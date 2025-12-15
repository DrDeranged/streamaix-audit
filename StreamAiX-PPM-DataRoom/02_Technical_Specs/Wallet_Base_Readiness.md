# Wallet Identity & Base Readiness Specification

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** LIVE (Off-Chain Settlement) | Base Network CONFIGURED

---

## 1. Wallet Authentication Method

### Authentication Standard
StreamAiX uses a **custom signed message challenge** for wallet authentication. This is NOT EIP-4361 SIWE (Sign-In With Ethereum) but follows a similar pattern.

### Signed Message Format
```
Sign this message to authenticate with StreamAiX:

Address: 0x1234...abcd
Nonce: a7b9c3d1e5f2
Timestamp: 2025-12-15T10:30:00.000Z

This signature is only used for authentication and will not trigger any blockchain transaction.
```

### Signature Verification
- **Method:** `ethers.verifyMessage(message, signature)`
- **Library:** ethers.js v6
- **Recovery:** Recovered address compared to claimed address (case-insensitive)

```typescript
// server/services/web3Service.ts
static async verifySignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  const recoveredAddress = ethers.verifyMessage(message, signature);
  return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
}
```

---

## 2. Wallet Binding Rules

### Database Schema
```typescript
// shared/schema.ts - users table
walletAddress: text("wallet_address"),  // UNIQUE constraint
ensName: text("ens_name"),
authProvider: text("auth_provider").default("local"), // local, twitter, wallet
```

### Binding Constraints
| Rule | Implementation |
|------|----------------|
| One wallet per user | `wallet_address` column has UNIQUE constraint |
| Wallet change allowed | Yes, user can disconnect and reconnect different wallet |
| Re-auth required on change | Yes, new signature required for new wallet |
| ENS resolution | Supported via Ethereum mainnet provider |
| ENS reverse lookup | Supported - address → ENS name |

### Wallet Change Flow
1. User initiates wallet disconnect
2. Old wallet_address cleared from user record
3. User connects new wallet via MetaMask
4. New nonce generated
5. User signs authentication message
6. Signature verified
7. New wallet_address stored

---

## 3. Supported Networks

| Network | Chain ID | RPC URL | Status |
|---------|----------|---------|--------|
| Base Mainnet | 8453 | https://mainnet.base.org | CONFIGURED |
| Base Sepolia (Testnet) | 84532 | https://sepolia.base.org | CONFIGURED |
| Ethereum Mainnet | 1 | https://eth.llamarpc.com | CONFIGURED (for ENS) |
| Optimism | 10 | https://mainnet.optimism.io | CONFIGURED |
| Polygon | 137 | https://polygon-rpc.com | CONFIGURED |

### Primary Network: Base
StreamAiX targets Base as the primary settlement network due to:
- Low transaction fees (~$0.01 per tx)
- Ethereum security via L2 rollup
- Coinbase ecosystem integration
- Growing DeFi liquidity

---

## 4. Current On-Chain Status

### Settlement Status: OFF-CHAIN TODAY

| Operation | Current Implementation | On-Chain Status |
|-----------|----------------------|-----------------|
| Market trading | Internal DB balances | OFF-CHAIN |
| Payout settlement | DB + STREAM points | OFF-CHAIN |
| Bounty rewards | DB + STREAM points | OFF-CHAIN |
| Tips | DB balances | OFF-CHAIN |
| Token minting | NOT IMPLEMENTED | PLANNED |
| NFT minting | Mock IPFS/Arweave hashes | OFF-CHAIN |

### Current Transaction Types Performed
**NONE** - All transactions are currently off-chain database operations.

The wallet is used ONLY for:
1. User authentication (signature verification)
2. Identity linking
3. ENS resolution
4. Future on-chain transaction preparation

---

## 5. Rollout Phases

### Phase 1: Current State (LIVE)
- Wallet authentication only
- All settlement off-chain
- STREAM points as internal balance
- Base network configured but not used for transactions

### Phase 2: Hybrid (Q1 2026)
- Tips enabled on-chain (Base)
- Market settlement on-chain for opted-in markets
- ERC-1155 position tokens minted
- 0.5% fee collected on-chain

### Phase 3: Full On-Chain (Q2 2026)
- All market settlements on-chain
- STREAM token deployed (ERC-20)
- Bounty rewards on-chain
- UMA Oracle integration live
- Full decentralized dispute resolution

---

## 6. Smart Contract Readiness

### Contracts Prepared (NOT DEPLOYED)
| Contract | Purpose | Network | Status |
|----------|---------|---------|--------|
| StreamAiXMarket.sol | Prediction market positions (ERC-1155) | Base | READY |
| StreamToken.sol | STREAM token (ERC-20) | Base | READY |
| BountyVault.sol | Escrow for bounty rewards | Base | READY |

### Contract ABIs
Located in `/contracts/abis/` (for frontend integration)

---

## 7. Wallet Connect Support

### Currently Implemented
| Provider | Status | Notes |
|----------|--------|-------|
| MetaMask | LIVE | Primary wallet, browser extension |
| WalletConnect | PARTIAL | Configured, not fully tested |
| Coinbase Wallet | PLANNED | High priority for Base users |
| Rainbow | PLANNED | Mobile wallet support |

### MetaMask Flow
1. User clicks "Connect Wallet"
2. MetaMask popup requests account access
3. User approves connection
4. Frontend receives wallet address
5. Backend generates nonce + auth message
6. MetaMask popup requests signature
7. User signs message
8. Backend verifies signature
9. Session created with wallet linked

---

## 8. Security Considerations

### Wallet Authentication Security
- Nonce is single-use and time-limited
- Signatures cannot be replayed
- No private keys stored server-side
- Message includes timestamp to prevent stale signatures

### Known Limitations
1. WalletConnect not fully tested across all mobile wallets
2. Hardware wallet support (Ledger/Trezor) not verified
3. Multi-sig wallets not specifically supported

---

## 9. User Data Flow

```
[MetaMask] → [Frontend] → [Backend]
     ↓            ↓            ↓
  Sign Msg    Send Sig    Verify Sig
                           Create Session
                           Store wallet_address
                           Link to user.id
```

### Data Stored
| Field | Storage | Retention |
|-------|---------|-----------|
| wallet_address | PostgreSQL users table | Permanent |
| ens_name | PostgreSQL users table | Permanent |
| auth_provider | PostgreSQL users table | Permanent |
| Signature | NOT stored after verification | N/A |
| Nonce | Session/cache | Until used |

---

## Summary

StreamAiX wallet integration is LIVE for authentication only. All financial settlement remains off-chain using internal database balances. Base network (chain ID 8453) is configured and ready for Phase 2 on-chain integration in Q1 2026.
