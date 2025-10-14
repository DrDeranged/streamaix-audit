const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🚀 Deploying PredictionMarketFactory...");
  console.log("📍 Deployer:", deployer.address);
  
  const conditionalTokensAddress = "0xb68f4dD0C228EeDB3492000284d1369a3D1FB1f3";
  const streamTokenAddress = "0x490520c8c45e444fFC510B35596eB0D4Fb104ff3";
  
  console.log("✅ Using ConditionalTokens:", conditionalTokensAddress);
  console.log("✅ Using STREAM Token:", streamTokenAddress);
  
  // Deploy Prediction Market Factory
  console.log("\n2️⃣ Deploying PredictionMarketFactory...");
  const PredictionMarketFactory = await hre.ethers.getContractFactory("PredictionMarketFactory");
  const factory = await PredictionMarketFactory.deploy(
    conditionalTokensAddress,
    streamTokenAddress,
    deployer.address,
    { gasLimit: 5000000 }
  );
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ PredictionMarketFactory deployed to:", factoryAddress);
  
  const network = await hre.ethers.provider.getNetwork();
  
  // Load existing deployment info
  const latestPath = path.join(__dirname, "../deployments", `latest-${network.name}.json`);
  let deploymentInfo = {};
  if (fs.existsSync(latestPath)) {
    deploymentInfo = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
  }
  
  // Add prediction market addresses
  deploymentInfo.contracts = {
    ...deploymentInfo.contracts,
    ConditionalTokens: conditionalTokensAddress,
    PredictionMarketFactory: factoryAddress
  };
  deploymentInfo.timestamp = new Date().toISOString();
  
  // Save updated deployment info
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n✨ All prediction market contracts deployed!");
  console.log("\n" + "=".repeat(80));
  console.log("📋 PREDICTION MARKET CONTRACT ADDRESSES:");
  console.log("=".repeat(80));
  console.log("ConditionalTokens:", conditionalTokensAddress);
  console.log("PredictionMarketFactory:", factoryAddress);
  console.log("=".repeat(80));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
