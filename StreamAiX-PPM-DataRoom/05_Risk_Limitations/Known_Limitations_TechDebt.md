# Known Limitations & Technical Debt

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Purpose:** Honest disclosure of current platform limitations for investor due diligence

---

## 1. Streaming Infrastructure

### No TURN Servers (~15% NAT Issue)
- **Impact:** Approximately 15-20% of users behind symmetric NAT cannot establish P2P connections
- **Symptom:** Video stream fails to load, shows "Connecting..." indefinitely
- **Workaround:** Chat and overlays remain functional; users can refresh
- **Timeline:** TURN deployment planned Q1 2026 (60 days)
- **Cost:** $50-100/month (Twilio TURN)

### P2P Viewer Cap (~50 viewers)
- **Impact:** Streams with 50+ viewers experience degraded quality
- **Symptom:** Increased latency, dropped frames, connection failures
- **Workaround:** Recommend multiple smaller streams for large audiences
- **Timeline:** SFU migration planned Q2 2026 (120 days)
- **Cost:** ~$500-1000/month (LiveKit or similar)

### No Stream Recording/Replays
- **Impact:** All streams are live-only, no VOD capability
- **Symptom:** Missed streams cannot be watched later
- **Workaround:** None currently
- **Timeline:** Planned Q2 2026
- **Cost:** Storage + transcoding ($200-500/month depending on volume)

---

## 2. Prediction Markets

### Off-Chain Settlement Only
- **Impact:** All trades settled via database, not blockchain
- **Symptom:** No verifiable on-chain transaction history
- **Workaround:** Internal audit logs provide transparency
- **Timeline:** On-chain settlement planned Q2 2026
- **Dependency:** Base mainnet stability, smart contract audit

### No UMA Oracle Integration
- **Impact:** Market resolution depends on AI + manual admin
- **Symptom:** Centralized resolution authority
- **Workaround:** 24-hour dispute window with admin arbitration
- **Timeline:** UMA integration planned Q2 2026
- **Dependency:** UMA Optimistic Oracle availability on Base

### Leagues/Tournaments Incomplete
- **Impact:** League structure exists but full tournament mode not functional
- **Symptom:** Cannot run complete season with brackets/elimination
- **Workaround:** Use leagues for simple leaderboard tracking
- **Timeline:** Full tournament mode Q1 2026

---

## 3. Wallet & Web3

### WalletConnect Not Fully Tested
- **Impact:** Mobile wallet users may experience connection issues
- **Symptom:** WalletConnect QR code flow may fail on some wallets
- **Workaround:** Use MetaMask browser extension
- **Timeline:** Full testing and fixes Q1 2026

### No On-Chain Transactions Today
- **Impact:** Wallet is authentication-only, no actual blockchain transactions
- **Symptom:** Users cannot see StreamAiX activity in wallet transaction history
- **Workaround:** Internal balance system provides same functionality
- **Timeline:** On-chain transactions planned Q2 2026

---

## 4. Security

### No 2FA/MFA
- **Impact:** Accounts protected only by password
- **Symptom:** Increased risk if password compromised
- **Workaround:** Strong password recommendations
- **Timeline:** 2FA implementation Q1 2026

### Rate Limiting Partially Implemented
- **Impact:** Auth endpoints vulnerable to brute force
- **Symptom:** No protection against login attempts
- **Workaround:** Account lockout after failed attempts (basic)
- **Timeline:** Full rate limiting Q1 2026

### No Token Refresh Rotation
- **Impact:** Long-lived JWTs if compromised
- **Symptom:** Cannot revoke tokens before expiry
- **Workaround:** 24-hour token expiry limits exposure
- **Timeline:** Refresh token system Q1 2026

---

## 5. Infrastructure

### Single WebSocket Server
- **Impact:** Cannot horizontally scale real-time connections
- **Symptom:** All users connect to single server instance
- **Workaround:** Current capacity sufficient for early stage
- **Timeline:** Redis-backed pub/sub Q2 2026

