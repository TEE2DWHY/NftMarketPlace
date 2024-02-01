const verifyContract = require("../utils/verifyContract");
const { ethers, network } = require("hardhat");
require("dotenv").config();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const main = async () => {
  try {
    const marketplaceContract = await ethers.getContractFactory(
      "NftMarketPlace"
    );
    console.log("------------------------------------");
    console.log("contract is being deployed");
    console.log("------------------------------------");
    if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
      const deployedContract = await marketplaceContract.deploy();
      await deployedContract.waitForDeployment(6);
      console.log("Contract Address:", deployedContract.target);
      setTimeout(async () => {
        await verifyContract(deployedContract.target);
      }, 60000);
    } else {
      const deployedContract = await marketplaceContract.deploy();
      console.log("------------------------------------");
      console.log("Contract Address:", deployedContract.target);
    }
  } catch (err) {
    console.log(err);
  }
};

main();

module.exports = main;
