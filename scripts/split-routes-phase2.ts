#!/usr/bin/env tsx
/**
 * Phase 2 codemod: extract the remaining big sections from server/routes.ts
 * (now that phase 1 has reduced it from 20k to 15k lines). Operates on the
 * CURRENT file (NOT a git checkout), since HEAD already contains the
 * phase-1-extracted version. Section line numbers below are relative to the
 * current 15,142-line state; re-running is safe because the codemod
 * detects the `// PHASE2-SPLIT BEGIN` marker.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROUTES_PATH = resolve(process.cwd(), 'server/routes.ts');
const OUT_DIR = resolve(process.cwd(), 'server/routes');

interface Section {
  slug: string;
  camel: string;
  startLine: number; // 1-indexed, line of opening `// ===` banner
  endLine: number;   // exclusive
}

// Cut points discovered via `grep -nE "^\s*//\s*[A-Z][A-Z ]+[A-Z]\s*$" server/routes.ts`.
// Each startLine is the line BEFORE the title (so we capture the full banner).
// Each startLine is the line of the opening `// ====` banner.
// endLine is exclusive — it should NOT cross an embedded
// `await register*Routes(app);` stub from phase 1, otherwise that stub
// would end up nested inside the new module instead of in the orchestrator.
const SECTIONS: Section[] = [
  { slug: 'avatar',                    camel: 'Avatar',                  startLine: 220,   endLine: 785  },
  { slug: 'interaction',               camel: 'Interaction',             startLine: 785,   endLine: 988  },
  { slug: 'autonomous-trading-engine', camel: 'AutonomousTradingEngine', startLine: 988,   endLine: 1482 },
  // 1482-1487: phase-1 stubs (knowledge-stack, user-notes, chat) stay in routes.ts
  { slug: 'stream-processing',         camel: 'StreamProcessing',        startLine: 1488, endLine: 1625 },
  { slug: 'web3-and-social',           camel: 'Web3AndSocial',           startLine: 1625, endLine: 1736 },
  // 1736-1741: phase-1 stubs (twitter-x, trending-crypto, youtube) stay in routes.ts
  { slug: 'wallet-and-rewards',        camel: 'WalletAndRewards',        startLine: 1742, endLine: 1778 },
  { slug: 'predictive-analytics',      camel: 'PredictiveAnalytics',     startLine: 1778, endLine: 2235 },
  { slug: 'market-data',               camel: 'MarketData',              startLine: 2235, endLine: 2601 },
  { slug: 'charting',                  camel: 'Charting',                startLine: 2601, endLine: 2941 },
  { slug: 'correlation-analysis',      camel: 'CorrelationAnalysis',     startLine: 2941, endLine: 3115 },
  { slug: 'risk-assessment',           camel: 'RiskAssessment',          startLine: 3115, endLine: 3422 },
  { slug: 'on-chain-analytics',        camel: 'OnChainAnalytics',        startLine: 3422, endLine: 3744 },
  { slug: 'economic-calendar',         camel: 'EconomicCalendar',        startLine: 3744, endLine: 3914 },
  { slug: 'fed-reserve',               camel: 'FedReserve',              startLine: 3914, endLine: 5028 },
  { slug: 'diagnostic',                camel: 'Diagnostic',              startLine: 5028, endLine: 5464 },
  { slug: 'real-processing',           camel: 'RealProcessing',          startLine: 5464, endLine: 5664 },
  { slug: 'market-data-api',           camel: 'MarketDataApi',           startLine: 5664, endLine: 6052 },
  { slug: 'tech-ai-stocks',            camel: 'TechAiStocks',            startLine: 6052, endLine: 6068 },
  { slug: 'alpha-intelligence',        camel: 'AlphaIntelligence',       startLine: 6068, endLine: 7656 },
  { slug: 'bot-trading-simulator',     camel: 'BotTradingSimulator',     startLine: 7656, endLine: 8111 },
  { slug: 'web3-blockchain',           camel: 'Web3Blockchain',          startLine: 8111, endLine: 8116 },
  { slug: 'social-trading-platform',   camel: 'SocialTradingPlatform',   startLine: 8116, endLine: 8121 },
  { slug: 'prediction-markets',        camel: 'PredictionMarkets',       startLine: 8121, endLine: 8818 },
  { slug: 'prediction-leagues',        camel: 'PredictionLeagues',       startLine: 8818, endLine: 9193 },
  { slug: 'ai-agent-trading',          camel: 'AiAgentTrading',          startLine: 9193, endLine: 9982 },
  // 9982-10202: WEBSOCKET SERVER FOR REAL-TIME UPDATES — defines `clients`
  // Set used by setup; KEEP in routes.ts.
  // 10203-10206: phase-1 stubs (waitlist, push-notifications) stay in routes.ts
  { slug: 'live-streaming',            camel: 'LiveStreaming',           startLine: 10207, endLine: 14703 },
  // 14704-14711: phase-1 stubs (portfolio-*, price-alerts) stay in routes.ts
];

