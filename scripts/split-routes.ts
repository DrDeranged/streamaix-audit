#!/usr/bin/env tsx
/**
 * Codemod: split server/routes.ts into per-domain modules under server/routes/.
 *
 * Strategy:
 *   1. Read server/routes.ts and the section-header inventory below.
 *   2. For each section, slice the lines [start..end-1] (where `end` is the
 *      line of the next section header), and write them into
 *      server/routes/<slug>.ts wrapped in
 *        export function register<Camel>Routes(app: Express): void { ... }
 *      Each generated module re-imports the same kitchen-sink set the
 *      monolith uses so route bodies compile unchanged. TypeScript's
 *      `noUnusedLocals` is disabled in the project tsconfig (verified), so
 *      unused imports do not break the build.
 *   3. Replace the original section in routes.ts with a single registrar call.
 *   4. Insert the registrar imports at the top of routes.ts.
 *   5. Move local helpers (`validateRequest`, `asyncHandler`, `requireAdmin`,
 *      `isAdmin`, `ADMIN_USERNAMES`) out of routes.ts (already done in
 *      server/routes/_shared.ts) and re-import them.
 *
 * Idempotent: re-running detects the registrar marker and skips.
 *
 * To add or adjust the cut points, edit SECTIONS below.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROUTES_PATH = resolve(process.cwd(), 'server/routes.ts');
const OUT_DIR = resolve(process.cwd(), 'server/routes');

interface Section {
  /** kebab-case file basename (no .ts) */
  slug: string;
  /** PascalCase used in `register<Camel>Routes` */
  camel: string;
  /** 1-indexed line of the `// === SECTION ===` header (or its banner-comment block start) */
  startLine: number;
  /** 1-indexed exclusive end (line of the next section header) */
  endLine: number;
}

// Cut points discovered via grep -nE on the section-header banners.
// Each `startLine` is the FIRST line of the 3-line `// ===` banner so the
// banner itself is moved to the new module.
const SECTIONS: Section[] = [
  { slug: 'auth',                 camel: 'Auth',                startLine: 211,   endLine: 563 },
  { slug: 'points',               camel: 'Points',              startLine: 563,   endLine: 724 },
  { slug: 'users',                camel: 'Users',               startLine: 724,   endLine: 805 },
  { slug: 'summaries',            camel: 'Summaries',           startLine: 805,   endLine: 980 },
  { slug: 'referrals',            camel: 'Referrals',           startLine: 980,   endLine: 1131 },
  { slug: 'social-feed',          camel: 'SocialFeed',          startLine: 1131,  endLine: 1210 },
  { slug: 'follow',               camel: 'Follow',              startLine: 1210,  endLine: 1426 },
  { slug: 'bounties',             camel: 'Bounties',            startLine: 1426,  endLine: 2077 },
  { slug: 'collaboration',        camel: 'Collaboration',       startLine: 2077,  endLine: 2146 },
  { slug: 'bounty-templates',     camel: 'BountyTemplates',     startLine: 2146,  endLine: 2226 },
  { slug: 'knowledge-stack',      camel: 'KnowledgeStack',      startLine: 3488,  endLine: 3563 },
  { slug: 'user-notes',           camel: 'UserNotes',           startLine: 3563,  endLine: 3667 },
  { slug: 'chat',                 camel: 'Chat',                startLine: 3667,  endLine: 3728 },
  { slug: 'twitter-x',            camel: 'TwitterX',            startLine: 3976,  endLine: 4118 },
  { slug: 'trending-crypto',      camel: 'TrendingCrypto',      startLine: 4118,  endLine: 4223 },
  { slug: 'youtube',              camel: 'Youtube',             startLine: 4223,  endLine: 4276 },
  { slug: 'waitlist',             camel: 'Waitlist',            startLine: 12737, endLine: 14018 },
  { slug: 'push-notifications',   camel: 'PushNotifications',   startLine: 14018, endLine: 14400 },
  { slug: 'portfolio-goals',      camel: 'PortfolioGoals',      startLine: 18897, endLine: 19015 },
  { slug: 'portfolio-news',       camel: 'PortfolioNews',       startLine: 19015, endLine: 19256 },
  { slug: 'portfolio-correlations', camel: 'PortfolioCorrelations', startLine: 19256, endLine: 19314 },
  { slug: 'price-alerts',         camel: 'PriceAlerts',         startLine: 19314, endLine: 19757 },
];

