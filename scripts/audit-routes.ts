#!/usr/bin/env tsx
/**
 * Route Security Audit Script
 *
 * Parses server/routes.ts, extracts every Express route registration,
 * inspects its middleware chain, classifies it, and emits:
 *
 *   1) docs/SECURITY_ROUTE_INVENTORY.md — full per-route inventory table
 *   2) An exit-code-driven verification of the security policy:
 *
 *        - Every mutation (POST/PUT/PATCH/DELETE) must be authenticated
 *          OR explicitly allowlisted as a documented public endpoint.
 *        - Every endpoint matching /admin/ must use requireAdmin (or
 *          requireAdminFlexible) AND authenticateToken.
 *        - Every endpoint that calls OpenAI / TTS / Whisper must use
 *          a rate limiter.
 *        - Every body-consuming POST should have either validateBody()
 *          or validateRequest() (warn-only — Zod adoption is incremental).
 *
 * Run: `npx tsx scripts/audit-routes.ts`
 *      `npx tsx scripts/audit-routes.ts --strict`  (fails on warnings)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

const ROUTES_FILE = resolve(process.cwd(), 'server/routes.ts');
const OUTPUT_FILE = resolve(process.cwd(), 'docs/SECURITY_ROUTE_INVENTORY.md');

const PUBLIC_ALLOWLIST = new Set<string>([
  // Health / diagnostic
  'GET /api/health',
  'GET /api/diagnostic-probe-v2',
  // Public auth surface (rate-limited, validated)
  'POST /api/auth/register',
  'POST /api/auth/login',
  'POST /api/auth/wallet-login',
  'POST /api/auth/twitter',
  'POST /api/auth/twitter/callback',
  'GET /api/auth/twitter',
  'GET /api/auth/twitter/callback',
  // Public reads
  'GET /api/avatars',
  'GET /api/prediction-markets',
  'GET /api/prediction-markets/trending',
  // Public newsletter signup (rate-limited)
  'POST /api/waitlist',
  'POST /api/newsletter/subscribe',
  // Public webhook receivers (must self-authenticate via signature)
  // (none currently)

  // Auth flow helpers (must be reachable before the user has a token)
  'POST /api/auth/twitter/verify',
  'POST /api/web3/nonce',

  // Read-only computations (rate-limit-eligible follow-up)
  'POST /api/charts/compare',
  'POST /api/prediction-markets/:marketId/quote-buy',

  // Anonymous analytics — no PII written, used by the SDK before login
  'POST /api/interactions/track',
  'POST /api/recommendations/track-click',
  'POST /api/bounties/:id/track',

  // Token-authenticated via URL parameter (one-time email link)
  'POST /api/waitlist/unsubscribe/:token',

  // Test endpoints — gated by disableInProd middleware (404 in production)
  'POST /api/test-post-simple',
  'POST /api/test-post-echo',
]);

// AI-heavy patterns are matched against the path AFTER stripping :params,
// so they won't false-positive on parameter names like ":summaryId".
// These match VERB / ACTION endpoints that synchronously call OpenAI / TTS /
// Whisper, NOT noun namespaces like /summaries/:id/like or /predictions/:id/vote.
const AI_HEAVY_PATTERNS = [
  /\/openai\b/i,
  /\/tts\b/i,
  /\/whisper\b/i,
  /\/transcrib/i,
  /\/generate-/i, // generate-markets, generate-summary, generate-audio, generate-replay-audio
  /\/backfill-?ai\b/i,
  /\/extract-?predictions?\b/i,
  /\/predict(?:\/|$)/i, // /predict at end OR /predict/:param prefix segment
  /\/predictions(?:$|\/create$)/i, // POST /predictions, POST /predictions/create
  /\/process$/i, // /summaries/_/process (AI re-process)
  /\/commentary(?:$|\/start$)/i,
  /\/analyze-?content/i,
  /\/summaries$/i, // POST /api/summaries triggers AI processing
  /\/convert-to-market$/i, // creates market via AI from prediction
  /\/conversation\/transcribe/i,
];

// High-risk mutation patterns: STREAM-spending, on-chain writes, financial txns
const HIGH_RISK_PATTERNS = [
  /\/trade\b/i,
  /\/buy\b/i,
  /\/sell\b/i,
  /\/bid\b/i,
  /\/wager\b/i,
  /\/mint\b/i,
  /\/spend\b/i,
  /\/transfer\b/i,
  /\/payout\b/i,
  /\/settle\b/i,
  /\/claim\b/i,
  /\/withdraw\b/i,
  /\/deposit\b/i,
  /\/redeem\b/i,
  /\/commit-?buy\b/i,
  /\/points\b/i,
  /\/reward/i,
  /\/payment/i,
  /\/wallet/i,
  /\/stake\b/i,
];

interface Route {
  method: string;
  path: string;
  line: number;
  middlewareSrc: string;
  hasAuth: boolean;
  hasOptionalAuth: boolean;
  hasRequireAdmin: boolean;
  hasRequireAdminFlexible: boolean;
  hasRateLimit: boolean;
  hasValidateBody: boolean;
  hasValidateRequest: boolean;
  isMutation: boolean;
  isAdminPath: boolean;
  isAiHeavy: boolean;
  isHighRisk: boolean;
}

const src = readFileSync(ROUTES_FILE, 'utf8');
const lines = src.split('\n');

const routes: Route[] = [];

const routeRe = /app\.(get|post|put|patch|delete)\s*\(\s*["'`]([^"'`]+)["'`]\s*,?/i;

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(routeRe);
  if (!m) continue;
  const method = m[1].toUpperCase();
  const path = m[2];
  // Capture this line + next ~3 for the full middleware chain (until first `{` of handler body or `=>`)
  const window = lines.slice(i, Math.min(i + 4, lines.length)).join(' ');
  const middlewareSrc = window.slice(0, window.indexOf('asyncHandler') + 12);

  routes.push({
    method,
    path,
    line: i + 1,
    middlewareSrc,
    hasAuth: /\bauthenticateToken\b/.test(middlewareSrc),
    hasOptionalAuth: /\boptionalAuth\b/.test(middlewareSrc),
    hasRequireAdmin: /\brequireAdmin\b/.test(middlewareSrc),
    hasRequireAdminFlexible: /\brequireAdminFlexible\b/.test(middlewareSrc),
    hasRateLimit: /\b(strictLimit|mediumLimit|looseLimit|signupLimit|authLimit)\b/.test(
      middlewareSrc,
    ),
    hasValidateBody: /\bvalidateBody\s*\(/.test(middlewareSrc),
    hasValidateRequest: /\bvalidateRequest\s*\(/.test(
      // validateRequest is called inside the handler, not in the chain — scan a wider window
      lines.slice(i, Math.min(i + 30, lines.length)).join('\n'),
    ),
    // Strip route params (":foo") so pattern matching only sees real path
    // segments — prevents false positives like ":summaryId" hitting /summary/.
    isMutation: ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method),
    isAdminPath: /\/admin\//i.test(path),
    isAiHeavy: AI_HEAVY_PATTERNS.some((re) => re.test(path.replace(/:\w+/g, '_'))),
    isHighRisk: HIGH_RISK_PATTERNS.some((re) => re.test(path.replace(/:\w+/g, '_'))),
  });
}

interface Issue {
  severity: 'error' | 'warn';
  category: string;
  route: string;
  detail: string;
}

const issues: Issue[] = [];

for (const r of routes) {
  const key = `${r.method} ${r.path}`;
  const isPublic = PUBLIC_ALLOWLIST.has(key);

  // 1. Mutation endpoints must require auth (unless allowlisted public)
  if (r.isMutation && !r.hasAuth && !isPublic) {
    issues.push({
      severity: 'error',
      category: 'unauthenticated_mutation',
      route: key,
      detail: `Mutation endpoint without authenticateToken at line ${r.line}`,
    });
  }

  // 2. Admin paths must require admin AND auth
  if (r.isAdminPath) {
    if (!r.hasAuth) {
      issues.push({
        severity: 'error',
        category: 'admin_without_auth',
        route: key,
        detail: `/admin/ path without authenticateToken at line ${r.line}`,
      });
    }
    if (!r.hasRequireAdmin && !r.hasRequireAdminFlexible) {
      issues.push({
        severity: 'error',
        category: 'admin_without_admin_check',
        route: key,
        detail: `/admin/ path without requireAdmin at line ${r.line}`,
      });
    }
  }

  // 3. AI-heavy endpoints (mutations) MUST have a rate limiter
  if (r.isMutation && r.isAiHeavy && !r.hasRateLimit) {
    issues.push({
      severity: 'error',
      category: 'ai_endpoint_without_rate_limit',
      route: key,
      detail: `AI/heavy mutation missing rate limiter at line ${r.line}`,
    });
  }

  // 4. AI-heavy + high-risk (financial/STREAM-spending) mutations MUST validate body
  const needsStrictValidation =
    r.isMutation &&
    (r.isAiHeavy || r.isHighRisk || r.isAdminPath) &&
    !isPublic &&
    r.method !== 'DELETE' &&
    !r.hasValidateBody &&
    !r.hasValidateRequest;

  if (needsStrictValidation) {
    issues.push({
      severity: 'error',
      category: r.isAiHeavy
        ? 'ai_endpoint_without_validation'
        : r.isHighRisk
        ? 'high_risk_without_validation'
        : 'admin_without_validation',
      route: key,
      detail: `High-risk mutation missing Zod body validation at line ${r.line}`,
    });
  }

  // 5. High-risk mutations should also be rate-limited (error)
  if (r.isMutation && r.isHighRisk && !r.hasRateLimit && !isPublic) {
    issues.push({
      severity: 'error',
      category: 'high_risk_without_rate_limit',
      route: key,
      detail: `High-risk financial mutation missing rate limiter at line ${r.line}`,
    });
  }

  // 6. Other body-consuming mutations should validate (warn — incremental adoption)
  if (
    r.isMutation &&
    !r.hasValidateBody &&
    !r.hasValidateRequest &&
    !isPublic &&
    !r.isAiHeavy &&
    !r.isHighRisk &&
    !r.isAdminPath &&
    r.method !== 'DELETE'
  ) {
    issues.push({
      severity: 'warn',
      category: 'mutation_without_body_validation',
      route: key,
      detail: `No Zod body validation at line ${r.line}`,
    });
  }
}

// Categorize each route for the inventory
function categorize(r: Route): string {
  if (r.isAdminPath) return 'admin';
  if (PUBLIC_ALLOWLIST.has(`${r.method} ${r.path}`)) return 'public-allowlisted';
  if (r.isAiHeavy) return 'ai-heavy';
  if (r.isMutation) return 'authenticated-mutation';
  return 'read';
}

function decision(r: Route): string {
  const layers: string[] = [];
  if (r.hasAuth) layers.push('auth');
  if (r.hasOptionalAuth && !r.hasAuth) layers.push('opt-auth');
  if (r.hasRequireAdmin || r.hasRequireAdminFlexible) layers.push('admin');
  if (r.hasRateLimit) layers.push('rate-limit');
  if (r.hasValidateBody) layers.push('zod-body');
  if (r.hasValidateRequest) layers.push('zod-inline');
  if (PUBLIC_ALLOWLIST.has(`${r.method} ${r.path}`)) layers.push('public-OK');
  return layers.length ? layers.join('+') : '(none)';
}

// Build the markdown inventory
const totals = {
  total: routes.length,
  byMethod: {} as Record<string, number>,
  byCategory: {} as Record<string, number>,
  authed: routes.filter((r) => r.hasAuth).length,
  rateLimited: routes.filter((r) => r.hasRateLimit).length,
  validated: routes.filter((r) => r.hasValidateBody || r.hasValidateRequest).length,
};
for (const r of routes) {
  totals.byMethod[r.method] = (totals.byMethod[r.method] || 0) + 1;
  const cat = categorize(r);
  totals.byCategory[cat] = (totals.byCategory[cat] || 0) + 1;
}

const issueErrors = issues.filter((i) => i.severity === 'error');
const issueWarns = issues.filter((i) => i.severity === 'warn');

const md: string[] = [];
md.push('# Route Security Inventory');
md.push('');
md.push(`Generated by \`scripts/audit-routes.ts\` on ${new Date().toISOString()}.`);
md.push('');
md.push('## Totals');
md.push('');
md.push(`- **Total routes:** ${totals.total}`);
md.push(`- **Authenticated:** ${totals.authed}`);
md.push(`- **Rate-limited:** ${totals.rateLimited}`);
md.push(`- **Body-validated (Zod):** ${totals.validated}`);
md.push('');
md.push('### By method');
md.push('');
md.push('| Method | Count |');
md.push('|---|---|');
for (const [m, c] of Object.entries(totals.byMethod).sort()) {
  md.push(`| ${m} | ${c} |`);
}
md.push('');
md.push('### By category');
md.push('');
md.push('| Category | Count |');
md.push('|---|---|');
for (const [k, v] of Object.entries(totals.byCategory).sort()) {
  md.push(`| ${k} | ${v} |`);
}
md.push('');
md.push('## Policy verification');
md.push('');
md.push(`- **Errors:** ${issueErrors.length}`);
md.push(`- **Warnings:** ${issueWarns.length}`);
md.push('');
if (issueErrors.length) {
  md.push('### Errors');
  md.push('');
  md.push('| Severity | Category | Route | Detail |');
  md.push('|---|---|---|---|');
  for (const i of issueErrors) {
    md.push(`| ❌ | ${i.category} | \`${i.route}\` | ${i.detail} |`);
  }
  md.push('');
}
if (issueWarns.length) {
  md.push('### Warnings (informational — incremental adoption)');
  md.push('');
  md.push('| Category | Route | Detail |');
  md.push('|---|---|---|');
  for (const i of issueWarns) {
    md.push(`| ${i.category} | \`${i.route}\` | ${i.detail} |`);
  }
  md.push('');
}

md.push('## Full route inventory');
md.push('');
md.push('| # | Method | Path | Line | Category | Protection layers |');
md.push('|---|---|---|---|---|---|');
routes
  .sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method))
  .forEach((r, idx) => {
    md.push(
      `| ${idx + 1} | ${r.method} | \`${r.path}\` | ${r.line} | ${categorize(r)} | ${decision(r)} |`,
    );
  });

mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
writeFileSync(OUTPUT_FILE, md.join('\n') + '\n');

const strict = process.argv.includes('--strict');
console.log(`Routes: ${totals.total}`);
console.log(`Authenticated: ${totals.authed}`);
console.log(`Rate-limited: ${totals.rateLimited}`);
console.log(`Validated: ${totals.validated}`);
console.log(`Errors: ${issueErrors.length}`);
console.log(`Warnings: ${issueWarns.length}`);
console.log(`Inventory written to: ${OUTPUT_FILE}`);

if (issueErrors.length > 0) {
  console.error('\n❌ Security policy errors:');
  for (const i of issueErrors) {
    console.error(`  [${i.category}] ${i.route} — ${i.detail}`);
  }
  process.exit(1);
}
if (strict && issueWarns.length > 0) {
  console.error('\n⚠️  Strict mode: failing on warnings');
  process.exit(2);
}
process.exit(0);
