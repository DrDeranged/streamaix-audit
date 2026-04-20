import fs from "fs";
import path from "path";

const files = `server/services/voiceAssistantService.ts
server/services/avatarCommentaryService.ts
server/services/smartInsightsEngine.ts
server/services/cleanContentProcessor.ts
server/services/realContentProcessor.ts
server/services/aiTradingSignalsService.ts
server/services/scheduledMarketStreamService.ts
server/services/aiMarketResolver.ts
server/services/enhancedStreamingService.ts
server/services/avatarVoiceService.ts
server/services/autonomousAvatarStreamService.ts
server/routes/portfolio-news.ts
server/services/agentBountyEngine.ts
server/services/knowledgeQuestionService.ts
server/services/aiTrendSpotter.ts
server/services/aiTradingBotService.ts
server/services/debateManagerService.ts
server/services/avatarStreamEnhancementsService.ts
server/services/predictionExtractionService.ts
server/services/avatarChatService.ts
server/services/alphaInsightsEngine.ts
server/services/aiLiquidityProvider.ts
server/services/aiAgentStreamingService.ts
server/services/aiAgentService.ts
server/services/avatarPodcastEngine.ts
server/services/agentContentCreator.ts
server/services/agentMarketAnalyzer.ts
server/services/streamConversationService.ts
server/services/chatService.ts
server/services/aiPredictionBackfillService.ts
server/services/aiTreasuryManager.ts
server/services/avatarAlphaStreamService.ts
server/services/aiCommunityManager.ts
server/services/alphaIntelligenceService.ts
server/services/aiContentModerator.ts
server/services/avatarMarketGenerator.ts
server/services/aiMetaTrader.ts
server/services/socialMarketGenerator.ts`.split("\n");

let totalReplacements = 0;
const noChange = [];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.error("MISSING:", f);
    continue;
  }
  let src = fs.readFileSync(f, "utf8");
  const before = src;

  const fromDir = path.dirname(f);
  let rel = path.relative(fromDir, "server/lib/openaiClient");
  if (!rel.startsWith(".")) rel = "./" + rel;

  if (f.endsWith("routes/portfolio-news.ts")) {
    src = src.replace(
      /const OpenAI = \(await import\(['"]openai['"]\)\)\.default;\s*\n\s*const openai = new OpenAI\(\{ apiKey: process\.env\.OPENAI_API_KEY \|\| "sk-missing-deploy-time-key" \}\);/,
      `const { openai } = await import("${rel}");`,
    );
    if (src !== before) {
      fs.writeFileSync(f, src);
      totalReplacements++;
    } else {
      noChange.push(f);
    }
    continue;
  }

  const importPattern = /^\s*import\s+OpenAI\s+from\s+["']openai["'];?\s*$/m;
  const hasOpenAIImport = importPattern.test(src);

  // Single-line constructor
  src = src.replace(
    /const\s+openai\s*=\s*new\s+OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY\s*\|\|\s*"sk-missing-deploy-time-key",?\s*\}\);?/g,
    `// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)`,
  );

  // Multiline constructor
  src = src.replace(
    /const\s+openai\s*=\s*new\s+OpenAI\(\{\s*\n\s*apiKey:\s*process\.env\.OPENAI_API_KEY\s*\|\|\s*"sk-missing-deploy-time-key",?\s*\n\s*\}\);?/g,
    `// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)`,
  );

  // Gated: const openai = process.env.OPENAI_API_KEY ? new OpenAI(...||"...") : null;
  src = src.replace(
    /const\s+openai\s*=\s*process\.env\.OPENAI_API_KEY\s*\n?\s*\?\s*new\s+OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY\s*\|\|\s*"sk-missing-deploy-time-key"\s*\}\)\s*\n?\s*:\s*null;?/g,
    `const openai = hasOpenAIKey() ? lazyOpenai : null;`,
  );

  // Class field: this.openai = new OpenAI(...||"...");
  src = src.replace(
    /this\.openai\s*=\s*new\s+OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY\s*\|\|\s*"sk-missing-deploy-time-key"\s*\}\);?/g,
    `this.openai = lazyOpenai;`,
  );

  // Class field gated
  src = src.replace(
    /this\.openai\s*=\s*process\.env\.OPENAI_API_KEY\s*\?\s*new\s+OpenAI\(\{\s*apiKey:\s*process\.env\.OPENAI_API_KEY\s*\|\|\s*"sk-missing-deploy-time-key"\s*\}\)\s*:\s*null;?/g,
    `this.openai = hasOpenAIKey() ? lazyOpenai : null;`,
  );

  const usesGated = /hasOpenAIKey\(\)/.test(src);
  const importLine = usesGated
    ? `import { openai as lazyOpenai, hasOpenAIKey } from "${rel}";`
    : `import { openai as lazyOpenai } from "${rel}";`;

  if (hasOpenAIImport) {
    src = src.replace(importPattern, importLine);
  } else if (!src.includes(rel)) {
    const firstImportMatch = src.match(/^import .+;$/m);
    if (firstImportMatch) {
      src = src.replace(
        firstImportMatch[0],
        firstImportMatch[0] + "\n" + importLine,
      );
    } else {
      src = importLine + "\n" + src;
    }
  }

  // Add `const openai = lazyOpenai;` alias if file references `openai.` outside class fields
  const refsOpenaiVar =
    /\bopenai\.(chat|images|audio|embeddings|completions|beta|files|moderations|responses|models)/.test(
      src,
    );
  if (refsOpenaiVar && !src.includes("const openai = lazyOpenai")) {
    src = src.replace(
      importLine,
      importLine + "\nconst openai = lazyOpenai;",
    );
  }

  if (src !== before) {
    fs.writeFileSync(f, src);
    totalReplacements++;
  } else {
    noChange.push(f);
  }
}

console.log("Files updated:", totalReplacements, "/", files.length);
if (noChange.length) console.log("No change:", noChange);
