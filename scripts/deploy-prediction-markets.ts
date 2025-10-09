import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("🚀 Deploying Prediction Market contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "ChainId:", network.chainId.toString());
  
  if (network.chainId !== 8453n && network.chainId !== 84532n) {
    console.error("❌ ERROR: Must deploy to Base mainnet (8453) or Base Sepolia (84532)");
    process.exit(1);
  }
  
  // Deploy Conditional Tokens (ERC-1155)
  console.log("\n1️⃣ Deploying ConditionalTokens (ERC-1155)...");
  const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
  const conditionalTokens = await ConditionalTokens.deploy();
  await conditionalTokens.waitForDeployment();
  const conditionalTokensAddress = await conditionalTokens.getAddress();
  console.log("✅ ConditionalTokens deployed to:", conditionalTokensAddress);
  
  // Deploy Prediction Market Factory
  console.log("\n2️⃣ Deploying PredictionMarketFactory...");
  const PredictionMarketFactory = await ethers.getContractFactory("PredictionMarketFactory");
  const factory = await PredictionMarketFactory.deploy(conditionalTokensAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ PredictionMarketFactory deployed to:", factoryAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      ConditionalTokens: conditionalTokensAddress,
      PredictionMarketFactory: factoryAddress,
    }
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filename = `prediction-markets-${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  // Also save latest deployment
  fs.writeFileSync(
    path.join(deploymentsDir, `latest-prediction-markets-${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n📄 Deployment info saved to:", filename);
  
  // Print environment variables to add
  console.log("\n" + "=".repeat(80));
  console.log("🔑 ADD THESE TO YOUR .env FILE:");
  console.log("=".repeat(80));
  console.log(`CONDITIONAL_TOKENS_ADDRESS=${conditionalTokensAddress}`);
  console.log(`PREDICTION_FACTORY_ADDRESS=${factoryAddress}`);
  console.log(`VITE_CONDITIONAL_TOKENS_ADDRESS=${conditionalTokensAddress}`);
  console.log(`VITE_PREDICTION_FACTORY_ADDRESS=${factoryAddress}`);
  console.log("=".repeat(80));
  
  // Print verification commands
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n" + "=".repeat(80));
    console.log("📝 VERIFY CONTRACTS ON BASESCAN:");
    console.log("=".repeat(80));
    console.log(`npx hardhat verify --network ${network.name} ${conditionalTokensAddress}`);
    console.log(`npx hardhat verify --network ${network.name} ${factoryAddress} "${conditionalTokensAddress}"`);
    console.log("=".repeat(80));
  } else {
    console.log("\n⚠️  BASESCAN_API_KEY not set - skip contract verification");
  }
  
  console.log("\n✨ Prediction Market deployment complete!");
  console.log("📊 You can now create prediction markets on Base network!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
