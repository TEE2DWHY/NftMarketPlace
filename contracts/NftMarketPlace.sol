// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;
error NftMarketPlace__PriceCannotBeZero();
error NftMarketPlace__NftNotApprovedByMarketPlace();
error NftMarketPlace__NftAlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__NotOwner(address owner);
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NftMarketPlace is ReentrancyGuard {
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event CanceledItem(address indexed nftAddress, uint256 indexed tokenId);

    struct Listing {
        uint256 price;
        address seller;
    }
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // seller => amount
    mapping(address => uint256) private s_proceeds;

    /*
     * @notice Method for listing your NFT on the marketplace
     * @param nftAddress: address of the NFT
     * @param tokenId: Token Id of the NFT
     * @param price: sale price of the NFT
     * @dev, Technically we could have allowed the contract to be the escrow for the NFT
     * but this way people can still hold their NFT when listed.
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        notListed(nftAddress, tokenId, msg.sender)
        isOwer(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketPlace__PriceCannotBeZero();
        }
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        // check if NFT is approved to be spent by contract
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NftNotApprovedByMarketPlace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    // buy item
    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (listedItem.price < msg.value) {
            revert NftMarketPlace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        s_proceeds[listedItem.seller] +=
            s_proceeds[listedItem.seller] +
            msg.value;
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        nft.safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
        delete (s_listings[nftAddress][tokenId]);
    }

    // cancel item lisitng
    function cancelItem(
        address nftAddress,
        address spender,
        uint256 tokenId
    ) external {
        spender = address(this);
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        // check if NFT is not approved
        if (nft.getApproved(tokenId) != spender) {
            revert NftMarketPlace__NftNotApprovedByMarketPlace();
        }
        nft.approve(address(0), tokenId);
        emit CanceledItem(nftAddress, tokenId);
    }

    // check if NFT is not already listed
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory existingListing = s_listings[nftAddress][tokenId];
        if (existingListing.price > 0) {
            revert NftMarketPlace__NftAlreadyListed(nftAddress, tokenId);
        }
        _;
    }
    // check if NFT is already listed
    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listed = s_listings[nftAddress][tokenId];
        if (listed.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    // check if NFT is owned by seller
    modifier isOwer(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (owner != spender) {
            revert NftMarketPlace__NotOwner(owner);
        }
        _;
    }
}
