# StreamAiX - Base Network Deployment Guide

Complete guide to deploying your StreamAiX dapp on Base network (Sepolia testnet and mainnet).

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Environment Setup](#step-1-environment-setup)
- [Step 2: Get Testnet Funds](#step-2-get-testnet-funds)
- [Step 3: Deploy to Base Sepolia (Testnet)](#step-3-deploy-to-base-sepolia-testnet)
- [Step 4: Verify Contracts](#step-4-verify-contracts)
- [Step 5: Update Application Configuration](#step-5-update-application-configuration)
- [Step 6: Test the Dapp](#step-6-test-the-dapp)
- [Step 7: Deploy to Base Mainnet](#step-7-deploy-to-base-mainnet)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:
- ✅ Node.js v18+ installed
- ✅ A MetaMask or compatible wallet
- ✅ ETH on Base Sepolia (testnet) or Base mainnet
- ✅ BaseScan API key for contract verification

---

## Step 1: Environment Setup

### 1.1 Create Environment File

Create a `.env` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env
```

### 1.2 Configure Private Key

**⚠️ IMPORTANT SECURITY NOTES:**
- NEVER commit your `.env` file to git
- NEVER share your private key
- Use a dedicated deployment wallet (not your main wallet)
- This wallet will own all contracts and have admin privileges

**Get your private key:**
1. Open MetaMask
2. Click account menu → Account details → Show private key
3. Copy the private key (starts with `0x`)

**Add to `.env`:**
```env
PRIVATE_KEY=0xYourPrivateKeyHere
NFT_OWNER_PRIVATE_KEY=0xYourPrivateKeyHere  # Can be same as above
```

### 1.3 Get BaseScan API Key

1. Visit https://basescan.org/myapikey
2. Sign up/login
3. Create a new API key
4. Add to `.env`:

```env
BASESCAN_API_KEY=YourBaseScanApiKeyHere
```

---

## Step 2: Get Testnet Funds

You need Base Sepolia ETH to deploy contracts on testnet.

### Option 1: Base Sepolia Faucet
Visit: https://www.alchemy.com/faucets/base-sepolia

### Option 2: Bridge from Sepolia ETH
1. Get Sepolia ETH from https://sepoliafaucet.com
2. Bridge to Base Sepolia via https://bridge.base.org

**Required amount:** ~0.05 ETH for deploying all 4 contracts

---

## Step 3: Deploy to Base Sepolia (Testnet)

### 3.1 Compile Contracts

```bash
npx hardhat compile
```

### 3.2 Deploy to Base Sepolia

```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```

**Expected output:**
```
Deploying contracts with account: 0xYourAddress
Account balance: 1000000000000000000

1. Deploying STREAM Token...
✅ STREAM Token deployed to: 0x1234...

2. Deploying Summary NFT...
✅ Summary NFT deployed to: 0x5678...

3. Deploying Staking Contract...
✅ Staking Contract deployed to: 0x9abc...

4. Deploying Bounty Board...
✅ Bounty Board deployed to: 0xdef0...

5. Allocating STREAM tokens to Staking contract...
✅ Allocated 10M STREAM tokens to Staking contract

📄 Deployment info saved to: deployment-baseSepolia-{timestamp}.json
```

### 3.3 Save Contract Addresses

Copy the addresses from the output and add them to your `.env`:

```env
VITE_BASE_STREAM_TOKEN=0xYourStreamTokenAddress
VITE_BASE_SUMMARY_NFT=0xYourSummaryNFTAddress
VITE_BASE_STAKING=0xYourStakingAddress
VITE_BASE_BOUNTY_BOARD=0xYourBountyBoardAddress
```

---

## Step 4: Verify Contracts

Verify all contracts on BaseScan:

```bash
npx hardhat run scripts/verify-all.ts --network baseSepolia
```

Or verify individually (if needed):

```bash
# STREAM Token
npx hardhat verify --network baseSepolia <STREAM_TOKEN_ADDRESS> "YOUR_WALLET_ADDRESS"

# Summary NFT
npx hardhat verify --network baseSepolia <SUMMARY_NFT_ADDRESS> "YOUR_WALLET_ADDRESS"

# Staking Contract
npx hardhat verify --network baseSepolia <STAKING_ADDRESS> "STREAM_TOKEN_ADDRESS" "YOUR_WALLET_ADDRESS"

# Bounty Board
npx hardhat verify --network baseSepolia <BOUNTY_BOARD_ADDRESS> "STREAM_TOKEN_ADDRESS" "YOUR_WALLET_ADDRESS"
```

**Verification successful when you see:**
```
Successfully verified contract on BaseScan.
https://sepolia.basescan.org/address/0xYourAddress#code
```

---

## Step 5: Update Application Configuration

### 5.1 Push Database Schema

Update database with NFT fields:

```bash
npm run db:push
```

If prompted about columns, select **"create column"** for any new fields.

### 5.2 Restart Application

```bash
npm run dev
```

The application will now use your deployed contracts!

---

## Step 6: Test the Dapp

### 6.1 Connect Wallet

1. Open your application: http://localhost:5000
2. Click "Connect Wallet"
3. Approve MetaMask connection
4. **Switch to Base Sepolia network** (app will prompt if needed)

### 6.2 Test Bounty Creation

1. Navigate to Bounties page
2. Click "Create Bounty"
3. Fill in details:
   - Title: "Test Bounty"
   - Description: "Testing on-chain bounty"
   - Reward: 100 STREAM tokens
   - Deadline: Set to future date
4. Click "Create Bounty"
5. **Approve STREAM tokens** in MetaMask (1st transaction)
6. **Confirm bounty creation** in MetaMask (2nd transaction)
7. View bounty on BaseScan: https://sepolia.basescan.org/tx/{txHash}

### 6.3 Test NFT Minting

When a summary is completed:
1. The backend will automatically mint an NFT
2. NFT will be sent to the creator's wallet
3. View on BaseScan: https://sepolia.basescan.org/token/{NFT_ADDRESS}

### 6.4 Test Staking

1. Navigate to Staking page
2. Enter amount to stake
3. Click "Stake"
4. Approve in MetaMask
5. View staked amount and rewards

---

## Step 7: Deploy to Base Mainnet

**⚠️ MAINNET DEPLOYMENT CHECKLIST:**

Before deploying to mainnet:
- [ ] All contracts tested thoroughly on testnet
- [ ] Security audit completed (recommended for production)
- [ ] Have sufficient ETH for deployment (~0.1 ETH recommended)
- [ ] Backup your private keys securely
- [ ] Understand gas costs and contract ownership

### 7.1 Update RPC URL (Optional)

In `.env`, ensure mainnet RPC is set:
```env
BASE_RPC_URL=https://mainnet.base.org
```

### 7.2 Deploy to Mainnet

```bash
npx hardhat run scripts/deploy.ts --network base
```

### 7.3 Verify on Mainnet

```bash
npx hardhat run scripts/verify-all.ts --network base
```

### 7.4 Update Environment Variables

Update `.env` with mainnet contract addresses and restart:
```bash
npm run dev
```

---

## Troubleshooting

### Issue: "Insufficient funds for gas"
**Solution:** Add more ETH to your deployment wallet

### Issue: "Contract verification failed"
**Solution:** 
1. Check BaseScan API key is correct
2. Wait 1-2 minutes after deployment
3. Try manual verification with exact constructor args

### Issue: "Transaction reverted"
**Solution:**
1. Check you approved tokens before creating bounty
2. Ensure deadline is in the future
3. Verify contract addresses are correct

### Issue: "Wrong network"
**Solution:** 
- Switch MetaMask to Base Sepolia (Chain ID: 84532) for testnet
- Or Base Mainnet (Chain ID: 8453) for production

### Issue: "NFT minting fails"
**Solution:**
1. Ensure `NFT_OWNER_PRIVATE_KEY` is set in `.env`
2. Verify summary has `ipfsHash` populated
3. Check backend logs for detailed error

---

## Network Information

### Base Sepolia Testnet
- **Chain ID:** 84532
- **RPC URL:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.alchemy.com/faucets/base-sepolia

### Base Mainnet
- **Chain ID:** 8453
- **RPC URL:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **Bridge:** https://bridge.base.org

---

## Deployed Contract Functions

### STREAM Token
- `balanceOf(address)` - Check token balance
- `transfer(to, amount)` - Transfer tokens
- `approve(spender, amount)` - Approve spending
- `mint(to, amount)` - Mint tokens (owner only)

### BountyBoard
- `createBounty(reward, deadline)` - Create on-chain bounty
- `claimBounty(bountyId)` - Claim a bounty
- `completeBounty(bountyId)` - Complete and pay (creator only)
- `addTip(bountyId, amount)` - Add tip to bounty

### SummaryNFT
- `mintSummaryNFT(to, ipfsHash, arweaveId)` - Mint NFT (owner only)
- `getSummaryData(tokenId)` - Get NFT metadata
- `balanceOf(address)` - Check NFT balance

### Staking
- `stake(amount)` - Stake STREAM tokens
- `unstake(amount)` - Unstake tokens
- `claimRewards()` - Claim staking rewards
- `getPendingRewards(address)` - View pending rewards

---

## API Endpoints

Your backend now includes Web3 endpoints:

- `POST /api/web3/mint-summary-nft` - Mint NFT (authenticated)
- `GET /api/web3/nfts/:address` - Get user's NFTs
- `GET /api/web3/staking/:address` - Get staking info
- `GET /api/web3/balance/:address` - Get token balance
- `POST /api/web3/reward-tokens` - Reward user (authenticated)
- `GET /api/web3/contracts` - Get contract addresses
- `POST /api/web3/verify-tx` - Verify transaction

---

## Security Best Practices

1. **Private Keys:**
   - Never commit to git
   - Use environment variables
   - Consider hardware wallets for mainnet

2. **Smart Contracts:**
   - Audit before mainnet deployment
   - Set up multi-sig for ownership
   - Monitor contract activity

3. **API Keys:**
   - Rotate regularly
   - Use separate keys for dev/prod
   - Limit permissions

4. **User Funds:**
   - Always test on testnet first
   - Implement emergency pause if needed
   - Have incident response plan

---

## Support

- **BaseScan Support:** https://basescan.org/contactus
- **Base Discord:** https://discord.gg/buildonbase
- **Hardhat Docs:** https://hardhat.org/docs

---

**🎉 Congratulations! Your StreamAiX dapp is now live on Base!**

For production deployment to Replit, your app is already configured and will automatically use the environment variables you've set.
