/**
 * API Cost Tracker Service
 * Tracks API usage and costs across all external services
 */

interface ApiCall {
  service: string;
  endpoint: string;
  timestamp: Date;
  cost: number;
  tokens?: number;
  model?: string;
}

interface ServiceCosts {
  openai: {
    gpt4o: { calls: number; inputTokens: number; outputTokens: number; cost: number };
    gpt4oMini: { calls: number; inputTokens: number; outputTokens: number; cost: number };
    whisper: { calls: number; minutes: number; cost: number };
    tts: { calls: number; characters: number; cost: number };
  };
  coingecko: { calls: number; cost: number };
  finnhub: { calls: number; cost: number };
  resend: { emails: number; cost: number };
  dune: { calls: number; cost: number };
  coinmarketcap: { calls: number; cost: number };
}

interface CostSummary {
  currentMonth: {
    total: number;
    breakdown: Record<string, number>;
  };
  projectedMonth: number;
  lastUpdated: Date;
  services: ServiceCosts;
}

class ApiCostTracker {
  private costs: ServiceCosts;
  private monthStart: Date;
  private recentCalls: ApiCall[] = [];

  // Pricing (as of 2024)
  private pricing = {
    openai: {
      'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // per 1K tokens
      'whisper': 0.006, // per minute
      'tts-1': 0.015, // per 1K characters
      'tts-1-hd': 0.030 // per 1K characters
    },
    coingecko: 0, // Pro plan is $129/month fixed
    finnhub: 0, // Free tier
    resend: 0.001, // ~$1 per 1000 emails
    dune: 0, // Depends on plan
    coinmarketcap: 0 // Free tier
  };

  constructor() {
    this.monthStart = new Date();
    this.monthStart.setDate(1);
    this.monthStart.setHours(0, 0, 0, 0);
    
    this.costs = this.getEmptyCosts();
    this.loadFromStorage();
  }

  private getEmptyCosts(): ServiceCosts {
    return {
      openai: {
        gpt4o: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        gpt4oMini: { calls: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
        whisper: { calls: 0, minutes: 0, cost: 0 },
        tts: { calls: 0, characters: 0, cost: 0 }
      },
      coingecko: { calls: 0, cost: 0 },
      finnhub: { calls: 0, cost: 0 },
      resend: { emails: 0, cost: 0 },
      dune: { calls: 0, cost: 0 },
      coinmarketcap: { calls: 0, cost: 0 }
    };
  }

  private loadFromStorage(): void {
    // In production, this would load from database
    // For now, we track in-memory with estimates based on replit.md
  }

  private checkMonthReset(): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const storedMonth = this.monthStart.getMonth();
    
    if (currentMonth !== storedMonth) {
      this.costs = this.getEmptyCosts();
      this.monthStart = new Date();
      this.monthStart.setDate(1);
      this.monthStart.setHours(0, 0, 0, 0);
      this.recentCalls = [];
    }
  }

  /**
   * Track OpenAI GPT-4o call
   */
  trackGpt4o(inputTokens: number, outputTokens: number): void {
    this.checkMonthReset();
    const cost = (inputTokens / 1000) * this.pricing.openai['gpt-4o'].input +
                 (outputTokens / 1000) * this.pricing.openai['gpt-4o'].output;
    
    this.costs.openai.gpt4o.calls++;
    this.costs.openai.gpt4o.inputTokens += inputTokens;
    this.costs.openai.gpt4o.outputTokens += outputTokens;
    this.costs.openai.gpt4o.cost += cost;
    
    this.recordCall('openai', 'gpt-4o', cost, inputTokens + outputTokens);
  }

  /**
   * Track OpenAI GPT-4o-mini call
   */
  trackGpt4oMini(inputTokens: number, outputTokens: number): void {
    this.checkMonthReset();
    const cost = (inputTokens / 1000) * this.pricing.openai['gpt-4o-mini'].input +
                 (outputTokens / 1000) * this.pricing.openai['gpt-4o-mini'].output;
    
    this.costs.openai.gpt4oMini.calls++;
    this.costs.openai.gpt4oMini.inputTokens += inputTokens;
    this.costs.openai.gpt4oMini.outputTokens += outputTokens;
    this.costs.openai.gpt4oMini.cost += cost;
    
    this.recordCall('openai', 'gpt-4o-mini', cost, inputTokens + outputTokens);
  }

