# StreamAiX API Requirements

## Quick Reference

### 🔴 CRITICAL - Must Have
| API | Purpose | Cost | Setup Required |
|-----|---------|------|----------------|
| PostgreSQL | Database | Included | Auto-configured |
| OpenAI | AI features | ~$5-20/mo | Add as secret |

### 🟡 IMPORTANT - Core Features
| API | Purpose | Cost | Setup Required |
|-----|---------|------|----------------|
| Finnhub | Stock data | Free tier OK | Transfer secret |
| RSS Feeds | News content | FREE | No setup |

### 🟢 OPTIONAL - Enhanced Features
| API | Purpose | Cost | Current Status |
|-----|---------|------|----------------|
| CoinGecko | Crypto prices | Free (limited) | Hit rate limit |
| CoinMarketCap | Crypto fallback | Free (limited) | Hit credit limit |
| Dune Analytics | Blockchain data | Free (limited) | Hit rate limit |
| Twitter OAuth | Social login | Free | Working |

### ⚪ NOT NEEDED - Skip for Now
- BaseScan
- CryptoNews API
- Federal Reserve (FRED)
- Alpha Vantage

---

## Detailed Breakdown

### 1. Database (CRITICAL ✅)

**Service:** PostgreSQL via Neon  
**Environment Variable:** `DATABASE_URL`  
**Cost:** Included with Replit deployment  
**Setup:** Automatic

**What It Does:**
- Stores all user data, bounties, markets, summaries
- Required for login, signup, any persistence
- Auto-configured by Replit when you publish

**Action Required:**
- ✅ Nothing - automatically available in production

---

### 2. OpenAI API (CRITICAL if using AI features)

**Environment Variable:** `OPENAI_API_KEY`  
**Cost:** Pay-per-use (~$0.002-0.006 per request)  
**Free Tier:** $5 credit for new accounts  

**What It Does:**
- AI chatbot assistant (GPT-4o)
- Content summarization
- Quality scoring for bounty submissions
- Prediction market suggestions from content

**Features Affected if Missing:**
- ❌ AI chatbot won't respond
- ❌ Can't process YouTube/podcast content
- ❌ No AI quality scoring
- ⚠️ Can still use bounties, markets, and social feed

**Estimated Monthly Cost:**
- Light use (100 chats/day): ~$5
- Medium use (500 chats/day): ~$15
- Heavy use (2000+ chats/day): ~$50+

**Action Required:**
1. Get API key from https://platform.openai.com/api-keys
2. Add as secret in deployment settings
3. Monitor usage in OpenAI dashboard

---

### 3. Finnhub API (IMPORTANT 🟡)

**Environment Variable:** `FINNHUB_API_KEY`  
**Cost:** Free tier (60 calls/minute)  
**Current Status:** ✅ Working

**What It Does:**
- Real-time stock prices for analytics
- Market data for correlation analysis
- Crypto-related stock tracking (COIN, MSTR, etc.)

**Features Affected if Missing:**
- ⚠️ Analytics dashboard shows limited data
- ⚠️ Market insights only show crypto data
- ✅ Core bounty/market features still work

**Free Tier Limits:**
- 60 API calls per minute
- Sufficient for most use cases with caching

**Action Required:**
1. Keep existing key or get free one from https://finnhub.io
2. Transfer secret to production deployment

---

### 4. News RSS Feeds (IMPORTANT 🟡)

**Services:** CoinDesk, CoinTelegraph  
**Cost:** FREE ✅  
**Current Status:** ✅ Working perfectly

**What It Does:**
- Powers social feed MACRO and CRYPTO tabs
- Shows 5 real story-driven news posts
- No API key needed - public RSS feeds

**Features Affected if Missing:**
- ❌ Social feed would be empty
- ✅ Everything else works fine

**Action Required:**
- ✅ Nothing - already working, no setup needed

---

### 5. CoinGecko API (OPTIONAL 🟢)

**Environment Variable:** `COINGECKO_API_KEY`  
**Cost:** 
- Free: 10,000 calls/month
- Analyst: $129/month (50,000 calls)
- Pro: $429/month (500,000 calls)

**Current Status:** ⚠️ Hit rate limit (10k calls exhausted)

**What It Does:**
- Cryptocurrency price data
- Market cap rankings
- 24h/7d/30d price changes

**Features Affected if Missing:**
- ⚠️ Analytics shows stocks only (Finnhub)
- ⚠️ Crypto price tickers may not update
- ✅ Core features unaffected

**Recommendation:**
- **For Testing:** Skip it, use Finnhub for stocks
- **For Production:** Only if you need live crypto prices
- **Alternative:** Use free tier and implement better caching

**Action Required:**
- Skip unless crypto price tracking is critical
- If needed: Upgrade to paid tier or optimize caching

---

