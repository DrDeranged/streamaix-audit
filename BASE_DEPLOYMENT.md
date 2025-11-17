# 🚀 StreamAiX Base Deployment Guide

Deploy StreamAiX smart contracts to Base network in 3 simple steps.

## Quick Start

### 1️⃣ Deploy to Base Sepolia (Testnet)

```bash
npx hardhat run scripts/deploy-base.ts --network baseSepolia
```

Get free testnet ETH: [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

### 2️⃣ Verify Contracts

```bash
npx tsx scripts/verify-base.ts base-sepolia
```

### 3️⃣ Deploy to Base Mainnet

```bash
npx hardhat run scripts/deploy-base.ts --network base
npx tsx scripts/verify-base.ts base-mainnet
```

## What Gets Deployed

✅ **6 Smart Contracts:**
1. STREAM Token (ERC-20) - Your platform token
2. Summary NFT (ERC-721) - Content ownership
3. Staking Contract - STREAM token rewards
4. Bounty Board - Gamified tasks
5. Conditional Tokens (ERC-1155) - Prediction market shares
6. Prediction Market Factory - Create prediction markets

## Configuration

All set! Your Hardhat is already configured for Base:
- ✅ Base Mainnet (Chain ID: 8453)
- ✅ Base Sepolia (Chain ID: 84532)
- ✅ BASESCAN_API_KEY configured for verification
- ✅ PRIVATE_KEY configured for deployment

## After Deployment

The script outputs environment variables. Add these to Replit Secrets:

```
VITE_BASE_STREAM_TOKEN=0x...
VITE_BASE_SUMMARY_NFT=0x...
VITE_BASE_STAKING=0x...
VITE_BASE_BOUNTY_BOARD=0x...
VITE_BASE_CONDITIONAL_TOKENS=0x...
VITE_BASE_PREDICTION_FACTORY=0x...
```

## Deployment Info

Contract addresses saved to:
- `deployments/latest-base-sepolia.json`
- `deployments/latest-base-mainnet.json`

## Resources

- [Base Docs](https://docs.base.org)
- [Basescan](https://basescan.org)
- [Base Bridge](https://bridge.base.org)
