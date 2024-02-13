// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MockERC721 is ERC721URIStorage {
    event NftEmitted(uint256 indexed tokenId);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        // Constructor logic (if any)
    }

    function mintNft(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
        emit NftEmitted(tokenId);
    }

    function approveNft(address to, uint256 tokenId) external {
        _approve(to, tokenId, _msgSender());
    }
}
