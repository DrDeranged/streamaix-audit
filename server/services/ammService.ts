/**
 * AMM (Automated Market Maker) Service
 * Implements constant product formula (x * y = k) for prediction market pricing
 */

const FEE_RATE = 50; // 0.5% fee in basis points
const BASIS_POINTS = 10000;

export class AMMService {
  /**
   * Calculate output amount for a swap using constant product formula
   * Formula: amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
   */
  calculateSwapOutput(
    amountIn: number,
    reserveIn: number,
    reserveOut: number,
    withFee: boolean = true
  ): number {
    if (amountIn <= 0) throw new Error('Amount must be positive');
    if (reserveIn <= 0 || reserveOut <= 0) throw new Error('Insufficient liquidity');
    
    let effectiveAmountIn = amountIn;
    
    if (withFee) {
      // Apply 0.5% fee
      const fee = Math.floor((amountIn * FEE_RATE) / BASIS_POINTS);
      effectiveAmountIn = amountIn - fee;
    }
    
    // Constant product formula
    const numerator = effectiveAmountIn * reserveOut;
    const denominator = reserveIn + effectiveAmountIn;
    
    return Math.floor(numerator / denominator);
  }

  /**
   * Calculate price impact of a trade
   * Returns percentage impact (0-100)
   */
  calculatePriceImpact(
    amountIn: number,
    reserveIn: number,
    reserveOut: number
  ): number {
    const amountOut = this.calculateSwapOutput(amountIn, reserveIn, reserveOut);
    
    const priceBefore = reserveOut / reserveIn;
    const priceAfter = (reserveOut - amountOut) / (reserveIn + amountIn);
    
    const impact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100;
    return Math.min(impact, 100); // Cap at 100%
  }

  /**
   * Calculate current market price in basis points (0-10000)
   * Price represents probability: 5000 = 50%, 7500 = 75%, etc.
   */
  calculateMarketPrice(
    yesReserve: number,
    noReserve: number,
    forYes: boolean = true
  ): number {
    const totalReserves = yesReserve + noReserve;
    if (totalReserves === 0) return 5000; // 50/50 if no liquidity
    
    // YES price = noReserve / totalReserves (inverse relationship)
    // NO price = yesReserve / totalReserves
    if (forYes) {
      return Math.floor((noReserve * BASIS_POINTS) / totalReserves);
    } else {
      return Math.floor((yesReserve * BASIS_POINTS) / totalReserves);
    }
  }

  /**
   * Calculate both YES and NO prices
   */
  calculateBothPrices(yesReserve: number, noReserve: number): {
    yesPrice: number;
    noPrice: number;
  } {
    return {
      yesPrice: this.calculateMarketPrice(yesReserve, noReserve, true),
      noPrice: this.calculateMarketPrice(yesReserve, noReserve, false),
    };
  }

  /**
   * Calculate expected tokens received for buying a position
   */
  calculateBuyTokens(
    amountIn: number,
    isYes: boolean,
    yesReserve: number,
    noReserve: number
  ): {
    tokensOut: number;
    newYesReserve: number;
    newNoReserve: number;
    fee: number;
    priceImpact: number;
  } {
    const fee = Math.floor((amountIn * FEE_RATE) / BASIS_POINTS);
    const amountAfterFee = amountIn - fee;
    
    let tokensOut: number;
    let newYesReserve: number;
    let newNoReserve: number;
    
    if (isYes) {
      tokensOut = this.calculateSwapOutput(amountAfterFee, noReserve, yesReserve, false);
      newYesReserve = yesReserve - tokensOut;
      newNoReserve = noReserve + amountAfterFee;
    } else {
      tokensOut = this.calculateSwapOutput(amountAfterFee, yesReserve, noReserve, false);
      newYesReserve = yesReserve + amountAfterFee;
      newNoReserve = noReserve - tokensOut;
    }
    
    const priceImpact = this.calculatePriceImpact(
      amountAfterFee,
      isYes ? noReserve : yesReserve,
      isYes ? yesReserve : noReserve
    );
    
    return {
      tokensOut,
      newYesReserve,
      newNoReserve,
      fee,
      priceImpact,
    };
  }

