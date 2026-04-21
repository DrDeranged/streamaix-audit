import { db } from '../db';
import { conversations, users, autonomousSystemLogs } from '@shared/schema';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';
import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

export class AICommunityManager {
  private isRunning: boolean = false;
  private aiUserId: string | null = null;

  constructor() {
    console.log('👥 AI Community Manager initialized');
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️  Community manager already running');
      return;
    }

    if (process.env.PAUSE_OPENAI_API === 'true') {
      console.log('👥 [Community Manager] ⏸️ OpenAI API paused - community manager disabled');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting AI Community Manager service...');

    try {
      await this.initializeCommunityBot();
    } catch (err) {
      console.error('⚠️  Community manager initialization failed (will continue):', err);
    }

    while (this.isRunning) {
      try {
        await this.manageCommunity();

        // Run every 8 hours (MAJOR COST OPTIMIZATION: 4x reduction)
        const delayMs = 8 * 60 * 60 * 1000;
        console.log(`⏱️  Community manager sleeping for 8 hours...`);
        await this.sleep(delayMs);

      } catch (error) {
        console.error('❌ Error in community manager:', error);
        await this.sleep(60000);
      }
    }
  }

  stop() {
    console.log('🛑 Stopping AI Community Manager...');
    this.isRunning = false;
  }

  private async initializeCommunityBot() {
    const [existingBot] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'AI_Community_Manager'))
      .limit(1);

    if (existingBot) {
      this.aiUserId = existingBot.id;
      console.log(`✅ Using existing community manager: ${existingBot.id}`);
    } else {
      const [newBot] = await db.insert(users).values({
        username: 'AI_Community_Manager',
        isAiAgent: true,
        streamPoints: 1000000,
        avatar: '👥',
        bio: 'Autonomous AI community manager - here to help, answer questions, and keep discussions engaging!',
        agentPersonality: {
          role: 'community_manager',
          traits: ['helpful', 'friendly', 'knowledgeable'],
        },
      }).returning();

      this.aiUserId = newBot.id;
      console.log(`✅ Created new community manager: ${newBot.id}`);
    }
  }

  private async manageCommunity() {
    const startTime = Date.now();
    console.log('\n👥 === Community Management Cycle Starting ===');

    if (!this.aiUserId) {
      console.error('❌ AI user not initialized');
      return;
    }

    // Find unanswered questions (posts without replies)
    const unansweredPosts = await db
      .select()
      .from(conversations)
      .where(
        and(
          isNull(conversations.parentId),
          eq(conversations.commentsCount, 0)
        )
      )
      .orderBy(desc(conversations.createdAt))
      .limit(5);

    console.log(`💬 Found ${unansweredPosts.length} unanswered posts`);

    let responded = 0;
    let failed = 0;

    for (const post of unansweredPosts) {
      try {
        // Check if AI has already responded
        const existingReply = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.parentId, post.id),
              eq(conversations.authorId, this.aiUserId!)
            )
          )
          .limit(1);

        if (existingReply.length > 0) {
          console.log(`⏭️  Already responded to: "${post.content.substring(0, 50)}..."`);
          continue;
        }

        console.log(`\n💬 Responding to: "${post.content.substring(0, 50)}..."`);

        // Generate helpful response
        const response = await this.generateResponse(post);

        // Post reply
        await this.postReply(post, response);

        console.log(`✅ Posted reply to ${post.authorId}`);
        responded++;

        await this.logAction('community_manager', 'replied_to_post', 'success', post.id, {
          originalContent: post.content.substring(0, 100),
        }, response);

        // Delay between responses
        await this.sleep(3000);

      } catch (error: any) {
        console.error(`❌ Failed to respond to post ${post.id}:`, error.message);
        failed++;
        await this.logAction('community_manager', 'reply_failed', 'failed', post.id, {}, undefined, error.message);
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`\n📊 Community Management Summary:`);
    console.log(`   ✅ Responded: ${responded}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Time: ${(executionTime / 1000).toFixed(1)}s`);
  }

  private async generateResponse(post: any): Promise<string> {
    const prompt = `You are a friendly AI community manager for StreamAiX, a crypto prediction market and content platform.

User posted: "${post.content}"

Generate a helpful, friendly reply that:
- Answers their question if it's a question
- Adds value to the discussion
- Is concise (2-3 sentences max)
- Uses crypto/Web3 knowledge when relevant
- Is encouraging and welcoming

Keep it natural and conversational. Don't be overly formal or robotic.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // COST OPTIMIZATION: 90% cheaper for community replies
      messages: [
        { role: "system", content: "You are a helpful community manager. Be friendly and concise." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return completion.choices[0].message.content?.trim() || "Thanks for sharing!";
  }

  private async postReply(post: any, content: string) {
    await db.insert(conversations).values({
      authorId: this.aiUserId!,
      content,
      parentId: post.id,
      linkedSummaryId: post.linkedSummaryId,
      linkedMarketId: post.linkedMarketId,
      linkedBountyId: post.linkedBountyId,
      isPublic: true,
    });

    // Update parent comment count
    await db
      .update(conversations)
      .set({
        commentsCount: sql`${conversations.commentsCount} + 1`,
      })
      .where(eq(conversations.id, post.id));
  }

  private async logAction(
    systemName: string,
    actionType: string,
    status: 'success' | 'failed' | 'partial',
    targetId?: string,
    metadata?: any,
    reasoning?: string,
    errorMessage?: string
  ) {
    try {
      await db.insert(autonomousSystemLogs).values({
        systemName,
        actionType,
        status,
        targetId,
        metadata,
        reasoning,
        errorMessage,
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiCommunityManager = new AICommunityManager();
