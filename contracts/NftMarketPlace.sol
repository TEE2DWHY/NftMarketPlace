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
error NftMarketPlace_NoProceeds();
error NftMarketPlace__TransferFailed();

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

    event CanceledItem(
        address spender,
        address indexed nftAddress,
        uint256 indexed tokenId
    );

    event UpdatedItem(
        address indexed nftAddress,
        uint256 tokenId,
        uint256 newPrice
    );

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
        isOwner(nftAddress, tokenId, msg.sender)
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

    /*
     *notice Method for buying your NFT on the marketplace
     *@param nftAddress: address of the NFT
     *@param tokenId: Token Id of the NFT
     @dev, we had to attach a user to his proceeds (sales) and move the risk to the user,
      by having them withdraw the tokens by themselves and not us transferring it to them.
     */
    // buy item
    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant isListed(nftAddress, tokenId) {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value != listedItem.price) {
            revert NftMarketPlace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftAddress][tokenId]);
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        nft.safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    /*
     *notice Method to cancel a listed item
     @spender: Address of the  NFT Owner
     @toekenId: Token Id of the NFT
     @dev, this function cancels and already listed NFT,
     it checks if an nft is already listed and ensures that only the owner can cancel the listing
     of an item. 
     */
    // cancel item lisitng
    function cancelItem(
        address nftAddress,
        address spender,
        uint256 tokenId
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        spender = address(this);
        // ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        // nft.approve(address(0), tokenId);
        delete (s_listings[nftAddress][tokenId]);
        emit CanceledItem(msg.sender, nftAddress, tokenId);
    }

    //  update the item
    function updateItem(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        payable
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        // Listing memory updatedaList = s_listings[nftAddress][tokenId];
        // updatedaList.price = newPrice; // this is more gas expensive
        s_listings[nftAddress][tokenId].price = newPrice; // this is more gas efficient
        emit UpdatedItem(nftAddress, tokenId, newPrice);
    }

    // withdraw proceeds
    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketPlace_NoProceeds();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        require(success, "Transfer failed");
    }

    // Getters
    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        // Listing memory lisitng = s_listings[nftAddress][tokenId];
        // return lisitng;
        return s_listings[nftAddress][tokenId]; // more gas effective
    }

    function getProceed(address seller) external view returns (uint256) {
        // uint256 proceed = s_proceeds[msg.sender]; //  It always returns the proceeds associated with the caller of the function, not the specified seller parameter.
        // return proceed;
        return s_proceeds[seller]; // returns the proceeds of a given address (the seller in this casse)
    }

    function getPrice(
        address nftAddress,
        uint256 tokenId
    ) external view returns (uint256) {
        return s_listings[nftAddress][tokenId].price;
    }

    function getOwner(
        address nftAddress,
        uint256 tokenId
    ) external view returns (address) {
        ERC721URIStorage nft = ERC721URIStorage(nftAddress);
        return nft.ownerOf(tokenId);
    }

    // Modifiers
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
    modifier isOwner(
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