### Agent Workers Co-Located
- **Impact:** AI agent processing runs on same server as web app
- **Symptom:** High agent activity may impact user experience
- **Workaround:** QUIET_MODE flag to pause agents if needed
- **Timeline:** Separate worker infrastructure Q2 2026

---

## 6. Compliance

### No KYC/AML
- **Impact:** Cannot verify user identity
- **Symptom:** Cannot comply with financial regulations
- **Workaround:** Geographic restrictions, withdrawal limits
- **Timeline:** KYC for withdrawals >$10k Q1 2026

### No Geo-Blocking Live
- **Impact:** U.S. users can access prediction markets
- **Symptom:** Potential regulatory exposure
- **Workaround:** Terms of service restrictions
- **Timeline:** IP-based geo-blocking at launch

---

## 7. Content & Data

### No Content Moderation
- **Impact:** User-generated content not automatically moderated
- **Symptom:** Potential for spam, harassment, misinformation
- **Workaround:** Report functionality, manual moderation
- **Timeline:** AI content moderation Q1 2026

### Limited Data Backup Verification
- **Impact:** Backup integrity not regularly verified
- **Symptom:** Unknown restore reliability
- **Workaround:** Managed database provider handles backups
- **Timeline:** Backup verification procedures Q1 2026

---

## 8. User Experience

### No Mobile App
- **Impact:** Mobile users must use web browser
- **Symptom:** Suboptimal mobile experience for streaming
- **Workaround:** PWA support for home screen installation
- **Timeline:** Native app considered for 2026 roadmap

### No Offline Support
- **Impact:** Platform requires internet connection
- **Symptom:** No cached content for offline viewing
- **Workaround:** PWA caches static assets
- **Timeline:** Offline mode not prioritized

---

## 9. Avatar System

### 17 Avatars Only
- **Impact:** Limited diversity of AI personalities
- **Symptom:** Users may want more variety
- **Workaround:** Avatars cover major crypto sectors
- **Timeline:** Additional avatars based on user demand
- **Note:** Earlier documentation mentioned 35 avatars; 17 are LIVE, 18 more planned

### No Custom User Avatars
- **Impact:** Users cannot create personal AI avatars
- **Symptom:** Limited personalization
- **Workaround:** Interact with existing Knowledge Avatars
- **Timeline:** Custom avatar creator explored for 2026

---

## 10. API & Integrations

### Third-Party API Dependencies
| API | Risk | Mitigation |
|-----|------|------------|
| OpenAI | Rate limits, price changes | GPT-4o-mini for cost control, PAUSE flag |
| CoinGecko | Rate limits (30/min free tier) | Pro tier, aggressive caching |
| CoinMarketCap | API quota limits | Fallback to CoinGecko |
| Dune Analytics | Query rate limits | Scheduled queries, caching |

### No API for Third Parties
- **Impact:** External developers cannot integrate
- **Symptom:** No public API documentation
- **Workaround:** Internal API used by frontend
- **Timeline:** Public API v1 considered for 2026

---

## Summary Table

| Category | Issue | Severity | Timeline |
|----------|-------|----------|----------|
| Streaming | No TURN | High | Q1 2026 |
| Streaming | P2P cap 50 | Medium | Q2 2026 |
| Streaming | No replays | Low | Q2 2026 |
| Markets | Off-chain only | Medium | Q2 2026 |
| Markets | No UMA | Medium | Q2 2026 |
| Security | No 2FA | High | Q1 2026 |
| Security | Rate limiting | High | Q1 2026 |
| Compliance | No KYC | High | Q1 2026 |
| Compliance | No geo-block | High | Launch |
| Infra | Single WS server | Medium | Q2 2026 |

---

## Risk Acknowledgment

This document represents an honest assessment of current platform limitations. All timelines are estimates and subject to change based on:
- Development resources
- User feedback and priorities
- Regulatory requirements
- Market conditions

The StreamAiX team is committed to addressing these limitations in priority order based on user impact and regulatory requirements.
