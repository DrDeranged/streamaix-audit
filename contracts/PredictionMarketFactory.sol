// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ConditionalTokens.sol";

/**
 * @title PredictionMarketFactory
 * @notice Factory contract for creating and managing prediction markets with AMM pricing
 * @dev DEFAULT_ADMIN_ROLE (multisig) manages fees and can rotate the resolver key
 *      via grantRole/revokeRole or rotateResolver() without redeploying.
 *      RESOLVER_ROLE is the only role allowed to resolve markets.
 */
contract PredictionMarketFactory is AccessControl, ReentrancyGuard {

    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    
    ConditionalTokens public conditionalTokens;
    IERC20 public streamToken;
    
    // AMM pricing constants (Constant Product Market Maker)
    uint256 public constant FEE_RATE = 50; // 0.5% fee (50 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    
    struct LiquidityPool {
        uint256 yesReserve;
        uint256 noReserve;
        uint256 k; // Constant product (x * y = k)
        uint256 totalShares;
        mapping(address => uint256) lpShares;
    }
    
    struct MarketStats {
        uint256 totalVolume;
        uint256 totalTrades;
        uint256 yesPrice; // Price in basis points (0-10000)
        uint256 noPrice;
    }
    
    // Market ID => Liquidity Pool
    mapping(uint256 => LiquidityPool) public liquidityPools;
    
    // Market ID => Stats
    mapping(uint256 => MarketStats) public marketStats;
    
    // Platform fee collection
    uint256 public collectedFees;
    address public feeRecipient;
    
    // Market categories
    enum Category { CRYPTO, DEFI, REAL_WORLD, COMMUNITY }
    mapping(uint256 => Category) public marketCategories;
    
    // Events
    event MarketCreatedWithLiquidity(uint256 indexed marketId, uint256 initialLiquidity);
    event PositionBought(uint256 indexed marketId, address indexed buyer, bool isYes, uint256 amountIn, uint256 tokensOut);
    event PositionSold(uint256 indexed marketId, address indexed seller, bool isYes, uint256 tokensIn, uint256 amountOut);
    event LiquidityAdded(uint256 indexed marketId, address indexed provider, uint256 amount, uint256 shares);
    event LiquidityRemoved(uint256 indexed marketId, address indexed provider, uint256 shares, uint256 amount);
    event PriceUpdated(uint256 indexed marketId, uint256 yesPrice, uint256 noPrice);
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);
    event ResolverRotated(address indexed previousResolver, address indexed newResolver);
    
    constructor(
        address _conditionalTokens,
        address _streamToken,
        address initialAdmin
    ) {
        require(initialAdmin != address(0), "Admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        conditionalTokens = ConditionalTokens(_conditionalTokens);
        streamToken = IERC20(_streamToken);
        feeRecipient = initialAdmin;
    }

    /**
     * @notice Rotate the resolver key in one transaction (admin only).
     * @dev Equivalent to revokeRole + grantRole; no redeploy needed.
     */
    function rotateResolver(address previousResolver, address newResolver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newResolver != address(0), "Resolver is zero address");
        if (previousResolver != address(0)) {
            _revokeRole(RESOLVER_ROLE, previousResolver);
        }
        _grantRole(RESOLVER_ROLE, newResolver);
        emit ResolverRotated(previousResolver, newResolver);
    }
    
    /**
     * @notice Create a new prediction market with initial liquidity
     */
    function createMarket(
        string memory question,
        uint256 deadline,
        uint256 initialLiquidity,
        Category category
    ) external nonReentrant returns (uint256) {
        require(initialLiquidity > 0, "Need initial liquidity");
        require(streamToken.transferFrom(msg.sender, address(this), initialLiquidity), "Transfer failed");
        
        // Create market in ConditionalTokens
        uint256 marketId = conditionalTokens.createMarket(
            msg.sender,
            question,
            deadline,
            address(this) // Factory is the resolver
        );
        
        // Initialize AMM pool with 50/50 split
        uint256 halfLiquidity = initialLiquidity / 2;
        LiquidityPool storage pool = liquidityPools[marketId];
        pool.yesReserve = halfLiquidity;
        pool.noReserve = halfLiquidity;
        pool.k = halfLiquidity * halfLiquidity;
        pool.totalShares = initialLiquidity;
        pool.lpShares[msg.sender] = initialLiquidity;
        
        // Set category
        marketCategories[marketId] = category;
        
        // Initialize prices at 50/50
        marketStats[marketId].yesPrice = 5000;
        marketStats[marketId].noPrice = 5000;
        
        emit MarketCreatedWithLiquidity(marketId, initialLiquidity);
        emit PriceUpdated(marketId, 5000, 5000);
        
        return marketId;
    }
    
    /**
     * @notice Buy YES or NO position using AMM
     */
    function buyPosition(
        uint256 marketId,
        bool isYes,
        uint256 amountIn,
        uint256 minTokensOut
    ) external nonReentrant returns (uint256 tokensOut) {
        require(streamToken.transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        
        // Calculate fee
        uint256 fee = (amountIn * FEE_RATE) / BASIS_POINTS;
        uint256 amountAfterFee = amountIn - fee;
        collectedFees += fee;
        
        LiquidityPool storage pool = liquidityPools[marketId];
        
        // Calculate tokens out using constant product formula
        if (isYes) {
            tokensOut = getAmountOut(amountAfterFee, pool.noReserve, pool.yesReserve);
            require(tokensOut >= minTokensOut, "Slippage too high");
            
            pool.noReserve += amountAfterFee;
            pool.yesReserve -= tokensOut;
            
            // Mint YES tokens to buyer
            conditionalTokens.mintPosition(marketId, msg.sender, ConditionalTokens.Outcome.YES, tokensOut);
        } else {
            tokensOut = getAmountOut(amountAfterFee, pool.yesReserve, pool.noReserve);
            require(tokensOut >= minTokensOut, "Slippage too high");
            
            pool.yesReserve += amountAfterFee;
            pool.noReserve -= tokensOut;
            
            // Mint NO tokens to buyer
            conditionalTokens.mintPosition(marketId, msg.sender, ConditionalTokens.Outcome.NO, tokensOut);
        }
        
        // Update stats
        marketStats[marketId].totalVolume += amountIn;
        marketStats[marketId].totalTrades++;
        updatePrices(marketId);
        
        emit PositionBought(marketId, msg.sender, isYes, amountIn, tokensOut);
    }
    
    /**
     * @notice Sell YES or NO position back to AMM
     */
    function sellPosition(
        uint256 marketId,
        bool isYes,
        uint256 tokensIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        LiquidityPool storage pool = liquidityPools[marketId];
        
        // Burn position tokens
        if (isYes) {
            conditionalTokens.burnPosition(marketId, msg.sender, ConditionalTokens.Outcome.YES, tokensIn);
            amountOut = getAmountOut(tokensIn, pool.yesReserve, pool.noReserve);
            
            pool.yesReserve += tokensIn;
            pool.noReserve -= amountOut;
        } else {
            conditionalTokens.burnPosition(marketId, msg.sender, ConditionalTokens.Outcome.NO, tokensIn);
            amountOut = getAmountOut(tokensIn, pool.noReserve, pool.yesReserve);
            
            pool.noReserve += tokensIn;
            pool.yesReserve -= amountOut;
        }
        
        // Apply fee
        uint256 fee = (amountOut * FEE_RATE) / BASIS_POINTS;
        uint256 amountAfterFee = amountOut - fee;
        require(amountAfterFee >= minAmountOut, "Slippage too high");
        collectedFees += fee;
        
        require(streamToken.transfer(msg.sender, amountAfterFee), "Transfer failed");
        
        // Update stats
        marketStats[marketId].totalVolume += amountOut;
        marketStats[marketId].totalTrades++;
        updatePrices(marketId);
        
        emit PositionSold(marketId, msg.sender, isYes, tokensIn, amountAfterFee);
    }
    
    /**
     * @notice Add liquidity to market AMM
     */
    function addLiquidity(uint256 marketId, uint256 amount) external nonReentrant returns (uint256 shares) {
        require(streamToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        LiquidityPool storage pool = liquidityPools[marketId];
        
        if (pool.totalShares == 0) {
            shares = amount;
            pool.yesReserve = amount / 2;
            pool.noReserve = amount / 2;
            pool.k = (amount / 2) * (amount / 2);
        } else {
            shares = (amount * pool.totalShares) / (pool.yesReserve + pool.noReserve);
            uint256 halfAmount = amount / 2;
            pool.yesReserve += halfAmount;
            pool.noReserve += halfAmount;
            pool.k = pool.yesReserve * pool.noReserve;
        }
        
        pool.totalShares += shares;
        pool.lpShares[msg.sender] += shares;
        
        emit LiquidityAdded(marketId, msg.sender, amount, shares);
    }
    
    /**
     * @notice Remove liquidity from market AMM
     */
    function removeLiquidity(uint256 marketId, uint256 shares) external nonReentrant returns (uint256 amount) {
        LiquidityPool storage pool = liquidityPools[marketId];
        require(pool.lpShares[msg.sender] >= shares, "Insufficient shares");
        
        amount = (shares * (pool.yesReserve + pool.noReserve)) / pool.totalShares;
        
        pool.lpShares[msg.sender] -= shares;
        pool.totalShares -= shares;
        
        uint256 halfAmount = amount / 2;
        pool.yesReserve -= halfAmount;
        pool.noReserve -= halfAmount;
        pool.k = pool.yesReserve * pool.noReserve;
        
        require(streamToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit LiquidityRemoved(marketId, msg.sender, shares, amount);
    }
    
    /**
     * @notice Resolve market and distribute winnings
     */
    function resolveMarket(uint256 marketId, ConditionalTokens.Resolution resolution) external onlyRole(RESOLVER_ROLE) {
        conditionalTokens.resolveMarket(marketId, resolution);
        
        // Transfer pool reserves based on outcome
        LiquidityPool storage pool = liquidityPools[marketId];
        uint256 totalReserves = pool.yesReserve + pool.noReserve;
        
        // Pool reserves stay in contract for winners to redeem against
        // Winners call redeemWinnings on ConditionalTokens, then claim from pool
    }
    
    /**
     * @notice Claim winnings after market resolution
     */
    function claimWinnings(uint256 marketId) external nonReentrant returns (uint256) {
        uint256 winningTokens = conditionalTokens.redeemWinnings(marketId);
        require(winningTokens > 0, "No winnings");
        
        // Transfer STREAM equivalent
        require(streamToken.transfer(msg.sender, winningTokens), "Transfer failed");
        
        return winningTokens;
    }
    
    /**
     * @notice Calculate output amount for AMM swap (x * y = k formula)
     */
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        require(amountIn > 0, "Insufficient input");
        require(reserveIn > 0 && reserveOut > 0, "Insufficient liquidity");
        
        uint256 amountInWithFee = amountIn * 9950; // 0.5% fee
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = (reserveIn * 10000) + amountInWithFee;
        
        return numerator / denominator;
    }
    
    /**
     * @notice Update market prices based on current reserves
     */
    function updatePrices(uint256 marketId) internal {
        LiquidityPool storage pool = liquidityPools[marketId];
        uint256 totalReserves = pool.yesReserve + pool.noReserve;
        
        if (totalReserves > 0) {
            marketStats[marketId].yesPrice = (pool.noReserve * BASIS_POINTS) / totalReserves;
            marketStats[marketId].noPrice = (pool.yesReserve * BASIS_POINTS) / totalReserves;
            
            emit PriceUpdated(marketId, marketStats[marketId].yesPrice, marketStats[marketId].noPrice);
        }
    }
    
    /**
     * @notice Get current market price
     */
    function getMarketPrice(uint256 marketId) external view returns (uint256 yesPrice, uint256 noPrice) {
        return (marketStats[marketId].yesPrice, marketStats[marketId].noPrice);
    }
    
    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = collectedFees;
        collectedFees = 0;
        require(streamToken.transfer(feeRecipient, amount), "Transfer failed");
    }
    
    /**
     * @notice Set fee recipient
     */
    function setFeeRecipient(address _recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit FeeRecipientUpdated(feeRecipient, _recipient);
        feeRecipient = _recipient;
    }
}
