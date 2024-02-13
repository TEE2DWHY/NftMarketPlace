const { ethers } = require("hardhat");

const marketPlaceContract = await ethers.getContractFactory("NftMarketPlace");
const deployedContract = await marketPlaceContract.deploy();
const nftContract = await ethers.getContractFactory("MockERC721");
const deployedNft = await nftContract.deploy("DOG", "DNFT");
const mintTx = await deployedNft.mint();
console.log("Minting.....");
const mintTxReceipt = mintTx.wait(1);
const tokenId = mintTxReceipt.events[0].args.tokenId;
console.log("Approving....");
const approvalTx = await nftContract.approve(deployedContract.target, tokenId);
await approvalTx.wait(1);
