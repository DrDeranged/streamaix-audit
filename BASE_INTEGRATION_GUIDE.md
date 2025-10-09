# Base Blockchain Integration Guide

## 🎯 Current Status

✅ **Completed:**
- Smart contracts compiled successfully (ConditionalTokens.sol, PredictionMarketFactory.sol)
- Hardhat configured for Base mainnet (Chain ID: 8453) and Base Sepolia testnet (Chain ID: 84532)
- Deployment script ready (`scripts/deploy-prediction-markets.cjs`)
- Private key configured in environment
- 10 prediction markets seeded in PostgreSQL database

⏳ **Pending:**
- Deploy contracts to Base network (requires ETH for gas)
- Update .env with deployed contract addresses
- Verify contracts on Basescan (optional, requires BASESCAN_API_KEY)

---

## 📍 Deployer Wallet Address

**Address:** `0x9C78aCE6cE656Efa4faAdD73F4A9245B90619655`

This is the wallet derived from your PRIVATE_KEY. You need to fund it with ETH for deployment.

---

## 💰 Funding Options

### Option 1: Base Mainnet (Production)
1. Send **~0.01 ETH** to: `0x9C78aCE6cE656Efa4faAdD73F4A9245B90619655`
2. You can bridge ETH from Ethereum mainnet via [Base Bridge](https://bridge.base.org)
3. Or buy ETH directly on Base via Coinbase

### Option 2: Base Sepolia Testnet (Testing)
1. Get free testnet ETH from: [Coinbase Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Or from: [Alchemy Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
3. Send to: `0x9C78aCE6cE656Efa4faAdD73F4A9245B90619655`

---

## 🚀 Deployment Commands

### Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-prediction-markets.cjs --network base
```

### Deploy to Base Sepolia Testnet
```bash
npx hardhat run scripts/deploy-prediction-markets.cjs --network baseSepolia
```

---

## 📋 After Deployment

The deployment script will automatically:
1. Deploy ConditionalTokens (ERC-1155 for YES/NO positions)
2. Deploy PredictionMarketFactory (market creation and AMM logic)
3. Configure contracts (authorize factory in ConditionalTokens)
4. Save deployment info to `deployments/` folder
5. Print environment variables to add to `.env`

### Example Output:
```
================================================================================
🔑 ADD THESE TO YOUR .env FILE:
================================================================================
CONDITIONAL_TOKENS_ADDRESS=0x1234...
PREDICTION_FACTORY_ADDRESS=0x5678...
VITE_CONDITIONAL_TOKENS_ADDRESS=0x1234...
VITE_PREDICTION_FACTORY_ADDRESS=0x5678...
================================================================================
```

Copy these values and add them to your `.env` file.

---

## 🔍 Contract Verification (Optional)

If you have a Basescan API key, add it to `.env`:
```
BASESCAN_API_KEY=your_key_here
```

Then verify contracts:
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS> "<CONSTRUCTOR_ARGS>"
```

The deployment script will print the exact verification commands for you.

---

## 🏗️ Smart Contract Architecture

### ConditionalTokens (ERC-1155)
- Mints YES/NO outcome tokens for each market
- YES token ID = marketId * 2
- NO token ID = marketId * 2 + 1
- Handles position redemption after market resolution

### PredictionMarketFactory
- Creates new prediction markets
- Manages AMM liquidity pools (x*y=k constant product)
- Executes trades with slippage protection
- Handles market resolution via UMA Optimistic Oracle
- Distributes winnings to correct predictors

---

## 🔗 Integration with Existing Database

Your prediction markets are already stored in PostgreSQL:
- 10 diverse markets across all categories
- Initial liquidity ranging from 800-2000 STREAM tokens
- 50/50 YES/NO probability (5000/10000 basis points)

Once contracts are deployed:
1. Backend will interact with blockchain for trades
2. Database tracks positions, trades, and analytics
3. Hybrid architecture: off-chain matching, on-chain settlement

---

## 🌐 Frontend Integration

The prediction markets are already visible on:
- `/` - Landing page with featured markets section
- `/markets` - Full market listing with category filters
- `/markets/:id` - Individual market trading pages

After deployment, users can:
- Buy/sell YES/NO positions with real on-chain transactions
- See real-time pricing from AMM
- Track their positions in ConditionalTokens (ERC-1155)
- Redeem winnings after market resolution

---

## 🎮 Next Steps

1. **Fund the deployer wallet** with ETH
2. **Run the deployment script** (mainnet or testnet)
3. **Copy contract addresses** to `.env` file
4. **Restart the application** to load new env vars
5. **Test market creation** through the UI
6. **Execute trades** and verify blockchain transactions
7. **Monitor on Basescan**: https://basescan.org

---

## 🆘 Troubleshooting

**Error: "Deployer account has 0 ETH balance"**
→ Fund the wallet address shown in the error message

**Error: "incorrect number of arguments to constructor"**
→ Fixed - ConditionalTokens now receives deployer.address as initialOwner

**Error: "Unknown file extension .ts"**
→ Fixed - Deploy scripts use .cjs extension for CommonJS

**Error: "ERESOLVE unable to resolve dependency tree"**
→ Fixed - Downgraded to Hardhat v2.26.0 for compatibility

---

## 📊 Cost Estimates

**Base Mainnet Deployment:**
- ConditionalTokens: ~0.003 ETH
- PredictionMarketFactory: ~0.005 ETH
- Configuration tx: ~0.0005 ETH
- **Total: ~0.009 ETH (~$30-40 USD at current ETH prices)**

**Base Sepolia (Free):**
- Testnet ETH is free from faucets
- Perfect for testing before mainnet deployment

---

## ✅ Ready to Deploy!

Everything is configured and ready. Just fund the wallet and run the deployment command!
