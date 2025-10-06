// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BountyBoard is Ownable, ReentrancyGuard {
    IERC20 public streamToken;
    
    enum BountyStatus { Open, Claimed, InProgress, Completed, Expired, Cancelled, Refunded }
    
    struct Bounty {
        address creator;
        address claimer;
        uint256 reward;
        uint256 tipPool;
        uint256 deadline;
        BountyStatus status;
    }
    
    mapping(uint256 => Bounty) public bounties;
    uint256 public bountyCount;
    
    uint256 public platformFee = 250; // 2.5% in basis points
    address public platformFeeRecipient;
    
    event BountyCreated(uint256 indexed bountyId, address indexed creator, uint256 reward, uint256 deadline);
    event BountyClaimed(uint256 indexed bountyId, address indexed claimer);
    event BountyCompleted(uint256 indexed bountyId, address indexed claimer, uint256 totalReward);
    event TipAdded(uint256 indexed bountyId, address indexed tipper, uint256 amount);
    event BountyRefunded(uint256 indexed bountyId, address indexed creator, uint256 amount);
    
    constructor(address _streamToken, address initialOwner) Ownable(initialOwner) {
        streamToken = IERC20(_streamToken);
        platformFeeRecipient = initialOwner;
    }
    
    function createBounty(uint256 reward, uint256 deadline) external nonReentrant returns (uint256) {
        require(reward > 0, "Reward must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        
        // Transfer tokens from creator to contract
        require(streamToken.transferFrom(msg.sender, address(this), reward), "Token transfer failed");
        
        uint256 bountyId = bountyCount++;
        bounties[bountyId] = Bounty({
            creator: msg.sender,
            claimer: address(0),
            reward: reward,
            tipPool: 0,
            deadline: deadline,
            status: BountyStatus.Open
        });
        
        emit BountyCreated(bountyId, msg.sender, reward, deadline);
        
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
        
        // Transfer rewards
        require(streamToken.transfer(bounty.claimer, claimerReward), "Claimer transfer failed");
        if (fee > 0) {
            require(streamToken.transfer(platformFeeRecipient, fee), "Fee transfer failed");
        }
        
        emit BountyCompleted(bountyId, bounty.claimer, claimerReward);
    }
    
    function addTip(uint256 bountyId, uint256 amount) external nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.status == BountyStatus.Open || bounty.status == BountyStatus.Claimed, "Invalid bounty status");
        require(amount > 0, "Tip must be greater than 0");
        
        require(streamToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        bounty.tipPool += amount;
        
        emit TipAdded(bountyId, msg.sender, amount);
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
        
        require(streamToken.transfer(bounty.creator, refundAmount), "Refund transfer failed");
        
        emit BountyRefunded(bountyId, bounty.creator, refundAmount);
    }
    
    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
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
}
