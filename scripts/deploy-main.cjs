const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🚀 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  
  const network = await hre.ethers.provider.getNetwork();
  console.log("📡 Network:", network.name, "ChainId:", network.chainId.toString());
  
  // Deploy STREAM Token
  console.log("\n1️⃣ Deploying STREAM Token...");
  const StreamToken = await hre.ethers.getContractFactory("StreamToken");
  const streamToken = await StreamToken.deploy(deployer.address);
  await streamToken.waitForDeployment();
  const streamTokenAddress = await streamToken.getAddress();
  console.log("✅ STREAM Token deployed to:", streamTokenAddress);
  
  // Deploy Summary NFT
  console.log("\n2️⃣ Deploying Summary NFT...");
  const SummaryNFT = await hre.ethers.getContractFactory("SummaryNFT");
  const summaryNFT = await SummaryNFT.deploy(deployer.address);
  await summaryNFT.waitForDeployment();
  const summaryNFTAddress = await summaryNFT.getAddress();
  console.log("✅ Summary NFT deployed to:", summaryNFTAddress);
  
  // Deploy Staking Contract
  console.log("\n3️⃣ Deploying Staking Contract...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(streamTokenAddress, deployer.address);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking Contract deployed to:", stakingAddress);
  
  // Deploy Bounty Board
  console.log("\n4️⃣ Deploying Bounty Board...");
  const BountyBoard = await hre.ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy(streamTokenAddress, deployer.address);
  await bountyBoard.waitForDeployment();
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("✅ Bounty Board deployed to:", bountyBoardAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      StreamToken: streamTokenAddress,
      SummaryNFT: summaryNFTAddress,
      Staking: stakingAddress,
      BountyBoard: bountyBoardAddress,
    }
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `deployment-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Also save latest deployment
  fs.writeFileSync(
    path.join(deploymentsDir, `latest-${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📄 Deployment info saved to:", filename);
  
  // Allocate tokens to staking contract for rewards
  console.log("\n5️⃣ Allocating STREAM tokens to Staking contract...");
  const rewardAllocation = hre.ethers.parseEther("10000000"); // 10M tokens for staking rewards
  const tx = await streamToken.transfer(stakingAddress, rewardAllocation);
  await tx.wait();
  console.log("✅ Allocated 10M STREAM tokens to Staking contract");
  
  console.log("\n✨ Main contracts deployment complete!");
  console.log("\n" + "=".repeat(80));
  console.log("📋 DEPLOYED CONTRACT ADDRESSES:");
  console.log("=".repeat(80));
  console.log("STREAM Token:", streamTokenAddress);
  console.log("Summary NFT:", summaryNFTAddress);
  console.log("Staking:", stakingAddress);
  console.log("Bounty Board:", bountyBoardAddress);
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
