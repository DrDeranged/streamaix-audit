// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ConditionalTokens
 * @notice ERC-1155 token representing YES/NO positions in prediction markets
 * @dev Each market has two tokens: YES (tokenId = marketId * 2) and NO (tokenId = marketId * 2 + 1)
 */
contract ConditionalTokens is ERC1155, Ownable, ReentrancyGuard {
    
    // Market outcomes
    enum Outcome { YES, NO }
    
    // Market resolution status
    enum Resolution { UNRESOLVED, YES_WINS, NO_WINS, INVALID }
    
    struct Market {
        uint256 id;
        address creator;
        string question;
        uint256 deadline;
        uint256 totalLiquidity;
        Resolution resolution;
        address resolver;
        bool resolved;
    }
    
    // Market ID => Market data
    mapping(uint256 => Market) public markets;
    
    // Total number of markets created
    uint256 public marketCount;
    
    // Authorized market factory
    address public marketFactory;
    
    // Events
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 deadline);
    event PositionMinted(uint256 indexed marketId, address indexed user, Outcome outcome, uint256 amount);
    event PositionBurned(uint256 indexed marketId, address indexed user, Outcome outcome, uint256 amount);
    event MarketResolved(uint256 indexed marketId, Resolution resolution);
    event WinningsRedeemed(uint256 indexed marketId, address indexed user, uint256 amount);
    
    modifier onlyFactory() {
        require(msg.sender == marketFactory, "Only factory can call");
        _;
    }
    
    constructor(address initialOwner) ERC1155("https://streamaix.io/api/markets/{id}.json") Ownable(initialOwner) {}
    
    /**
     * @notice Set the authorized market factory
     */
    function setMarketFactory(address _factory) external onlyOwner {
        marketFactory = _factory;
    }
    
    /**
     * @notice Create a new prediction market
     */
    function createMarket(
        address creator,
        string memory question,
        uint256 deadline,
        address resolver
    ) external onlyFactory returns (uint256) {
        require(deadline > block.timestamp, "Deadline must be in future");
        
        uint256 marketId = marketCount++;
        
        markets[marketId] = Market({
            id: marketId,
            creator: creator,
            question: question,
            deadline: deadline,
            totalLiquidity: 0,
            resolution: Resolution.UNRESOLVED,
            resolver: resolver,
            resolved: false
        });
        
        emit MarketCreated(marketId, creator, question, deadline);
        return marketId;
    }
    
    /**
     * @notice Mint position tokens (YES or NO)
     */
    function mintPosition(
        uint256 marketId,
        address user,
        Outcome outcome,
        uint256 amount
    ) external onlyFactory {
        require(!markets[marketId].resolved, "Market already resolved");
        require(block.timestamp < markets[marketId].deadline, "Market expired");
        
        uint256 tokenId = getTokenId(marketId, outcome);
        _mint(user, tokenId, amount, "");
        
        markets[marketId].totalLiquidity += amount;
        
        emit PositionMinted(marketId, user, outcome, amount);
    }
    
    /**
     * @notice Burn position tokens
     */
    function burnPosition(
        uint256 marketId,
        address user,
        Outcome outcome,
        uint256 amount
    ) external onlyFactory {
        uint256 tokenId = getTokenId(marketId, outcome);
        _burn(user, tokenId, amount);
        
        emit PositionBurned(marketId, user, outcome, amount);
    }
    
    /**
     * @notice Resolve a market
     */
    function resolveMarket(
        uint256 marketId,
        Resolution resolution
    ) external {
        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");
        require(msg.sender == market.resolver || msg.sender == owner(), "Not authorized");
        require(block.timestamp >= market.deadline, "Market not expired");
        require(resolution != Resolution.UNRESOLVED, "Invalid resolution");
        
        market.resolution = resolution;
        market.resolved = true;
        
        emit MarketResolved(marketId, resolution);
    }
    
    /**
     * @notice Redeem winnings for resolved market
     */
    function redeemWinnings(uint256 marketId) external nonReentrant returns (uint256) {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");
        
        Outcome winningOutcome;
        if (market.resolution == Resolution.YES_WINS) {
            winningOutcome = Outcome.YES;
        } else if (market.resolution == Resolution.NO_WINS) {
            winningOutcome = Outcome.NO;
        } else {
            // Invalid market - redeem proportionally
            uint256 yesBalance = balanceOf(msg.sender, getTokenId(marketId, Outcome.YES));
            uint256 noBalance = balanceOf(msg.sender, getTokenId(marketId, Outcome.NO));
            
            if (yesBalance > 0) {
                _burn(msg.sender, getTokenId(marketId, Outcome.YES), yesBalance);
            }
            if (noBalance > 0) {
                _burn(msg.sender, getTokenId(marketId, Outcome.NO), noBalance);
            }
            
            uint256 totalRefund = yesBalance + noBalance;
            emit WinningsRedeemed(marketId, msg.sender, totalRefund);
            return totalRefund;
        }
        
        uint256 tokenId = getTokenId(marketId, winningOutcome);
        uint256 winningAmount = balanceOf(msg.sender, tokenId);
        require(winningAmount > 0, "No winnings to redeem");
        
        _burn(msg.sender, tokenId, winningAmount);
        
        emit WinningsRedeemed(marketId, msg.sender, winningAmount);
        return winningAmount;
    }
    
    /**
     * @notice Get token ID for a market outcome
     * YES = marketId * 2, NO = marketId * 2 + 1
     */
    function getTokenId(uint256 marketId, Outcome outcome) public pure returns (uint256) {
        return marketId * 2 + uint256(outcome);
    }
    
    /**
     * @notice Get market details
     */
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }
    
    /**
     * @notice Get user position balance
     */
    function getPosition(uint256 marketId, address user, Outcome outcome) external view returns (uint256) {
        return balanceOf(user, getTokenId(marketId, outcome));
    }
}
