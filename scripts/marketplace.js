const verifyContract = require("../utils/verifyContract");
const { ethers, network } = require("hardhat");
require("dotenv").config();

const main = async () => {
  try {
    const marketplaceContract = await ethers.getContractFactory(
      "NftMarketPlace"
    );
    console.log("------------------------------------");
    console.log("contract is being deployed....");
    console.log("------------------------------------");
    const deployedContract = await marketplaceContract.deploy();
    await deployedContract.waitForDeployment(6);
    console.log("Contract Address:", deployedContract.target);
    if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
      setTimeout(async () => {
        await verifyContract(deployedContract.target);
      }, 60000);
    }
  } catch (error) {
    console.log(error.message);
  }
};

main();

module.exports = main;
