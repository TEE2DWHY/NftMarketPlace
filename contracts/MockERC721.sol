// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MockERC721 is ERC721URIStorage {
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        // Constructor logic (if any)
    }

    function mint(address to, uint256 tokenId) external {
        _mint(to, tokenId);
        // Additional minting logic (if any)
    }

    // Additional functions if needed for testing
}
