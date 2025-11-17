import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying StreamAiX to Base");
  console.log("=" .repeat(80));
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("=" .repeat(80));
  
  // Verify we're on Base
  if (network.chainId !== 8453n && network.chainId !== 84532n) {
    console.error("❌ ERROR: Must deploy to Base Mainnet (8453) or Base Sepolia (84532)");
    console.error("Current chain ID:", network.chainId.toString());
    process.exit(1);
  }
  
  const contracts: Record<string, string> = {};
  
  // 1. Deploy STREAM Token
  console.log("\n1️⃣ Deploying STREAM Token (ERC-20)...");
  const StreamToken = await ethers.getContractFactory("StreamToken");
  const streamToken = await StreamToken.deploy(deployer.address);
  await streamToken.waitForDeployment();
  contracts.StreamToken = await streamToken.getAddress();
  console.log("✅ STREAM Token:", contracts.StreamToken);
  
  // 2. Deploy Summary NFT
  console.log("\n2️⃣ Deploying Summary NFT (ERC-721)...");
  const SummaryNFT = await ethers.getContractFactory("SummaryNFT");
  const summaryNFT = await SummaryNFT.deploy(deployer.address);
  await summaryNFT.waitForDeployment();
  contracts.SummaryNFT = await summaryNFT.getAddress();
  console.log("✅ Summary NFT:", contracts.SummaryNFT);
  
  // 3. Deploy Staking Contract
  console.log("\n3️⃣ Deploying Staking Contract...");
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(contracts.StreamToken, deployer.address);
  await staking.waitForDeployment();
  contracts.Staking = await staking.getAddress();
  console.log("✅ Staking:", contracts.Staking);
  
  // 4. Deploy Bounty Board
  console.log("\n4️⃣ Deploying Bounty Board...");
  const BountyBoard = await ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy(contracts.StreamToken, deployer.address);
  await bountyBoard.waitForDeployment();
  contracts.BountyBoard = await bountyBoard.getAddress();
  console.log("✅ Bounty Board:", contracts.BountyBoard);
  
  // 5. Deploy Conditional Tokens (ERC-1155)
  console.log("\n5️⃣ Deploying Conditional Tokens (ERC-1155)...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy();
  await conditionalTokens.waitForDeployment();
  contracts.ConditionalTokens = await conditionalTokens.getAddress();
  console.log("✅ Conditional Tokens:", contracts.ConditionalTokens);
  
  // 6. Deploy Prediction Market Factory
  console.log("\n6️⃣ Deploying Prediction Market Factory...");
  const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarketFactory");
  const factory = await PredictionMarketFactory.deploy(contracts.ConditionalTokens);
  await factory.waitForDeployment();
  contracts.PredictionMarketFactory = await factory.getAddress();
  console.log("✅ Prediction Market Factory:", contracts.PredictionMarketFactory);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts,
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const networkName = network.chainId === 8453n ? "base-mainnet" : "base-sepolia";
  const filename = `${networkName}-${Date.now()}.json`;
  const latestFilename = `latest-${networkName}.json`;
  
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  fs.writeFileSync(
    path.join(deploymentsDir, latestFilename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Allocate tokens for staking rewards
  console.log("\n7️⃣ Allocating STREAM tokens...");
  const rewardAllocation = ethers.parseEther("10000000"); // 10M tokens
  const tx = await streamToken.transfer(contracts.Staking, rewardAllocation);
  await tx.wait();
  console.log("✅ Allocated 10M STREAM to Staking contract");
  
  // Print summary
  console.log("\n" + "=".repeat(80));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(80));
  console.log("📄 Saved to:", filename);
  console.log("\n📋 Contract Addresses:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  
  // Print environment variables
  console.log("\n" + "=".repeat(80));
  console.log("🔑 ENVIRONMENT VARIABLES FOR FRONTEND:");
  console.log("=".repeat(80));
  console.log(`VITE_BASE_STREAM_TOKEN=${contracts.StreamToken}`);
  console.log(`VITE_BASE_SUMMARY_NFT=${contracts.SummaryNFT}`);
  console.log(`VITE_BASE_STAKING=${contracts.Staking}`);
  console.log(`VITE_BASE_BOUNTY_BOARD=${contracts.BountyBoard}`);
  console.log(`VITE_BASE_CONDITIONAL_TOKENS=${contracts.ConditionalTokens}`);
  console.log(`VITE_BASE_PREDICTION_FACTORY=${contracts.PredictionMarketFactory}`);
  console.log("=".repeat(80));
  
  // Print verification commands
  console.log("\n" + "=".repeat(80));
  console.log("📝 VERIFY CONTRACTS ON BASESCAN:");
  console.log("=".repeat(80));
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.StreamToken} "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.SummaryNFT} "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.Staking} "${contracts.StreamToken}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.BountyBoard} "${contracts.StreamToken}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.ConditionalTokens}`);
  console.log(`npx hardhat verify --network ${network.chainId === 8453n ? 'base' : 'baseSepolia'} ${contracts.PredictionMarketFactory} "${contracts.ConditionalTokens}"`);
  console.log("=".repeat(80));
  
  console.log("\n✨ Ready to verify and integrate with frontend!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
