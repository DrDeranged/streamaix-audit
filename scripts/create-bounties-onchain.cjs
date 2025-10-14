const hre = require("hardhat");
const { Client } = require("pg");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Creating bounties on-chain with deployer:", deployer.address);
  
  // Connect to database
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await db.connect();
  
  // Fetch bounties from database
  const result = await db.query(`
    SELECT id, title, reward, deadline, creator_wallet
    FROM bounties 
    WHERE contract_bounty_id IS NOT NULL
    ORDER BY created_at
    LIMIT 5
  `);
  
  const bounties = result.rows;
  console.log(`\n📋 Found ${bounties.length} bounties to create on-chain\n`);
  
  // Get contract addresses
  const streamTokenAddress = "0x490520c8c45e444fFC510B35596eB0D4Fb104ff3";
  const bountyBoardAddress = "0x5F0b11E9A1bb2F16B1c03B92a8C2629e7dAfeF1e";
  
  // Get contract instances
  const StreamToken = await hre.ethers.getContractAt("StreamToken", streamTokenAddress);
  const BountyBoard = await hre.ethers.getContractAt("BountyBoard", bountyBoardAddress);
  
  // Process each bounty
  for (let i = 0; i < bounties.length; i++) {
    const bounty = bounties[i];
    console.log(`\n${i + 1}. Creating: ${bounty.title}`);
    
    // Convert reward to wei (STREAM has 18 decimals)
    const rewardInWei = hre.ethers.parseEther(bounty.reward.toString());
    
    // Calculate deadline timestamp (if null, set to 30 days from now)
    const deadlineTimestamp = bounty.deadline 
      ? Math.floor(new Date(bounty.deadline).getTime() / 1000)
      : Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
    
    console.log(`   💰 Reward: ${bounty.reward} STREAM`);
    console.log(`   ⏰ Deadline: ${new Date(deadlineTimestamp * 1000).toISOString()}`);
    
    try {
      // Step 1: Approve STREAM tokens with gas settings
      console.log("   🔓 Approving STREAM tokens...");
      const approveTx = await StreamToken.approve(bountyBoardAddress, rewardInWei, {
        gasLimit: 100000
      });
      await approveTx.wait();
      console.log("   ✅ Tokens approved");
      
      // Wait a bit to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Create bounty on-chain with gas settings
      console.log("   📝 Creating bounty on-chain...");
      const createTx = await BountyBoard.createBounty(rewardInWei, deadlineTimestamp, {
        gasLimit: 500000
      });
      const receipt = await createTx.wait();
      console.log(`   ✅ Bounty created! TxHash: ${receipt.hash}`);
      
      // Step 3: Get bounty ID from event
      const bountyCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = BountyBoard.interface.parseLog(log);
          return parsed && parsed.name === "BountyCreated";
        } catch {
          return false;
        }
      });
      
      let contractBountyId;
      if (bountyCreatedEvent) {
        const parsed = BountyBoard.interface.parseLog(bountyCreatedEvent);
        contractBountyId = Number(parsed.args.bountyId);
        console.log(`   🎯 On-chain Bounty ID: ${contractBountyId}`);
      } else {
        // Fallback: get current bounty count
        const count = await BountyBoard.bountyCount();
        contractBountyId = Number(count);
        console.log(`   🎯 On-chain Bounty ID (from count): ${contractBountyId}`);
      }
      
      // Step 4: Update database with real contractBountyId
      await db.query(`
        UPDATE bounties 
        SET contract_bounty_id = $1, blockchain_tx_hash = $2
        WHERE id = $3
      `, [contractBountyId, receipt.hash, bounty.id]);
      
      console.log(`   💾 Database updated with contract_bounty_id: ${contractBountyId}`);
      
      // Wait between bounties
      if (i < bounties.length - 1) {
        console.log("   ⏳ Waiting 3 seconds before next bounty...");
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error(`   ❌ Error creating bounty: ${error.message}`);
      continue;
    }
  }
  
  // Final check
  console.log("\n" + "=".repeat(80));
  console.log("✨ BOUNTY CREATION COMPLETE!");
  console.log("=".repeat(80));
  
  const updatedBounties = await db.query(`
    SELECT id, title, contract_bounty_id, blockchain_tx_hash
    FROM bounties 
    ORDER BY created_at
    LIMIT 5
  `);
  
  console.log("\n📊 Updated Bounties:");
  updatedBounties.rows.forEach((b, idx) => {
    console.log(`${idx + 1}. ${b.title}`);
    console.log(`   Contract ID: ${b.contract_bounty_id}`);
    console.log(`   TxHash: ${b.blockchain_tx_hash ? b.blockchain_tx_hash.substring(0, 20) + '...' : 'N/A'}`);
  });
  
  await db.end();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
