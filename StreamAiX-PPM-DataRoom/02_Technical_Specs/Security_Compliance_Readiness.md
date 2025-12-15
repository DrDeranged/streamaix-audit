# Security & Compliance Readiness Specification

**Document Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** PARTIALLY IMPLEMENTED | KYC/AML PLANNED

---

## 1. Authentication Methods

### Live Authentication Methods

| Method | Status | Implementation |
|--------|--------|----------------|
| Email/Password | LIVE | bcrypt hashing, 12 rounds |
| Twitter OAuth | LIVE | Passport.js, OAuth 1.0a |
| MetaMask Wallet | LIVE | ethers.js signature verification |
| Google OAuth | PLANNED | Passport.js |
| 2FA/MFA | NOT IMPLEMENTED | PLANNED Q1 2026 |

### Password Security
```typescript
// Password hashing with bcrypt
const SALT_ROUNDS = 12;
const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

// Password verification
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

### Password Requirements
| Requirement | Value |
|-------------|-------|
| Minimum length | 8 characters |
| Complexity | No requirement (planned) |
| Expiration | None |
| History | None |

---

## 2. Session Management

### Session Implementation
```typescript
// express-session configuration
app.use(session({
  store: new PostgresStore({ pool }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax'
  }
}));
```

### Session Parameters
| Parameter | Value |
|-----------|-------|
| Storage | PostgreSQL (connect-pg-simple) |
| Duration | 7 days |
| Renewal | On activity |
| HTTP Only | Yes |
| Secure (prod) | Yes |
| SameSite | Lax |

---

## 3. JWT Strategy

### JWT Usage
| Use Case | Implementation |
|----------|----------------|
| API authentication | Bearer token in Authorization header |
| WebSocket auth | Token in connection query params |
| Refresh tokens | NOT IMPLEMENTED |

### JWT Configuration
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '24h';

// Token generation
const token = jwt.sign(
  { userId: user.id, wallet: user.walletAddress },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRY }
);

// Token verification
const decoded = jwt.verify(token, JWT_SECRET);
```

### Known Risks
1. **No refresh token rotation** - Long-lived tokens if compromised
2. **No token revocation list** - Cannot invalidate tokens before expiry
3. **Secret rotation** - No automated secret rotation

---

## 4. Rate Limiting

### Current Status: PARTIALLY IMPLEMENTED

### Rate Limiting Plan

| Endpoint Category | Limit | Status |
|------------------|-------|--------|
| Auth endpoints (login/register) | 5/minute/IP | PLANNED |
| API endpoints | 100/minute/user | PLANNED |
| WebSocket messages | 60/minute/connection | PARTIALLY LIVE |
| Market trades | 10/minute/user | LIVE |
| Bounty submissions | 5/hour/user | LIVE |

### WebSocket Rate Limiting (Live)
```typescript
const MESSAGE_RATE_LIMIT = 60; // per minute
const messageCount = new Map<string, number>();

ws.on('message', (msg) => {
  const count = messageCount.get(ws.userId) || 0;
  if (count > MESSAGE_RATE_LIMIT) {
    ws.send(JSON.stringify({ error: 'Rate limit exceeded' }));
    return;
  }
  messageCount.set(ws.userId, count + 1);
});
```

### Planned Implementation
- Use `express-rate-limit` for HTTP endpoints
- Redis-backed rate limiting for distributed deployment
- Graduated penalties for repeat offenders

---

## 5. WebSocket Authentication

### Authentication Requirement: YES

| Channel Type | Auth Required | Access Level |
|--------------|---------------|--------------|
| Public streams | No | Read-only (video, chat) |
| Private streams | Yes | Full interaction |
| Market data | No | Read-only |
| Trading actions | Yes | Requires auth |
| Chat posting | Yes | Requires auth |
| Admin channels | Yes | Admin role required |

### WebSocket Auth Flow
```typescript
wss.on('connection', (ws, req) => {
  const token = req.url?.split('token=')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      ws.userId = decoded.userId;
      ws.isAuthenticated = true;
    } catch (e) {
      ws.isAuthenticated = false;
    }
  } else {
    ws.isAuthenticated = false;
  }
});
```

### Unauthenticated Access
Unauthenticated WebSocket connections can:
- View public stream video/audio
- Read chat messages
- Receive market price updates

Cannot:
- Post chat messages
- Execute trades
- Create content

---

## 6. Data Collection & Retention

### Data Collected

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Email addresses | Account identification | Permanent |
| Wallet addresses | Web3 authentication | Permanent |
| Twitter OAuth tokens | Social login | Until revoked |
| Watch history | Personalization | 90 days |
| Chat messages | User content | 30 days |
| IP addresses | Security/fraud | 7 days |
| Trade history | Platform records | Permanent |
| Bounty submissions | Platform content | Permanent |
| Session data | Authentication | 7 days |

### Data Minimization
- No SSN or government IDs collected (until KYC)
- No financial account numbers
- No physical addresses
- No biometric data

