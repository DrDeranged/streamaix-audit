import type { DatabaseStorage } from "./storage";
import memoizee from "memoizee";

interface AvatarRecommendation {
  avatarId: string;
  score: number;
  reasons: string[];
}

export class RecommendationEngine {
  private similarityCache: Map<string, number> = new Map();
  
  constructor(private storage: DatabaseStorage) {}
  
  // Memoized category similarity calculation
  private calculateCategorySimilarity = memoizee(
    (category: string, followedCategories: string[]): number => {
      return followedCategories.includes(category) ? 30 : 0;
    },
    { maxAge: 5 * 60 * 1000 } // Cache for 5 minutes
  );
  
  // Memoized investment focus overlap calculation
  private calculateFocusOverlap = memoizee(
    (avatarFocus: string[], followedFocus: string[]): string[] => {
      return avatarFocus.filter(focus => followedFocus.includes(focus));
    },
    { maxAge: 5 * 60 * 1000, primitive: true }
  );

  /**
   * Generate personalized avatar recommendations based on user behavior
   */
  async generateRecommendations(userId: string, limit: number = 5): Promise<AvatarRecommendation[]> {
    try {
      // Get user's followed avatars
      const followedAvatars = await this.storage.getUserFollowedAvatars(userId);
      const followedIds = new Set(followedAvatars.map((f: any) => f.avatarId));

      // Get user's interaction history
      const interactions = await this.storage.getUserInteractions(userId);

      // Get all avatars
      const allAvatars = await this.storage.getKnowledgeAvatars();

      // Calculate recommendation scores
      const recommendations: AvatarRecommendation[] = [];

      for (const avatar of allAvatars) {
        // Skip already followed avatars
        if (followedIds.has(avatar.id)) continue;

        const reasons: string[] = [];
        let score = 0;

        // Score based on category similarity (memoized)
        const followedCategories = followedAvatars
          .map((f: any) => allAvatars.find((a: any) => a.id === f.avatarId)?.category)
          .filter((cat): cat is string => Boolean(cat));
        
        if (avatar.category) {
          const categoryScore = this.calculateCategorySimilarity(avatar.category, followedCategories);
          if (categoryScore > 0) {
            score += categoryScore;
            reasons.push(`Similar category to your interests: ${avatar.category}`);
          }
        }

        // Score based on investment focus overlap (memoized)
        const followedInvestmentFocus = followedAvatars
          .flatMap((f: any) => allAvatars.find((a: any) => a.id === f.avatarId)?.investmentFocus || []);
        
        const focusOverlap = this.calculateFocusOverlap(avatar.investmentFocus || [], followedInvestmentFocus);
        
        if (focusOverlap.length > 0) {
          score += focusOverlap.length * 15;
          reasons.push(`Focuses on ${focusOverlap.slice(0, 2).join(', ')}`);
        }

        // Score based on performance metrics
        if (avatar.portfolioRoi && avatar.portfolioRoi > 100) {
          score += 25;
          reasons.push(`Strong portfolio performance: ${avatar.portfolioRoi}% ROI`);
        }

        if (avatar.accuracyPercentage && avatar.accuracyPercentage > 75) {
          score += 20;
          reasons.push(`High prediction accuracy: ${avatar.accuracyPercentage}%`);
        }

        // Score based on risk profile similarity
        if (avatar.riskScore && followedAvatars.length > 0) {
          const avgFollowedRisk = followedAvatars.reduce((sum: number, f: any) => {
            const a = allAvatars.find((av: any) => av.id === f.avatarId);
            return sum + (a?.riskScore || 50);
          }, 0) / followedAvatars.length;

          const riskDiff = Math.abs((avatar.riskScore || 50) - avgFollowedRisk);
          if (riskDiff < 20) {
            score += 15;
            reasons.push('Similar risk profile to your followed entrepreneurs');
          }
        }

        // Score based on trending/influence
        if (avatar.influenceScore && avatar.influenceScore > 80) {
          score += 10;
          reasons.push('Highly influential in crypto space');
        }

        // Bonus for recent activity
        if (avatar.recentActivity && Array.isArray(avatar.recentActivity) && avatar.recentActivity.length > 0) {
          score += 10;
          reasons.push('Recently active with new insights');
        }

        // If user has no follows yet, recommend top performers
        if (followedAvatars.length === 0) {
          score += (avatar.portfolioRoi || 0) * 0.5;
          score += (avatar.accuracyPercentage || 0) * 0.3;
          if (reasons.length === 0) {
            reasons.push('Top performer recommended for you');
          }
        }

        if (score > 0) {
          recommendations.push({
            avatarId: avatar.id,
            score,
            reasons: reasons.slice(0, 3) // Limit to top 3 reasons
          });
        }
      }

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate similar avatars based on a specific avatar
   */
  async getSimilarAvatars(avatarId: string, limit: number = 4): Promise<AvatarRecommendation[]> {
    try {
      const allAvatars = await this.storage.getKnowledgeAvatars();
      const targetAvatar = allAvatars.find((a: any) => a.id === avatarId);
      
      if (!targetAvatar) return [];

      const recommendations: AvatarRecommendation[] = [];

      for (const avatar of allAvatars) {
        if (avatar.id === avatarId) continue;

        const reasons: string[] = [];
        let score = 0;

        // Same category
        if (avatar.category === targetAvatar.category) {
          score += 40;
          reasons.push(`Both focus on ${avatar.category}`);
        }

        // Investment focus overlap
        const focusOverlap = (avatar.investmentFocus || []).filter(
          (focus: string) => (targetAvatar.investmentFocus || []).includes(focus)
        );
        
        if (focusOverlap.length > 0) {
          score += focusOverlap.length * 20;
          reasons.push(`Similar investment areas: ${focusOverlap.slice(0, 2).join(', ')}`);
        }

        // Similar risk profile
        const riskDiff = Math.abs((avatar.riskScore || 50) - (targetAvatar.riskScore || 50));
        if (riskDiff < 15) {
          score += 25;
          reasons.push('Similar risk approach');
        }

        // Similar performance level
        const roiDiff = Math.abs((avatar.portfolioRoi || 0) - (targetAvatar.portfolioRoi || 0));
        if (roiDiff < 50) {
          score += 15;
          reasons.push('Comparable track record');
        }

        if (score > 0) {
          recommendations.push({
            avatarId: avatar.id,
            score,
            reasons: reasons.slice(0, 3)
          });
        }
      }

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error finding similar avatars:', error);
      return [];
    }
  }

  /**
   * Get trending avatars based on recent activity and performance
   */
  async getTrendingAvatars(limit: number = 6): Promise<string[]> {
    try {
      const allAvatars = await this.storage.getKnowledgeAvatars();

      const scored = allAvatars.map((avatar: any) => {
        let score = 0;

        // Recent activity
        if (avatar.recentActivity && Array.isArray(avatar.recentActivity)) {
          score += avatar.recentActivity.length * 10;
        }

        // Performance
        score += (avatar.portfolioRoi || 0) * 0.3;
        score += (avatar.accuracyPercentage || 0) * 0.5;
        score += (avatar.influenceScore || 0) * 0.8;

        return { id: avatar.id, score };
      });

      return scored
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit)
        .map((s: any) => s.id);

    } catch (error) {
      console.error('Error getting trending avatars:', error);
      return [];
    }
  }
}
