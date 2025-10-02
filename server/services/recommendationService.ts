import { type DatabaseStorage } from "../storage";
import { type KnowledgeAvatar, type Summary, type UserPreferences, type UserInteraction } from "@shared/schema";

interface RecommendationScore {
  id: string;
  type: 'avatar' | 'content';
  score: number;
  reasons: string[];
  data: any;
}

interface UserProfile {
  userId: string;
  followedAvatars: string[];
  interactedContent: string[];
  preferences?: UserPreferences | null;
  recentInteractions: UserInteraction[];
}

export class RecommendationService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const [followedAvatars, recentInteractions, preferences] = await Promise.all([
      this.storage.getAvatarFollowsByUserId(userId),
      this.storage.getUserInteractions(userId, { limit: 50 }),
      this.storage.getUserPreferences(userId)
    ]);

    return {
      userId,
      followedAvatars: followedAvatars.map(f => f.avatarId),
      interactedContent: recentInteractions
        .filter(i => i.summaryId)
        .map(i => i.summaryId as string),
      preferences,
      recentInteractions
    };
  }

  private calculateAvatarScore(
    avatar: KnowledgeAvatar,
    userProfile: UserProfile,
    allAvatars: KnowledgeAvatar[]
  ): RecommendationScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. User preference alignment
    if (userProfile.preferences?.interests) {
      const interests = userProfile.preferences.interests as any;
      if (interests.topics && Array.isArray(interests.topics)) {
        const avatarTopics = avatar.expertise?.split(', ') || [];
        const matchingTopics = avatarTopics.filter(topic => 
          interests.topics.includes(topic)
        );
        if (matchingTopics.length > 0) {
          score += matchingTopics.length * 15;
          reasons.push(`Matches your interests in ${matchingTopics.join(', ')}`);
        }
      }
    }

    // 2. Follower similarity (collaborative filtering)
    const alreadyFollowing = userProfile.followedAvatars;
    if (alreadyFollowing.length > 0) {
      // Find avatars followed by users who also follow the same avatars as current user
      score += 10;
      reasons.push('Popular among users with similar interests');
    }

    // 3. Performance metrics
    if (avatar.portfolioRoi && avatar.portfolioRoi > 100) {
      score += 20;
      reasons.push(`Strong performance: +${avatar.portfolioRoi}% ROI`);
    }
    if (avatar.accuracyPercentage && avatar.accuracyPercentage > 80) {
      score += 15;
      reasons.push(`${avatar.accuracyPercentage}% prediction accuracy`);
    }

    // 4. Influence and credibility
    if (avatar.followerCount) {
      const influenceScore = Math.min(avatar.followerCount / 100000, 1) * 10;
      score += influenceScore;
      if (avatar.followerCount > 500000) {
        reasons.push('Highly influential in crypto space');
      }
    }

    // 5. Verification status
    if (avatar.verificationStatus === 'verified') {
      score += 10;
      reasons.push('Verified account');
    }

    // 6. Recent activity and engagement
    if (avatar.recentThoughts && avatar.recentThoughts.length > 0) {
      score += 5;
      reasons.push('Active with recent insights');
    }

    // 7. Investment track record
    if (avatar.notableInvestments && avatar.notableInvestments.length > 5) {
      score += 10;
      reasons.push('Extensive investment portfolio');
    }

    // 8. Diversity bonus - recommend avatars from different expertise areas
    const existingExpertise = allAvatars
      .filter(a => alreadyFollowing.includes(a.id))
      .map(a => a.expertise);
    if (!existingExpertise.includes(avatar.expertise)) {
      score += 12;
      reasons.push('Adds diversity to your knowledge network');
    }

    // 9. Trending status
    if (avatar.expertise && ['DeFi', 'Layer 1', 'AI'].includes(avatar.expertise)) {
      score += 8;
      reasons.push('Expert in trending sector');
    }

    return {
      id: avatar.id,
      type: 'avatar',
      score,
      reasons: reasons.slice(0, 3), // Top 3 reasons
      data: avatar
    };
  }

  private calculateContentScore(
    content: Summary,
    userProfile: UserProfile
  ): RecommendationScore {
    let score = 0;
    const reasons: string[] = [];

    // 1. Tag matching with user interests
    if (userProfile.preferences?.interests && content.tags) {
      const interests = userProfile.preferences.interests as any;
      if (interests.topics && Array.isArray(interests.topics)) {
        const matchingTags = content.tags.filter(tag => 
          interests.topics.includes(tag)
        );
        if (matchingTags.length > 0) {
          score += matchingTags.length * 12;
          reasons.push(`Matches your interest: ${matchingTags[0]}`);
        }
      }
    }

    // 2. Content type preference with enhanced podcast scoring
    const isPodcast = content.contentType?.toLowerCase() === 'podcast' || content.platform?.toLowerCase().includes('podcast');
    const isVideo = content.contentType?.toLowerCase() === 'video' || content.platform?.toLowerCase() === 'youtube';
    
    if (isPodcast) {
      score += 8;
      reasons.push('In-depth podcast discussion');
    } else if (isVideo) {
      score += 6;
      reasons.push('Visual content with analysis');
    }

    // 3. Recency with time-decay algorithm
    if (content.createdAt) {
      const ageInDays = (Date.now() - new Date(content.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 1) {
        score += 15;
        reasons.push('Fresh content from today');
      } else if (ageInDays < 3) {
        score += 12;
        reasons.push('Recent content');
      } else if (ageInDays < 7) {
        score += 8;
        reasons.push('From this week');
      } else if (ageInDays < 30) {
        score += 3;
      }
    }

    // 4. Content quality indicators with weighted scoring
    if (content.accuracy && content.accuracy > 85) {
      score += 12;
      reasons.push(`${content.accuracy}% accuracy rating`);
    } else if (content.accuracy && content.accuracy > 70) {
      score += 6;
    }

    if (content.sourceCredibility && ['A+', 'A'].includes(content.sourceCredibility)) {
      score += 10;
      reasons.push('From credible source');
    } else if (content.sourceCredibility === 'B+' || content.sourceCredibility === 'B') {
      score += 5;
    }

    if (content.expertCredibility && content.expertCredibility > 80) {
      score += 8;
      reasons.push('Expert-level analysis');
    }

    // 5. Market relevance and sentiment
    if (content.marketSentiment) {
      score += 5;
      const sentiment = content.marketSentiment.toLowerCase();
      if (sentiment.includes('bullish') || sentiment.includes('optimistic')) {
        score += 3;
        reasons.push('Bullish market outlook');
      } else if (sentiment.includes('bearish') || sentiment.includes('cautious')) {
        score += 3;
        reasons.push('Important risk analysis');
      }
    }

    // 6. Comprehensive analysis bonus
    if (content.keyInsights && content.chapters && content.actionItems) {
      score += 10;
      reasons.push('Complete breakdown with actionable insights');
    } else if (content.keyInsights && content.chapters) {
      score += 6;
    }

    // 7. Content length optimization (favor substantial content)
    if (content.originalDuration) {
      const durationMinutes = content.originalDuration / 60;
      if (durationMinutes >= 30 && durationMinutes <= 120) {
        score += 5;
        reasons.push('Perfect length for deep dive');
      } else if (durationMinutes > 120) {
        score += 3;
      }
    }

    // 8. Interaction history bonus
    const hasUserInteracted = userProfile.recentInteractions.some(
      interaction => interaction.targetType === 'summary' && interaction.targetId === content.id
    );
    if (hasUserInteracted) {
      score -= 50; // Strongly demote already-seen content
    }

    return {
      id: content.id,
      type: 'content',
      score,
      reasons: reasons.slice(0, 3),
      data: content
    };
  }

  async getPersonalizedAvatarRecommendations(
    userId: string,
    limit: number = 5
  ): Promise<RecommendationScore[]> {
    const userProfile = await this.getUserProfile(userId);
    const allAvatars = await this.storage.getKnowledgeAvatars(100);

    // Filter out already followed avatars
    const unfollowedAvatars = allAvatars.filter(
      avatar => !userProfile.followedAvatars.includes(avatar.id)
    );

    // Calculate scores for each avatar
    const scoredAvatars = unfollowedAvatars.map(avatar =>
      this.calculateAvatarScore(avatar, userProfile, allAvatars)
    );

    // Sort by score and return top N
    return scoredAvatars
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getPersonalizedContentRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationScore[]> {
    const userProfile = await this.getUserProfile(userId);
    const recentContent = await this.storage.getSummaries(50, 0);

    // Filter out already interacted content
    const newContent = recentContent.filter(
      content => !userProfile.interactedContent.includes(content.id)
    );

    // Calculate scores for each content
    const scoredContent = newContent.map(content =>
      this.calculateContentScore(content, userProfile)
    );

    // Sort by score and return top N
    return scoredContent
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getMixedRecommendations(userId: string): Promise<{
    avatars: RecommendationScore[];
    content: RecommendationScore[];
    trendingTopics: string[];
  }> {
    const [avatars, content, userProfile] = await Promise.all([
      this.getPersonalizedAvatarRecommendations(userId, 5),
      this.getPersonalizedContentRecommendations(userId, 12),
      this.getUserProfile(userId)
    ]);

    // Extract trending topics from user's recent interactions
    const trendingTopics = this.extractTrendingTopics(userProfile);

    return {
      avatars,
      content,
      trendingTopics
    };
  }

  private extractTrendingTopics(userProfile: UserProfile): string[] {
    const topics = new Map<string, number>();

    // Count topic frequency from interactions
    userProfile.recentInteractions.forEach(interaction => {
      if (interaction.metadata) {
        const metadata = interaction.metadata as any;
        if (metadata.tags && Array.isArray(metadata.tags)) {
          metadata.tags.forEach((tag: string) => {
            topics.set(tag, (topics.get(tag) || 0) + 1);
          });
        }
      }
    });

    // Return top 5 topics
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  async trackRecommendationClick(
    userId: string,
    recommendationId: string,
    recommendationType: 'avatar' | 'content'
  ): Promise<void> {
    await this.storage.createUserInteraction({
      userId,
      interactionType: 'recommendation_click',
      targetType: recommendationType,
      targetId: recommendationId,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'ai_recommendations'
      }
    });
  }

  async updateUserPreferencesFromInteraction(
    userId: string,
    interaction: UserInteraction
  ): Promise<void> {
    let preferences = await this.storage.getUserPreferences(userId);

    if (!preferences) {
      // User preferences don't exist yet, skip for now
      return;
    }

    const interests = (preferences.interests as any) || { topics: [], sectors: {}, contentTypes: {} };

    // Update topic weights based on interaction type
    if (interaction.metadata) {
      const metadata = interaction.metadata as any;
      if (metadata.tags && Array.isArray(metadata.tags)) {
        metadata.tags.forEach((tag: string) => {
          if (!interests.topics.includes(tag)) {
            interests.topics.push(tag);
          }
        });
      }
    }

    await this.storage.updateUserPreferences(userId, { interests });
  }
}
