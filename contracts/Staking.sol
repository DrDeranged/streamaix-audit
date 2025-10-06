// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Staking is Ownable, ReentrancyGuard {
    IERC20 public streamToken;
    
    uint256 public apr = 1200; // 12% APR in basis points
    uint256 public totalStaked;
    
    struct StakeInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
    }
    
    mapping(address => StakeInfo) public stakes;
    
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor(address _streamToken, address initialOwner) Ownable(initialOwner) {
        streamToken = IERC20(_streamToken);
    }
    
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        
        // Claim pending rewards first
        if (stakes[msg.sender].amount > 0) {
            _claimRewards(msg.sender);
        }
        
        require(streamToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].timestamp = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot unstake 0");
        require(stakes[msg.sender].amount >= amount, "Insufficient staked amount");
        
        // Claim pending rewards first
        _claimRewards(msg.sender);
        
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        require(streamToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }
    
    function _claimRewards(address user) private {
        uint256 pending = getPendingRewards(user);
        if (pending > 0) {
            stakes[user].timestamp = block.timestamp;
            stakes[user].rewardDebt += pending;
            
            require(streamToken.transfer(user, pending), "Reward transfer failed");
            
            emit RewardsClaimed(user, pending);
        }
    }
    
    function getPendingRewards(address user) public view returns (uint256) {
        if (stakes[user].amount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - stakes[user].timestamp;
        uint256 reward = (stakes[user].amount * apr * timeStaked) / (365 days * 10000);
        
        return reward;
    }
    
    function getStakedAmount(address user) external view returns (uint256) {
        return stakes[user].amount;
    }
    
    function getAPR() external view returns (uint256) {
        return apr;
    }
    
    function setAPR(uint256 _apr) external onlyOwner {
        require(_apr <= 10000, "APR too high"); // Max 100%
        apr = _apr;
    }
    
    // Emergency function to recover tokens
    function emergencyWithdraw() external nonReentrant {
        uint256 amount = stakes[msg.sender].amount;
        require(amount > 0, "No stake to withdraw");
        
        stakes[msg.sender].amount = 0;
        totalStaked -= amount;
        
        require(streamToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstaked(msg.sender, amount);
    }
}
