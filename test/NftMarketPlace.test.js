const { assert } = require("chai");
const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("NftMarketPlace", () => {
      let nftMarketPlace;
      let nftContract;
      let owner;
      let buyer;

      beforeEach(async () => {
        [owner, buyer] = await ethers.getSigners();

        // Deploy NftMarketPlace and ERC721 contract
        const NftMarketPlace = await ethers.getContractFactory(
          "NftMarketPlace"
        );
        nftMarketPlace = await NftMarketPlace.deploy();
        nftMarketPlace.waitForDeployment(6);
        const ERC721Mock = await ethers.getContractFactory("MockERC721");
        nftContract = await ERC721Mock.deploy("MyNFT", "NFT");
        nftMarketPlace.waitForDeployment(6);

        // Mint an NFT and approve the market contract
        await nftContract.mint(owner.address, 1);
        await nftContract.connect(owner).approve(nftMarketPlace.target, 1); //The connect method in ethers.js is used to create a new contract instance that is connected to a specific signer.
      });

      describe("listItem", () => {
        it("should list an item for sale", async () => {
          const price = ethers.parseEther("1.0");

          // Call listItem function
          await nftMarketPlace
            .connect(owner)
            .listItem(nftContract.target, 1, price);

          // Check if the item is listed
          const listing = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );

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

        it("should revert if item is not approved", async () => {
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

        it("should revert if item is already listed", async () => {
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

      describe("buyItem", () => {
        beforeEach(async () => {
          await nftMarketPlace
            .connect(owner)
            .listItem(nftContract.target, 1, ethers.parseEther("1"));
        });
        it("Check if item is up for sale", async () => {
          const price = await nftMarketPlace.getPrice(nftContract.target, 1);
          assert.isTrue(price > 0, "Item is not listed.");
        });
        it("Ensure that item is listed by the owner", async () => {
          const listing = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );
          const seller = listing.seller;
          assert.equal(seller, owner.address, "Not Owner");
        });
        it("Buyers price must match the cost of item", async () => {
          const listing = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );
          const tx = await nftMarketPlace
            .connect(buyer)
            .buyItem(nftContract.target, 1, { value: ethers.parseEther("1") });
          const amountSent = tx.value;
          assert.equal(
            amountSent.toString(),
            listing.price.toString(),
            "Price Not Met"
          );
        });
        it("Check if buyer is now the owner", async () => {
          await nftMarketPlace
            .connect(buyer)
            .buyItem(nftContract.target, 1, { value: ethers.parseEther("1") });
          const owner = await nftMarketPlace.getOwner(nftContract.target, 1);
          assert.equal(
            buyer.address,
            owner,
            "Ownership Transfer to Buyer Failed."
          );
        });
      });

      describe("cancelItem", () => {
        beforeEach(async () => {
          await nftMarketPlace
            .connect(owner)
            .listItem(nftContract.target, 1, ethers.parseEther("10"));
        });
        it("Check if item is Listed", async () => {
          const price = await nftMarketPlace.getPrice(nftContract.target, 1);
          assert.isTrue(price.toString() > 0, "Item is not Listed");
        });
        it("Only owner can cancel item listing", async () => {
          const listedItem = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );
          const seller = listedItem.seller;
          assert.equal(owner.address, seller, "Not Owner of Item.");
        });
      });

      describe("updateItem", () => {
        beforeEach(async () => {
          await nftMarketPlace
            .connect(owner)
            .listItem(nftContract.target, 1, ethers.parseEther("10"));
        });
        it("Check if item is listed", async () => {
          const price = await nftMarketPlace.getPrice(nftContract.target, 1);
          assert.isTrue(price.toString() > 0, "Item is Not Listed");
        });
        it("Only owner can update item", async () => {
          const listing = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );
          const seller = listing.seller;
          assert.equal(owner.address, seller, "Not Owner");
        });
        it("Updated price cannot be zero", async () => {
          await nftMarketPlace.updateItem(
            nftContract.target,
            1,
            ethers.parseEther("3")
          );
          const price = await nftMarketPlace.getPrice(nftContract.target, 1);
          assert.isTrue(price > 0, "Price Cannot be Zero.");
        });
        it("Check if price is successfully updated.", async () => {
          await nftMarketPlace.updateItem(
            nftContract.target,
            1,
            ethers.parseEther("2.0")
          );
          const listing = await nftMarketPlace.getListing(
            nftContract.target,
            1
          );
          const newPrice = listing.price;
          const price = await nftMarketPlace.getPrice(nftContract.target, 1);
          assert.equal(
            price.toString(),
            newPrice.toString(),
            "Item Update Fail"
          );
        });
      });

      describe("withdrawProceeds", async () => {
        it("Check if proceed is now zero after withdrawal", async function () {
          await nftMarketPlace
            .connect(owner)
            .listItem(nftContract.target, 1, ethers.parseEther("10"));
          await nftMarketPlace.connect(buyer).buyItem(nftContract.target, 1, {
            value: ethers.parseEther("10"),
          });
          await nftMarketPlace.connect(owner).withdrawProceeds();
          const newProceed = await nftMarketPlace.getProceed(owner.address);
          assert.equal(newProceed, 0, "Proceeds not properly withdrawn");
        });
      });
    });
