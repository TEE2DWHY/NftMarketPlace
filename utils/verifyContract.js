const { run } = require("hardhat");

const verifyContract = async (contractAddress) => {
  try {
    //the verify here is the task that would be running
    await run("verify", {
      address: contractAddress,
    });
  } catch (error) {
    if (error.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    }
    console.log(error.message);
  }
};

module.exports = verifyContract;
