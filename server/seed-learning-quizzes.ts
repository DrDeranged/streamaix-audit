import { db } from "./db";
import { learningQuizzes } from "../shared/schema";
import { eq } from "drizzle-orm";

function formatQuiz(id: string, lessonId: string, question: string, options: string[], correctIndex: number, xpReward = 25, sortOrder = 1) {
  return {
    id,
    lessonId,
    question,
    questionType: "multiple_choice",
    options: options.map((text, i) => ({ id: `opt-${i}`, text, isCorrect: i === correctIndex })),
    xpReward,
    sortOrder
  };
}

const allQuizzes = [
  // WEB3 BASICS
  formatQuiz("quiz-web3-1-1", "lesson-web3-1", "What does a blockchain primarily store?", ["Physical documents", "Encrypted emails", "Immutable transaction records", "Social media posts"], 2, 25, 1),
  formatQuiz("quiz-web3-1-2", "lesson-web3-1", "What is a 'block' in a blockchain?", ["A cryptocurrency coin", "A collection of validated transactions with a cryptographic hash", "A type of mining hardware", "A network server"], 1, 25, 2),
  formatQuiz("quiz-web3-1-3", "lesson-web3-1", "Which consensus mechanism does Bitcoin use?", ["Proof of Stake", "Proof of Work", "Delegated Proof of Stake", "Proof of Authority"], 1, 25, 3),
  formatQuiz("quiz-web3-2-1", "lesson-web3-2", "What does a cryptocurrency wallet actually store?", ["Actual cryptocurrency coins", "Private keys that prove ownership", "Blockchain data", "Transaction history only"], 1, 25, 1),
  formatQuiz("quiz-web3-2-2", "lesson-web3-2", "What is a seed phrase used for?", ["Speeding up transactions", "Recovering wallet access on any device", "Mining cryptocurrency", "Paying gas fees"], 1, 25, 2),
  formatQuiz("quiz-web3-2-3", "lesson-web3-2", "Which wallet type offers the highest security for large holdings?", ["Browser extension wallet", "Mobile wallet", "Hardware wallet", "Exchange wallet"], 2, 25, 3),
  formatQuiz("quiz-web3-3-1", "lesson-web3-3", "What is a smart contract?", ["A legal document stored online", "Self-executing code on a blockchain", "A type of cryptocurrency", "A mining agreement"], 1, 25, 1),
  formatQuiz("quiz-web3-3-2", "lesson-web3-3", "Which programming language is most commonly used for Ethereum smart contracts?", ["Python", "JavaScript", "Solidity", "Rust"], 2, 25, 2),
  formatQuiz("quiz-web3-3-3", "lesson-web3-3", "What is a reentrancy attack?", ["Hacking a hardware wallet", "Exploiting a contract before state updates complete", "Stealing seed phrases", "Mining without permission"], 1, 25, 3),
  formatQuiz("quiz-web3-4-1", "lesson-web3-4", "What determines transaction cost on Ethereum?", ["Time of day only", "Gas Used multiplied by Gas Price", "Network speed", "Wallet balance"], 1, 25, 1),
  formatQuiz("quiz-web3-4-2", "lesson-web3-4", "What happens to the base fee in EIP-1559?", ["Paid to miners", "Burned permanently", "Returned to sender", "Donated to charity"], 1, 25, 2),
  formatQuiz("quiz-web3-5-1", "lesson-web3-5", "What is the most common type of crypto attack?", ["Smart contract exploits", "Phishing attacks", "51% attacks", "Hardware hacks"], 1, 25, 1),
  formatQuiz("quiz-web3-5-2", "lesson-web3-5", "What should you do if a website asks for your seed phrase?", ["Enter it carefully", "Verify the URL first then enter", "Never enter it - it's a scam", "Only enter the first 6 words"], 2, 25, 2),
  formatQuiz("quiz-web3-5-3", "lesson-web3-5", "What is a wallet drainer?", ["A virus that uses your electricity", "A smart contract that steals approved tokens", "A mining software", "A network spam tool"], 1, 25, 3),

  // DEFI
  formatQuiz("quiz-defi-1-1", "lesson-defi-1", "What is a key advantage of DeFi over traditional finance?", ["Government backing", "24/7 permissionless access", "FDIC insurance", "Physical branch offices"], 1, 25, 1),
  formatQuiz("quiz-defi-1-2", "lesson-defi-1", "What is a stablecoin?", ["A coin that never changes price", "A cryptocurrency designed to maintain a stable value", "A government-issued digital currency", "A long-term investment token"], 1, 25, 2),
  formatQuiz("quiz-defi-1-3", "lesson-defi-1", "What does TVL stand for in DeFi?", ["Total Value Locked", "Token Verification Level", "Transaction Volume Limit", "Transfer Value Ledger"], 0, 25, 3),
  formatQuiz("quiz-defi-2-1", "lesson-defi-2", "What formula do most AMMs like Uniswap use?", ["x + y = k", "x × y = k", "x / y = k", "x - y = k"], 1, 25, 1),
  formatQuiz("quiz-defi-2-2", "lesson-defi-2", "What is impermanent loss?", ["A temporary wallet glitch", "Loss from price divergence when providing liquidity", "Network transaction fees", "A type of slippage"], 1, 25, 2),
  formatQuiz("quiz-defi-2-3", "lesson-defi-2", "What does slippage mean in AMM trading?", ["Transaction failure", "Difference between expected and actual trade price", "Wallet hack vulnerability", "Interest rate change"], 1, 25, 3),
  formatQuiz("quiz-defi-3-1", "lesson-defi-3", "In DeFi lending, what is the health factor?", ["Transaction speed metric", "Collateral value divided by loan value", "Interest rate percentage", "Token burn rate"], 1, 25, 1),
  formatQuiz("quiz-defi-3-2", "lesson-defi-3", "What happens when your health factor falls below 1?", ["Interest rates increase", "Your position gets liquidated", "Rewards are paused", "You earn bonus tokens"], 1, 25, 2),
  formatQuiz("quiz-defi-3-3", "lesson-defi-3", "What is a flash loan?", ["Very fast transaction", "Loan that must be repaid in same block", "Short-term traditional loan", "Emergency wallet recovery"], 1, 25, 3),
  formatQuiz("quiz-defi-4-1", "lesson-defi-4", "What is the difference between APR and APY?", ["They are the same", "APY includes compounding effect", "APR includes fees", "APY is always lower"], 1, 25, 1),
  formatQuiz("quiz-defi-4-2", "lesson-defi-4", "What is liquidity mining?", ["Creating new cryptocurrencies", "Earning token rewards for providing liquidity", "Mining Bitcoin with pools", "Trading on centralized exchanges"], 1, 25, 2),
  formatQuiz("quiz-defi-5-1", "lesson-defi-5", "What percentage of portfolio should typically be in high-risk DeFi strategies?", ["50-80%", "10-20%", "100%", "0%"], 1, 25, 1),
  formatQuiz("quiz-defi-5-2", "lesson-defi-5", "What should you look for before depositing in a DeFi protocol?", ["Highest APY only", "Audit reports from reputable firms", "Most Twitter followers", "Newest launch date"], 1, 25, 2),

  // AI TRADING
  formatQuiz("quiz-ai-1-1", "lesson-ai-1", "What type of AI learns from trial and error to maximize rewards?", ["Supervised learning", "Unsupervised learning", "Reinforcement learning", "Transfer learning"], 2, 25, 1),
  formatQuiz("quiz-ai-1-2", "lesson-ai-1", "What is a major limitation of AI trading models?", ["They're too fast", "Overfitting to historical data", "They don't make mistakes", "They're always profitable"], 1, 25, 2),
  formatQuiz("quiz-ai-1-3", "lesson-ai-1", "What is alternative data in trading?", ["Fake data for testing", "Non-traditional data like satellite imagery", "Encrypted trading data", "Historical price data"], 1, 25, 3),
  formatQuiz("quiz-ai-2-1", "lesson-ai-2", "What does RSI measure?", ["Trade volume", "Momentum and overbought/oversold conditions", "Moving averages", "Support levels"], 1, 25, 1),
  formatQuiz("quiz-ai-2-2", "lesson-ai-2", "What is signal confluence?", ["Multiple signals contradicting each other", "Multiple signals pointing in the same direction", "A single strong indicator", "Signal interference"], 1, 25, 2),
  formatQuiz("quiz-ai-2-3", "lesson-ai-2", "In multi-timeframe analysis, what does the higher timeframe provide?", ["Entry signals", "Exit timing", "Primary trend context", "Stop-loss levels"], 2, 25, 3),
  formatQuiz("quiz-ai-3-1", "lesson-ai-3", "What is the commonly recommended maximum risk per trade?", ["10-20%", "1-2%", "50%", "5-10%"], 1, 25, 1),
  formatQuiz("quiz-ai-3-2", "lesson-ai-3", "What is position sizing based on volatility designed to do?", ["Maximize profits", "Normalize risk across different assets", "Reduce trading frequency", "Increase leverage"], 1, 25, 2),
  formatQuiz("quiz-ai-4-1", "lesson-ai-4", "What is look-ahead bias in backtesting?", ["Planning trades too far in advance", "Using information that wouldn't have been available at the time", "Testing only winning trades", "Ignoring losing trades"], 1, 25, 1),
  formatQuiz("quiz-ai-4-2", "lesson-ai-4", "What is walk-forward testing?", ["Testing while walking", "Using rolling windows of in-sample and out-of-sample data", "Only testing on future data", "Testing without historical data"], 1, 25, 2),
  formatQuiz("quiz-ai-5-1", "lesson-ai-5", "What is a data pipeline in AI trading?", ["Hardware for fast trading", "System for collecting and processing market data", "Cryptocurrency mining equipment", "Trading algorithm"], 1, 25, 1),
  formatQuiz("quiz-ai-5-2", "lesson-ai-5", "What indicates an AI model needs retraining?", ["Consistent performance", "Degrading performance or detected regime change", "Increasing profits", "Stable predictions"], 1, 25, 2),

  // PREDICTION MARKETS
  formatQuiz("quiz-pred-1-1", "lesson-pred-1", "In a prediction market, what does a YES share trading at $0.70 indicate?", ["70 cents per share", "70% implied probability of YES outcome", "70 shares available", "70% discount"], 1, 25, 1),
  formatQuiz("quiz-pred-1-2", "lesson-pred-1", "What is the 'wisdom of crowds' principle?", ["Following majority opinion blindly", "Aggregated independent judgments often outperform individuals", "Expert opinions are always wrong", "Crowds always panic sell"], 1, 25, 2),
  formatQuiz("quiz-pred-1-3", "lesson-pred-1", "What is the favorite-longshot bias?", ["Favorites always win", "Markets often overprice longshots and underprice favorites", "Long-term bets are better", "Favorites never lose"], 1, 25, 3),
  formatQuiz("quiz-pred-2-1", "lesson-pred-2", "What is edge in prediction markets?", ["Being first to trade", "Difference between your probability estimate and market price", "Having more capital", "Following influencers"], 1, 25, 1),
  formatQuiz("quiz-pred-2-2", "lesson-pred-2", "What is the Brier score?", ["Measure of trading volume", "Measure of probabilistic prediction accuracy", "Risk metric", "Profit calculation"], 1, 25, 2),
  formatQuiz("quiz-pred-3-1", "lesson-pred-3", "How does a market maker profit?", ["Always betting on winners", "Earning the spread between bid and ask", "Getting insider information", "Front-running trades"], 1, 25, 1),
  formatQuiz("quiz-pred-3-2", "lesson-pred-3", "What is 'skewing' in market making?", ["Cheating the market", "Adjusting quotes to manage inventory", "Only taking one side", "Avoiding all trades"], 1, 25, 2),
  formatQuiz("quiz-pred-4-1", "lesson-pred-4", "Why is diversification important in prediction market portfolios?", ["Increases risk", "Reduces single prediction impact on overall returns", "Makes tracking harder", "Decreases returns"], 1, 25, 1),
  formatQuiz("quiz-pred-4-2", "lesson-pred-4", "What is fractional Kelly betting?", ["Betting a fraction of Kelly optimal to reduce risk", "Only betting on fractions", "A type of rounding", "Partial position closing"], 0, 25, 2),
  formatQuiz("quiz-pred-5-1", "lesson-pred-5", "What is the UMA Optimistic Oracle?", ["A trading bot", "A decentralized resolution mechanism for prediction markets", "A price feed", "A exchange"], 1, 25, 1),
  formatQuiz("quiz-pred-5-2", "lesson-pred-5", "What should you do if a market's resolution criteria seems ambiguous?", ["Trade maximum size", "Avoid the market or factor in resolution risk", "Trust the market completely", "Always bet YES"], 1, 25, 2),

  // MACRO ECONOMICS
  formatQuiz("quiz-macro-1-1", "lesson-macro-1", "What does CPI measure?", ["Corporate profits", "Consumer price changes over time", "Currency exchange rates", "Stock market performance"], 1, 25, 1),
  formatQuiz("quiz-macro-1-2", "lesson-macro-1", "How does the Fed typically fight high inflation?", ["Lowering interest rates", "Raising interest rates", "Printing more money", "Reducing bank regulations"], 1, 25, 2),
  formatQuiz("quiz-macro-1-3", "lesson-macro-1", "What is an inverted yield curve often a predictor of?", ["Stock market rally", "Recession", "High inflation", "Currency appreciation"], 1, 25, 3),
  formatQuiz("quiz-macro-2-1", "lesson-macro-2", "What is the GDP equation?", ["Revenue - Costs", "C + I + G + (X - M)", "Assets - Liabilities", "Imports + Exports"], 1, 25, 1),
  formatQuiz("quiz-macro-2-2", "lesson-macro-2", "What does a PMI reading below 50 indicate?", ["Economic expansion", "Economic contraction", "No change", "Inflation"], 1, 25, 2),
  formatQuiz("quiz-macro-2-3", "lesson-macro-2", "Which is a leading economic indicator?", ["Unemployment rate", "Corporate profits", "Building permits", "Consumer credit"], 2, 25, 3),
  formatQuiz("quiz-macro-3-1", "lesson-macro-3", "What is the Fed's dual mandate?", ["High returns and low risk", "Maximum employment and price stability", "Trade balance and currency stability", "Bank profits and consumer lending"], 1, 25, 1),
  formatQuiz("quiz-macro-3-2", "lesson-macro-3", "What is quantitative easing?", ["Reducing bank regulations", "Central bank buying assets to inject money into the system", "Raising interest rates quickly", "Printing physical currency"], 1, 25, 2),
  formatQuiz("quiz-macro-3-3", "lesson-macro-3", "What does 'hawkish' Fed policy typically mean?", ["Concerned about growth, favors lower rates", "Concerned about inflation, favors higher rates", "Neutral policy", "No policy changes"], 1, 25, 3),
  formatQuiz("quiz-macro-4-1", "lesson-macro-4", "What typically happens to emerging markets when the dollar strengthens?", ["They benefit greatly", "They face pressure due to dollar-denominated debt", "No impact", "Their currencies strengthen too"], 1, 25, 1),
  formatQuiz("quiz-macro-4-2", "lesson-macro-4", "What is a carry trade?", ["Transporting physical cash", "Borrowing in low-rate currency to invest in high-rate currency", "Long-term investment strategy", "Day trading technique"], 1, 25, 2),

  // TECH STOCKS
  formatQuiz("quiz-tech-1-1", "lesson-tech-1", "What is the Rule of 40 for SaaS companies?", ["Revenue must exceed $40 million", "Revenue growth rate + profit margin should equal 40%+", "Must have 40 customers", "40% market share required"], 1, 25, 1),
  formatQuiz("quiz-tech-1-2", "lesson-tech-1", "What does net revenue retention above 120% indicate?", ["Losing customers", "Existing customers are spending significantly more over time", "Revenue is declining", "Prices are too low"], 1, 25, 2),
  formatQuiz("quiz-tech-1-3", "lesson-tech-1", "Why are high-growth tech stocks sensitive to interest rates?", ["They have more debt", "Their earnings are far in the future, more affected by discount rates", "They pay dividends", "They're in cyclical industries"], 1, 25, 3),
  formatQuiz("quiz-tech-2-1", "lesson-tech-2", "What is the most important outcome when analyzing tech earnings?", ["Past quarter performance only", "Actual vs. expectations and forward guidance", "Stock price movement", "CEO comments"], 1, 25, 1),
  formatQuiz("quiz-tech-2-2", "lesson-tech-2", "What is Non-GAAP earnings?", ["Illegal accounting", "Company's adjusted view excluding certain items like stock-based comp", "European accounting standard", "Quarterly only earnings"], 1, 25, 2),
  formatQuiz("quiz-tech-2-3", "lesson-tech-2", "What is IV crush in options?", ["Options getting cheaper", "Implied volatility drop after earnings, reducing option values", "Increased volatility", "Market crash"], 1, 25, 3),
  formatQuiz("quiz-tech-3-1", "lesson-tech-3", "What is a network effect?", ["Faster internet speed", "Product becomes more valuable as more people use it", "Computer networking technology", "Social media marketing"], 1, 25, 1),
  formatQuiz("quiz-tech-3-2", "lesson-tech-3", "Which secular trend is driving demand for NVIDIA GPUs?", ["Gaming only", "Artificial intelligence infrastructure", "Cryptocurrency mining", "Remote work"], 1, 25, 2),
  formatQuiz("quiz-tech-4-1", "lesson-tech-4", "What percentage of S&P 500 market cap do the Magnificent 7 represent?", ["About 10%", "About 30%", "About 50%", "About 5%"], 1, 25, 1),
  formatQuiz("quiz-tech-4-2", "lesson-tech-4", "Which Magnificent 7 company is known for its AI/OpenAI partnership?", ["Apple", "Microsoft", "Meta", "Tesla"], 1, 25, 2),
  formatQuiz("quiz-tech-4-3", "lesson-tech-4", "What is NVIDIA's primary competitive advantage in AI?", ["Lowest prices", "GPU architecture and CUDA ecosystem", "Largest market cap", "Oldest company"], 1, 25, 3),
];

export async function seedLearningQuizzes() {
  console.log("Starting learning quizzes seed...");
  
  for (const quiz of allQuizzes) {
    try {
      const existing = await db.select()
        .from(learningQuizzes)
        .where(eq(learningQuizzes.id, quiz.id))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(learningQuizzes)
          .set({
            question: quiz.question,
            questionType: quiz.questionType,
            options: quiz.options,
            xpReward: quiz.xpReward,
            sortOrder: quiz.sortOrder
          })
          .where(eq(learningQuizzes.id, quiz.id));
        console.log(`Updated quiz: ${quiz.id}`);
      } else {
        await db.insert(learningQuizzes).values({
          id: quiz.id,
          lessonId: quiz.lessonId,
          question: quiz.question,
          questionType: quiz.questionType,
          options: quiz.options,
          xpReward: quiz.xpReward,
          sortOrder: quiz.sortOrder
        });
        console.log(`Created quiz: ${quiz.id}`);
      }
    } catch (error) {
      console.error(`Error seeding quiz ${quiz.id}:`, error);
    }
  }
  
  console.log("Learning quizzes seed complete!");
}