### User Data Rights (Planned)
- Export personal data
- Delete account and data
- Opt-out of tracking
- Access data collected

---

## 7. Storage Security

### Database Encryption

| Layer | Status | Implementation |
|-------|--------|----------------|
| At-rest encryption | YES | Managed DB provider default |
| In-transit encryption | YES | TLS 1.3 |
| Field-level encryption | NO | Not implemented |
| Backup encryption | YES | Managed DB provider |

### Secret Management

| Secret Type | Storage | Access |
|-------------|---------|--------|
| API keys | Environment variables | Server-side only |
| JWT secret | Environment variable | Server-side only |
| Database URL | Environment variable | Server-side only |
| OAuth secrets | Environment variables | Server-side only |

### Secrets NOT Exposed
- No secrets in frontend code
- No secrets in git repository
- No secrets in logs
- No secrets in error messages

---

## 8. Geo-Blocking Plan

### Prediction Markets: U.S. DISABLED AT LAUNCH

| Feature | U.S. Users | Non-U.S. Users |
|---------|------------|----------------|
| Prediction market trading | BLOCKED | ALLOWED |
| Market viewing | ALLOWED | ALLOWED |
| Live streaming | ALLOWED | ALLOWED |
| Bounties | ALLOWED | ALLOWED |
| Tips | ALLOWED | ALLOWED |
| Chat | ALLOWED | ALLOWED |

### Implementation Plan
```typescript
const isUSUser = (req: Request): boolean => {
  const ip = req.ip;
  const country = geoip.lookup(ip)?.country;
  return country === 'US';
};

// Block prediction market trades for US users
app.post('/api/markets/:id/trade', (req, res) => {
  if (isUSUser(req)) {
    return res.status(403).json({ 
      error: 'Prediction market trading not available in your region' 
    });
  }
  // ... proceed with trade
});
```

### Geo-IP Provider
Planned: MaxMind GeoIP2 or similar

### Limitations
- VPN users can bypass geo-blocking
- Not legally binding compliance
- Additional measures may be required

---

## 9. KYC/AML Plan

### Status: NOT IMPLEMENTED

### Timeline: Q1 2026 (Pre-Launch)

### KYC Requirements

| Threshold | Requirement |
|-----------|-------------|
| Withdrawals < $1,000 | None |
| Withdrawals $1,000 - $10,000 | Basic ID verification |
| Withdrawals > $10,000 | Full KYC (ID + address + source of funds) |

### KYC Provider (Planned)
Options under evaluation:
- Jumio
- Onfido
- Sumsub
- Persona

### AML Monitoring (Planned)
- Transaction monitoring for suspicious patterns
- Wallet screening against OFAC/sanction lists
- Reporting for large transactions

---

## 10. Compliance Disclosures

### In-Product Disclaimers

| Disclaimer | Location |
|------------|----------|
| "Not financial advice" | Market pages, avatar responses |
| "AI-generated content" | Avatar streams, agent content |
| "Risk of loss" | Trading pages |
| "No guarantee of returns" | Market pages |
| "Platform beta" | Global footer |

### Legal Documents (Planned)
- Terms of Service
- Privacy Policy
- Risk Disclosure
- Cookie Policy
- Acceptable Use Policy

---

## 11. Security Checklist

### Implemented
- [x] Password hashing (bcrypt)
- [x] HTTPS in production
- [x] HTTP-only cookies
- [x] Session-based auth
- [x] JWT for API/WebSocket
- [x] Input validation (Zod)
- [x] SQL injection prevention (Drizzle ORM)
- [x] WebSocket authentication
- [x] Database encryption at rest

### Partially Implemented
- [ ] Rate limiting (some endpoints)
- [ ] CORS configuration (default)

### Not Implemented (Planned)
- [ ] 2FA/MFA
- [ ] Auth endpoint rate limiting
- [ ] Token refresh rotation
- [ ] Token revocation
- [ ] Full audit logging
- [ ] Security headers (helmet.js)
- [ ] CSRF protection
- [ ] Content Security Policy
- [ ] Penetration testing

---

## 12. Incident Response

### Planned Response Process
1. Detection (monitoring alerts)
2. Containment (pause affected systems)
3. Investigation (log analysis)
4. Remediation (patch/fix)
5. Notification (users if data affected)
6. Post-mortem (documentation)

### Contact Points (Planned)
- Security team email
- Bug bounty program
- Responsible disclosure policy

---

## Summary

StreamAiX authentication is **LIVE** with email/password (bcrypt), Twitter OAuth, and MetaMask wallet signing. Sessions are PostgreSQL-backed with 7-day duration. Rate limiting is **PARTIALLY IMPLEMENTED**. WebSocket requires authentication for posting/trading but allows read-only access for public streams. KYC/AML is **PLANNED** for Q1 2026. Geo-blocking for U.S. prediction market trading is **PLANNED** for launch. 2FA is **NOT IMPLEMENTED**. All data storage uses managed provider encryption at rest.
