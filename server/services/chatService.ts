import { modelGateway } from "../lib/modelGateway";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYSTEM_PROMPT = `You are StreamAiX Assistant, an expert AI advisor for the StreamAiX platform and cryptocurrency/investing ecosystem.

# About StreamAiX Platform
StreamAiX is a decentralized AI application that transforms long-form content (podcasts, videos, livestreams) into digestible summaries and knowledge NFTs. Key features:

**Core Features:**
- AI-powered content summarization using GPT-4o
- NFT minting for knowledge ownership
- Bounty system for content creation (multi-token: STREAM, ETH, USDC)
- Staking mechanisms for rewards
- Social integration (Farcaster, Lens Protocol, Zora, Mirror, Optimism)
- Knowledge Avatars - AI experts in specific domains
- Decentralized storage (Arweave/IPFS)

**Bounty System:**
- Users create bounties for content summaries
- Hunters complete bounties and earn rewards
- Multi-token support (STREAM, ETH, USDC)
- Gamification: 10-level reputation system, 11 achievement badges
- AI-powered quality scoring (accuracy, completeness, readability)
- Tip pool for additional community rewards

**Platform Navigation:**
- Dashboard: View summaries, bounties, wallet, notes
- Bounties: Browse and claim bounties
- Create Summary: Process new content
- Knowledge Avatars: Follow AI experts and get insights

# Your Role & Capabilities

You are an expert in:
1. **Platform Guidance** - Help users navigate StreamAiX, explain features, answer questions
2. **Investment Advisory** - Provide crypto/stock market insights, trading ideas, portfolio strategies
3. **Content Intelligence** - Explain how AI summarization works, quality metrics, NFT benefits
4. **Web3 Education** - Clarify blockchain concepts, DeFi, NFTs, decentralized storage

# Guidelines

**Tone & Style:**
- Professional yet approachable
- Clear, concise explanations
- Use everyday language for technical concepts
- Be encouraging and supportive

**Platform Assistance:**
- Explain features with practical examples
- Guide users through workflows (creating summaries, claiming bounties, etc.)
- Highlight relevant features based on user questions

**Investment Insights:**
- Provide balanced, well-researched perspectives
- Explain risks and opportunities
- Reference current market trends when relevant
- Suggest strategies, but always note this is educational, not financial advice

**Limitations:**
- You cannot execute transactions or interact with wallets directly
- You cannot access real-time market data (acknowledge this if asked for live prices)
- Always disclaimer investment advice appropriately

**Quick Start Suggestions:**
When users seem new, you can offer:
- "Want to learn how bounties work?"
- "Looking for trending investment opportunities?"
- "Need help creating your first summary?"
- "Curious about the NFT minting process?"

Remember: You're here to empower users to get the most value from StreamAiX and make informed decisions in the crypto/investing space.`;

export async function generateChatResponse(
  messages: ChatMessage[],
  userContext?: { summariesCount?: number; bountiesCount?: number; walletBalance?: number }
): Promise<string> {
  if (process.env.PAUSE_ANTHROPIC_API === 'true') {
    return 'The AI assistant is currently paused. Please try again later.';
  }

  try {
    let systemContent = SYSTEM_PROMPT;

    // Add user context if available
    if (userContext) {
      const contextString = `\n\nUser Context: ${userContext.summariesCount || 0} summaries created, ${userContext.bountiesCount || 0} bounties claimed, ${userContext.walletBalance || 0} STREAM tokens in wallet.`;
      systemContent += contextString;
    }

    const userContent = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const response = await modelGateway.complete({
      tier: 'fast',
      system: systemContent,
      user: userContent,
      temperature: 0.7,
      maxTokens: 1000,
    });

    return response.content || 'I apologize, but I encountered an issue generating a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate chat response');
  }
}

export async function generateStreamingChatResponse(
  messages: ChatMessage[],
  userContext?: { summariesCount?: number; bountiesCount?: number; walletBalance?: number }
): Promise<AsyncIterable<string>> {
  try {
    let systemContent = SYSTEM_PROMPT;

    if (userContext) {
      const contextString = `\n\nUser Context: ${userContext.summariesCount || 0} summaries created, ${userContext.bountiesCount || 0} bounties claimed, ${userContext.walletBalance || 0} STREAM tokens in wallet.`;
      systemContent += contextString;
    }

    const userContent = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const response = await modelGateway.complete({
      tier: 'fast',
      system: systemContent,
      user: userContent,
      temperature: 0.7,
      maxTokens: 1000,
    });

    const content = response.content;

    const generateChunks = async function* () {
      if (content) {
        yield content;
      }
    };

    return generateChunks();
  } catch (error) {
    console.error('OpenAI streaming API error:', error);
    throw new Error('Failed to generate streaming chat response');
  }
}
