// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title SummaryNFT
 * @notice Summary NFTs with role-based minting.
 * @dev DEFAULT_ADMIN_ROLE is intended for a multisig / hardware wallet.
 *      MINTER_ROLE is the limited backend service key. Pause gates both
 *      minting and transfers.
 */
contract SummaryNFT is ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private _nextTokenId;

    struct SummaryData {
        string ipfsHash;
        string arweaveId;
        uint256 timestamp;
    }

    mapping(uint256 => SummaryData) public summaryData;

    event SummaryMinted(uint256 indexed tokenId, address indexed owner, string ipfsHash);

    constructor(address initialAdmin) ERC721("StreamAiX Summary", "SUMMARY") {
        require(initialAdmin != address(0), "Admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    function mintSummaryNFT(
        address to,
        string memory ipfsHash,
        string memory arweaveId
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        summaryData[tokenId] = SummaryData({
            ipfsHash: ipfsHash,
            arweaveId: arweaveId,
            timestamp: block.timestamp
        });

        // Set token URI to IPFS hash
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsHash)));

        emit SummaryMinted(tokenId, to, ipfsHash);

        return tokenId;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function getSummaryData(uint256 tokenId)
        public
        view
        returns (string memory ipfsHash, string memory arweaveId, uint256 timestamp)
    {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        SummaryData memory data = summaryData[tokenId];
        return (data.ipfsHash, data.arweaveId, data.timestamp);
    }

    // Override required functions
    /// @dev Gates mint, burn, and transfer while paused.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