  /**
   * Calculate expected STREAM received for selling a position
   */
  calculateSellTokens(
    tokensIn: number,
    isYes: boolean,
    yesReserve: number,
    noReserve: number
  ): {
    amountOut: number;
    newYesReserve: number;
    newNoReserve: number;
    fee: number;
    priceImpact: number;
  } {
    let amountOut: number;
    let newYesReserve: number;
    let newNoReserve: number;
    
    if (isYes) {
      amountOut = this.calculateSwapOutput(tokensIn, yesReserve, noReserve, false);
      newYesReserve = yesReserve + tokensIn;
      newNoReserve = noReserve - amountOut;
    } else {
      amountOut = this.calculateSwapOutput(tokensIn, noReserve, yesReserve, false);
      newYesReserve = yesReserve - amountOut;
      newNoReserve = noReserve + tokensIn;
    }
    
    const fee = Math.floor((amountOut * FEE_RATE) / BASIS_POINTS);
    const amountAfterFee = amountOut - fee;
    
    const priceImpact = this.calculatePriceImpact(
      tokensIn,
      isYes ? yesReserve : noReserve,
      isYes ? noReserve : yesReserve
    );
    
    return {
      amountOut: amountAfterFee,
      newYesReserve,
      newNoReserve,
      fee,
      priceImpact,
    };
  }

  /**
   * Calculate slippage tolerance
   * Returns minimum acceptable output amount
   */
  calculateMinOutput(
    expectedOutput: number,
    slippageBps: number = 100 // 1% default
  ): number {
    const slippageMultiplier = (BASIS_POINTS - slippageBps) / BASIS_POINTS;
    return Math.floor(expectedOutput * slippageMultiplier);
  }

  /**
   * Calculate liquidity pool shares for adding liquidity
   */
  calculateLPShares(
    amountIn: number,
    yesReserve: number,
    noReserve: number,
    totalShares: number
  ): number {
    if (totalShares === 0) {
      // Initial liquidity
      return amountIn;
    }
    
    const totalReserves = yesReserve + noReserve;
    return Math.floor((amountIn * totalShares) / totalReserves);
  }

  /**
   * Calculate amount received for removing liquidity
   */
  calculateLPWithdraw(
    shares: number,
    yesReserve: number,
    noReserve: number,
    totalShares: number
  ): number {
    if (totalShares === 0) return 0;
    
    const totalReserves = yesReserve + noReserve;
    return Math.floor((shares * totalReserves) / totalShares);
  }

  /**
   * Estimate potential profit/loss for a position
   */
  estimateProfitLoss(
    shares: number,
    buyPrice: number, // in basis points
    currentPrice: number // in basis points
  ): {
    potentialProfit: number;
    potentialLoss: number;
    roi: number; // percentage
  } {
    const invested = Math.floor((shares * buyPrice) / BASIS_POINTS);
    const currentValue = Math.floor((shares * currentPrice) / BASIS_POINTS);
    const pnl = currentValue - invested;
    
    return {
      potentialProfit: Math.max(pnl, 0),
      potentialLoss: Math.abs(Math.min(pnl, 0)),
      roi: invested > 0 ? (pnl / invested) * 100 : 0,
    };
  }

  /**
   * Format price to human-readable percentage
   */
  formatPrice(basisPoints: number): string {
    const percentage = (basisPoints / 100).toFixed(1);
    return `${percentage}%`;
  }

  /**
   * Get price display for UI
   */
  getPriceDisplay(basisPoints: number): {
    percentage: string;
    decimal: number;
    odds: string;
  } {
    const percentage = basisPoints / 100;
    const decimal = basisPoints / BASIS_POINTS;
    
    // Calculate odds format (e.g., 3:1)
    const probabilityYes = decimal;
    const probabilityNo = 1 - decimal;
    const oddsRatio = probabilityYes > 0 ? (probabilityNo / probabilityYes) : 0;
    const odds = `${oddsRatio.toFixed(2)}:1`;
    
    return {
      percentage: `${percentage.toFixed(1)}%`,
      decimal,
      odds,
    };
  }
}

export const ammService = new AMMService();
