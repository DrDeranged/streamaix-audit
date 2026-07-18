import { z } from 'zod';

const nonEmpty = (label: string) =>
  z.string({ required_error: `${label} is required` }).min(1, `${label} is required`);

export const followBodySchema = z.object({
  fid: nonEmpty('fid'),
  username: nonEmpty('username').max(100),
});

export const castActionSchema = z.object({
  castHash: nonEmpty('castHash').max(200),
});

export const replyBodySchema = z.object({
  castHash: nonEmpty('castHash').max(200),
  replyText: nonEmpty('replyText').max(320, 'Reply text too long (max 320 characters)'),
});

export const analyzeContentSchema = z.object({
  url: nonEmpty('url').url('url must be a valid URL').max(2048),
});

export const enhanceTrendsSchema = z.object({
  trends: z.array(z.unknown()).min(1).max(50).optional(),
}).passthrough();

const symbolStr = z
  .string()
  .min(1, 'symbol must not be empty')
  .max(20, 'symbol too long')
  .regex(/^[A-Za-z0-9._-]+$/, 'symbol contains invalid characters');

const horizonStr = z.enum(['1d', '7d', '30d', '90d']);

export const volForecastSchema = z.object({
  symbols: z.array(symbolStr).min(1, 'symbols array is required').max(50),
  horizons: z.array(horizonStr).min(1).max(10).optional(),
});

export const stressTestSchema = z.object({
  assets: z.array(symbolStr).min(1, 'assets array is required').max(50),
  scenarioIds: z.array(z.string().min(1).max(100)).max(20).optional(),
});

export const ackAlertSchema = z.object({
  acknowledgedBy: z.string().min(1).max(100).optional(),
});

export const generateMarketsFromNewsSchema = z.object({
  articles: z.array(z.unknown()).min(1, 'articles array is required').max(50),
  maxMarkets: z.number().int().positive().max(20).optional(),
}).passthrough();

export const avatarGenerateMarketsSchema = z.object({
  count: z.number().int().positive().max(10).optional(),
  topic: z.string().max(500).optional(),
}).passthrough();

export const priceSnapshotSchema = z.object({
  yesPrice: z.number().min(0).max(1).optional(),
  noPrice: z.number().min(0).max(1).optional(),
  volume: z.number().min(0).optional(),
}).passthrough();

const avatarName = z.string().min(1).max(200);

export const avatarPredictSchema = z.object({
  asset: nonEmpty('asset').max(50),
  marketContext: z.string().max(4000).optional(),
}).passthrough();

export const testTtsSchema = z.object({
  avatarName: avatarName.optional(),
  maxSegments: z.number().int().positive().max(5).optional(),
}).passthrough();

export const testTtsAudioSchema = z.object({
  avatarName: avatarName.optional(),
  streamId: z.string().min(1).max(100).optional(),
}).passthrough();

export const generateReplayAudioSchema = z.object({
  count: z.number().int().positive().max(20).optional(),
}).passthrough();

// Empty-body endpoints — accept any object, but reject string/array/null bodies
export const emptyBodySchema = z.object({}).passthrough();

export const voiceAssistantSchema = z.object({
  audioBase64: z.string().min(100).max(2_500_000),
  mimeType: z.string().min(3).max(100).default('audio/webm'),
  currentPath: z.string().max(500).optional(),
});

// Forms / mutations
export const streamWatchSchema = z.object({
  streamId: nonEmpty('streamId').max(100),
  minutesWatched: z.number().positive().max(60 * 24),
}).passthrough();

export const voiceConversationSchema = z.object({
  streamId: nonEmpty('streamId').max(100),
}).passthrough();

export const bountyClaimSchema = z.object({
  claimerWallet: z.string().max(200).optional(),
  blockchainTxHash: z.string().max(200).optional(),
}).passthrough();

export const summaryProcessSchema = z.object({
  forceReprocess: z.boolean().optional(),
}).passthrough();

export const forceRefreshSchema = z.object({
  forceRefresh: z.boolean().optional(),
}).passthrough();

export const botStakeSchema = z.object({
  avatarId: nonEmpty('avatarId').max(100),
  amount: z.number().positive().max(1_000_000_000),
}).passthrough();

export const botWithdrawSchema = z.object({
  stakeId: nonEmpty('stakeId').max(100),
}).passthrough();

export const predictionMarketTradeSchema = z.object({
  amount: z.number().positive().max(1_000_000_000),
  outcome: z.enum(['yes', 'no', 'YES', 'NO', 'Yes', 'No']),
  tradeType: z.enum(['buy', 'sell', 'BUY', 'SELL']),
}).passthrough();

export const aiAgentTradeSchema = z.object({
  marketId: nonEmpty('marketId').max(100),
  predictionId: nonEmpty('predictionId').max(100),
  shares: z.number().positive().max(1_000_000_000),
}).passthrough();

export const streamPredictionSchema = z.object({
  predictionText: nonEmpty('predictionText').max(2000),
  confidence: z.number().min(0).max(100).optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export const convertToMarketSchema = z.object({
  deadline: z.union([z.string(), z.number()]),
}).passthrough();

export const transcribeSchema = z.object({
  audioBase64: nonEmpty('audioBase64').max(5_000_000),
}).passthrough();

export const channelPointsRedeemSchema = z.object({
  rewardId: nonEmpty('rewardId').max(100),
}).passthrough();

export const debateNextSchema = z.object({
  previousStatement: z.string().max(4000).optional(),
  prompt: z.string().max(2000).optional(),
  speakerId: z.string().max(100).optional(),
}).passthrough();

export const agentTrackRecordParamsSchema = z.object({
  id: z.string().min(1).max(100),
});

export const resolutionDecideParamsSchema = z.object({
  marketId: z.string().min(1).max(100),
});

export const bridgeWithdrawSchema = z.object({
  points: z.number().int().positive().max(100_000_000),
}).passthrough();

export const bridgeRequestParamsSchema = z.object({
  id: z.string().min(1).max(100),
});

export const resolutionDecideSchema = z.object({
  resolution: z.enum(['yes', 'no', 'invalid', 'YES', 'NO', 'INVALID']),
  note: z.string().max(4000).optional(),
}).passthrough();
