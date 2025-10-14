const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceInEth = hre.ethers.formatEther(balance);
  
  console.log("📍 Wallet Address:", deployer.address);
  console.log("💰 Balance:", balanceInEth, "ETH");
  console.log("⛽ Gas estimate for claiming bounty: ~0.001 ETH");
  
  if (parseFloat(balanceInEth) < 0.001) {
    console.log("\n⚠️  WARNING: Low balance! You need more Base Sepolia ETH.");
    console.log("🔗 Get testnet ETH from: https://www.coinbase.com/faucets/base-sepolia-faucet");
  } else {
    console.log("\n✅ Sufficient balance for transactions!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
