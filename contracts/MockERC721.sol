// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MockERC721 is ERC721URIStorage {
    uint256 private s_counter;
    event MintedNft(uint256 indexed counter);

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        s_counter = 0;
    }

    function mint(address to, uint256 tokenId) external {
        _safeMint(to, tokenId);
        emit MintedNft(s_counter);
        s_counter++;
    }
}
