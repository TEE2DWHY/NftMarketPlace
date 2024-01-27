const { assert } = require("chai");
const { ethers, network } = require("hardhat");
const verifyContract = require("../utils/verifyContract");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name) // if network name is not in development chain skip test
  ? describe.skip
  : describe("NftMarketPlace Deployment", () => {
      let deployedContract;
      beforeEach(async () => {
        const contractFactory = await ethers.getContractFactory(
          "NftMarketPlace"
        );
        deployedContract = await contractFactory.deploy();
        // deployedContract.waitForDeployment(6);
        console.log("contractAddress:", deployedContract.target);
        // verifyContract(deployedContract);
      });

      describe("List Item", () => {
        it("Only owner can list items and checks if item is not listed already.", async () => {
          const listing = await deployedContract.getListing(
            deployedContract.target,
            1
          );
          const seller = listing.seller;
          const owner = await deployedContract.getOwner(
            deployedContract.target,
            1
          );
          const price = await deployedContract.getPrice(
            deployedContract.target,
            1
          );
          assert.equal(
            seller,
            owner,
            "Only the owner should be able to list items."
          );
          assert.equal(price.toString(), "0", "NFT is listed.");
        });
      });
    });