// Re-import the same imports the monolith uses so the route bodies compile
// unchanged. This is intentionally a kitchen-sink list — TypeScript will
// tree-shake unused names at bundle time and the project tsconfig does not
// fail on unused imports.
const MODULE_PRELUDE = `import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  signupLimit,
  authLimit,
  requireAdminFlexible,
  disableInProd,
  validateBody,
} from "../middleware/security";
import * as schemas from "../middleware/validationSchemas";
import {
  followBodySchema,
  castActionSchema,
  replyBodySchema,
  analyzeContentSchema,
  enhanceTrendsSchema,
  volForecastSchema,
  stressTestSchema,
  ackAlertSchema,
  generateMarketsFromNewsSchema,
  avatarGenerateMarketsSchema,
  priceSnapshotSchema,
  debateNextSchema,
  avatarPredictSchema,
  testTtsSchema,
  testTtsAudioSchema,
  generateReplayAudioSchema,
  emptyBodySchema,
  streamWatchSchema,
  voiceConversationSchema,
  bountyClaimSchema,
  summaryProcessSchema,
  forceRefreshSchema,
  botStakeSchema,
  botWithdrawSchema,
  predictionMarketTradeSchema,
  aiAgentTradeSchema,
  streamPredictionSchema,
  convertToMarketSchema,
  transcribeSchema,
  channelPointsRedeemSchema,
} from "../middleware/validationSchemas";
import { cacheService } from "../services/cacheService";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { youtubeService } from "../services/youtubeService";
import { trendingService } from "../services/trendingService";
import { pointsService } from "../services/pointsService";
import { bountyHunterService } from "../services/bountyHunterService";
import { qualityScorerService } from "../services/qualityScorerService";
import { db } from "../db";
import * as schema from "../../shared/schema";
import {
  predictionMarkets, aiAgents, aiPredictions, aiPositions, aiTrades, users, userInteractions,
  predictionLeagues, leagueParticipants, leagueTrades, marketTrades, pushSubscriptions,
  liveStreams, streamParticipants, streamMessages, streamTips, streamPredictions,
  streamPolls, streamPollVotes, streamReactions, streamScheduleReminders, streamClips,
  streamRecordings, streamAchievements, userStreamAchievements, streamChatCommands,
  streamChatCommandLogs, streamViewerLeaderboard, knowledgeAvatars, bounties, summaries,
  avatarTrades as avatarTradesTable, avatarPositions, streamConversationMessages, pointsTransactions, dailyLoginStreak,
  scheduledDebates, botStakes, botSimTrades, botPerformanceSnapshots
} from "../../shared/schema";
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray } from "drizzle-orm";
import * as validators from "../validators";
import {
  loginSchema,
  registerSchema,
  walletLoginSchema,
  twitterAuthSchema,
  updateUserSchema,
  createSummarySchema,
  updateSummarySchema,
  createBountySchema,
  updateBountySchema,
  createInteractionSchema,
  createKnowledgeStackSchema,
  updateKnowledgeStackSchema,
  createUserNoteSchema,
  updateUserNoteSchema,
  paginationSchema,
  searchSchema,
  recentActivitySchema,
  processContentSchema,
  type LoginRequest,
  type RegisterRequest,
  type WalletLoginRequest,
  type TwitterAuthRequest,
  type RecentActivityRequest,
} from "../validators";
import passport from "passport";
import axios from "axios";
import { ADMIN_USERNAMES, isAdmin, requireAdmin, validateRequest, asyncHandler } from "./_shared";
`;

function buildModule(section: Section, body: string): string {
  return `// ============================================================================
// ${section.camel} routes — extracted from server/routes.ts by
// scripts/split-routes.ts. No behavior changes; this is a pure file
// reorganization to break the 20k-line monolith into per-domain modules.
// ============================================================================
${MODULE_PRELUDE}
export async function register${section.camel}Routes(app: Express): Promise<void> {
${body}
}
`;
}

