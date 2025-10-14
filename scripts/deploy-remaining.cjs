const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🚀 Deploying remaining contracts...");
  console.log("📍 Deployer:", deployer.address);
  
  const streamTokenAddress = "0x490520c8c45e444fFC510B35596eB0D4Fb104ff3";
  console.log("✅ Using existing STREAM Token:", streamTokenAddress);
  
  // Deploy Summary NFT with higher gas
  console.log("\n2️⃣ Deploying Summary NFT...");
  const SummaryNFT = await hre.ethers.getContractFactory("SummaryNFT");
  const summaryNFT = await SummaryNFT.deploy(deployer.address, {
    gasLimit: 3000000
  });
  await summaryNFT.waitForDeployment();
  const summaryNFTAddress = await summaryNFT.getAddress();
  console.log("✅ Summary NFT deployed to:", summaryNFTAddress);
  
  // Deploy Staking Contract
  console.log("\n3️⃣ Deploying Staking Contract...");
  const Staking = await hre.ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(streamTokenAddress, deployer.address, {
    gasLimit: 3000000
  });
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ Staking Contract deployed to:", stakingAddress);
  
  // Deploy Bounty Board
  console.log("\n4️⃣ Deploying Bounty Board...");
  const BountyBoard = await hre.ethers.getContractFactory("BountyBoard");
  const bountyBoard = await BountyBoard.deploy(streamTokenAddress, deployer.address, {
    gasLimit: 3000000
  });
  await bountyBoard.waitForDeployment();
  const bountyBoardAddress = await bountyBoard.getAddress();
  console.log("✅ Bounty Board deployed to:", bountyBoardAddress);
  
  const network = await hre.ethers.provider.getNetwork();
  
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
  
  fs.writeFileSync(
    path.join(deploymentsDir, `latest-${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n✨ All main contracts deployed!");
  console.log("\n" + "=".repeat(80));
  console.log("📋 CONTRACT ADDRESSES:");
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
