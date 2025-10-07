# IPFS & Arweave Storage Integration

## Overview
StreamAiX now supports **real decentralized storage** using IPFS (via Pinata) and Arweave for storing AI-generated summaries permanently on-chain.

## Features
- ✅ Real IPFS uploads via Pinata API
- ✅ Real Arweave uploads via Irys devnet
- ✅ Graceful fallback to mock hashes when not configured
- ✅ Parallel uploads for speed (IPFS + Arweave simultaneously)
- ✅ Automatic integration with content processing pipeline

## Configuration

### Setup Pinata (for IPFS)
1. Create account at https://pinata.cloud (free tier available)
2. Generate API key in account settings
3. Add to Replit Secrets:
   - `PINATA_API_KEY=your_api_key`
   - `PINATA_SECRET_KEY=your_secret_key`

### Setup Arweave (optional)
1. Get Arweave wallet from https://arweave.org
2. Add to Replit Secrets:
   - `ARWEAVE_KEY=your_wallet_key`

### Fallback Behavior
If credentials are not configured:
- ⚠️ System will generate mock hashes
- ⚠️ Warning logged in console
- ✅ Application continues to work normally

## How It Works

### Content Processing Pipeline
When a summary is processed:

1. **Extract & Analyze** - Content is analyzed by AI
2. **Prepare Data** - Summary, insights, chapters packaged as JSON
3. **Upload to IPFS** - JSON uploaded to Pinata → returns IPFS hash (CID)
4. **Upload to Arweave** - Same JSON uploaded to Arweave → returns transaction ID
5. **Save to Database** - Hashes stored in `summaries` table
6. **Ready for NFT Minting** - IPFS hash used as NFT metadata URI

### Example Upload Flow
```
Summary Created → AI Analysis → Data Package
                                    ↓
                    ┌───────────────┴──────────────┐
                    ↓                              ↓
            IPFS Upload                    Arweave Upload
         (via Pinata API)                 (via Irys devnet)
                    ↓                              ↓
            QmXYZ123...                    abc789def...
                    └───────────────┬──────────────┘
                                    ↓
                        Save to PostgreSQL Database
```

## Implementation Details

### Server-Side Storage (`server/services/web3Service.ts`)
```typescript
// Real IPFS upload
static async storeOnIPFS(data: any): Promise<string> {
  // Uses Pinata API with automatic fallback
  // Returns: QmXXXXXX... (IPFS CID)
}

// Real Arweave upload
static async storeOnArweave(data: any): Promise<string> {
  // Uses Irys devnet with automatic fallback
  // Returns: transaction ID
}
```

### Content Processor Integration (`server/services/rebuiltContentProcessor.ts`)
- **Fast Mode** (metadata analysis): Uploads analysis results
- **Deep Mode** (transcription): Uploads transcript + analysis

## Viewing Uploaded Content

### IPFS Gateways
- Pinata: `https://gateway.pinata.cloud/ipfs/{hash}`
- IPFS.io: `https://ipfs.io/ipfs/{hash}`
- Cloudflare: `https://cloudflare-ipfs.com/ipfs/{hash}`

### Arweave Gateways
- Main: `https://arweave.net/{txId}`
- AR.io: `https://ar-io.net/{txId}`

## Stored Data Structure
```json
{
  "title": "Summary Title",
  "summary": "Full AI-generated summary...",
  "tldrSummary": "Quick overview...",
  "blogPost": "Executive summary...",
  "bulletPoints": ["Key point 1", "Key point 2"],
  "trends": ["Trend 1", "Trend 2"],
  "chapters": [
    {"title": "Chapter 1", "content": "...", "timestamp": "0:00"}
  ],
  "tags": ["crypto", "defi", "ai"],
  "metadata": {
    "channel": "Channel Name",
    "duration": 1234,
    "views": 50000
  },
  "createdAt": "2025-10-07T..."
}
```

## NFT Integration
The IPFS hash is used as the `tokenURI` when minting NFTs:
```solidity
// Smart contract reference
function mintSummaryNFT(address to, string memory ipfsHash) external {
    _mint(to, tokenId);
    _setTokenURI(tokenId, string.concat("ipfs://", ipfsHash));
}
```

## Costs

### IPFS (Pinata)
- **Free Tier**: 1 GB storage, unlimited gateways
- **Pro Tier**: $20/month for 100 GB

### Arweave
- **One-time payment**: ~$0.005 per KB for permanent storage
- **Irys devnet**: Free for testing

## Monitoring

### Check Upload Status
```bash
# View logs during content processing
# Look for:
# ✅ IPFS upload successful: QmXXX...
# ✅ Arweave upload successful: abc123...
```

### Verify Content
```bash
# Test IPFS hash
curl https://gateway.pinata.cloud/ipfs/QmYourHashHere

# Test Arweave ID
curl https://arweave.net/YourTxIdHere
```

## Troubleshooting

### Issue: "Mock IPFS hash" warning
**Solution**: Add PINATA_API_KEY and PINATA_SECRET_KEY to Replit Secrets

### Issue: Upload fails
**Solution**: Check API key validity, network connection, or review error logs

### Issue: Content not accessible via gateway
**Solution**: Wait 1-2 minutes for propagation, try alternative gateways

## Next Steps
1. ✅ Real IPFS storage - COMPLETE
2. 🚧 Deploy smart contracts to Base network
3. 🚧 Implement NFT minting with real IPFS metadata URIs
4. 🚧 Add content verification (compare IPFS vs Arweave hashes)

---
**Status**: ✅ Production-ready with graceful fallback
**Last Updated**: October 7, 2025