function main() {
  if (!existsSync(ROUTES_PATH)) {
    throw new Error(`routes.ts not found at ${ROUTES_PATH}`);
  }
  const src = readFileSync(ROUTES_PATH, 'utf8');
  const lines = src.split('\n');

  // Validate sections are in non-overlapping ascending order
  for (let i = 1; i < SECTIONS.length; i++) {
    if (SECTIONS[i].startLine < SECTIONS[i - 1].endLine) {
      throw new Error(
        `Section ${SECTIONS[i].slug} starts (${SECTIONS[i].startLine}) before previous section ends (${SECTIONS[i - 1].endLine})`,
      );
    }
  }

  // Idempotency: if registrar imports already in routes.ts, abort safely
  if (src.includes('// SPLIT-ROUTES BEGIN')) {
    console.log('[split-routes] routes.ts already split; aborting.');
    return;
  }

  // Generate domain modules
  for (const section of SECTIONS) {
    // 1-indexed slice → 0-indexed array
    const slice = lines.slice(section.startLine - 1, section.endLine - 1);
    let body = slice.join('\n');
    // Rewrite relative dynamic imports: code moved one level deeper, so
    // `./services/foo` → `../services/foo` (and recommendation/, etc).
    body = body.replace(
      /(import\s*\(\s*['"])\.\/(services|recommendation)\//g,
      '$1../$2/',
    );
    const moduleSrc = buildModule(section, body);
    const outPath = resolve(OUT_DIR, `${section.slug}.ts`);
    writeFileSync(outPath, moduleSrc);
    console.log(
      `[split-routes] wrote ${outPath} (${slice.length} lines from L${section.startLine}-${section.endLine - 1})`,
    );
  }

  // Build the new routes.ts by walking original lines and:
  //   - keeping lines outside every extracted range
  //   - replacing each extracted range with one `register<Camel>Routes(app);` call
  const out: string[] = [];
  let i = 0;
  let registrarImports: string[] = [];

  while (i < lines.length) {
    const lineNo = i + 1; // 1-indexed
    const section = SECTIONS.find((s) => s.startLine === lineNo);
    if (section) {
      // Replace whole range with a stub call
      out.push(`  // ▶ ${section.camel} routes extracted to server/routes/${section.slug}.ts`);
      out.push(`  await register${section.camel}Routes(app);`);
      registrarImports.push(
        `import { register${section.camel}Routes } from "./routes/${section.slug}";`,
      );
      i = section.endLine - 1; // jump to the line that begins the next section / unrelated code
      continue;
    }
    out.push(lines[i]);
    i++;
  }

  // Inject registrar imports + shared helper imports near the top
  // of routes.ts. Find a stable anchor: the closing `} from "./middleware/validationSchemas";`
  // import block is always present.
  const newSrc = out.join('\n');
  const anchor = 'from "./validators";';
  const idx = newSrc.indexOf(anchor);
  if (idx === -1) {
    throw new Error(`Anchor not found: ${anchor}`);
  }
  // Insert AFTER the line containing the anchor
  const after = newSrc.indexOf('\n', idx) + 1;
  const banner = `\n// SPLIT-ROUTES BEGIN — domain registrars (see scripts/split-routes.ts)\nimport { ADMIN_USERNAMES, isAdmin, requireAdmin, validateRequest, asyncHandler } from "./routes/_shared";\n${registrarImports.join('\n')}\n// SPLIT-ROUTES END\n`;
  const finalSrc = newSrc.slice(0, after) + banner + newSrc.slice(after);

  // Remove the now-duplicated local definitions of validateRequest, asyncHandler,
  // ADMIN_USERNAMES, isAdmin, requireAdmin from routes.ts (they live in _shared.ts).
  // We do this by deleting the contiguous block starting at the
  // `// Helper function to handle validation errors` comment through the
  // end of the requireAdmin definition.
  const helperStartMarker = '// Helper function to handle validation errors';
  const helperEndMarker = `const requireAdmin = (req: AuthRequest, res: Response, next: Function) => {`;
  const startIdx = finalSrc.indexOf(helperStartMarker);
  if (startIdx === -1) {
    console.warn('[split-routes] helper block start marker not found — skipping helper hoist');
    writeFileSync(ROUTES_PATH, finalSrc);
    return;
  }
  const endMarkerIdx = finalSrc.indexOf(helperEndMarker, startIdx);
  if (endMarkerIdx === -1) {
    console.warn('[split-routes] helper block end marker not found — skipping helper hoist');
    writeFileSync(ROUTES_PATH, finalSrc);
    return;
  }
  // Find the closing brace of the requireAdmin definition (3-line function body)
  const closingBraceIdx = finalSrc.indexOf('\n};\n', endMarkerIdx);
  if (closingBraceIdx === -1) {
    console.warn('[split-routes] helper block close brace not found — skipping helper hoist');
    writeFileSync(ROUTES_PATH, finalSrc);
    return;
  }
  const cleaned =
    finalSrc.slice(0, startIdx) +
    '// Local helpers (validateRequest, asyncHandler, requireAdmin, isAdmin,\n' +
    '// ADMIN_USERNAMES) hoisted to ./routes/_shared.ts during the domain split.\n' +
    finalSrc.slice(closingBraceIdx + '\n};\n'.length);

  writeFileSync(ROUTES_PATH, cleaned);
  console.log(`[split-routes] rewrote ${ROUTES_PATH}`);
  console.log(
    `[split-routes] new line count: ${cleaned.split('\n').length} (was ${lines.length})`,
  );
}

main();
