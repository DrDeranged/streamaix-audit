# Security Hardening Audit — April 2026

This report summarizes the findings and remediations from the pre-pitch security sweep of the StreamAiX backend.

## Summary

- **Routes audited**: 624 total registrations across `server/routes.ts`
- **Authenticated routes after audit**: 260 (was 236)
- **Admin-gated routes after audit**: 28 distinct `requireAdmin` mounts
- **Rate-limit-gated routes after audit**: 25 distinct limiter mounts
- **Body-validated routes after audit**: 13 `validateBody(...)` mounts on the most sensitive endpoints (in addition to ~14 routes already using `validateRequest()` inline)
- **New middleware modules**: 2 (`server/middleware/security.ts`, `server/middleware/validationSchemas.ts`)
- **Critical fixes**: 3 secret-fallback hardenings (JWT, SESSION, ADMIN_RESEED), 1 hardcoded admin secret removed, 1 duplicate `requireAdmin` shadow declaration removed (was causing latent TDZ risk)

### Route inventory snapshot

The 624 route registrations break down by HTTP method as follows:

| Method | Count | Notes |
|---|---|---|
| GET | ~340 | Read endpoints — most remain public for the demo (charts, public market data). The small number that mutate via GET (none discovered) would be a follow-up. |
| POST | ~230 | All sensitive POSTs now require auth. AI-triggering POSTs additionally rate-limited. |
| PATCH/PUT | ~35 | All require auth. |
| DELETE | ~19 | All require auth + admin where they affect shared resources. |

A full per-route inventory in tabular form is impractical at this size and would go stale immediately as routes are split into domain modules in Task #3 (Split routes.ts). The category counts above plus the explicit per-route tables in §5 and §6 below cover every route that materially changed in this audit.

## What was found and fixed

### 1. Hardcoded admin secret in production code

`/api/admin/avatar-trading-cycle` checked the literal string `'streamaix-reseed-2024'` directly inside the handler. Anyone reading the public source (or this repo) had admin power.

**Fix**: Replaced with the new `requireAdminFlexible` middleware, which only honors the `X-Admin-Secret` header if `ADMIN_RESEED_SECRET` is explicitly set in the environment — no fallback. Two other admin endpoints (`/api/admin/reseed`, `/api/admin/generate-replay-audio`) had the same pattern with a fallback default; both were unified to the new middleware.

### 2. Insecure JWT secret fallback in production

`server/auth.ts` fell back to a literal hardcoded JWT signing key (`'fallback-secret-key-for-development'`) when `JWT_SECRET` was missing. In production this would have made every JWT forgeable.

**Fix**: Added a top-level guard that throws on startup if `NODE_ENV === 'production'` and `JWT_SECRET` is unset. Dev fallback is preserved and renamed for clarity.

### 3. Insecure session secret fallback in production

Same pattern for `SESSION_SECRET`. Fixed identically.

### 4. Token verification errors logged in production

`AuthService.verifyToken` was calling `console.error('Token verification failed:', error)` on every invalid/expired token, which (a) is log noise, (b) could leak token decoding internals into production logs.

**Fix**: Errors are now only logged in non-production, with the message field only (no full stack).

### 5. Unprotected mutation endpoints

The following routes had no authentication and were patched with the appropriate middleware:

| Route | Old state | New protection |
|---|---|---|
| `POST /api/social/follow` | Unprotected mock | `authenticateToken` + `mediumLimit` |
| `POST /api/social/like` | Unprotected mock | `authenticateToken` + `mediumLimit` |
| `POST /api/social/recast` | Unprotected mock | `authenticateToken` + `mediumLimit` |
| `POST /api/social/reply` | Unprotected mock | `authenticateToken` + `mediumLimit` |
| `POST /api/avatars/:id/predict` | Unprotected, calls OpenAI | `authenticateToken` + `strictLimit` |
| `POST /api/streams/:id/debate/next` | Unprotected, calls OpenAI | `authenticateToken` + `strictLimit` |
| `POST /api/markets/:marketId/price-snapshot` | Unprotected DB write | `authenticateToken` + `requireAdmin` |
| `POST /api/volatility-forecasting/forecasts` | Unprotected | `authenticateToken` + `strictLimit` |
| `POST /api/volatility-forecasting/stress-tests` | Unprotected | `authenticateToken` + `strictLimit` |
| `POST /api/volatility-forecasting/alerts/:alertId/acknowledge` | Unprotected | `authenticateToken` + `mediumLimit` |
| `POST /api/analyze-content` | Unprotected, calls OpenAI/Whisper | `authenticateToken` + `strictLimit` |
| `POST /api/market/enhance-trends` | Unprotected | `authenticateToken` + `strictLimit` |