### 6. CoinMarketCap API (OPTIONAL 🟢)

**Environment Variable:** `COINMARKETCAP_API_KEY`  
**Cost:**
- Free: 10,000 monthly credits
- Basic: $79/month (100,000 credits)
- Hobbyist: $299/month (500,000 credits)

**Current Status:** ⚠️ Hit monthly credit limit

**What It Does:**
- Backup crypto price source (if CoinGecko fails)
- More detailed market data
- Historical price data

**Features Affected if Missing:**
- ⚠️ Only affects crypto analytics
- ✅ App has 3-tier fallback (CoinGecko → CMC → Dune)

**Recommendation:**
- Skip - redundant with CoinGecko
- Only needed if CoinGecko is down

**Action Required:**
- Don't transfer this secret unless you upgrade to paid tier

---

### 7. Dune Analytics (OPTIONAL 🟢)

**Environment Variable:** `DUNE_API_KEY`  
**Cost:**
- Free: ~2,500 credits/month
- Plus: $99/month (higher limits)

**Current Status:** ⚠️ Hit rate limit

**What It Does:**
- Blockchain analytics (3rd fallback)
- On-chain DEX price data
- ERC-20 token pricing

**Features Affected if Missing:**
- ⚠️ 3rd fallback for crypto prices fails
- ✅ Already have 2 fallbacks before this

**Recommendation:**
- Skip - tertiary fallback, rarely used
- Only needed if both CoinGecko AND CoinMarketCap fail

**Action Required:**
- Don't include in production unless you have paid plan

---

### 8. Twitter OAuth (OPTIONAL 🟢)

**Environment Variables:**
- `TWITTER_CONSUMER_KEY`
- `TWITTER_CONSUMER_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_SECRET`

**Cost:** FREE  
**Current Status:** ⚠️ Rate-limited (expected with free tier)

**What It Does:**
- "Login with Twitter" option
- Social feed integration (currently disabled due to API limits)

**Features Affected if Missing:**
- ⚠️ Users can't login via Twitter
- ✅ Still have local login and Web3 wallet login

**Recommendation:**
- Include if you want Twitter login option
- Social feed features currently disabled anyway

**Action Required:**
- Transfer secrets if you want Twitter login
- Otherwise skip - local auth works great

---

### 9. BaseScan API (NOT NEEDED ⚪)

**Environment Variable:** `BASESCAN_API_KEY`  
**Status:** Not used in current codebase

**What It's For:**
- Smart contract verification on Base network
- Would be used for production smart contract deployment

**Recommendation:** Skip for now

---

### 10. CryptoNews API (NOT NEEDED ⚪)

**Environment Variable:** `CRYPTONEWS_API_KEY`  
**Status:** Not used - using free RSS feeds instead

**Recommendation:** Skip - RSS feeds work great and are free

---

### 11. Federal Reserve API (NOT NEEDED ⚪)

**Environment Variable:** `FRED_API_KEY`  
**Status:** Not critical for core features

**What It's For:**
- Economic data from Federal Reserve
- Interest rates, inflation data

**Recommendation:** Skip unless you add macro economic features

---

### 12. Alpha Vantage (NOT NEEDED ⚪)

**Environment Variable:** `ALPHA_VANTAGE_API_KEY`  
**Status:** Not used - using Finnhub instead

**Recommendation:** Skip - Finnhub is better and already integrated

---

## Recommended Production Setup

### Minimum Viable Deployment
**Just these two:**
1. ✅ PostgreSQL (auto-configured)
2. ✅ OpenAI API (if using AI features)

**Everything else works:**
- Authentication ✅
- Bounties ✅
- Prediction Markets ✅
- News Feed ✅ (RSS is free)
- Navigation ✅

### Enhanced Experience
**Add these for full features:**
3. Finnhub API (stock data)
4. Keep RSS feeds (already working)

**Don't add:**
- CoinGecko (hit rate limit)
- CoinMarketCap (hit credit limit)
- Dune (tertiary fallback)
- Other optional services

### Cost Estimation

**Minimum Setup:**
- Database: Included in Replit deployment
- OpenAI: ~$5-20/month
- **Total: ~$5-20/month**

**Enhanced Setup:**
- Database: Included
- OpenAI: ~$5-20/month
- Finnhub: FREE
- **Total: ~$5-20/month**

**Full Featured (not recommended):**
- Database: Included
- OpenAI: ~$20/month
- Finnhub: FREE
- CoinGecko Pro: $129/month
- **Total: ~$149/month**

## Recommendation

**For Launch:**
Start with minimum setup (database + OpenAI). Monitor usage and only add paid APIs if specific features are heavily used by real users.

**Why:**
- News feed works great with free RSS
- Stock data works with free Finnhub
- Crypto prices nice-to-have but not critical
- Save money until you validate user demand
