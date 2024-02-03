const { run } = require("hardhat");

const verifyContract = async (contractAddress, args) => {
  console.log("verifying contract......");
  console.log("-----------------------------------");
  try {
    await run("verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    x;
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    }
    console.log(error.message);
  }
};

module.exports = verifyContract;
