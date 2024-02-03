const { ethers, network } = require("hardhat");
require("dotenv").config();
const verifyContract = require("../utils/verifyContract");

const main = async () => {
  try {
    const nftContract = await ethers.getContractFactory("MockERC721");
    console.log("---------------------------------");
    console.log("contract is being deployed.....");
    console.log("---------------------------------");
    const [name, symbol] = ["Adisa", "AD"];
    if (network.config.chainId === 5 && process.env.ETHERSCAN_API_KEY) {
      const deployedContract = await nftContract.deploy(name, symbol);
      await deployedContract.waitForDeployment(6);
      console.log("Contract Address:", deployedContract.target);
      console.log("---------------------------------");
      setTimeout(async () => {
        await verifyContract(deployedContract.target, [name, symbol]);
      }, 60000);
    }
  } catch (error) {
    console.log(error.message);
  }
};

main();

module.exports = main;