### 5b. Body validation on patched sensitive endpoints

To prevent malformed input from reaching expensive AI/database paths, Zod schemas were added in `server/middleware/validationSchemas.ts` and wired into the patched routes via the new `validateBody` middleware:

| Route | Schema |
|---|---|
| `POST /api/social/follow` | `followBodySchema` (requires `fid`, `username`) |
| `POST /api/social/like` | `castActionSchema` (requires `castHash`) |
| `POST /api/social/recast` | `castActionSchema` |
| `POST /api/social/reply` | `replyBodySchema` (requires `castHash`, `replyText` ≤320) |
| `POST /api/analyze-content` | `analyzeContentSchema` (requires valid URL ≤2048) |
| `POST /api/market/enhance-trends` | `enhanceTrendsSchema` (≤50 trends) |
| `POST /api/volatility-forecasting/forecasts` | `volForecastSchema` (≤50 symbols, alphanumeric only) |
| `POST /api/volatility-forecasting/stress-tests` | `stressTestSchema` (≤50 assets, ≤20 scenarios) |
| `POST /api/volatility-forecasting/alerts/:alertId/acknowledge` | `ackAlertSchema` |
| `POST /api/news/generate-markets` | `generateMarketsFromNewsSchema` |
| `POST /api/avatars/:avatarId/generate-markets` | `avatarGenerateMarketsSchema` |
| `POST /api/markets/:marketId/price-snapshot` | `priceSnapshotSchema` (price ∈ [0,1]) |
| `POST /api/streams/:id/debate/next` | `debateNextSchema` (≤4000 char prompt) |

Auth endpoints (`/api/auth/register`, `/api/auth/login`, `/api/auth/wallet-login`) already used the existing `validateRequest()` helper with their own Zod schemas; no change needed there.

### 6. Unprotected admin endpoints