  /**
   * Track OpenAI Whisper call
   */
  trackWhisper(minutes: number): void {
    this.checkMonthReset();
    const cost = minutes * this.pricing.openai.whisper;
    
    this.costs.openai.whisper.calls++;
    this.costs.openai.whisper.minutes += minutes;
    this.costs.openai.whisper.cost += cost;
    
    this.recordCall('openai', 'whisper', cost);
  }

  /**
   * Track OpenAI TTS call
   */
  trackTts(characters: number, hd: boolean = false): void {
    this.checkMonthReset();
    const rate = hd ? this.pricing.openai['tts-1-hd'] : this.pricing.openai['tts-1'];
    const cost = (characters / 1000) * rate;
    
    this.costs.openai.tts.calls++;
    this.costs.openai.tts.characters += characters;
    this.costs.openai.tts.cost += cost;
    
    this.recordCall('openai', 'tts', cost);
  }

  /**
   * Track CoinGecko API call
   */
  trackCoinGecko(): void {
    this.checkMonthReset();
    this.costs.coingecko.calls++;
    this.recordCall('coingecko', 'api', 0);
  }

  /**
   * Track Finnhub API call
   */
  trackFinnhub(): void {
    this.checkMonthReset();
    this.costs.finnhub.calls++;
    this.recordCall('finnhub', 'api', 0);
  }

  /**
   * Track Resend email
   */
  trackResend(emailCount: number = 1): void {
    this.checkMonthReset();
    const cost = emailCount * this.pricing.resend;
    
    this.costs.resend.emails += emailCount;
    this.costs.resend.cost += cost;
    
    this.recordCall('resend', 'email', cost);
  }

  /**
   * Track Dune Analytics call
   */
  trackDune(): void {
    this.checkMonthReset();
    this.costs.dune.calls++;
    this.recordCall('dune', 'api', 0);
  }

  /**
   * Track CoinMarketCap call
   */
  trackCoinMarketCap(): void {
    this.checkMonthReset();
    this.costs.coinmarketcap.calls++;
    this.recordCall('coinmarketcap', 'api', 0);
  }

  private recordCall(service: string, endpoint: string, cost: number, tokens?: number): void {
    this.recentCalls.push({
      service,
      endpoint,
      timestamp: new Date(),
      cost,
      tokens
    });
    
    // Keep only last 1000 calls
    if (this.recentCalls.length > 1000) {
      this.recentCalls = this.recentCalls.slice(-1000);
    }
  }

  /**
   * Get cost summary
   */
  getSummary(): CostSummary {
    this.checkMonthReset();
    
    const openaiTotal = 
      this.costs.openai.gpt4o.cost +
      this.costs.openai.gpt4oMini.cost +
      this.costs.openai.whisper.cost +
      this.costs.openai.tts.cost;
    
    const total = openaiTotal + this.costs.resend.cost;
    
    // Calculate days elapsed in month
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const dailyRate = daysElapsed > 0 ? total / daysElapsed : 0;
    const projectedMonth = dailyRate * daysInMonth;
    
    return {
      currentMonth: {
        total,
        breakdown: {
          'OpenAI GPT-4o': this.costs.openai.gpt4o.cost,
          'OpenAI GPT-4o-mini': this.costs.openai.gpt4oMini.cost,
          'OpenAI Whisper': this.costs.openai.whisper.cost,
          'OpenAI TTS': this.costs.openai.tts.cost,
          'Resend': this.costs.resend.cost,
          'CoinGecko Pro': 129, // Fixed monthly cost
        }
      },
      projectedMonth: projectedMonth + 129, // Add CoinGecko fixed cost
      lastUpdated: new Date(),
      services: this.costs
    };
  }

  /**
   * Get recent API calls
   */
  getRecentCalls(limit: number = 50): ApiCall[] {
    return this.recentCalls.slice(-limit).reverse();
  }

  /**
   * Get estimated monthly budget based on replit.md
   */
  getEstimatedBudget(): { openai: number; coingecko: number; total: number } {
    return {
      openai: 25, // $15-25 as per replit.md
      coingecko: 129,
      total: 154
    };
  }
}

export const apiCostTracker = new ApiCostTracker();