// Re-import the same kitchen-sink set so route bodies compile unchanged.
const MODULE_PRELUDE = `import type { Express, Request, Response, NextFunction } from "express";
import { storage, DatabaseStorage } from "../storage";
import { AuthService, authenticateToken, optionalAuth, type AuthRequest } from "../auth";
import {
  strictLimit,
  mediumLimit,
  looseLimit,
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
import { StreamProcessor } from "../services/streamProcessor";
import { StreamProcessorV2 } from "../services/streamProcessorV2";
import RebuiltContentProcessor from "../services/rebuiltContentProcessor";
import { AIService } from "../services/aiService";
import { Web3Service } from "../services/web3Service";
import { MarketDataService } from "../services/marketDataService";
import { youtubeService } from "../services/youtubeService";
import { PredictiveAnalyticsService } from "../services/predictiveAnalyticsService";
import { onChainAnalyticsService } from "../services/onChainAnalyticsService";
import { duneAnalyticsService } from "../services/duneAnalyticsService";
import { federalReserveService } from "../services/federalReserveService";
import { CorrelationAnalysisService } from "../services/correlationAnalysisService";
import { chartingService } from "../services/chartingService";
import { derivativesAnalyticsService } from "../services/derivativesAnalyticsService";
import { institutionalFlowService } from "../services/institutionalFlowService";
import { RiskAssessmentService } from "../services/riskAssessmentService";
import { CrossMarketSignalService } from "../services/crossMarketSignalService";
import { VolatilityForecastingService } from "../services/volatilityForecastingService";
import { marketEventModelingService } from "../services/marketEventModelingService";
import { patternRecognitionService } from "../services/patternRecognitionService";
import { RecommendationEngine } from "../recommendation-engine";
import { cryptoIntelligenceService } from "../services/cryptoIntelligenceService";
import { macroDataService } from "../services/macroDataService";
import { advancedMarketIntelService } from "../services/advancedMarketIntelService";
import { aiTradingSignalsService } from "../services/aiTradingSignalsService";
import { trendingService } from "../services/trendingService";
import { autonomousTradingEngine } from "../services/autonomousTradingEngine";
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
import { eq, and, desc, gte, lte, sql, asc, isNotNull, isNull, inArray, count } from "drizzle-orm";
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
// scripts/split-routes-phase2.ts. No behavior changes; pure file
// reorganization to break the monolith into per-domain modules.
// ============================================================================
${MODULE_PRELUDE}
export async function register${section.camel}Routes(app: Express): Promise<void> {
${body}
}
`;
}

function main() {
  const src = readFileSync(ROUTES_PATH, 'utf8');
  const lines = src.split('\n');

  if (src.includes('// PHASE2-SPLIT BEGIN')) {
    console.log('[phase2] already applied; aborting.');
    return;
  }

  // Validate ascending non-overlapping
  for (let i = 1; i < SECTIONS.length; i++) {
    if (SECTIONS[i].startLine < SECTIONS[i - 1].endLine) {
      throw new Error(
        `Section ${SECTIONS[i].slug} starts (${SECTIONS[i].startLine}) before previous section ends (${SECTIONS[i - 1].endLine})`,
      );
    }
  }

  // Generate domain modules
  for (const section of SECTIONS) {
    const slice = lines.slice(section.startLine - 1, section.endLine - 1);
    let body = slice.join('\n');
    // Rewrite relative dynamic imports moved one level deeper
    body = body.replace(
      /(import\s*\(\s*['"])\.\/(services|recommendation)\//g,
      '$1../$2/',
    );
    const moduleSrc = buildModule(section, body);
    const outPath = resolve(OUT_DIR, `${section.slug}.ts`);
    writeFileSync(outPath, moduleSrc);
    console.log(
      `[phase2] wrote ${outPath} (${slice.length} lines from L${section.startLine}-${section.endLine - 1})`,
    );
  }

  // Build new routes.ts
  const out: string[] = [];
  let i = 0;
  const registrarImports: string[] = [];

  while (i < lines.length) {
    const lineNo = i + 1;
    const section = SECTIONS.find((s) => s.startLine === lineNo);
    if (section) {
      out.push(`  // ▶ ${section.camel} routes extracted to server/routes/${section.slug}.ts`);
      out.push(`  await register${section.camel}Routes(app);`);
      registrarImports.push(
        `import { register${section.camel}Routes } from "./routes/${section.slug}";`,
      );
      i = section.endLine - 1;
      continue;
    }
    out.push(lines[i]);
    i++;
  }

  const newSrc = out.join('\n');

  // Insert registrar imports right after the existing SPLIT-ROUTES END marker
  const anchor = '// SPLIT-ROUTES END';
  const idx = newSrc.indexOf(anchor);
  if (idx === -1) throw new Error(`Anchor not found: ${anchor}`);
  const after = newSrc.indexOf('\n', idx) + 1;
  const banner = `\n// PHASE2-SPLIT BEGIN — additional domain registrars (see scripts/split-routes-phase2.ts)\n${registrarImports.join('\n')}\n// PHASE2-SPLIT END\n`;
  const finalSrc = newSrc.slice(0, after) + banner + newSrc.slice(after);

  writeFileSync(ROUTES_PATH, finalSrc);
  console.log(`[phase2] rewrote ${ROUTES_PATH}`);
  console.log(`[phase2] new line count: ${finalSrc.split('\n').length} (was ${lines.length})`);
}

main();