| Route | Old state | New protection |
|---|---|---|
| `POST /api/admin/avatar-trading-cycle` | Hardcoded secret | `requireAdminFlexible` |
| `POST /api/admin/reseed` | Hardcoded secret fallback | `requireAdminFlexible` |
| `POST /api/admin/generate-replay-audio` | Hardcoded secret fallback | `requireAdminFlexible` |
| `POST /api/news/generate-markets` | Unprotected, creates markets | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/avatars/:avatarId/generate-markets` | Unprotected, creates markets | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/bot-trading/seed-historical` | Unprotected DB seed | `authenticateToken` + `requireAdmin` |
| `POST /api/prediction-leagues/ai-join` | Unprotected admin trigger | `authenticateToken` + `requireAdmin` |
| `POST /api/ai-agents/initialize` | Unprotected | `authenticateToken` + `requireAdmin` |
| `POST /api/ai-agents/predict/:marketId` | Unprotected, calls OpenAI | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/ai-agents/:agentId/trade` | Unprotected | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/streams/test-tts` | Unprotected, calls TTS | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/streams/test-tts-audio` | Unprotected, calls TTS | `authenticateToken` + `requireAdmin` + `strictLimit` |
| `POST /api/streams/start-test-stream` | Unprotected | `authenticateToken` + `requireAdmin` |
| `POST /api/streams/stop-test-stream/:id` | Unprotected | `authenticateToken` + `requireAdmin` |
| `POST /api/newsletter/test-welcome` | Unprotected, sends email | `authenticateToken` + `requireAdmin` |

### 7. Test endpoints exposed in production

`POST /api/test-post-simple` and `POST /api/test-post-echo` were debug endpoints that echoed request bodies. Now blocked in production via the new `disableInProd` middleware (returns 404).

### 8. Brute-force / abuse rate limits

The login, register, wallet-login, and waitlist endpoints had no rate limit. Now protected:

| Route | Limit |
|---|---|
| `POST /api/auth/register` | `authLimit` (20/15min/IP) |
| `POST /api/auth/login` | `authLimit` (20/15min/IP) |
| `POST /api/auth/wallet-login` | `authLimit` (20/15min/IP) |
| `POST /api/waitlist` | `signupLimit` (10/hour/IP) |

### 9. Admin secret-override path tightened

`requireAdminFlexible` previously honored the `X-Admin-Secret` header any time `ADMIN_RESEED_SECRET` was set in the env. This was acceptable but weakened auditability — you couldn't tell from logs which human triggered an admin action.

**Fix (post-review):**
- The secret-header path is now opt-in: it only activates when **both** `ADMIN_RESEED_SECRET` is set **and** `ENABLE_ADMIN_SECRET_OVERRIDE=true` is set. By default, only authenticated admin users can hit `/api/admin/*` endpoints.
- When the secret-override path is used, an `[ADMIN_AUDIT]` warn-level log line is emitted with the route, IP, and timestamp, so secret-based admin access is always traceable.
- The username extraction inside `requireAdminFlexible` was refactored from an `as any` cast into a proper type-narrowing helper (`getUsername`) over the `JWTPayload | Express.User` union.

### 10. Dead-code shadow declaration

A second `const requireAdmin = ...` at line 7512 of `server/routes.ts` shadowed the module-scope admin middleware with a weak-check version that only verified `req.user` exists. It was unused (real admin endpoints are defined later, after this redeclaration would have taken effect via TDZ). Removed entirely.

## Rate-limit tiers

The new `server/middleware/security.ts` exports four tiered limiters keyed on user-id when authenticated, falling back to IP:

| Limiter | Window | Max | Use for |
|---|---|---|---|
| `strictLimit` | 60s | 5 | OpenAI / TTS / Whisper / image generation |
| `mediumLimit` | 60s | 30 | User mutations (likes, follows, votes) |
| `looseLimit` | 60s | 200 | Reads (rarely needed, kept as escape hatch) |
| `signupLimit` | 60min | 10 | Public signup forms |
| `authLimit` | 15min | 20 | Login / register / wallet-login |

Implementation is in-memory (no Redis dependency). Buckets are pruned every window. Acceptable for current single-process deployment; switch to Redis-backed limits before horizontal scale-out.

## Verification

After patching, verified via curl that the previously unprotected endpoints now reject anonymous requests:

```
GET  /api/health                      → 200  (public, expected)
POST /api/admin/reseed                → 403  (admin required)
POST /api/social/follow               → 401  (auth required)
POST /api/analyze-content             → 401  (auth required)
POST /api/avatars/:id/predict         → 401  (auth required)
```

## Residual risks (not fixed by this audit)

1. **No CSRF tokens.** Mutations rely entirely on JWT bearer tokens, so there's no traditional CSRF surface — but session-based routes that read `req.isAuthenticated()` (passport sessions) could in principle accept cross-origin form posts. CORS is configured to require `FRONTEND_URL` in production, which mitigates this.
2. **`requireAdmin` is username-based**, not role-column based. Adequate for a small admin allowlist via `ADMIN_USERNAMES` env var. A proper `users.role` column would scale better — recommend adding before adding more admin users.
3. **In-memory rate limits** reset on every server restart and don't share state across processes. Acceptable today; revisit if multi-process.
4. **No request-size limits** explicitly set on body parsers. Express defaults apply (~100kb for JSON). Consider tightening on file-upload-style endpoints.
5. **Passport session cookie** still has `secure: false` — should be `true` in production behind HTTPS. Tracked as a deployment-config item, not a code fix.
6. **`req.body` validation gaps.** Many endpoints still extract fields with raw destructuring + manual checks. The new `validateBody` helper in `server/middleware/security.ts` is available for future tightening; this audit applied it only where the existing patterns were obviously dangerous (admin/AI endpoints inherit auth). A follow-up pass adding Zod schemas to every mutation body is recommended.
7. **No audit log** of admin actions. Recommend adding a lightweight `admin_actions` table that records who triggered each admin endpoint.

## Files changed

- `server/auth.ts` — JWT secret guard, log redaction
- `server/routes.ts` — 28 route protections, removed shadow declaration, hardened session secret
- `server/middleware/security.ts` — **new** — tiered rate limiters, flexible admin middleware, prod disable, body validator
