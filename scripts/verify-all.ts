import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const network = process.env.HARDHAT_NETWORK || "baseSepolia";
  
  // Load latest deployment
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `latest-${network}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`No deployment found for network: ${network}`);
    console.error(`Looking for: ${deploymentFile}`);
    process.exit(1);
  }
  
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  
  console.log("Verifying contracts on", network);
  console.log("Deployer:", deployment.deployer);
  
  try {
    // Verify STREAM Token
    console.log("\n1. Verifying STREAM Token...");
    await run("verify:verify", {
      address: deployment.contracts.StreamToken,
      constructorArguments: [deployment.deployer],
    });
    console.log("✅ STREAM Token verified");
  } catch (error: any) {
    console.log("Note:", error.message);
  }
  
  try {
    // Verify Summary NFT
    console.log("\n2. Verifying Summary NFT...");
    await run("verify:verify", {
      address: deployment.contracts.SummaryNFT,
      constructorArguments: [deployment.deployer],
    });
    console.log("✅ Summary NFT verified");
  } catch (error: any) {
    console.log("Note:", error.message);
  }
  
  try {
    // Verify Staking
    console.log("\n3. Verifying Staking Contract...");
    await run("verify:verify", {
      address: deployment.contracts.Staking,
      constructorArguments: [deployment.contracts.StreamToken, deployment.deployer],
    });
    console.log("✅ Staking Contract verified");
  } catch (error: any) {
    console.log("Note:", error.message);
  }
  
  try {
    // Verify Bounty Board
    console.log("\n4. Verifying Bounty Board...");
    await run("verify:verify", {
      address: deployment.contracts.BountyBoard,
      constructorArguments: [deployment.contracts.StreamToken, deployment.deployer],
    });
    console.log("✅ Bounty Board verified");
  } catch (error: any) {
    console.log("Note:", error.message);
  }
  
  console.log("\n✨ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
