const { ethers } = require("hardhat");
const mintAndList = async () => {
  try {
    let owner;
    let buyer;
    const price = ethers.parseEther("1");
    [owner, buyer] = await ethers.getSigners();
    const marketPlaceContract = await ethers.getContractFactory(
      "NftMarketPlace"
    );
    const deployedContract = await marketPlaceContract.deploy();
    deployedContract.waitForDeployment(6);
    const nftContract = await ethers.getContractFactory("MockERC721");
    const deployedNft = await nftContract.deploy("DOG", "DNFT");
    deployedNft.waitForDeployment(6);
    console.log("Minting Nft.....");
    const mintTx = await deployedNft.mintNft(owner.address, 2);
    const mintTxReceipt = await mintTx.wait(1);
    const tokenId = mintTxReceipt.logs[1].args.tokenId.toString();
    console.log("Minted✅");
    console.log("Approving Nft....");
    const approvalTx = await deployedNft.approveNft(
      deployedContract.target,
      tokenId
    );
    await approvalTx.wait(1);
    console.log("Approved✅");
    console.log("Listing Nft....");
    const listedItem = await deployedContract
      .connect(owner)
      .listItem(deployedNft.target, tokenId, price);
    await listedItem.wait(1);
    console.log("Listed✅");
  } catch (error) {
    console.log(error.message);
  }
};

mintAndList();
module.exports = mintAndList;
