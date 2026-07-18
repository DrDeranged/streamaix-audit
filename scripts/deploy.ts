import hre from "hardhat";
const { ethers } = hre;
import * as fs from "fs";
import * as path from "path";
import { assertMainnetSafety, handoffRoles } from "./roles.ts";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name, "ChainId:", network.chainId.toString());
  assertMainnetSafety(network.chainId);
  
  // Deploy STREAM Token
  console.log("\n1. Deploying STREAM Token...");
  const StreamToken = await ethers.getContractFactory("StreamToken");
  const streamToken = await StreamToken.deploy(deployer.address);
  await streamToken.waitForDeployment();
  const streamTokenAddress = await streamToken.getAddress();
  console.log("✅ STREAM Token deployed to:", streamTokenAddress);
  
  // Deploy Summary NFT
  console.log("\n2. Deploying Summary NFT...");
  const SummaryNFT = await ethers.getContractFactory("SummaryNFT");
  const summaryNFT = await SummaryNFT.deploy(deployer.address);
  await summaryNFT.waitForDeployment();
  const summaryNFTAddress = await summaryNFT.getAddress();
  console.log("✅ Summary NFT deployed to:", summaryNFTAddress);
  
  // Deploy Staking Contract
  console.log("\n3. Deploying Staking Contract...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(streamTokenAddress, deployer.address);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking Contract deployed to:", stakingAddress);
  
  // Deploy Bounty Board
  console.log("\n4. Deploying Bounty Board...");
  const BountyBoard = await ethers.getContractFactory("BountyBoard");
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
  
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const deploymentsDir = path.join(scriptDir, "../deployments");
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
  
  // Print environment variables to add
  console.log("\n" + "=".repeat(80));
  console.log("🔑 ADD THESE TO YOUR .env FILE:");
  console.log("=".repeat(80));
  console.log(`VITE_BASE_STREAM_TOKEN=${streamTokenAddress}`);
  console.log(`VITE_BASE_SUMMARY_NFT=${summaryNFTAddress}`);
  console.log(`VITE_BASE_STAKING=${stakingAddress}`);
  console.log(`VITE_BASE_BOUNTY_BOARD=${bountyBoardAddress}`);
  console.log("=".repeat(80));
  
  // Print verification commands
  console.log("\n" + "=".repeat(80));
  console.log("📝 VERIFY CONTRACTS ON BASESCAN:");
  console.log("=".repeat(80));
  console.log(`npx hardhat verify --network ${network.name} ${streamTokenAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.name} ${summaryNFTAddress} "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.name} ${stakingAddress} "${streamTokenAddress}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.name} ${bountyBoardAddress} "${streamTokenAddress}" "${deployer.address}"`);
  console.log("=".repeat(80));
  
  // Allocate tokens to staking contract for rewards
  console.log("\n5. Allocating STREAM tokens to Staking contract...");
  const rewardAllocation = ethers.parseEther("10000000"); // 10M tokens for staking rewards
  const tx = await streamToken.transfer(stakingAddress, rewardAllocation);
  await tx.wait();
  console.log("✅ Allocated 10M STREAM tokens to Staking contract");
  
  // Role handoff: service key gets MINTER_ROLE, admin goes to multisig, deployer renounces.
  await handoffRoles(deployer.address, { streamToken, summaryNFT });
  
  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
