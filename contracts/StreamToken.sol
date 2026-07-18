// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title StreamToken
 * @notice STREAM ERC-20 with role-based minting and on-chain mint caps.
 * @dev DEFAULT_ADMIN_ROLE is intended for a multisig / hardware wallet.
 *      MINTER_ROLE is the limited backend service key. Minting is bounded
 *      per transaction (maxMintPerTx) and per rolling UTC day (maxMintPerDay).
 */
contract StreamToken is ERC20, ERC20Burnable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 billion tokens

    /// @notice Maximum amount mintable in a single transaction.
    uint256 public maxMintPerTx;
    /// @notice Maximum amount mintable per rolling 24-hour window (all minters combined).
    uint256 public maxMintPerDay;

    /// @dev Rolling 24h window: 24 hourly buckets of minted amounts.
    uint256[24] private hourlyMinted;
    /// @dev Absolute hour index (block.timestamp / 1 hours) each bucket was written for.
    uint256[24] private bucketHour;

    event MaxMintPerTxUpdated(uint256 previousCap, uint256 newCap);
    event MaxMintPerDayUpdated(uint256 previousCap, uint256 newCap);

    constructor(address initialAdmin) ERC20("STREAM", "STREAM") {
        require(initialAdmin != address(0), "Admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);

        // Conservative defaults; admin-settable.
        maxMintPerTx = 100_000 * 10 ** 18;
        maxMintPerDay = 500_000 * 10 ** 18;

        // Initial supply to the admin (can distribute as needed).
        _mint(initialAdmin, 100_000_000 * 10 ** 18); // 100M initial supply
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(amount <= maxMintPerTx, "Exceeds per-tx mint cap");
        require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");

        uint256 hourNow = block.timestamp / 1 hours;
        uint256 idx = hourNow % 24;
        // A stale bucket (written for a different absolute hour) is reset before use.
        if (bucketHour[idx] != hourNow) {
            bucketHour[idx] = hourNow;
            hourlyMinted[idx] = 0;
        }
        require(mintedLast24h() + amount <= maxMintPerDay, "Exceeds daily mint cap");
        hourlyMinted[idx] += amount;

        _mint(to, amount);
    }

    /// @notice Total minted within the current rolling 24-hour window.
    function mintedLast24h() public view returns (uint256 total) {
        uint256 hourNow = block.timestamp / 1 hours;
        for (uint256 i = 0; i < 24; i++) {
            // Count only buckets written within the last 24 hours.
            if (bucketHour[i] + 24 > hourNow) {
                total += hourlyMinted[i];
            }
        }
    }

    function setMaxMintPerTx(uint256 newCap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit MaxMintPerTxUpdated(maxMintPerTx, newCap);
        maxMintPerTx = newCap;
    }

    function setMaxMintPerDay(uint256 newCap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        emit MaxMintPerDayUpdated(maxMintPerDay, newCap);
        maxMintPerDay = newCap;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /// @dev Gates mint, burn, and transfer while paused.
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
