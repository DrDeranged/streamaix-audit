import { db } from "./db";
import { learningModules, learningLessons, learningQuizzes } from "../shared/schema";
import { eq } from "drizzle-orm";

const expandedLessons = [
  // ==========================================
  // WEB3 BASICS - 5 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-web3-1",
    moduleId: "mod-web3-basics",
    title: "What is Blockchain?",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 1,
    content: `# What is Blockchain Technology?

Blockchain is a revolutionary technology that serves as the foundation of all cryptocurrencies and many decentralized applications. At its core, a blockchain is a distributed digital ledger that records transactions across a network of computers in a way that makes it virtually impossible to alter, hack, or cheat the system.

## The Core Concept: A Chain of Blocks

Imagine a spreadsheet that is duplicated thousands of times across a network of computers. This network is designed to regularly update this spreadsheet—that's the basic concept of a blockchain. Each "block" contains:

- **Transaction Data**: Records of value transfers between participants
- **Timestamp**: When the block was created
- **Cryptographic Hash**: A unique digital fingerprint of the block
- **Previous Block Hash**: Links to the previous block, creating the "chain"

## How Blocks Are Created

1. **Transaction Initiation**: A user requests a transaction (e.g., sending Bitcoin)
2. **Broadcasting**: The transaction is broadcast to a peer-to-peer network of computers (nodes)
3. **Validation**: Network nodes validate the transaction using consensus mechanisms
4. **Block Creation**: Valid transactions are combined into a new block
5. **Chain Addition**: The new block is added to the existing blockchain
6. **Completion**: The transaction is complete and permanently recorded

## Key Properties of Blockchain

### Decentralization
Unlike traditional databases controlled by a single entity, blockchain distributes data across thousands of nodes worldwide. No single party has control, making the system:
- Resistant to censorship
- More resilient to attacks
- Transparent to all participants

### Immutability
Once data is recorded on a blockchain, it becomes extremely difficult to change. Each block contains the hash of the previous block, so altering any historical data would require changing every subsequent block—a computationally impossible task on major networks.

### Transparency
All transactions on public blockchains are visible to anyone. While participants use pseudonymous addresses, the transaction history is completely transparent. This creates:
- Auditable financial systems
- Reduced fraud opportunities
- Increased accountability

### Consensus Mechanisms
Blockchains use various methods to agree on the state of the ledger:

**Proof of Work (PoW)**
- Used by Bitcoin
- Miners solve complex mathematical puzzles
- High energy consumption but very secure

**Proof of Stake (PoS)**
- Used by Ethereum, Solana, and many others
- Validators stake tokens as collateral
- More energy-efficient than PoW

## Real-World Applications

### Financial Services
- Cross-border payments (Ripple, Stellar)
- Decentralized lending (Aave, Compound)
- Stablecoins (USDC, DAI)

### Supply Chain
- Product authenticity verification
- Tracking goods from manufacturer to consumer
- Reducing counterfeiting

### Digital Identity
- Self-sovereign identity solutions
- Credential verification
- Privacy-preserving authentication

## The Evolution of Blockchain

**First Generation (Bitcoin, 2009)**
- Digital currency and payments
- Simple scripting capabilities

**Second Generation (Ethereum, 2015)**
- Smart contracts
- Programmable money
- Decentralized applications (dApps)

**Third Generation (Solana, Avalanche, etc.)**
- Scalability solutions
- Lower transaction costs
- Higher throughput

Understanding blockchain technology is essential for navigating the Web3 ecosystem. It's not just about cryptocurrency—it's about reimagining how we organize information, value, and trust in the digital age.`
  },
  {
    id: "lesson-web3-2",
    moduleId: "mod-web3-basics",
    title: "Understanding Wallets",
    lessonType: "article",
    estimatedMinutes: 12,
    xpReward: 100,
    sortOrder: 2,
    content: `# Understanding Cryptocurrency Wallets

A cryptocurrency wallet is your gateway to the blockchain world. Unlike a physical wallet that stores cash, a crypto wallet doesn't actually store your cryptocurrency. Instead, it stores the private keys that give you access to your digital assets on the blockchain.

## How Wallets Work

### Public and Private Keys
Every wallet operates on a fundamental cryptographic principle:

**Public Key (Your Address)**
- Like your email address—share it to receive funds
- Derived from your private key mathematically
- Anyone can send you crypto using this address
- Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f...

**Private Key**
- Like your password—NEVER share it
- Proves ownership and authorizes transactions
- If lost, you lose access to your funds forever
- If stolen, a thief can drain your wallet instantly

### Seed Phrases (Recovery Phrases)
Most modern wallets use a 12 or 24-word seed phrase:
- Generates all your private keys
- Allows wallet recovery on any device
- Must be stored securely offline
- Example: "apple banana cherry dragon eagle..."

**CRITICAL**: Never enter your seed phrase on any website. No legitimate service will ever ask for it.

## Types of Wallets

### Hot Wallets (Connected to Internet)

**Browser Extension Wallets**
- MetaMask, Phantom, Rabby
- Convenient for daily use and dApp interaction
- Higher security risk due to internet connection
- Best for: Small amounts, frequent transactions

**Mobile Wallets**
- Trust Wallet, Coinbase Wallet, Rainbow
- Easy to use on the go
- QR code scanning for payments
- Best for: Everyday transactions, retail payments

**Desktop Wallets**
- Exodus, Electrum, Ledger Live
- More features than mobile wallets
- Still connected to internet
- Best for: Regular trading, portfolio management

### Cold Wallets (Offline Storage)

**Hardware Wallets**
- Ledger Nano, Trezor, GridPlus
- Private keys never leave the device
- Physical button confirmation for transactions
- Cost: $50-$250
- Best for: Large holdings, long-term storage

**Paper Wallets**
- Private keys printed on paper
- Completely offline
- Risk of physical damage or loss
- Best for: Long-term cold storage

**Air-Gapped Computers**
- Dedicated offline computer
- Used by institutions and whales
- Maximum security, minimum convenience

## Wallet Security Best Practices

### Essential Security Steps

1. **Use Strong Passwords**
   - Unique password for each wallet
   - Consider a password manager

2. **Enable 2FA Where Possible**
   - Hardware keys (YubiKey) preferred
   - Authenticator apps over SMS

3. **Secure Your Seed Phrase**
   - Write it down on paper (multiple copies)
   - Consider metal backup for fire/water resistance
   - Never store digitally (no photos, no cloud)
   - Store copies in different physical locations

4. **Verify Transactions Carefully**
   - Always check recipient addresses
   - Review transaction amounts and gas fees
   - Use hardware wallet for large transactions

### Common Attacks to Avoid

**Phishing**
- Fake websites mimicking legitimate services
- Always verify URLs carefully
- Bookmark official sites

**Fake Wallet Apps**
- Scam apps in app stores
- Only download from official sources
- Check developer names and reviews

**Clipboard Hijacking**
- Malware that changes copied addresses
- Always verify the full address before sending

**Social Engineering**
- Scammers impersonating support staff
- No legitimate service asks for your seed phrase

## Multi-Signature Wallets

For enhanced security, especially with large amounts:

- Requires multiple approvals for transactions
- Example: 2-of-3 signers needed
- Used by DAOs, treasuries, and institutions
- Reduces single point of failure risk

## Choosing the Right Wallet

**Beginners**: Start with MetaMask (browser) or Trust Wallet (mobile)
**Intermediate**: Add a hardware wallet for larger amounts
**Advanced**: Multi-sig setup with institutional-grade solutions

The key principle: Never store more value in a hot wallet than you'd carry in your pocket. Use cold storage for significant holdings.`
  },
  {
    id: "lesson-web3-3",
    moduleId: "mod-web3-basics",
    title: "Smart Contracts 101",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 3,
    content: `# Smart Contracts: The Building Blocks of Web3

Smart contracts are self-executing programs stored on a blockchain that automatically execute when predetermined conditions are met. They're the fundamental innovation that transformed blockchain from a simple payment network into a platform for decentralized applications.

## What Makes a Contract "Smart"?

A traditional contract requires:
- Lawyers to draft terms
- Courts to enforce agreements
- Trust between parties
- Intermediaries (banks, escrow agents)

A smart contract provides:
- Automatic execution when conditions are met
- No intermediaries needed
- Transparent and auditable code
- Immutable once deployed

## How Smart Contracts Work

### The Basic Flow

1. **Agreement**: Parties agree to terms encoded in the contract
2. **Deployment**: Contract code is published to the blockchain
3. **Triggering**: A transaction or condition activates the contract
4. **Execution**: Code runs automatically, transferring value or data
5. **Settlement**: Results are permanently recorded on-chain

### Example: Simple Token Sale

\`\`\`
When user sends ETH:
  → If sale is active
  → And user hasn't exceeded limit
  → Then transfer tokens to user
  → And record the purchase
Otherwise:
  → Refund the ETH
\`\`\`

## Smart Contract Languages

### Solidity (Ethereum, BSC, Polygon, Avalanche)
- Most widely used smart contract language
- JavaScript-like syntax
- Extensive tooling and documentation
- Largest developer community

### Rust (Solana, Near, Polkadot)
- High performance and memory safety
- Steeper learning curve
- Growing ecosystem

### Move (Aptos, Sui)
- Resource-oriented programming
- Built for digital assets
- Enhanced safety guarantees

## Real-World Smart Contract Applications

### Decentralized Finance (DeFi)

**Lending Protocols (Aave, Compound)**
- Deposit crypto as collateral
- Borrow other assets automatically
- Interest rates set algorithmically

**Decentralized Exchanges (Uniswap, Curve)**
- Token swaps without intermediaries
- Automated Market Makers (AMMs)
- Liquidity provider rewards

**Yield Aggregators (Yearn, Convex)**
- Automated yield optimization
- Compound interest strategies
- Gas-efficient harvesting

### NFTs and Digital Ownership

**ERC-721 Standard**
- Unique, non-fungible tokens
- Digital art, collectibles, game items
- Provenance tracking

**ERC-1155 Standard**
- Semi-fungible tokens
- Gaming items (multiple copies of same item)
- More gas-efficient than ERC-721

### DAOs (Decentralized Autonomous Organizations)

**Governance Contracts**
- Proposal creation and voting
- Treasury management
- Automatic execution of approved proposals

**Examples**
- MakerDAO: Governs the DAI stablecoin
- Uniswap: Protocol upgrades and fee structures
- Aave: Risk parameters and new markets

## Smart Contract Security

### Common Vulnerabilities

**Reentrancy Attacks**
- Contract calls external contract before updating state
- Attacker can re-enter and drain funds
- The DAO hack (2016) exploited this

**Integer Overflow/Underflow**
- Numbers exceeding their maximum value
- Mitigated in Solidity 0.8.0+

**Access Control Issues**
- Functions accessible to unauthorized users
- Critical for admin functions

**Oracle Manipulation**
- Manipulating price feeds
- Flash loan attacks

### Security Best Practices

1. **Audit Everything**: Professional audits before mainnet deployment
2. **Start Small**: Limit initial funds, gradually increase
3. **Bug Bounties**: Reward white-hat hackers
4. **Formal Verification**: Mathematical proofs of correctness
5. **Timelocks**: Delay on sensitive operations
6. **Upgradability**: Ability to fix issues (with tradeoffs)

## Interacting with Smart Contracts

### Reading Data (Free)
- View token balances
- Check prices
- Read contract state

### Writing Data (Costs Gas)
- Transfer tokens
- Swap on DEX
- Provide liquidity

### Gas Optimization
- Time transactions for low-fee periods
- Use layer 2 solutions
- Batch multiple operations

## The Future of Smart Contracts

**Cross-Chain Contracts**
- Operate across multiple blockchains
- Unified liquidity and state

**AI Integration**
- Machine learning models in contracts
- Automated decision-making

**Real-World Assets**
- Tokenized securities
- On-chain real estate
- Supply chain integration

Smart contracts represent a paradigm shift in how we create and enforce agreements. Understanding them is essential for anyone building or investing in the Web3 ecosystem.`
  },
  {
    id: "lesson-web3-4",
    moduleId: "mod-web3-basics",
    title: "Gas Fees and Transactions",
    lessonType: "article",
    estimatedMinutes: 12,
    xpReward: 75,
    sortOrder: 4,
    content: `# Understanding Gas Fees and Blockchain Transactions

Gas is the fuel that powers blockchain operations. Understanding how gas works is crucial for managing costs and timing your transactions effectively.

## What is Gas?

Gas is a unit that measures the computational effort required to execute operations on a blockchain. Every action—from simple token transfers to complex smart contract interactions—requires gas.

### The Gas Formula

**Transaction Cost = Gas Used × Gas Price**

- **Gas Used**: Determined by the complexity of the operation
- **Gas Price**: How much you're willing to pay per gas unit
- **Result**: Total fee in the native currency (ETH, SOL, etc.)

## Gas on Different Blockchains

### Ethereum Gas Model

**Base Fee** (EIP-1559)
- Algorithmically determined minimum
- Burns ETH, making it deflationary
- Adjusts based on network congestion

**Priority Fee (Tip)**
- Extra payment to validators
- Incentivizes faster inclusion
- Higher tip = faster confirmation

**Max Fee**
- Maximum you're willing to pay
- Unused gas is refunded

**Example Transaction:**
\`\`\`
Gas Used: 21,000 (simple transfer)
Base Fee: 20 gwei
Priority Fee: 2 gwei
Total Cost: 21,000 × 22 gwei = 462,000 gwei = 0.000462 ETH
At $2,000/ETH: ~$0.92
\`\`\`

### Common Gas Costs

| Operation | Gas Used | At 20 gwei |
|-----------|----------|------------|
| ETH Transfer | 21,000 | ~$0.85 |
| Token Transfer | 65,000 | ~$2.60 |
| Uniswap Swap | 150,000 | ~$6.00 |
| NFT Mint | 200,000+ | ~$8.00+ |
| Complex DeFi | 300,000+ | ~$12.00+ |

### Alternative Blockchains

**Solana**
- Fixed ~0.00025 SOL per transaction
- ~$0.01-0.02 at typical prices
- Priority fees for faster processing

**Polygon**
- Similar to Ethereum model
- 100-1000x cheaper than ETH mainnet

**Arbitrum / Optimism (L2s)**
- Ethereum security at lower cost
- 10-50x cheaper than mainnet

## Strategies to Minimize Gas Costs

### Timing Your Transactions

**Low Activity Periods**
- Weekends (especially Sunday)
- Early morning UTC (2-6 AM)
- US holidays

**High Activity Periods (Avoid)**
- NFT drops
- Market volatility
- Major protocol launches

### Tools for Gas Monitoring

- **Etherscan Gas Tracker**: Real-time prices
- **GasNow**: Historical patterns
- **Blocknative Gas Estimator**: Prediction models

### Transaction Bundling

Combine multiple operations:
- Approve + Swap in one transaction
- Use aggregators like 1inch
- Batch transfers with specialized tools

### Layer 2 Solutions

Move activity to L2s for regular transactions:
1. Bridge assets to L2 (one-time fee)
2. Transact cheaply on L2
3. Bridge back when needed

## Understanding Transaction Status

### Transaction Lifecycle

1. **Pending**: Broadcast to network, waiting for inclusion
2. **Confirmed**: Included in a block
3. **Finalized**: Irreversible (varies by network)

### When Transactions Get Stuck

**Causes:**
- Gas price too low
- Nonce issues
- Network congestion

**Solutions:**
- Speed up (higher gas, same nonce)
- Cancel (0 ETH to self, same nonce)
- Wait (network may clear)

## Advanced Gas Concepts

### Gas Limit

- Maximum gas you allow the transaction to use
- Too low = transaction fails (gas still consumed)
- Too high = unused gas refunded

### Failed Transactions

- Gas is still charged (work was done)
- Check "Reverted" status on block explorer
- Common causes: slippage, approval issues

### MEV (Maximal Extractable Value)

- Validators can reorder transactions
- Front-running and sandwich attacks
- Use MEV protection (Flashbots, private RPCs)

## Best Practices

1. **Set Appropriate Gas**: Use wallet estimates as baseline
2. **Use L2s for Small Transactions**: Mainnet only when necessary
3. **Monitor Before Confirming**: Check gas estimation accuracy
4. **Batch When Possible**: Multiple operations in one transaction
5. **Time Non-Urgent Transactions**: Wait for low-fee periods

Gas optimization is an ongoing skill. As you become more experienced, you'll develop intuition for when and how to transact most efficiently.`
  },
  {
    id: "lesson-web3-5",
    moduleId: "mod-web3-basics",
    title: "Web3 Security Essentials",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 5,
    content: `# Web3 Security Essentials: Protecting Your Digital Assets

In Web3, you are your own bank. This freedom comes with responsibility—there's no customer service to call if you get hacked. Understanding security is not optional; it's essential for survival in this space.

## The Threat Landscape

### Types of Attacks

**Phishing (Most Common)**
- Fake websites mimicking legitimate services
- Malicious links in Discord/Twitter DMs
- Fraudulent emails with urgent calls to action

**Wallet Drainers**
- Smart contracts that steal approved tokens
- "Free mint" scams that request excessive permissions
- Signature requests that authorize asset transfers

**Social Engineering**
- Scammers impersonating team members
- Fake customer support in Telegram/Discord
- Romance scams in crypto communities

**Technical Exploits**
- Smart contract vulnerabilities
- Bridge hacks
- Oracle manipulation

## Essential Security Practices

### Wallet Security

**Hardware Wallet Setup**
1. Buy directly from manufacturer (Ledger, Trezor)
2. Never use a pre-configured device
3. Generate seed phrase on the device
4. Write seed on metal plate (fire/water resistant)
5. Store in multiple secure locations

**Hot Wallet Hygiene**
- Use for small amounts only
- Revoke unused approvals regularly
- Different wallets for different purposes:
  - Minting wallet (high risk)
  - Trading wallet (medium risk)
  - Vault wallet (cold storage)

### Transaction Safety

**Before Signing Anything:**

1. **Verify the Website URL**
   - Check for typos (uniswap vs unlswap)
   - Look for https and valid certificate
   - Bookmark official sites

2. **Understand What You're Signing**
   - Read the transaction details
   - Check token approval amounts
   - Unlimited approvals = high risk

3. **Use Transaction Simulators**
   - Pocket Universe, Fire, Stelo
   - Preview what will happen before signing
   - Detect drainer contracts

**Red Flags:**
- Urgency ("Act now or lose out!")
- Free money promises
- Requests for seed phrase
- DMs about "winning" something
- Unusual approval requests

### Token Approval Management

**The Problem:**
When you approve a DEX to spend your tokens, you're giving it permission to move those tokens. A malicious or hacked contract can drain approved tokens.

**Best Practices:**
1. Set specific approval amounts (not unlimited)
2. Revoke approvals after use
3. Regular approval audits using:
   - Revoke.cash
   - Etherscan Token Approvals
   - DeBank

### Operational Security (OpSec)

**Digital Hygiene:**
- Unique, strong passwords (password manager)
- Hardware 2FA (YubiKey) over SMS
- Separate email for crypto accounts
- Privacy-focused browser (Brave)
- VPN for public networks

**Social Media:**
- Don't share wallet addresses publicly
- Never reveal holdings
- Be skeptical of new followers/DMs
- Verify announcements on official channels

**Device Security:**
- Keep OS and software updated
- Antivirus and anti-malware
- Firewall enabled
- Separate device for high-value transactions

## Recognizing Scams

### Common Scam Patterns

**Fake Airdrops**
- "Claim your tokens" links
- Requires connecting wallet
- Drains everything upon approval

**Rug Pulls**
- Team abandons project with funds
- Honeypot tokens (can buy, can't sell)
- Fake liquidity, fake volume

**Pump and Dumps**
- Coordinated price manipulation
- Celebrity endorsements (often fake)
- "Guaranteed" returns

**Impersonation**
- Fake social media accounts
- Cloned websites
- "Support" reaching out proactively

### Verification Steps

1. **Check Official Sources**: Verify links through official Twitter/Discord
2. **Research the Team**: Anonymous = higher risk
3. **Audit Reports**: Look for reputable auditors
4. **Community Sentiment**: What are others saying?
5. **Too Good to Be True**: It usually is

## Incident Response

### If You've Been Compromised

**Immediate Steps:**
1. **Don't Panic**: Think clearly
2. **Transfer Remaining Assets**: To a new, secure wallet
3. **Revoke Approvals**: On the compromised wallet
4. **Document Everything**: Transactions, communications
5. **Report**: To relevant platforms and authorities

**DO NOT:**
- Pay ransoms or "recovery fees"
- Trust "recovery services" that DM you
- Reuse the compromised seed phrase

### Building Resilience

**Diversification:**
- Multiple wallets across security levels
- Different chains and protocols
- No single point of failure

**Backups:**
- Seed phrase in multiple locations
- Hardware wallet backup device
- Documented recovery procedures

**Education:**
- Stay updated on new attack vectors
- Follow security researchers
- Practice with small amounts first

## Security Checklist

- [ ] Hardware wallet for significant holdings
- [ ] Seed phrase stored offline in multiple locations
- [ ] Unique passwords with password manager
- [ ] Hardware 2FA enabled everywhere possible
- [ ] Transaction simulation extension installed
- [ ] Regular approval reviews scheduled
- [ ] Different wallets for different purposes
- [ ] Official sites bookmarked
- [ ] DMs disabled on Discord/Twitter

Remember: In Web3, security is not a one-time setup—it's an ongoing practice. Stay vigilant, stay updated, and never stop learning.`
  },

  // ==========================================
  // DEFI - 5 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-defi-1",
    moduleId: "mod-defi-intro",
    title: "DeFi Fundamentals",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 1,
    content: `# DeFi Fundamentals: The Future of Finance

Decentralized Finance (DeFi) represents a paradigm shift in how financial services are delivered. Instead of relying on banks and intermediaries, DeFi uses blockchain technology and smart contracts to create open, permissionless financial systems accessible to anyone with an internet connection.

## What Makes DeFi Revolutionary?

### Traditional Finance (TradFi) vs. DeFi

| Aspect | Traditional Finance | DeFi |
|--------|-------------------|------|
| Access | Requires bank account, ID | Just need a wallet |
| Hours | Business hours, weekdays | 24/7/365 |
| Permission | Must be approved | Permissionless |
| Custody | Bank holds your money | You hold your assets |
| Transparency | Opaque | Fully auditable |
| Speed | Days for settlement | Minutes |
| Fees | High, hidden | Transparent, competitive |

### The DeFi Stack

**Layer 1: Settlement Layer**
- Base blockchain (Ethereum, Solana, etc.)
- Handles transaction finality
- Provides security guarantees

**Layer 2: Asset Layer**
- Native tokens (ETH, SOL)
- ERC-20 tokens
- NFTs and wrapped assets

**Layer 3: Protocol Layer**
- Lending (Aave, Compound)
- DEXs (Uniswap, Curve)
- Derivatives (dYdX, GMX)

**Layer 4: Application Layer**
- User interfaces
- Aggregators (1inch, Zapper)
- Portfolio managers

**Layer 5: Aggregation Layer**
- Yield optimizers
- Cross-protocol strategies
- Automated rebalancing

## Core DeFi Primitives

### Stablecoins

Cryptocurrencies designed to maintain a stable value, typically $1 USD.

**Types:**

**Fiat-Backed (Centralized)**
- USDC, USDT
- Backed by real dollars in banks
- Audited reserves
- Risk: Centralized, can be frozen

**Crypto-Collateralized (Decentralized)**
- DAI, LUSD
- Over-collateralized by crypto
- Governed by DAOs
- Risk: Collateral volatility

**Algorithmic**
- FRAX (partially)
- Supply adjusts to maintain peg
- Various mechanisms
- Risk: Can depeg in stress

### Lending and Borrowing

**How It Works:**
1. Lenders deposit assets, earn interest
2. Borrowers post collateral
3. Borrow up to a percentage of collateral value
4. Interest rates set algorithmically

**Key Concepts:**

**Supply APY**: What you earn by depositing
**Borrow APY**: What you pay to borrow
**Utilization Rate**: % of deposited funds being borrowed
**Health Factor**: Collateral value / Loan value (must stay above 1)
**Liquidation**: Collateral sold if health factor falls too low

**Major Protocols:**
- Aave: Multi-chain, flash loans
- Compound: Original DeFi lending
- MakerDAO: DAI stablecoin issuer

### Decentralized Exchanges (DEXs)

**Order Book DEXs**
- Similar to traditional exchanges
- Buy/sell orders matched
- More capital efficient
- Examples: dYdX, Serum

**Automated Market Makers (AMMs)**
- Liquidity pools instead of order books
- Price set by mathematical formula
- Always available liquidity
- Examples: Uniswap, Curve, Balancer

### Yield Farming

Earning rewards by providing capital to DeFi protocols.

**Sources of Yield:**
- Trading fees (liquidity provision)
- Interest (lending)
- Token incentives (liquidity mining)
- Governance participation

## Risk Management in DeFi

### Smart Contract Risk
- Bugs in code can cause loss of funds
- Look for audited protocols
- Established track record matters

### Economic/Design Risk
- Tokenomics may not be sustainable
- Incentive structures may fail
- Oracle dependencies

### Systemic Risk
- Cascading liquidations
- Stablecoin depegs
- Contagion across protocols

### Operational Risk
- Wallet security
- Transaction errors
- Key management

## Getting Started with DeFi

### First Steps

1. **Set Up a Wallet**
   - MetaMask for Ethereum/L2s
   - Start with small amounts

2. **Get Some Tokens**
   - Buy from centralized exchange
   - Bridge to your preferred network

3. **Start Simple**
   - Provide stablecoin liquidity
   - Try a single-asset staking

4. **Gradually Explore**
   - DEX swaps
   - Lending protocols
   - Yield aggregators

### Best Practices

- Never invest more than you can afford to lose
- Start with established protocols
- Understand the risks before depositing
- Monitor your positions regularly
- Diversify across protocols and chains

DeFi is still evolving rapidly. What's cutting-edge today may be outdated tomorrow. Stay curious, stay cautious, and keep learning.`
  },
  {
    id: "lesson-defi-2",
    moduleId: "mod-defi-intro",
    title: "Automated Market Makers",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 2,
    content: `# Automated Market Makers: The Engine of DeFi

Automated Market Makers (AMMs) are one of the most important innovations in DeFi. They enable decentralized trading without traditional order books, using mathematical formulas and liquidity pools instead.

## How Traditional Exchanges Work

On centralized exchanges like Coinbase or NYSE:
- Buyers and sellers place orders
- An order book matches buy and sell orders
- Market makers provide liquidity
- Spreads exist between bid and ask

**Problems for DeFi:**
- Requires high-frequency order matching
- Expensive on-chain
- Needs sophisticated market makers
- Low liquidity = high slippage

## The AMM Solution

### Liquidity Pools

Instead of order books, AMMs use liquidity pools:
- Pools of tokens locked in smart contracts
- Anyone can deposit and earn fees
- Trading happens against the pool
- Price determined by formula

### The Constant Product Formula

Uniswap popularized: **x × y = k**

Where:
- x = quantity of Token A
- y = quantity of Token B  
- k = constant (pool's total liquidity)

**Example:**
Pool has 100 ETH and 200,000 USDC
- k = 100 × 200,000 = 20,000,000

To buy 10 ETH:
- New ETH: 100 - 10 = 90
- Required USDC: 20,000,000 / 90 = 222,222
- You pay: 222,222 - 200,000 = 22,222 USDC
- Price per ETH: 2,222 USDC (higher than spot due to slippage)

### Slippage

Slippage is the difference between expected and actual price.

**Factors affecting slippage:**
- Trade size relative to pool size
- Pool's liquidity depth
- Current pool balance

**Minimizing slippage:**
- Trade smaller amounts
- Use deeper pools
- Aggregate across multiple pools
- Set slippage tolerance

## Types of AMMs

### Constant Product (Uniswap v2 style)
- x × y = k
- Works for any token pair
- Higher slippage for large trades
- Good for volatile assets

### StableSwap (Curve style)
- Optimized for similar-value assets
- Much lower slippage for stablecoin swaps
- Uses concentrated liquidity around peg
- Popular for: USDC/USDT, stETH/ETH

### Concentrated Liquidity (Uniswap v3)
- LPs choose price ranges
- More capital efficient
- Higher rewards, more management
- Better for experienced LPs

### Weighted Pools (Balancer)
- Multiple tokens in one pool
- Customizable weights (80/20, 50/25/25, etc.)
- Enables index-like products

## Providing Liquidity

### How It Works

1. **Deposit tokens** in equal value (for traditional AMMs)
2. **Receive LP tokens** representing your share
3. **Earn trading fees** proportional to your share
4. **Redeem LP tokens** for underlying assets + earned fees

### Fee Structures

| Protocol | Standard Fee | Notes |
|----------|-------------|-------|
| Uniswap v3 | 0.01%, 0.05%, 0.3%, 1% | Tier-based |
| Curve | 0.04% | Low for stables |
| Balancer | 0.01% - 10% | Customizable |
| SushiSwap | 0.3% | 0.05% to SUSHI stakers |

### Impermanent Loss

The biggest risk for liquidity providers.

**What is it?**
When asset prices change, LPs end up with different proportions than they deposited. If prices return to original levels, the "loss" disappears (hence "impermanent").

**Example:**
- Deposit: 1 ETH + 2,000 USDC (ETH = $2,000)
- ETH price doubles to $4,000
- Pool rebalances to maintain x × y = k
- Your share: ~0.707 ETH + 2,828 USDC
- Value if you HODL'd: $6,000
- Value as LP: ~$5,656
- Impermanent loss: ~5.7%

**When is IL Significant?**
- Large price divergence (2x, 3x moves)
- Volatile asset pairs
- Short holding periods

**When is IL Less Concerning?**
- Correlated assets (stablecoin pairs)
- Fees offset the loss
- You believe price will mean-revert

### Impermanent Loss Calculator

For a 2x price change: ~5.7% IL
For a 3x price change: ~13.4% IL
For a 5x price change: ~25.5% IL

## LP Strategies

### Conservative
- Stablecoin pairs (USDC/USDT)
- Minimal IL risk
- Lower APY (2-10%)

### Moderate  
- ETH/stETH, similar assets
- Some IL risk
- Medium APY (5-20%)

### Aggressive
- Major pairs (ETH/USDC)
- Significant IL risk
- Higher APY (10-50%+)
- Token incentives often included

### Advanced
- Concentrated liquidity ranges
- Active management required
- Highest potential returns
- Also highest risk

## Tools for AMM Analysis

**Simulation:**
- DeFiLlama yields
- Uniswap calculator
- APY Vision

**Tracking:**
- Zapper
- DeBank
- Revert.finance

**Backtesting:**
- Historical APY analysis
- IL simulations
- Fee accumulation tracking

## Key Takeaways

1. AMMs enable trustless, always-on trading
2. Slippage is inherent—plan accordingly
3. Impermanent loss is real—understand before depositing
4. Fees can offset IL but aren't guaranteed
5. Different AMM designs suit different use cases
6. Active management can improve returns but requires time

AMMs democratized market making. Anyone can now earn from providing liquidity—but with that opportunity comes responsibility to understand the risks.`
  },
  {
    id: "lesson-defi-3",
    moduleId: "mod-defi-intro",
    title: "Lending and Borrowing Protocols",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 3,
    content: `# DeFi Lending and Borrowing: Earn Interest and Access Leverage

Lending protocols are the banks of DeFi—but without the banks. They enable users to earn interest on deposits and borrow assets using crypto collateral, all without intermediaries.

## How DeFi Lending Works

### The Basic Model

**For Lenders (Suppliers):**
1. Deposit assets into the protocol
2. Receive interest-bearing tokens (aTokens, cTokens)
3. Interest accrues continuously
4. Withdraw anytime (if liquidity available)

**For Borrowers:**
1. Deposit collateral
2. Borrow up to a percentage of collateral value
3. Pay interest on borrowed amount
4. Repay loan to unlock collateral

### Interest Rate Models

Most protocols use utilization-based rates:

**Utilization = Borrowed / Supplied**

- Low utilization: Low rates (encourage borrowing)
- High utilization: High rates (encourage repayment)
- Optimal range: Usually 70-90%
- Above optimal: Rates spike dramatically

**Example Rate Curve:**
- 0-80% utilization: 0-10% APY
- 80-90% utilization: 10-50% APY
- 90-100% utilization: 50-200% APY

This prevents pool depletion while maximizing capital efficiency.

## Key Concepts

### Collateralization

**Loan-to-Value (LTV) Ratio**
- Maximum you can borrow vs. collateral
- Example: 80% LTV = borrow $80 for every $100 collateral

**Collateral Factor**
- Each asset has different risk parameters
- ETH: ~80% LTV
- Stablecoins: ~85-90% LTV
- Volatile tokens: 50-70% LTV

### Health Factor

Health Factor = Collateral Value × Liquidation Threshold / Borrowed Value

- HF > 1: Position is safe
- HF = 1: Liquidation threshold reached
- HF < 1: Liquidation occurs

**Monitoring Your Position:**
- Keep HF above 1.5 for safety buffer
- Watch during market volatility
- Consider automated alerts

### Liquidation

When health factor falls below 1:

1. **Liquidators are incentivized** to repay part of your loan
2. **They receive your collateral** at a discount (5-15%)
3. **You lose the liquidation penalty**
4. **Remaining collateral is returned** after loan closure

**Avoiding Liquidation:**
- Don't borrow maximum amount
- Add collateral during downturns
- Repay part of loan if concerned
- Use stablecoins to reduce volatility risk

## Major Lending Protocols

### Aave

**Features:**
- Multi-chain (Ethereum, Polygon, Arbitrum, etc.)
- Flash loans (borrow without collateral for one block)
- E-mode (enhanced efficiency for correlated assets)
- Isolation mode (limit risk from new assets)

**Unique Products:**
- GHO stablecoin
- Credit delegation
- Portal (cross-chain lending)

### Compound

**Features:**
- The original DeFi money market
- COMP governance token
- Simple, time-tested design
- Compound III (single collateral market)

### MakerDAO

**Unique Model:**
- Borrow DAI against crypto collateral
- Collateralized debt positions (CDPs)
- Stability fees instead of interest rates
- DAI Savings Rate for holders

**Supported Collateral:**
- ETH, WBTC
- Real-world assets (RWA)
- LP tokens
- Stablecoins

### Spark (Formerly MakerDAO's Direct Deposit)

**Features:**
- Fork of Aave v3
- Native DAI integration
- Competitive rates
- Growing ecosystem

## Borrowing Strategies

### Looping (Leveraged Farming)

1. Deposit ETH as collateral
2. Borrow stablecoin
3. Swap stablecoin for more ETH
4. Deposit additional ETH
5. Repeat (loop)

**Result:** Leveraged long position on ETH
**Risk:** Liquidation if ETH drops significantly

### Arbitrage

1. Borrow from low-rate protocol
2. Lend to high-rate protocol
3. Profit from rate difference
4. Watch for rate changes

### Tax Optimization

- Borrow against assets instead of selling
- Avoid triggering taxable events
- Maintain exposure while accessing liquidity

### Short Selling

1. Deposit stablecoin collateral
2. Borrow volatile asset (e.g., LINK)
3. Sell borrowed asset
4. If price drops, buy back cheaper
5. Repay loan, keep difference

## Risks to Consider

### Smart Contract Risk
- Protocol bugs can drain funds
- Use established, audited protocols
- Consider insurance (Nexus Mutual)

### Oracle Risk
- Price feeds determine liquidations
- Oracle manipulation can cause improper liquidations
- Check what oracles protocol uses

### Interest Rate Risk
- Variable rates can spike
- Consider fixed-rate options (Notional, Yield)
- Monitor utilization trends

### Liquidity Risk
- High utilization = can't withdraw
- During market stress, withdrawals may be delayed

## Best Practices

1. **Start Conservative**: Low LTV, single collateral
2. **Monitor Regularly**: Especially during volatility
3. **Diversify**: Across protocols and chains
4. **Understand Each Protocol**: They're not identical
5. **Have Exit Plans**: Know when and how you'll repay
6. **Use Alerts**: Set up health factor notifications

DeFi lending offers incredible opportunities for yield and capital efficiency. But with great power comes great responsibility—understand the risks before you deposit.`
  },
  {
    id: "lesson-defi-4",
    moduleId: "mod-defi-intro",
    title: "Yield Farming and Strategies",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 4,
    content: `# Yield Farming: Maximizing Returns in DeFi

Yield farming is the practice of putting crypto assets to work to generate maximum returns. It's the DeFi equivalent of putting money in a high-yield savings account—except the potential returns (and risks) are much higher.

## Understanding Yield Sources

### Where Does Yield Come From?

**Trading Fees**
- DEX liquidity providers earn from swaps
- Real, sustainable yield
- Proportional to pool share

**Lending Interest**
- Borrowers pay interest to lenders
- Market-driven rates
- Sustainable when there's borrowing demand

**Token Incentives (Liquidity Mining)**
- Protocols distribute governance tokens
- Bootstraps liquidity and users
- May not be sustainable long-term
- Often highest APYs

**Protocol Revenue**
- Some protocols share revenue with stakers
- Real yield from actual usage
- More sustainable model

**Staking Rewards**
- Proof of Stake consensus rewards
- ETH staking: ~4-5% APY
- Inflationary (new tokens created)

## Calculating Real Yield

### APR vs APY

**APR (Annual Percentage Rate)**
- Simple interest, no compounding
- What protocols usually display

**APY (Annual Percentage Yield)**
- Includes compounding effect
- APY = (1 + APR/n)^n - 1
- Where n = compounding periods

**Example:**
100% APR compounded daily = ~171% APY

### Sustainability Check

Ask yourself:
1. Where is the yield coming from?
2. Is this from real economic activity?
3. How long have rates been stable?
4. What happens when incentives end?

**Red Flags:**
- APYs over 1000% (unsustainable)
- Unknown yield sources
- New, unaudited protocols
- Complex tokenomics hiding inflation

## Yield Farming Strategies

### Beginner: Single-Sided Staking

**How It Works:**
- Deposit one asset
- Earn yield in same asset or protocol token

**Examples:**
- Staking ETH with Lido (stETH)
- Single asset vaults on Yearn
- Lending on Aave/Compound

**Pros:** Simple, no impermanent loss
**Cons:** Usually lower yields

### Intermediate: Stablecoin Farming

**Strategies:**
- Provide liquidity in stablecoin pools (Curve)
- Lend stablecoins on money markets
- Stake LP tokens for additional rewards

**Popular Pools:**
- USDC/USDT/DAI (Curve 3pool)
- FRAX/USDC
- Stable pairs on various chains

**Pros:** Low IL, relatively safe
**Cons:** Stablecoin depeg risk

### Advanced: Leveraged Farming

**How It Works:**
1. Deposit collateral
2. Borrow against it
3. Farm with borrowed funds
4. Repeat (loop)

**Example:**
- Deposit $10,000 USDC
- Borrow $8,000 USDC worth of ETH
- Farm ETH/USDC pool with $18,000 exposure
- Earn fees on larger position

**Risks:**
- Liquidation if collateral drops
- Higher gas costs
- Complexity of managing position

### Expert: Delta-Neutral Strategies

**Concept:** Remove price exposure while earning yield

**Example: Funding Rate Arbitrage**
1. Long ETH in spot (buy)
2. Short ETH perpetual futures (equal size)
3. Collect positive funding rates
4. Net zero price exposure

**Example: LP + Short**
1. Provide ETH/USDC liquidity
2. Short equivalent ETH position
3. Earn trading fees
4. Hedge out impermanent loss

## Yield Aggregators

### How They Work

1. Pool user deposits
2. Deploy to best opportunities
3. Auto-compound rewards
4. Auto-harvest and reinvest
5. Optimize gas costs

### Popular Aggregators

**Yearn Finance**
- Pioneer of yield aggregation
- Conservative, battle-tested strategies
- Strong risk management

**Beefy Finance**
- Multi-chain aggregator
- More aggressive strategies
- Lower barriers to entry

**Convex Finance**
- Boosted Curve yields
- CRV and CVX rewards
- Top for Curve liquidity

**Concentrator (AladdinDAO)**
- Vault strategies for various protocols
- Auto-compounding focus

### Fees

Aggregators typically charge:
- Performance fee: 10-20% of profits
- Management fee: 0-2% annually
- Withdrawal fee: 0-0.5% (usually none)

Usually worth it due to:
- Gas savings from pooled deposits
- Auto-compounding
- Strategy optimization

## Risk Management

### Diversification

**Across Protocols:** Don't concentrate in one platform
**Across Chains:** Ethereum, Arbitrum, Polygon, etc.
**Across Strategies:** Mix of conservative and aggressive

### Position Sizing

**Risk Tiers:**
- Low Risk (40-60%): Blue chip staking, stablecoin lending
- Medium Risk (30-40%): Established LP pools
- High Risk (10-20%): New protocols, incentive farming
- Degen (0-10%): Experimental, very high APY

### Monitoring

**Regular Checks:**
- Position health (for leveraged)
- APY sustainability
- Protocol news and updates
- Smart contract audits

**Tools:**
- DeBank portfolio tracker
- Zapper dashboard
- DeFiLlama yields
- Discord/Twitter for updates

## Tax Considerations

Yield farming creates taxable events:
- Token rewards received = income
- Swapping LP for underlying = disposition
- Harvesting and reinvesting = taxable

**Keep Records:**
- Deposit dates and amounts
- Rewards received and values
- All transactions
- Consider crypto tax software

## Getting Started

1. **Start Simple:** Single-asset staking
2. **Understand the Protocol:** Read docs, audit reports
3. **Begin with Stablecoins:** Lower risk while learning
4. **Automate with Aggregators:** When comfortable
5. **Gradually Add Complexity:** As knowledge grows

Yield farming rewards knowledge and attention. The best farmers are constantly learning, adapting, and managing risk. Don't chase the highest APY—focus on sustainable, risk-adjusted returns.`
  },
  {
    id: "lesson-defi-5",
    moduleId: "mod-defi-intro",
    title: "DeFi Risk Management",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 5,
    content: `# DeFi Risk Management: Protecting Your Capital

DeFi offers incredible opportunities, but it's also where fortunes are lost. Understanding and managing risk is the difference between sustainable profits and devastating losses.

## The DeFi Risk Framework

### Types of Risk

**Smart Contract Risk**
- Bugs in code
- Upgradeable contract exploits
- Malicious code

**Economic Risk**
- Tokenomics failures
- Bank run scenarios
- Death spirals

**Oracle Risk**
- Price feed manipulation
- Oracle failures
- Stale data

**Governance Risk**
- Malicious proposals
- Vote buying
- Centralization of power

**Liquidity Risk**
- Unable to exit positions
- High slippage
- Pool imbalances

**Systemic Risk**
- Contagion across protocols
- Mass liquidations
- Stablecoin depegs

## Assessing Protocol Risk

### Due Diligence Checklist

**Security**
- [ ] Audited by reputable firms (Trail of Bits, OpenZeppelin, Consensys)
- [ ] Active bug bounty program
- [ ] Incident response plan documented
- [ ] Time-tested (longer = generally safer)

**Team and Governance**
- [ ] Known team (or strong pseudonymous reputation)
- [ ] Decentralized governance
- [ ] Timelocks on admin functions
- [ ] Multi-sig for treasury

**Tokenomics**
- [ ] Sustainable emission schedule
- [ ] Clear utility and value capture
- [ ] No excessive concentration
- [ ] Reasonable unlock schedules

**Operations**
- [ ] Healthy liquidity
- [ ] Active development
- [ ] Transparent communication
- [ ] Community engagement

### Red Flags

**Immediate Concerns:**
- Anonymous team + large TVL
- No audits
- Promises of extremely high fixed yields
- Admin keys can drain contracts
- No timelock on changes

**Warning Signs:**
- Forked code with minimal changes
- Aggressive marketing, shallow substance
- Insider token concentration
- Governance capture by whales

## Risk Quantification

### Exposure Limits

**Per Protocol:**
- Maximum 10-20% of portfolio in any single protocol
- Less for newer/riskier protocols

**Per Chain:**
- Maximum 40-50% on any single chain
- Diversify across L1s and L2s

**Per Strategy:**
- Riskier strategies = smaller allocations
- Adjust based on your risk tolerance

### Risk-Adjusted Returns

Don't chase the highest APY. Consider:

**Expected Return = APY - (Risk of Loss × Potential Loss %)**

Example:
- Protocol A: 50% APY, 5% chance of losing 100%
- Expected: 50% - (5% × 100%) = 45% expected return

- Protocol B: 10% APY, 0.1% chance of losing 100%
- Expected: 10% - (0.1% × 100%) = 9.9% expected return

Protocol A looks better but carries more risk.

## Risk Mitigation Strategies

### Diversification

**Across Protocols:**
Don't keep everything in one protocol. If Aave has an issue, you don't lose everything.

**Across Chains:**
Bridge risk exists, but chain-specific risks are real too.

**Across Asset Types:**
Mix of stables, blue chips, and smaller positions.

### Insurance

**DeFi Insurance Protocols:**
- Nexus Mutual: Pool-based coverage
- InsurAce: Multi-chain coverage
- Unslashed: Modular coverage

**What They Cover:**
- Smart contract exploits
- Stablecoin depegs
- Oracle failures
- Some governance attacks

**Considerations:**
- Coverage has costs (2-10%+ annually)
- Claims require community votes
- Coverage limits may not cover full position

### Position Management

**Stop-Loss Strategies:**
- Define exit points before entering
- Use limit orders where available
- Consider automated bots for leveraged positions

**Profit Taking:**
- Remove initial capital after reasonable gains
- Let "house money" continue earning
- Reduces emotional decision-making

### Monitoring

**What to Track:**
- Protocol TVL changes
- Health factor (for borrowing)
- APY sustainability
- Governance proposals
- Social sentiment

**Tools:**
- DeFiLlama for TVL
- DeBank for portfolio
- Snapshot for governance
- Twitter/Discord for news

## Incident Response Plan

### If Something Goes Wrong

**Immediate Steps:**
1. Assess: What happened? Is it ongoing?
2. Evaluate: How exposed are you?
3. Act: Remove funds if possible
4. Document: Screenshot everything
5. Report: Help the community

**Don't Panic:**
- Sometimes rumored hacks are false
- Verify before acting
- Avoid front-running yourself into losses

### Post-Incident

**Learn:**
- What went wrong?
- How could you have avoided it?
- Update your checklist

**Community:**
- Share learnings
- Support affected users
- Advocate for improvements

## Building a Resilient Portfolio

### The Barbell Approach

**Safe Side (60-80%):**
- ETH/BTC staking
- Stablecoin lending
- Blue chip DeFi protocols
- Conservative yield farming

**Risk Side (20-40%):**
- Higher yield opportunities
- New protocols (after due diligence)
- More volatile positions

### Regular Rebalancing

**Monthly:**
- Review positions
- Take profits from winners
- Cut losses from losers
- Rebalance to target allocation

**Quarterly:**
- Full portfolio review
- Strategy assessment
- Risk parameter updates

## Key Principles

1. **Never invest more than you can afford to lose**
2. **Understand before you deposit**
3. **Diversification is your friend**
4. **APY isn't everything—consider risk-adjusted returns**
5. **Have a plan before you need one**
6. **Learn from every experience, especially losses**

Risk management isn't glamorous, but it's what separates successful DeFi participants from those who get rekt. Stay humble, stay diversified, and never stop learning.`
  },

  // ==========================================
  // AI TRADING - 5 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-ai-1",
    moduleId: "mod-ai-trading",
    title: "AI in Financial Markets",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 1,
    content: `# AI in Financial Markets: The New Paradigm

Artificial Intelligence is transforming how markets operate, how trades are executed, and how information is processed. Understanding AI's role in finance is essential for any modern trader or investor.

## The AI Trading Revolution

### Historical Context

**Pre-AI Era:**
- Human traders analyzed charts
- Phone calls to brokers
- Information traveled slowly
- Emotional decision-making prevalent

**Algorithmic Era (1990s-2010s):**
- Rule-based automated trading
- High-frequency trading (HFT) emerges
- Speed becomes competitive advantage
- Quant funds grow

**AI Era (2010s-Present):**
- Machine learning finds patterns
- Natural language processing reads news
- Adaptive strategies that learn
- Democratization through APIs and tools

### Market Impact of AI

**Speed and Efficiency:**
- Trades executed in microseconds
- 24/7 market monitoring
- Instant arbitrage opportunities captured

**Price Discovery:**
- AI improves market efficiency
- Anomalies corrected faster
- Bid-ask spreads tighten

**Volatility:**
- Flash crashes from algorithmic feedback loops
- Sudden liquidity withdrawals
- New types of market dynamics

## Types of AI in Trading

### Machine Learning Approaches

**Supervised Learning**
- Trained on labeled historical data
- Predicts outcomes (price direction, volatility)
- Examples: Classification, Regression

**Unsupervised Learning**
- Finds patterns without labels
- Clustering similar market regimes
- Anomaly detection

**Reinforcement Learning**
- Learns through trial and error
- Optimizes for reward signals (profit)
- Adapts to changing conditions

### Deep Learning

**Neural Networks**
- Multiple layers of interconnected nodes
- Can learn complex, non-linear relationships
- Requires large amounts of data

**Recurrent Neural Networks (RNN/LSTM)**
- Designed for sequential data (time series)
- Remembers previous inputs
- Good for price prediction

**Transformer Models**
- Attention mechanisms
- Powers ChatGPT-style analysis
- Excellent for text analysis

## AI Trading Applications

### Quantitative Strategies

**Statistical Arbitrage**
- AI identifies pricing inefficiencies
- Exploits mean reversion
- Pairs trading, basket strategies

**Momentum Trading**
- Detects and follows trends
- Combines multiple signals
- Dynamic position sizing

**Market Making**
- AI provides liquidity
- Manages inventory risk
- Adjusts quotes based on flow

### Sentiment Analysis

**Data Sources:**
- Social media (Twitter, Reddit)
- News articles and headlines
- Earnings calls and filings
- On-chain data (crypto)

**Applications:**
- Predict price movements from sentiment
- Early detection of market-moving news
- Gauge crowd psychology

### Alternative Data

**Non-Traditional Inputs:**
- Satellite imagery (parking lots, oil tanks)
- Credit card transaction data
- Web traffic analytics
- App download trends

**AI Advantage:**
- Processes vast amounts of unstructured data
- Finds correlations humans miss
- Faster than manual analysis

## Crypto-Specific AI Applications

### On-Chain Analysis

AI analyzes blockchain data:
- Whale wallet movements
- Exchange inflows/outflows
- Smart contract interactions
- DeFi protocol metrics

### Social Sentiment

Crypto markets are heavily influenced by:
- Twitter trending topics
- Discord and Telegram activity
- Reddit discussions
- Influencer posts

### Market Microstructure

Understanding order flow:
- DEX liquidity analysis
- MEV (Maximal Extractable Value)
- Slippage prediction
- Gas price optimization

## Limitations of AI Trading

### Overfitting

**The Problem:**
AI finds patterns that worked historically but don't generalize.

**Example:**
A model that perfectly predicts past data but fails on new data.

**Solutions:**
- Out-of-sample testing
- Walk-forward optimization
- Simpler models

### Regime Changes

**The Problem:**
Markets change; models trained on old data may not work in new conditions.

**Example:**
Models trained in bull markets fail during crashes.

**Solutions:**
- Regime detection
- Continuous retraining
- Ensemble approaches

### Data Quality

**The Problem:**
Garbage in, garbage out. Poor data leads to poor models.

**Issues:**
- Missing data points
- Survivorship bias
- Look-ahead bias

### Black Box Nature

**The Problem:**
Complex AI models are hard to interpret.

**Implications:**
- Difficulty debugging failures
- Regulatory concerns
- Trust issues

## Using AI as a Retail Trader

### Available Tools

**Sentiment Platforms:**
- Santiment
- LunarCrush
- TheTie

**AI Trading Signals:**
- StreamAiX (our platform!)
- Various trading bots

**Analysis Tools:**
- ChatGPT for research
- AI-powered screeners
- Automated alerts

### Best Practices

1. **AI as a Tool, Not a Replacement**
   - Use AI to augment your analysis
   - Don't blindly follow signals
   - Understand the reasoning

2. **Risk Management First**
   - AI doesn't eliminate risk
   - Position sizing still matters
   - Stop-losses protect capital

3. **Continuous Learning**
   - AI techniques evolve rapidly
   - Stay updated on developments
   - Understand what AI can and can't do

4. **Skeptical Adoption**
   - Backtest before live trading
   - Start with small positions
   - Monitor performance rigorously

The future of trading is increasingly AI-driven. Understanding these systems—their capabilities and limitations—is essential for any serious market participant.`
  },
  {
    id: "lesson-ai-2",
    moduleId: "mod-ai-trading",
    title: "Understanding Trading Signals",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 2,
    content: `# Understanding Trading Signals: From Data to Decisions

Trading signals are the bridge between market analysis and actionable trades. Understanding how to interpret, combine, and act on signals is a crucial skill for any trader.

## What Are Trading Signals?

A trading signal is an indicator that suggests a potential trading opportunity. Signals can be:

- **Buy/Long signals**: Suggesting price will rise
- **Sell/Short signals**: Suggesting price will fall
- **Hold signals**: Suggesting no action needed

### Signal Components

Every quality signal should include:

1. **Direction**: Buy, sell, or hold
2. **Asset**: What to trade
3. **Timing**: When to enter
4. **Confidence**: How strong is the signal
5. **Invalidation**: When the signal is wrong

## Types of Trading Signals

### Technical Signals

Based on price and volume data:

**Trend Indicators**
- Moving averages (SMA, EMA)
- MACD (Moving Average Convergence Divergence)
- ADX (Average Directional Index)

**Momentum Indicators**
- RSI (Relative Strength Index)
- Stochastic Oscillator
- Rate of Change (ROC)

**Volume Indicators**
- On-Balance Volume (OBV)
- Volume Weighted Average Price (VWAP)
- Accumulation/Distribution

**Volatility Indicators**
- Bollinger Bands
- ATR (Average True Range)
- Implied Volatility

### Fundamental Signals

Based on underlying value:

**Traditional Markets:**
- P/E ratios vs. historical averages
- Earnings surprises
- Revenue growth trends
- Insider buying/selling

**Crypto Markets:**
- Network activity (transactions, addresses)
- Developer activity (GitHub commits)
- Tokenomics metrics
- Protocol revenue

### On-Chain Signals (Crypto-Specific)

**Whale Activity**
- Large wallet movements
- Exchange deposits/withdrawals
- Accumulation patterns

**Network Health**
- Hash rate (PoW chains)
- Validator activity (PoS chains)
- Transaction fees
- Active addresses

**DeFi Metrics**
- TVL (Total Value Locked)
- Lending rates
- Liquidation levels
- DEX volumes

### Sentiment Signals

**Social Metrics:**
- Social volume (mentions)
- Sentiment score (positive/negative)
- Influencer activity
- Google trends

**Market Structure:**
- Funding rates (perpetuals)
- Open interest
- Put/call ratios
- Fear & Greed indices

## Signal Strength and Confidence

### Measuring Signal Quality

**Backtesting Metrics:**
- Win rate: % of profitable signals
- Profit factor: Gross profit / Gross loss
- Sharpe ratio: Risk-adjusted return
- Maximum drawdown: Largest peak-to-trough decline

**Example:**
A signal with:
- 55% win rate
- 2:1 risk/reward ratio
- 1.5 profit factor
= Potentially profitable over time

### Confidence Levels

**High Confidence:**
- Multiple confirming indicators
- Consistent with higher timeframes
- Aligns with fundamental backdrop
- Clear invalidation level

**Medium Confidence:**
- Some conflicting signals
- Works on one timeframe only
- Neutral fundamentals
- Wide invalidation range

**Low Confidence:**
- Single indicator only
- Against higher timeframe trend
- Contradictory signals
- No clear invalidation

## Combining Multiple Signals

### Multi-Factor Models

**The Principle:**
Single signals are noisy; combining them reduces false signals.

**Approach:**
1. Score each factor (e.g., -2 to +2)
2. Weight factors by importance
3. Calculate composite score
4. Trade when score exceeds threshold

**Example Composite:**
- Technical trend: +2 (strongly bullish)
- On-chain flow: +1 (moderately bullish)
- Sentiment: -1 (moderately bearish)
- Weighted average: +0.67 (slight buy signal)

### Signal Confluence

Look for multiple signals pointing the same direction:

**Strong Long Setup:**
- Price above key moving averages
- RSI showing bullish divergence
- Increasing on-chain accumulation
- Positive sentiment shift

**Strong Short Setup:**
- Price below key moving averages
- Overbought RSI
- Whale selling detected
- Negative news flow

## Timeframe Alignment

### Multi-Timeframe Analysis

**The Concept:**
Higher timeframes provide context; lower timeframes provide entry.

**Common Framework:**
- Weekly: Primary trend direction
- Daily: Intermediate trend and levels
- 4-Hour: Entry and exit timing
- 1-Hour: Fine-tuning execution

**The Rule:**
Trade in the direction of the higher timeframe trend unless there's strong evidence of reversal.

## Acting on Signals

### Entry Execution

**Aggressive Entry:**
- Enter immediately on signal
- Higher risk, higher reward potential
- Works well for high-conviction signals

**Conservative Entry:**
- Wait for confirmation
- May miss some moves
- Reduces false signals

**Scaled Entry:**
- Enter in tranches
- Average into position
- Reduces timing risk

### Position Sizing

**Based on Signal Strength:**
- High confidence: Larger position
- Medium confidence: Standard position
- Low confidence: Small or no position

**Risk-Based Sizing:**
Position Size = (Account Risk %) / (Stop Loss %)

Example:
- $10,000 account
- Risk 2% per trade = $200
- Stop loss 10% from entry
- Position size = $200 / 10% = $2,000

### Stop-Loss and Take-Profit

**Stop-Loss Approaches:**
- Technical levels (support/resistance)
- ATR-based (e.g., 2x ATR)
- Fixed percentage (e.g., 5%)

**Take-Profit Approaches:**
- Risk/reward ratio targets (e.g., 2:1, 3:1)
- Trailing stops (lock in profits)
- Scale out (partial exits at targets)

## Building Your Signal Framework

### Step-by-Step Approach

1. **Define Your Style**
   - Timeframe (scalp, swing, position)
   - Risk tolerance
   - Time commitment

2. **Select Indicators**
   - Start with few (3-5)
   - Understand each deeply
   - Avoid redundancy

3. **Establish Rules**
   - Clear entry criteria
   - Clear exit criteria
   - Position sizing rules

4. **Backtest**
   - Historical performance
   - Different market conditions
   - Statistical significance

5. **Paper Trade**
   - Live execution practice
   - Emotion management
   - Rule adherence

6. **Go Live (Small)**
   - Real money, small size
   - Track everything
   - Iterate based on results

Trading signals are only as good as the framework around them. Discipline, consistency, and continuous improvement are what turn signals into profits.`
  },
  {
    id: "lesson-ai-3",
    moduleId: "mod-ai-trading",
    title: "Risk Management with AI",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 3,
    content: `# Risk Management with AI: Protecting Capital in Uncertain Markets

Risk management is the most important skill in trading. AI can enhance risk management, but understanding the fundamentals is essential before adding AI tools.

## Core Risk Management Principles

### The First Rule

**Never risk more than you can afford to lose.**

This sounds simple but is violated constantly. Before any trade:
- Define your maximum loss
- Accept that loss before entering
- Size your position accordingly

### Risk Per Trade

**The 1-2% Rule:**
- Risk no more than 1-2% of your capital per trade
- After 5 consecutive losses at 2%, you've lost ~10%
- Still have 90% to continue trading

**Example:**
- $10,000 account
- 2% risk = $200 max loss per trade
- If stop-loss is 10% away, position size = $2,000

### Risk of Ruin

**Definition:** The probability of losing enough capital that you can no longer trade effectively.

**Factors:**
- Win rate
- Risk/reward ratio
- Position sizing
- Number of trades

**Example:**
With 2% risk per trade, you'd need 50 consecutive losers to go broke. With 10% risk per trade, only 10 losers and you're done.

## AI-Enhanced Risk Management

### Dynamic Position Sizing

AI can adjust position sizes based on:

**Market Volatility:**
- Higher volatility = smaller positions
- Lower volatility = larger positions
- ATR-based calculations

**Signal Confidence:**
- Stronger signals = larger positions
- Weaker signals = smaller positions
- Model probability scoring

**Recent Performance:**
- Winning streak = maintain size
- Losing streak = reduce size
- Kelly Criterion optimization

### Drawdown Protection

AI systems can implement automatic risk reduction:

**Drawdown Limits:**
- 10% drawdown: Reduce position sizes 50%
- 20% drawdown: Reduce to 25% or pause
- Review and diagnose before resuming

**Trailing Maximum:**
- Track equity high-water mark
- Calculate drawdown from peak
- Trigger protective actions

### Portfolio-Level Risk

AI can analyze correlation and concentration:

**Correlation Monitoring:**
- Track position correlations
- Reduce when correlations spike
- Diversify across uncorrelated assets

**Sector Exposure:**
- Limit exposure to any single sector
- Balance across market segments
- Adjust as markets shift

## Volatility and Risk

### Understanding Volatility

**Historical Volatility:**
- Calculated from past price movements
- Standard deviation of returns
- Backward-looking

**Implied Volatility:**
- Derived from options prices
- Market's expectation of future volatility
- Forward-looking

### Using Volatility for Sizing

**Volatility-Adjusted Position Sizing:**

Position Size = (Risk Amount) / (Volatility × Multiplier)

Example:
- Risk amount: $200
- Asset 30-day volatility: 5%
- Multiplier: 2 (for conservative)
- Position size: $200 / (5% × 2) = $2,000

Compare to a high-volatility asset:
- 10% volatility
- Position size: $200 / (10% × 2) = $1,000

This normalizes risk across different assets.

## Stop-Loss Strategies

### Types of Stops

**Fixed Percentage Stop:**
- Simple and consistent
- Example: -5% from entry
- Doesn't adapt to market conditions

**ATR-Based Stop:**
- Adapts to volatility
- Example: 2× ATR from entry
- Wider in volatile markets, tighter in calm

**Technical Level Stop:**
- Based on support/resistance
- More meaningful levels
- Requires chart analysis

**Time-Based Stop:**
- Exit if trade doesn't work in X time
- Reduces opportunity cost
- Useful for catalysts that didn't materialize

### Stop-Loss Placement

**Common Mistakes:**
- Too tight: Stopped out by noise
- Too wide: Excessive losses
- At obvious levels: Hunted by market

**AI Enhancement:**
- Analyze historical stop-out rates
- Optimize placement based on volatility
- Identify stop-hunting zones

### Trailing Stops

**Concept:** Move stop-loss as price moves favorably.

**Types:**
- Fixed trailing (move stop every X% gain)
- ATR trailing (maintain X ATR below high)
- Chandelier exit (multiple ATR from peak)

**AI Optimization:**
- Analyze optimal trailing parameters
- Adapt to market conditions
- Balance protection vs. room to move

## Hedging Strategies

### What is Hedging?

Reducing risk by taking offsetting positions.

**Simple Example:**
- Long ETH spot
- Short ETH perpetual
- Net: Neutral price exposure, collect funding

### Hedging Tools

**Options:**
- Buy puts to protect long positions
- Cost is the premium
- Defined maximum loss

**Futures/Perpetuals:**
- Short to hedge long exposure
- Capital efficient
- Monitor funding rates

**Correlated Assets:**
- Short correlated asset
- Not perfect hedge
- Lower costs than direct hedge

### AI in Hedging

**Correlation Analysis:**
- Find optimal hedge ratios
- Detect correlation regime changes
- Dynamic hedge adjustment

**Tail Risk Protection:**
- Identify extreme risk scenarios
- Cost-effective protection strategies
- Monte Carlo simulations

## Building a Risk Framework

### Essential Components

1. **Pre-Trade Checklist:**
   - Define entry and exit before trading
   - Calculate position size
   - Set stop-loss and take-profit

2. **Active Trade Monitoring:**
   - Track open positions
   - Monitor correlations
   - Update stops as needed

3. **Post-Trade Review:**
   - Did you follow rules?
   - What worked/didn't work?
   - Lessons for future

### Risk Metrics to Track

- **Win Rate:** Percentage of profitable trades
- **Average Win/Loss:** Size of wins vs. losses
- **Profit Factor:** Gross profit / Gross loss
- **Maximum Drawdown:** Largest peak-to-trough decline
- **Sharpe Ratio:** Risk-adjusted returns

### AI Tools for Risk Management

**Portfolio Analytics:**
- Real-time exposure tracking
- Correlation matrices
- Value at Risk (VaR) calculations

**Anomaly Detection:**
- Unusual market conditions
- Position size outliers
- Strategy drift identification

**Scenario Analysis:**
- Stress testing
- Historical crash simulations
- "What if" modeling

## Key Takeaways

1. **Risk management comes first, profits second**
2. **Position sizing is more important than entry signals**
3. **AI can enhance but not replace sound risk principles**
4. **Survive first, then thrive**
5. **Track everything, learn constantly**

The best traders aren't the ones who win the most—they're the ones who manage risk the best. AI gives you powerful tools, but discipline and consistency are what make them work.`
  },
  {
    id: "lesson-ai-4",
    moduleId: "mod-ai-trading",
    title: "Backtesting and Strategy Validation",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 4,
    content: `# Backtesting and Strategy Validation: Testing Before Trading

Backtesting is the process of testing a trading strategy on historical data to see how it would have performed. It's an essential step before risking real capital.

## Why Backtest?

### The Purpose

1. **Validate Strategy Logic:** Does the idea actually work?
2. **Quantify Performance:** What are the realistic expectations?
3. **Identify Weaknesses:** Where does the strategy fail?
4. **Optimize Parameters:** What settings work best?
5. **Build Confidence:** Trust your system in drawdowns

### What Backtesting Can Tell You

- Historical win rate
- Average profit/loss per trade
- Maximum drawdown
- Performance in different market conditions
- Sensitivity to parameter changes

### What Backtesting Cannot Tell You

- Future performance guarantees
- How you'll handle real-time execution
- Slippage and execution quality
- Your emotional response to losses
- Regime changes not in historical data

## Building a Backtest

### Components of a Backtest

**1. Historical Data**
- Price data (OHLCV)
- Sufficient time period
- Multiple market conditions
- Clean, gap-free data

**2. Strategy Rules**
- Entry conditions
- Exit conditions
- Position sizing
- Risk management

**3. Execution Model**
- When trades are filled
- Price at which they're filled
- Slippage assumptions
- Commission costs

**4. Performance Metrics**
- Returns (total, annualized)
- Risk metrics (drawdown, volatility)
- Efficiency metrics (Sharpe, Sortino)
- Trade statistics

### Data Requirements

**Time Period:**
- Minimum: 2-3 years for swing trading
- Ideal: Multiple market cycles (bull, bear, sideways)
- For day trading: At least 6-12 months of minute data

**Data Quality:**
- Accurate prices (not just closes)
- Volume data
- Splits and dividends adjusted
- No gaps or errors

**Common Data Sources:**
- Yahoo Finance (free, limited)
- Alpha Vantage (free tier available)
- Polygon.io (quality crypto data)
- Exchange APIs (direct, requires setup)

## Common Backtesting Mistakes

### Overfitting

**The Problem:**
Adding too many rules or parameters to fit historical data perfectly, but failing on new data.

**Signs:**
- Perfect backtest, terrible live performance
- Many specific rules
- Complex conditions

**Solutions:**
- Keep strategies simple
- Use out-of-sample testing
- Regularize parameters
- Cross-validation

### Look-Ahead Bias

**The Problem:**
Using information that wouldn't have been available at the time.

**Examples:**
- Using close price for entry that occurs before close
- Applying future adjustments retroactively
- Filling at exact indicator levels

**Solutions:**
- Strict time separation
- Fill at next bar's open
- Account for data delays

### Survivorship Bias

**The Problem:**
Only testing on assets that still exist, ignoring those that failed.

**Examples:**
- Testing on current S&P 500 members
- Only analyzing tokens that survived
- Ignoring delisted stocks

**Solutions:**
- Use point-in-time data
- Include delisted assets
- Test on realistic universe

### Ignoring Costs

**The Problem:**
Not accounting for trading costs that eat into profits.

**Cost Types:**
- Commissions/fees
- Slippage (bid-ask spread)
- Market impact (for large trades)
- Funding rates (for perpetuals)

**Solutions:**
- Model realistic costs
- Add slippage assumptions
- Higher turnover = more costs

## Walk-Forward Testing

### The Concept

Instead of one backtest, use rolling windows:

1. **In-Sample:** Train/optimize on portion of data
2. **Out-of-Sample:** Test on subsequent period
3. **Roll Forward:** Move windows and repeat
4. **Combine:** Aggregate out-of-sample results

### Example Walk-Forward

**Year 1-2:** In-sample (optimize)
**Year 3:** Out-of-sample (test)

**Year 2-3:** In-sample (optimize)
**Year 4:** Out-of-sample (test)

**Year 3-4:** In-sample (optimize)
**Year 5:** Out-of-sample (test)

Combine Year 3, 4, 5 results = More realistic performance estimate

### Benefits

- Prevents overfitting
- Simulates real-world adaptation
- More reliable performance estimates
- Identifies strategy degradation

## Monte Carlo Simulation

### What It Does

Randomly varies trade sequence and sizing to see distribution of possible outcomes.

### Why It's Useful

**Risk Assessment:**
- What's the worst-case drawdown?
- What's the probability of various outcomes?
- How sensitive are results to trade sequence?

**Position Sizing:**
- What sizing leads to acceptable risk of ruin?
- How does compounding affect outcomes?

### Running Monte Carlo

1. Take your trade history
2. Randomly reshuffle trade order
3. Calculate equity curve
4. Repeat 1,000+ times
5. Analyze distribution of outcomes

## Performance Metrics

### Essential Metrics

**Return Metrics:**
- Total Return: Overall profit/loss
- Annualized Return: Yearly equivalent
- CAGR: Compound Annual Growth Rate

**Risk Metrics:**
- Maximum Drawdown: Largest peak-to-trough decline
- Average Drawdown: Mean of all drawdowns
- Volatility: Standard deviation of returns

**Risk-Adjusted Metrics:**
- Sharpe Ratio: (Return - Risk-free rate) / Volatility
- Sortino Ratio: Only counts downside volatility
- Calmar Ratio: Return / Maximum Drawdown

**Trade Metrics:**
- Win Rate: Percentage of winning trades
- Average Win/Loss: Size of wins vs. losses
- Profit Factor: Gross profit / Gross loss
- Average Trade: Net profit / Number of trades

### Minimum Standards (Example)

For a strategy to be worth trading:
- Sharpe Ratio > 1.0 (after costs)
- Maximum Drawdown < 25%
- Win Rate > 40% with positive profit factor
- Consistent across market regimes

## Paper Trading

### After Backtesting

Before risking real capital, paper trade:

1. **Simulate Live Conditions**
   - Real-time data
   - Record all trades
   - Track emotions

2. **Duration**
   - Minimum: 1-3 months
   - Enough trades for statistical significance
   - Multiple market conditions if possible

3. **What to Watch**
   - Execution vs. expected prices
   - Your ability to follow rules
   - Emotional reactions
   - Strategy performance vs. backtest

### Transitioning to Live

When paper trading confirms backtest:
1. Start with small position sizes
2. Scale up gradually
3. Maintain detailed records
4. Compare live to paper/backtest

## Building Your Process

### Standard Workflow

1. **Idea Generation:** Hypothesis about market behavior
2. **Initial Coding:** Implement basic logic
3. **Preliminary Backtest:** Does it show promise?
4. **Refinement:** Improve, but avoid overfitting
5. **Walk-Forward Test:** Robust out-of-sample testing
6. **Monte Carlo:** Understand risk distributions
7. **Paper Trade:** Verify in live conditions
8. **Go Live (Small):** Real money, conservative sizing
9. **Scale Up:** Increase size as confidence grows

The best traders are rigorous about testing. Time spent in backtesting saves money in live markets.`
  },
  {
    id: "lesson-ai-5",
    moduleId: "mod-ai-trading",
    title: "Building AI Trading Systems",
    lessonType: "article",
    estimatedMinutes: 20,
    xpReward: 150,
    sortOrder: 5,
    content: `# Building AI Trading Systems: From Concept to Deployment

This lesson covers the practical aspects of building AI trading systems, from data collection to deployment and monitoring.

## System Architecture

### Core Components

**1. Data Pipeline**
- Data collection (APIs, feeds)
- Data storage (databases)
- Data processing (cleaning, features)
- Real-time streaming

**2. Model Training**
- Feature engineering
- Model selection
- Training pipeline
- Validation framework

**3. Signal Generation**
- Model inference
- Signal processing
- Confidence scoring
- Alert generation

**4. Execution**
- Order management
- Exchange connectivity
- Slippage management
- Position tracking

**5. Monitoring**
- Performance tracking
- Risk monitoring
- System health
- Alerting

### Data Flow

\`\`\`
Market Data → Storage → Features → Model → Signals → Orders → Execution
     ↑                                                          ↓
     ←──────────── Feedback Loop ←───────────────────────────────
\`\`\`

## Data Management

### Essential Data Types

**Price Data:**
- OHLCV (Open, High, Low, Close, Volume)
- Multiple timeframes
- Clean, adjusted data

**Order Book Data:**
- Bid/ask levels and sizes
- Order flow
- Trade prints

**On-Chain Data (Crypto):**
- Wallet movements
- DEX activity
- Smart contract events

**Alternative Data:**
- Social sentiment
- News feeds
- Funding rates

### Data Storage Options

**Time-Series Databases:**
- InfluxDB, TimescaleDB
- Optimized for time-series queries
- Efficient compression

**General Databases:**
- PostgreSQL, MongoDB
- Flexible, well-supported
- May need optimization for time-series

**File-Based:**
- Parquet, CSV
- Simple, portable
- Less efficient for live trading

### Data Quality

**Cleaning Steps:**
- Remove outliers and errors
- Handle missing values
- Adjust for splits/dividends
- Align timestamps

**Validation:**
- Cross-reference sources
- Check for gaps
- Verify against known events

## Feature Engineering

### What Are Features?

Features are the inputs to your model—transformations of raw data that capture useful information.

### Common Feature Categories

**Price-Based:**
- Returns (log returns, percentage)
- Moving averages (SMA, EMA)
- Momentum (ROC, RSI)
- Volatility (ATR, Bollinger Bands)

**Volume-Based:**
- Volume ratios
- OBV (On-Balance Volume)
- Volume momentum

**Micro-Structure:**
- Bid-ask spread
- Order imbalance
- Trade intensity

**Technical Patterns:**
- Support/resistance levels
- Chart patterns (encoded)
- Candlestick patterns

**Fundamental/On-Chain:**
- Network metrics
- DeFi metrics
- Sentiment scores

### Feature Selection

**Importance:** Not all features help; some add noise.

**Methods:**
- Correlation analysis
- Feature importance (tree models)
- Stepwise selection
- SHAP values

**Avoid:**
- Features correlated with each other
- Features with look-ahead bias
- Features that don't generalize

## Model Development

### Model Selection

**For Time-Series Prediction:**
- LSTM, GRU (deep learning)
- XGBoost, LightGBM (gradient boosting)
- Random Forest

**For Classification (Direction):**
- Logistic Regression (baseline)
- Gradient Boosting
- Neural Networks

**For Ranking:**
- Learning to Rank
- Pairwise models

### Training Best Practices

**Data Splitting:**
- Time-based split (never random for time-series)
- Train → Validation → Test
- Out-of-time validation

**Cross-Validation:**
- Time-series cross-validation
- Purging to prevent leakage
- Embargo periods between folds

**Regularization:**
- Prevent overfitting
- Dropout, L1/L2 penalties
- Early stopping

### Model Monitoring

**Tracking:**
- Feature drift
- Prediction confidence
- Realized vs. predicted performance

**When to Retrain:**
- Degrading performance
- Regime change detected
- Significant feature drift

## Execution Systems

### Order Types

**Market Orders:**
- Immediate execution
- Certain fill, uncertain price
- Higher slippage risk

**Limit Orders:**
- Specified price
- Uncertain fill
- Lower slippage

**Stop Orders:**
- Triggered by price level
- Risk management tool
- Can have slippage in gaps

### Execution Quality

**Slippage Reduction:**
- Split large orders (TWAP, VWAP)
- Use limit orders when possible
- Time execution for liquidity

**Latency:**
- Faster = better for some strategies
- Colocation for HFT
- Less critical for longer timeframes

### Exchange Integration

**API Considerations:**
- Rate limits
- Websocket vs. REST
- Error handling
- Failover systems

## Risk Controls

### Pre-Trade Checks

- Position size within limits
- Total exposure acceptable
- Correlation check
- Sufficient margin

### In-Flight Controls

- Stop-loss monitoring
- Margin monitoring
- Connection health
- Order fill tracking

### Post-Trade Review

- Fill quality analysis
- P&L attribution
- Strategy adherence
- System performance

## Deployment

### Infrastructure

**Cloud Providers:**
- AWS, GCP, Azure
- Reliable uptime
- Global distribution

**Dedicated Servers:**
- More control
- Consistent performance
- Higher maintenance

### Reliability

**Essential Practices:**
- Redundancy (backup systems)
- Monitoring and alerting
- Automated failover
- Regular testing

### Security

- API key management
- Encryption at rest and in transit
- Access controls
- Audit logging

## Live Monitoring

### Dashboards

Track in real-time:
- Open positions
- P&L (realized and unrealized)
- Risk metrics
- System health

### Alerts

Set alerts for:
- Unusual losses
- System errors
- Connection issues
- Risk limit breaches

### Performance Review

**Daily:**
- P&L review
- Trade analysis
- System check

**Weekly:**
- Strategy performance
- Risk analysis
- Optimization review

**Monthly:**
- Comprehensive review
- Model retraining assessment
- System upgrades

## Continuous Improvement

### Iteration Cycle

1. Monitor live performance
2. Identify issues
3. Hypothesize improvements
4. Backtest changes
5. Paper trade
6. Deploy to production
7. Return to step 1

### Staying Current

- Follow research papers
- Monitor competition
- Adapt to market changes
- Upgrade technology

Building AI trading systems is a journey, not a destination. Markets evolve, and your systems must evolve with them.`
  }
];

export async function seedExpandedLearningContent() {
  console.log("Starting expanded learning content seed...");
  
  for (const lesson of expandedLessons) {
    try {
      const existing = await db.select()
        .from(learningLessons)
        .where(eq(learningLessons.id, lesson.id))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(learningLessons)
          .set({
            title: lesson.title,
            content: lesson.content,
            estimatedMinutes: lesson.estimatedMinutes,
            xpReward: lesson.xpReward,
            lessonType: lesson.lessonType,
            sortOrder: lesson.sortOrder
          })
          .where(eq(learningLessons.id, lesson.id));
        console.log(`Updated lesson: ${lesson.title}`);
      } else {
        await db.insert(learningLessons).values({
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          content: lesson.content,
          lessonType: lesson.lessonType as any,
          estimatedMinutes: lesson.estimatedMinutes,
          xpReward: lesson.xpReward,
          sortOrder: lesson.sortOrder
        });
        console.log(`Created lesson: ${lesson.title}`);
      }
    } catch (error) {
      console.error(`Error seeding lesson ${lesson.id}:`, error);
    }
  }
  
  console.log("Expanded learning content seed complete!");
}

