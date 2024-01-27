const { assert } = require("chai");
const { ethers } = require("hardhat");

describe("NftMarketPlace: listItem Function", () => {
  let nftMarketPlace;
  let nftContract;
  let owner;
  let buyer;

  beforeEach(async () => {
    [owner, buyer] = await ethers.getSigners();

    // Deploy NftMarketPlace and ERC721 contract
    const NftMarketPlace = await ethers.getContractFactory("NftMarketPlace");
    nftMarketPlace = await NftMarketPlace.deploy();
    nftMarketPlace.waitForDeployment(6);

    const ERC721Mock = await ethers.getContractFactory("MockERC721");
    nftContract = await ERC721Mock.deploy("MyNFT", "NFT");
    nftMarketPlace.waitForDeployment(6);

    // Mint an NFT and approve the market contract
    await nftContract.mint(owner.address, 1);
    await nftContract.connect(owner).approve(nftMarketPlace.target, 1);
  });

  describe("List Item", () => {
    it("should list an NFT for sale", async () => {
      const price = ethers.parseEther("1.0");

      // Call listItem function
      await nftMarketPlace
        .connect(owner)
        .listItem(nftContract.target, 1, price);

      // Check if the item is listed
      const listing = await nftMarketPlace.getListing(nftContract.target, 1);

      assert.equal(listing.price.toString(), price.toString());
      assert.equal(listing.seller, owner.address);
    });

    it("should revert if price is zero", async () => {
      // Call listItem function with zero price
      await assert.isRejected(
        nftMarketPlace.connect(owner).listItem(nftContract.target, 1, 0),
        "NftMarketPlace__PriceCannotBeZero"
      );
    });

    it("should revert if NFT is not approved", async () => {
      // Mint a new NFT without approving the market contract
      await nftContract.mint(owner.address, 2);

      // Try to list the NFT without approval
      await assert.isRejected(
        nftMarketPlace
          .connect(owner)
          .listItem(nftContract.target, 2, ethers.parseEther("1.0")),
        "NftMarketPlace__NftNotApprovedByMarketPlace"
      );
    });

    it("should revert if NFT is already listed", async () => {
      // List an NFT
      await nftMarketPlace
        .connect(owner)
        .listItem(nftContract.target, 1, ethers.parseEther("1.0"));

      // Try to list the same NFT again
      await assert.isRejected(
        nftMarketPlace
          .connect(owner)
          .listItem(nftContract.target, 1, ethers.parseEther("2.0")),
        "NftMarketPlace__NftAlreadyListed"
      );
    });

    it("should revert if the caller is not the owner of the NFT", async () => {
      // Mint an NFT and approve the market contract
      await nftContract.mint(owner.address, 3);
      await nftContract.connect(owner).approve(nftMarketPlace.target, 3);

      // Try to list the NFT as a non-owner
      await assert.isRejected(
        nftMarketPlace
          .connect(buyer)
          .listItem(nftContract.target, 3, ethers.parseEther("1.0")),
        "NftMarketPlace__NotOwner"
      );
    });
  });
});
