import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function main() {
  const args = process.argv.slice(2);
  const networkArg = args[0] || "base-sepolia";
  
  const networkName = networkArg === "base-mainnet" ? "base" : "baseSepolia";
  const deploymentFile = path.join(__dirname, `../deployments/latest-${networkArg}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.error("Run deployment first: npx hardhat run scripts/deploy-base.ts --network", networkName);
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf-8"));
  const { contracts, deployer } = deployment;
  
  console.log("🔍 Verifying contracts on Basescan");
  console.log("=" .repeat(80));
  console.log("Network:", networkName);
  console.log("Deployer:", deployer);
  console.log("=" .repeat(80));
  
  const verifications = [
    {
      name: "StreamToken",
      address: contracts.StreamToken,
      args: [deployer],
    },
    {
      name: "SummaryNFT",
      address: contracts.SummaryNFT,
      args: [deployer],
    },
    {
      name: "Staking",
      address: contracts.Staking,
      args: [contracts.StreamToken, deployer],
    },
    {
      name: "BountyBoard",
      address: contracts.BountyBoard,
      args: [contracts.StreamToken, deployer],
    },
    {
      name: "ConditionalTokens",
      address: contracts.ConditionalTokens,
      args: [],
    },
    {
      name: "PredictionMarketFactory",
      address: contracts.PredictionMarketFactory,
      args: [contracts.ConditionalTokens],
    },
  ];
  
  for (const { name, address, args } of verifications) {
    console.log(`\n📝 Verifying ${name}...`);
    console.log(`Address: ${address}`);
    
    try {
      const argsStr = args.map(arg => `"${arg}"`).join(" ");
      const command = `npx hardhat verify --network ${networkName} ${address} ${argsStr}`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes("Already Verified")) {
        console.error("⚠️ Warning:", stderr);
      }
      
      if (stdout.includes("Already Verified")) {
        console.log("✅ Already verified");
      } else if (stdout.includes("Successfully verified")) {
        console.log("✅ Successfully verified");
      } else {
        console.log(stdout);
      }
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ Already verified");
      } else {
        console.error("❌ Verification failed:", error.message);
      }
    }
    
    // Wait a bit between verifications to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n" + "=" .repeat(80));
  console.log("🎉 Verification complete!");
  console.log("=" .repeat(80));
  console.log(`\n🌐 View on Basescan: https://${networkName === 'base' ? '' : 'sepolia.'}basescan.org/address/${contracts.StreamToken}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Verification failed:", error);
    process.exit(1);
  });
