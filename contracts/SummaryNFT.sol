// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SummaryNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    
    struct SummaryData {
        string ipfsHash;
        string arweaveId;
        uint256 timestamp;
    }
    
    mapping(uint256 => SummaryData) public summaryData;
    
    event SummaryMinted(uint256 indexed tokenId, address indexed owner, string ipfsHash);
    
    constructor(address initialOwner) 
        ERC721("StreamAiX Summary", "SUMMARY") 
        Ownable(initialOwner) 
    {}
    
    function mintSummaryNFT(
        address to,
        string memory ipfsHash,
        string memory arweaveId
    ) public onlyOwner returns (uint256) {
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
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
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
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
