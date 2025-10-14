const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n📍 Deployer Wallet Address:", deployer.address);
  
  try {
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Current Balance:", hre.ethers.formatEther(balance), "ETH on Base Sepolia\n");
  } catch (e) {
    console.log("⚠️ Could not fetch balance - RPC might be unavailable\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
