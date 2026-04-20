import { openai as lazyOpenai } from "../lib/openaiClient";
const openai = lazyOpenai;
import { db } from '../db';
import { knowledgeAvatars, avatarConversations, type KnowledgeAvatar, type AvatarConversation } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// openai client provided by lib/openaiClient (lazy, throws clear error if OPENAI_API_KEY missing)

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function buildAvatarSystemPrompt(avatar: KnowledgeAvatar): string {
  const expertiseList = Array.isArray(avatar.expertise) ? avatar.expertise.join(', ') : avatar.expertise;
  const philosophicalViews = Array.isArray(avatar.philosophicalViews) ? avatar.philosophicalViews.join('. ') : (avatar.philosophicalViews || '');
  
  return `You are ${avatar.name}, a Knowledge Avatar on the StreamAiX platform. You embody the expertise and personality of a real expert in ${expertiseList}.

# Your Identity
- **Name**: ${avatar.name}
- **Expertise**: ${expertiseList}
- **Bio**: ${avatar.bio || 'A leading expert in my field.'}
- **Philosophical Views**: ${philosophicalViews}
- **Investment Thesis**: ${avatar.investmentThesis || 'Build long-term value through informed decisions.'}
- **Trading Style**: ${avatar.tradingStyle || 'balanced'}
- **Risk Tolerance**: ${avatar.riskTolerance || 'moderate'}
- **Market Outlook**: ${avatar.marketOutlook || 'cautiously optimistic'}
- **Decision Bias**: ${avatar.decisionBias || 'data-driven'}

# Your Personality
You speak with authority and passion about your areas of expertise. Your responses reflect your unique philosophical views and investment thesis. You're here to educate, share insights, and help users understand complex topics through your distinctive lens.

# Communication Style
- Speak in first person as ${avatar.name}
- Reference your expertise and philosophy naturally
- Be conversational but insightful
- Share specific examples and actionable insights when relevant
- Your responses should feel like talking to the real expert
- Keep responses focused and valuable (2-4 paragraphs max unless the user asks for detail)

# Guidelines
- Stay in character at all times
- When asked about markets/investments, reflect your ${avatar.riskTolerance} risk tolerance and ${avatar.tradingStyle} trading style
- Share your ${avatar.marketOutlook} market outlook when relevant
- Reference your philosophical views to add depth
- If asked about topics outside your expertise, acknowledge it but offer your perspective
- Always note that investment advice is educational, not financial advice

# Context
You're chatting with a StreamAiX user who wants to learn from your expertise and perspective. They've chosen to chat with you specifically because of your unique insights.`;
}

export async function getOrCreateConversation(
  userId: string, 
  avatarId: string
): Promise<AvatarConversation> {
  const existing = await db
    .select()
    .from(avatarConversations)
    .where(and(
      eq(avatarConversations.userId, userId),
      eq(avatarConversations.avatarId, avatarId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [newConversation] = await db
    .insert(avatarConversations)
    .values({
      userId,
      avatarId,
      messages: [],
      title: null,
    })
    .returning();

  return newConversation;
}

export async function generateAvatarChatResponse(
  avatarId: string,
  userId: string,
  userMessage: string
): Promise<{ response: string; conversationId: string }> {
  if (process.env.PAUSE_OPENAI_API === 'true') {
    return {
      response: 'The AI chat is currently paused for maintenance. Please try again later.',
      conversationId: '',
    };
  }

  const [avatar] = await db
    .select()
    .from(knowledgeAvatars)
    .where(eq(knowledgeAvatars.id, avatarId))
    .limit(1);

  if (!avatar) {
    throw new Error('Avatar not found');
  }

  const conversation = await getOrCreateConversation(userId, avatarId);
  const existingMessages = (conversation.messages as ChatMessage[]) || [];

  const newUserMessage: ChatMessage = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString(),
  };

  const messagesForAI = existingMessages.slice(-10).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  messagesForAI.push({
    role: 'user' as const,
    content: userMessage,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: buildAvatarSystemPrompt(avatar) },
        ...messagesForAI,
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0]?.message?.content || 
      "I'm having trouble formulating a response right now. Please try again.";

    const newAssistantMessage: ChatMessage = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...existingMessages, newUserMessage, newAssistantMessage];

    await db
      .update(avatarConversations)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
        title: updatedMessages.length <= 2 ? userMessage.slice(0, 100) : conversation.title,
      })
      .where(eq(avatarConversations.id, conversation.id));

    return {
      response: assistantMessage,
      conversationId: conversation.id,
    };
  } catch (error) {
    console.error('Avatar chat error:', error);
    throw new Error('Failed to generate response');
  }
}

export async function getConversationHistory(
  userId: string,
  avatarId: string
): Promise<ChatMessage[]> {
  const conversation = await db
    .select()
    .from(avatarConversations)
    .where(and(
      eq(avatarConversations.userId, userId),
      eq(avatarConversations.avatarId, avatarId)
    ))
    .limit(1);

  if (conversation.length === 0) {
    return [];
  }

  return (conversation[0].messages as ChatMessage[]) || [];
}

export async function clearConversation(
  userId: string,
  avatarId: string
): Promise<void> {
  await db
    .update(avatarConversations)
    .set({
      messages: [],
      updatedAt: new Date(),
    })
    .where(and(
      eq(avatarConversations.userId, userId),
      eq(avatarConversations.avatarId, avatarId)
    ));
}
