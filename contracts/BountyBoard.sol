// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BountyBoard is Ownable, ReentrancyGuard {
    IERC20 public streamToken;
    
    enum BountyStatus { Open, Claimed, InProgress, Completed, Expired, Cancelled, Refunded }
    enum TokenType { STREAM, ETH, ERC20 }
    
    struct Bounty {
        address creator;
        address claimer;
        uint256 reward;
        uint256 tipPool;
        uint256 deadline;
        address tokenAddress; // For ERC20 tokens, address(0) for ETH
        TokenType tokenType;
        BountyStatus status;
    }
    
    struct Tip {
        address tipper;
        uint256 amount;
        address tokenAddress;
        TokenType tokenType;
    }
    
    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => Tip[]) public bountyTips; // Track individual tips per bounty
    uint256 public bountyCount;
    
    uint256 public platformFee = 250; // 2.5% in basis points
    address public platformFeeRecipient;
    
    // Supported ERC20 tokens (USDC, etc)
    mapping(address => bool) public supportedTokens;
    
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, address tokenAddress, TokenType tokenType, uint256 deadline);
    event BountyClaimed(uint256 indexed bountyId, address indexed claimer);
    event BountyCompleted(uint256 indexed bountyId, address indexed claimer, uint256 totalReward, address tokenAddress);
    event TipAdded(uint256 indexed bountyId, address indexed tipper, uint256 amount, address tokenAddress, TokenType tokenType);
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount);
    event TokenAdded(address indexed tokenAddress);
    event TokenRemoved(address indexed tokenAddress);
    
    constructor(address _streamToken, address initialOwner) Ownable(initialOwner) {
        streamToken = IERC20(_streamToken);
        platformFeeRecipient = initialOwner;
        
        // STREAM is always supported
        supportedTokens[_streamToken] = true;
    }
    
    // Create bounty with STREAM tokens
    function createBounty(uint256 reward, uint256 deadline) external nonReentrant returns (uint256) {
        return _createBounty(reward, deadline, address(streamToken), TokenType.STREAM);
    }
    
    // Create bounty with ETH
    function createBountyWithETH(uint256 deadline) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "ETH reward must be greater than 0");
        return _createBounty(msg.value, deadline, address(0), TokenType.ETH);
    }
    
    // Create bounty with ERC20 token (USDC, etc)
    function createBountyWithToken(uint256 reward, uint256 deadline, address tokenAddress) external nonReentrant returns (uint256) {
        require(supportedTokens[tokenAddress], "Token not supported");
        require(tokenAddress != address(streamToken), "Use createBounty for STREAM");
        return _createBounty(reward, deadline, tokenAddress, TokenType.ERC20);
    }
    
    function _createBounty(uint256 reward, uint256 deadline, address tokenAddress, TokenType tokenType) private returns (uint256) {
        require(reward > 0, "Reward must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        
        // Transfer tokens based on type
        if (tokenType == TokenType.ETH) {
            // ETH already received via msg.value
            require(msg.value == reward, "ETH value mismatch");
        } else if (tokenType == TokenType.STREAM) {
            require(streamToken.transferFrom(msg.sender, address(this), reward), "STREAM transfer failed");
        } else if (tokenType == TokenType.ERC20) {
            require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), reward), "Token transfer failed");
        }
        
        uint256 bountyId = bountyCount++;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            claimer: address(0),
            reward: reward,
            tipPool: 0,
            deadline: deadline,
            tokenAddress: tokenAddress,
            tokenType: tokenType,
            status: BountyStatus.Open
        });
        
        emit BountyCreated(bountyId, msg.sender, reward, tokenAddress, tokenType, deadline);
        
        return bountyId;
    }
    
    function claimBounty(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Open, "Bounty not available");
        require(block.timestamp < bounty.deadline, "Bounty expired");
        require(bounty.claimer == address(0), "Bounty already claimed");
        
        bounty.claimer = msg.sender;
        bounty.status = BountyStatus.Claimed;
        
        emit BountyClaimed(bountyId, msg.sender);
    }
    
    function completeBounty(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Claimed, "Bounty not claimed");
        require(msg.sender == bounty.creator, "Only creator can complete");
        require(block.timestamp < bounty.deadline, "Bounty expired");
        
        bounty.status = BountyStatus.Completed;
        
        uint256 totalReward = bounty.reward + bounty.tipPool;
        uint256 fee = (totalReward * platformFee) / 10000;
        uint256 claimerReward = totalReward - fee;
        
        // Transfer rewards based on token type
        if (bounty.tokenType == TokenType.ETH) {
            (bool successClaimer, ) = bounty.claimer.call{value: claimerReward}("");
            require(successClaimer, "ETH transfer to claimer failed");
            
            if (fee > 0) {
                (bool successFee, ) = platformFeeRecipient.call{value: fee}("");
                require(successFee, "ETH fee transfer failed");
            }
        } else if (bounty.tokenType == TokenType.STREAM) {
            require(streamToken.transfer(bounty.claimer, claimerReward), "STREAM transfer failed");
            if (fee > 0) {
                require(streamToken.transfer(platformFeeRecipient, fee), "STREAM fee transfer failed");
            }
        } else if (bounty.tokenType == TokenType.ERC20) {
            IERC20 token = IERC20(bounty.tokenAddress);
            require(token.transfer(bounty.claimer, claimerReward), "Token transfer failed");
            if (fee > 0) {
                require(token.transfer(platformFeeRecipient, fee), "Token fee transfer failed");
            }
        }
        
        emit BountyCompleted(bountyId, bounty.claimer, claimerReward, bounty.tokenAddress);
    }
    
    // Add tip with STREAM
    function addTip(uint256 bountyId, uint256 amount) external nonReentrant {
        _addTip(bountyId, amount, address(streamToken), TokenType.STREAM);
    }
    
    // Add tip with ETH
    function addTipWithETH(uint256 bountyId) external payable nonReentrant {
        require(msg.value > 0, "ETH tip must be greater than 0");
        _addTip(bountyId, msg.value, address(0), TokenType.ETH);
    }
    
    // Add tip with ERC20 token
    function addTipWithToken(uint256 bountyId, uint256 amount, address tokenAddress) external nonReentrant {
        require(supportedTokens[tokenAddress], "Token not supported");
        _addTip(bountyId, amount, tokenAddress, TokenType.ERC20);
    }
    
    function _addTip(uint256 bountyId, uint256 amount, address tokenAddress, TokenType tokenType) private {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Open || bounty.status == BountyStatus.Claimed, "Invalid bounty status");
        require(amount > 0, "Tip must be greater than 0");
        
        // Transfer tokens based on type
        if (tokenType == TokenType.ETH) {
            require(msg.value == amount, "ETH value mismatch");
        } else if (tokenType == TokenType.STREAM) {
            require(streamToken.transferFrom(msg.sender, address(this), amount), "STREAM transfer failed");
        } else if (tokenType == TokenType.ERC20) {
            require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        }
        
        // Convert tip to bounty's native token if different (simplified - just add to pool)
        // In production, you'd use a DEX/oracle for conversion
        bounty.tipPool += amount;
        
        // Track individual tip
        bountyTips[bountyId].push(Tip({
            tipper: msg.sender,
            amount: amount,
            tokenAddress: tokenAddress,
            tokenType: tokenType
        }));
        
        emit TipAdded(bountyId, msg.sender, amount, tokenAddress, tokenType);
    }
    
    function refund(uint256 bountyId) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.creator, "Only creator can refund");
        require(
            bounty.status == BountyStatus.Open || 
            (bounty.status == BountyStatus.Claimed && block.timestamp >= bounty.deadline),
            "Cannot refund"
        );
        
        uint256 refundAmount = bounty.reward + bounty.tipPool;
        bounty.status = BountyStatus.Refunded;
        
        // Refund based on token type
        if (bounty.tokenType == TokenType.ETH) {
            (bool success, ) = bounty.creator.call{value: refundAmount}("");
            require(success, "ETH refund failed");
        } else if (bounty.tokenType == TokenType.STREAM) {
            require(streamToken.transfer(bounty.creator, refundAmount), "STREAM refund failed");
        } else if (bounty.tokenType == TokenType.ERC20) {
            require(IERC20(bounty.tokenAddress).transfer(bounty.creator, refundAmount), "Token refund failed");
        }
        
        emit BountyRefunded(bountyId, bounty.creator, refundAmount);
    }
    
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }
    
    function getBountyTips(uint256 bountyId) external view returns (Tip[] memory) {
        return bountyTips[bountyId];
    }
    
    function setBountyCount() external view returns (uint256) {
        return bountyCount;
    }
    
    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        platformFee = _fee;
    }
    
    function setPlatformFeeRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        platformFeeRecipient = _recipient;
    }
    
    function addSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        supportedTokens[tokenAddress] = true;
        emit TokenAdded(tokenAddress);
    }
    
    function removeSupportedToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(streamToken), "Cannot remove STREAM");
        supportedTokens[tokenAddress] = false;
        emit TokenRemoved(tokenAddress);
    }
    
    // Emergency withdraw function (owner only)
    function emergencyWithdraw(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) {
            // Withdraw ETH
            (bool success, ) = owner().call{value: address(this).balance}("");
            require(success, "ETH withdraw failed");
        } else {
            // Withdraw ERC20
            IERC20 token = IERC20(tokenAddress);
            uint256 balance = token.balanceOf(address(this));
            require(token.transfer(owner(), balance), "Token withdraw failed");
        }
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
