import { db } from "./db";
import { learningLessons, learningQuizzes } from "../shared/schema";
import { eq } from "drizzle-orm";

const predictionAndMacroLessons = [
  // ==========================================
  // PREDICTION MARKETS - 5 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-pred-1",
    moduleId: "mod-prediction-markets",
    title: "Prediction Markets 101",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 1,
    content: `# Prediction Markets 101: Betting on the Future

Prediction markets are platforms where participants trade on the outcomes of future events. They combine elements of gambling, financial markets, and collective intelligence to produce remarkably accurate forecasts.

## What Are Prediction Markets?

### The Basic Concept

A prediction market allows you to buy and sell contracts based on event outcomes. The price of a contract reflects the market's collective estimate of the probability that an event will occur.

**Example:**
"Will Bitcoin exceed $100,000 by December 31, 2025?"
- YES shares trading at $0.45 = 45% implied probability
- NO shares trading at $0.55 = 55% implied probability

If Bitcoin does exceed $100k:
- YES shares pay out $1.00
- NO shares worth $0.00

### Why Prediction Markets Work

**The Wisdom of Crowds:**
When many independent people make predictions, their aggregated judgment often outperforms individual experts.

**Skin in the Game:**
Participants risk real money, incentivizing serious analysis rather than casual opinions.

**Price Discovery:**
Market prices reflect constantly updating collective intelligence as new information emerges.

## Types of Prediction Markets

### Binary Markets

The simplest type: YES or NO outcomes.

**Examples:**
- "Will the Fed raise rates in March?"
- "Will [candidate] win the election?"
- "Will Ethereum 2.0 ship by Q2?"

**Settlement:**
- YES shares pay $1 if event occurs
- NO shares pay $1 if event doesn't occur

### Scalar/Range Markets

Predict where a value will fall within a range.

**Examples:**
- "What will be ETH's price on December 31?"
- "How many seats will [party] win?"

**Settlement:**
Payout proportional to final value within the range.

### Categorical Markets

Multiple exclusive outcomes.

**Examples:**
- "Who will win the Super Bowl?"
- "Which project will have highest TVL?"

**Settlement:**
Winning category pays out; others worth $0.

## Key Concepts

### Price as Probability

Market price = Implied probability (in efficient markets)

**Interpreting Prices:**
- $0.70 = 70% chance of YES
- $0.30 = 30% chance of NO
- Prices must sum to ~$1.00 (minus fees)

### Market Making and Liquidity

**Order Book Markets:**
- Buyers and sellers match orders
- Like traditional exchanges

**Automated Market Makers (AMMs):**
- Algorithmic pricing based on pools
- Constant product formula adaptation
- Always available liquidity

### Resolution and Settlement

**Resolution Sources:**
- Official data (government, sports leagues)
- Oracles (Chainlink, UMA)
- Dispute mechanisms

**Settlement Process:**
1. Event occurs or deadline passes
2. Resolution source confirms outcome
3. Winning shares can be redeemed
4. Losing shares worth $0

## Finding Edge in Prediction Markets

### Where Does Edge Come From?

**Information Advantage:**
- Better data sources
- Faster processing
- Domain expertise

**Analytical Advantage:**
- Better models
- Contrarian thinking
- Probability calibration

**Timing:**
- Early positioning before news breaks
- Understanding how markets will react

### Biases to Exploit

**Favorite-Longshot Bias:**
- Markets often overprice longshots
- And underprice near-certainties
- Similar to sports betting

**Recency Bias:**
- Overweighting recent events
- Underweighting base rates

**Narrative Bias:**
- Compelling stories overpriced
- Boring but likely outcomes underpriced

## Risk Management for Prediction Markets

### Position Sizing

**Kelly Criterion:**
Bet size = (Edge / Odds)

**Example:**
- You estimate 60% probability
- Market price is $0.50 (50%)
- Edge = 60% - 50% = 10%
- Optimal bet = Edge / (1 - Market Price) = 10% / 50% = 20% of bankroll

**Fractional Kelly:**
Use 1/2 or 1/4 Kelly for more conservative sizing.

### Bankroll Management

- Never risk entire bankroll
- Diversify across multiple markets
- Have rules for maximum position size

### Liquidity Risk

- Check market depth before entering
- Larger positions need more liquidity
- Exit may be difficult in thin markets

## Major Prediction Market Platforms

### Decentralized

**Polymarket:**
- Largest crypto prediction market
- Built on Polygon
- USDC settlements
- AMM-based liquidity

**Augur:**
- One of the first decentralized platforms
- Ethereum-based
- REP token for resolution

### Centralized

**Kalshi:**
- US-regulated (CFTC)
- Wide range of markets
- Real-money trading

**PredictIt:**
- Academic exemption for US traders
- Political markets
- Position limits

## Strategy Framework

### Evaluating a Market

1. **Calculate Your Probability**
   - Independent analysis
   - Consider multiple scenarios

2. **Compare to Market Price**
   - Is there sufficient edge?
   - Account for fees and slippage

3. **Assess Confidence**
   - How reliable is your estimate?
   - Consider margin of error

4. **Size Appropriately**
   - Based on edge and confidence
   - Never bet more than you can lose

5. **Monitor and Update**
   - React to new information
   - Adjust or exit if thesis changes

### Common Mistakes

- Overconfidence in predictions
- Ignoring base rates
- Failing to update on new information
- Poor position sizing
- Emotional decision-making

Prediction markets are a unique opportunity to monetize accurate forecasting. Success requires calibrated probability estimation, disciplined risk management, and continuous learning.`
  },
  {
    id: "lesson-pred-2",
    moduleId: "mod-prediction-markets",
    title: "Finding Information Edges",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 2,
    content: `# Finding Information Edges in Prediction Markets

Edge is the difference between your estimated probability and the market price. Finding consistent edge is what separates profitable traders from those who lose money.

## Understanding Edge

### What Is Edge?

**Edge = Your Probability - Market Probability**

**Example:**
- Market says 40% (price: $0.40)
- You believe 55%
- Your edge: 55% - 40% = 15%

### Types of Edge

**Informational Edge:**
You know something the market doesn't.

**Analytical Edge:**
You process available information better.

**Structural Edge:**
You can access opportunities others can't.

**Timing Edge:**
You react faster to new information.

## Research Methods

### Base Rate Analysis

Start with: "How often does this type of event happen historically?"

**Example: Fed Rate Decisions**
- Historical rate of rate changes per meeting
- Rates by economic conditions
- Seasonal patterns

**Example: Election Markets**
- Incumbent win rates
- Economic predictors
- Polling accuracy

### Expert Forecasting

**Aggregating Expert Opinions:**
- Superforecasters (top 2% of forecasters)
- Domain experts
- Survey data

**Weighting:**
- Track record matters
- Recent performance > historical
- Domain-specific expertise

### Data Analysis

**Quantitative Signals:**
- Statistical models
- Machine learning predictions
- On-chain data (for crypto)

**Qualitative Analysis:**
- News and developments
- Insider behavior
- Policy signals

## Information Sources

### For Crypto Markets

**On-Chain Data:**
- Whale movements
- Exchange flows
- DeFi protocol metrics
- Smart contract activity

**Social Signals:**
- Developer activity
- Community engagement
- Influencer sentiment
- Discord/Telegram activity

**Technical Development:**
- GitHub commits
- Upgrade timelines
- Partnership announcements

### For Political Markets

**Polling:**
- Poll aggregators
- Poll quality weighting
- Trends vs. snapshots

**Fundamentals:**
- Economic indicators
- Approval ratings
- Historical patterns

**Expert Analysis:**
- Political science research
- Campaign insider perspectives
- State-level specialists

### For Sports Markets

**Statistics:**
- Advanced analytics
- Injury reports
- Weather conditions

**Situational Factors:**
- Rest days
- Travel schedules
- Motivation factors

**Market Movements:**
- Sharp money (professional bettors)
- Line movement patterns
- Reverse line movement

## Calibration and Updating

### Probability Calibration

**Are Your Estimates Accurate?**
- Track all your predictions
- Compare predicted vs. actual outcomes
- 70% predictions should happen ~70% of the time

**Brier Score:**
Measures accuracy of probabilistic predictions:
- Perfect = 0
- Random = 0.25
- Lower is better

### Bayesian Updating

When new information arrives:

**Prior Probability** + **New Evidence** = **Posterior Probability**

**Example:**
- Prior: 40% chance of rate hike
- New data: Inflation higher than expected
- How much should this shift your estimate?

**Key Principle:**
Update proportionally to:
1. How unexpected the evidence is
2. How predictive it is of the outcome

## Building an Information System

### Data Pipeline

1. **Identify Key Sources**
   - Primary data sources
   - Expert opinions
   - Market indicators

2. **Set Up Monitoring**
   - News alerts
   - Data feeds
   - Social listening

3. **Process and Analyze**
   - Automated parsing
   - Human interpretation
   - Model integration

4. **Generate Signals**
   - Probability updates
   - Edge identification
   - Trade recommendations

### Workflow Example

**Daily Routine:**
- Morning: Check overnight news and data
- Review open positions and market prices
- Update probability estimates
- Identify new opportunities
- Execute trades if edge exists

**For Major Events:**
- Pre-event position building
- Real-time monitoring during event
- Quick analysis post-event
- Immediate reaction if warranted

## Contrarian Thinking

### When to Go Against the Crowd

**Signs of Overreaction:**
- Recent news driving extreme price moves
- Narrative overwhelming data
- High volume without new fundamentals

**Signs of Underreaction:**
- Significant news ignored by market
- Slow-moving fundamental changes
- Complex information hard to process

### Avoiding Contrarian Traps

Not every crowd is wrong. Be contrarian only when:
- You have specific reasons the market is wrong
- You've done the analysis
- You can articulate why others are mistaken

## Common Edge Sources

### Calendar/Event-Based

- Earnings reports
- Fed meetings
- Product launches
- Regulatory decisions

### Expert Disagreement

- When experts disagree, someone is wrong
- Find who has the better track record
- Understand both arguments

### Base Rate Neglect

- Markets often ignore historical frequencies
- "This time is different" is usually wrong
- But sometimes it is different—know when

### Complexity Arbitrage

- Complex events are harder to price
- Multi-factor outcomes have more mispricing
- Conditional probabilities often wrong

## Measuring Your Edge

### Track Everything

- Every prediction with probability estimate
- Market price at time of prediction
- Actual outcome
- P&L from each trade

### Metrics to Track

- Brier score over time
- ROI on prediction market trades
- Win rate at various confidence levels
- Edge capture (how much of theoretical edge realized)

### Continuous Improvement

- Review incorrect predictions
- Understand what went wrong
- Update your models and thinking
- Stay humble—you'll be wrong often

Finding edge in prediction markets is hard. The market represents the collective intelligence of all participants. To consistently win, you need to be better than average at something—information gathering, analysis, or execution. Know your strengths and focus there.`
  },
  {
    id: "lesson-pred-3",
    moduleId: "mod-prediction-markets",
    title: "Market Making Strategies",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 3,
    content: `# Market Making in Prediction Markets

Market makers provide liquidity by continuously offering to buy and sell. They profit from the spread between bid and ask prices while managing the risk of holding inventory.

## What Is Market Making?

### The Core Concept

A market maker:
1. Posts bid (buy) orders below fair value
2. Posts ask (sell) orders above fair value
3. Earns the spread when orders are filled
4. Manages inventory to limit directional risk

### Example

**Fair Value Estimate:** 50% ($0.50)

**Market Maker's Quotes:**
- Bid: $0.48 (willing to buy at 48%)
- Ask: $0.52 (willing to sell at 52%)
- Spread: $0.04 (4 cents)

**Profit Scenario:**
- Buy from seller at $0.48
- Sell to buyer at $0.52
- Net profit: $0.04 per round trip

### Why Provide Liquidity?

**Earn Spreads:**
Consistent income from bid-ask spread.

**Market Access:**
First to see order flow.

**Volume Rebates:**
Some platforms pay liquidity providers.

## Market Making Mechanics

### Setting Quotes

**Fair Value Estimation:**
First, estimate the true probability of the event.

**Spread Width:**
Based on:
- Uncertainty in your estimate
- Market volatility
- Desired inventory levels
- Competition

**Quote Size:**
How much are you willing to buy/sell at each price?

### Inventory Management

**The Problem:**
As one side of your quotes gets hit, you accumulate directional exposure.

**Example:**
- You're willing to hold 100 shares
- Buyers take your ask repeatedly
- Now you're short 80 shares
- You're exposed to YES outcome

**Solutions:**

**Skewing:**
Adjust quotes to encourage offsetting trades.
- If long (bought too much): Lower bid, lower ask
- If short (sold too much): Raise bid, raise ask

**Position Limits:**
- Maximum position in either direction
- Stop quoting one side at limits

**Hedging:**
- Use correlated markets
- Options if available

### Risk Management

**Quote Management:**
- Widen spreads during uncertainty
- Reduce size before major events
- Pull quotes during extreme volatility

**Position Monitoring:**
- Real-time inventory tracking
- P&L monitoring
- Greek exposures (if applicable)

**Loss Limits:**
- Daily loss limits
- Position-level stops
- Automatic quote pulling

## AMM Market Making

### How AMMs Work

Automated Market Makers use algorithms instead of order books:

**Constant Product Formula:**
x × y = k

Where x and y are token quantities, k is constant.

**Example (Prediction Market):**
- YES tokens: 1000
- NO tokens: 1000
- k = 1,000,000

Price of YES = NO_qty / YES_qty = 1000/1000 = 1.00... but since they're complements, it's 50% each.

### Providing Liquidity to AMMs

**How It Works:**
1. Deposit both YES and NO tokens
2. Receive LP tokens representing your share
3. Earn trading fees proportional to your share
4. Redeem LP tokens for underlying + fees

**Risks:**

**Impermanent Loss:**
If one side becomes much more valuable, LPs can lose compared to just holding.

**Event Resolution:**
When the market resolves, one side goes to $0—LPs holding that side lose.

### Strategies for AMM LPs

**Pre-Resolution:**
- Profitable when outcome uncertain
- Fees offset IL in active markets
- Exit before resolution if possible

**Concentrated Liquidity:**
- Some AMMs allow custom ranges
- Higher fees for narrower ranges
- More active management required

## Advanced Strategies

### Information-Based Market Making

**Adverse Selection:**
The problem: Informed traders trade against you.

**Defense:**
- Widen spreads when informed flow expected
- Reduce size for large orders
- Identify toxic flow patterns

**Opportunity:**
- Narrow spreads when flow is uninformed
- Capture more volume

### Event Market Making

**Pre-Event:**
- Wider spreads (more uncertainty)
- Smaller positions
- Be ready to pull quotes

**During Event:**
- May need to pause quoting
- Rapid price discovery period
- Risk of being run over

**Post-Event:**
- Spreads tighten
- Outcome becomes certain
- Limited opportunity

### Multi-Market Strategies

**Arbitrage:**
Ensure consistency across related markets.

**Example:**
- "Democrats win presidency" + "Republicans win presidency" should = ~100%
- If not, arbitrage opportunity

**Correlation Trading:**
- Identify correlated outcomes
- Hedge positions across markets
- Capture spread while hedged

## Practical Considerations

### Capital Requirements

**Order Book Markets:**
- Capital tied up in orders
- Need buffer for inventory swings
- Typical: 5-20x daily trading volume

**AMM LPing:**
- Deposit capital in pools
- Less capital efficient
- But more passive

### Technology

**Essential:**
- Fast data feeds
- Automated order management
- Position tracking
- Risk monitoring

**Helpful:**
- Custom pricing models
- Inventory optimization
- Alert systems

### Regulatory Considerations

- Market making may require licenses in some jurisdictions
- Understand platform rules
- Tax implications of trading activity

## Getting Started

### Step-by-Step

1. **Choose Markets:**
   - Start with liquid, active markets
   - Avoid highly uncertain or about-to-resolve

2. **Set Up Infrastructure:**
   - API access
   - Order management
   - Position tracking

3. **Start Small:**
   - Wide spreads initially
   - Small position limits
   - Learn market dynamics

4. **Iterate:**
   - Tighten spreads as you learn
   - Increase size with experience
   - Refine your models

Market making in prediction markets can be profitable but requires active management, good risk controls, and understanding of both the underlying events and market dynamics. Start small, track everything, and gradually increase sophistication.`
  },
  {
    id: "lesson-pred-4",
    moduleId: "mod-prediction-markets",
    title: "Portfolio Theory for Predictions",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 4,
    content: `# Portfolio Theory for Prediction Markets

Managing a portfolio of prediction market positions requires different thinking than single-bet optimization. This lesson covers how to construct and manage a prediction market portfolio.

## The Portfolio Approach

### Why Think in Portfolios?

**Diversification:**
Single predictions can be wrong; portfolios smooth returns.

**Correlation:**
Some positions offset each other's risks.

**Capital Efficiency:**
Better allocation across opportunities.

**Psychological:**
Easier to handle losses when part of diversified portfolio.

### Portfolio vs. Single Bets

**Single Bet Mentality:**
- "I'm betting $100 on X at 2:1 odds"
- Focus on individual outcome

**Portfolio Mentality:**
- "X is one of 20 positions representing 5% of portfolio"
- Focus on aggregate performance

## Correlation in Prediction Markets

### Types of Correlation

**Positive Correlation:**
Events that tend to happen together.

**Examples:**
- "Recession in 2025" + "S&P 500 below 4000 in 2025"
- "Democrats win House" + "Democrats win Senate"

**Negative Correlation:**
Events where one happening makes the other less likely.

**Examples:**
- "Fed raises rates" + "Recession in 6 months" (short-term)
- "Candidate A wins primary" + "Candidate B wins primary"

**Uncorrelated:**
Events with no relationship.

**Examples:**
- "Bitcoin above $100k" + "Lakers win championship"
- "Earthquake in California" + "Netflix earnings beat"

### Managing Correlation

**Diversification Goal:**
Hold positions with low or negative correlations.

**Why It Matters:**
If all your positions are highly correlated, you're effectively making one big bet.

**Example Portfolio:**
- Political market positions
- Crypto price predictions
- Sports outcomes
- Company earnings calls

These have low correlation, reducing portfolio volatility.

## Position Sizing for Portfolios

### Kelly Criterion Revisited

**For Single Bet:**
Kelly % = Edge / Odds

**For Portfolio:**
- Adjust for correlations
- Consider opportunity cost
- Account for portfolio constraints

### Fractional Kelly

**Why Use Fractional:**
- Full Kelly is optimal only with perfect edge estimation
- Overconfidence leads to overbetting
- Fractional Kelly (1/4 to 1/2) is more robust

**Practical Rule:**
- Use 1/4 Kelly for uncertain edge
- Use 1/2 Kelly for confident estimates
- Never exceed full Kelly

### Position Limits

**Per Position:**
- Maximum 5-10% of portfolio in any single market
- Less for correlated positions

**Per Category:**
- Maximum 20-30% in any category
- (All crypto, all political, etc.)

**By Timeframe:**
- Balance near-term and long-term positions
- Don't concentrate in one resolution date

## Constructing a Portfolio

### Step 1: Generate Candidates

Identify markets with potential edge:
- Your probabilistic estimates
- Current market prices
- Calculated edge

### Step 2: Estimate Correlations

For each pair of positions:
- Positive, negative, or uncorrelated?
- Magnitude of correlation

### Step 3: Optimize Allocation

Given:
- Expected edges
- Correlation structure
- Position limits

Determine optimal sizing for each position.

### Step 4: Execute and Monitor

- Build positions over time
- Track actual vs. expected performance
- Rebalance as prices change

## Rebalancing

### When to Rebalance

**Price Movement:**
As market prices change, your edge changes too.

- Edge increased: Consider adding
- Edge decreased: Consider reducing
- Edge gone: Close position

**New Information:**
Update your probability estimates and adjust accordingly.

**Time Decay:**
As events approach, edge may change.

### How to Rebalance

**Threshold-Based:**
Rebalance when position deviates X% from target.

**Calendar-Based:**
Review and rebalance on regular schedule.

**Continuous:**
For active traders, constant adjustment.

## Risk Metrics

### Portfolio Volatility

How much does your portfolio value fluctuate?

**Measurement:**
- Daily P&L standard deviation
- Maximum drawdown
- Value at Risk (VaR)

### Concentration Risk

Are you too exposed to single outcomes?

**Metrics:**
- Largest position as % of portfolio
- Sum of correlated positions
- Herfindahl index

### Tail Risk

What's your maximum loss scenario?

**Scenario Analysis:**
- Worst-case resolution of all positions
- Correlated negative outcomes
- Stress testing

## Advanced Concepts

### Hedging Across Markets

**Example:**
Long "BTC > $100k" on Polymarket
Short "BTC > $100k" on Kalshi (if prices differ)

Lock in profit regardless of outcome.

### Arbitrage Portfolios

**Related Market Arbitrage:**
- "Candidate wins nomination" + "Candidate is nominee"
- These should be consistent

**Cross-Platform:**
- Same market priced differently
- Buy cheap, sell expensive

### Conditional Positions

**Building Compound Bets:**
"If A happens, then B is likely"

Position accordingly:
- Long A
- Long B (conditional on A)

## Practical Implementation

### Tracking Your Portfolio

**Essential Data:**
- All open positions with sizes
- Entry prices
- Current market prices
- Your probability estimates
- Calculated P&L

**Helpful Additions:**
- Correlation matrix
- Position-level edge tracking
- Resolution dates and calendars

### Portfolio Dashboard

Track in real-time:
- Total portfolio value
- Unrealized P&L
- Exposure by category
- Upcoming resolutions

### Performance Review

**Regular Analysis:**
- Realized returns vs. expectations
- Calibration of your predictions
- Which types of markets you do well in
- Where you make mistakes

The portfolio approach transforms prediction market trading from gambling into systematic investing. By thinking about positions collectively rather than individually, you can reduce risk, improve returns, and build a sustainable edge over time.`
  },
  {
    id: "lesson-pred-5",
    moduleId: "mod-prediction-markets",
    title: "Advanced Resolution and Settlement",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 5,
    content: `# Advanced Resolution and Settlement in Prediction Markets

Understanding how prediction markets resolve is crucial for avoiding disputes and trading effectively. This lesson covers resolution mechanisms, edge cases, and dispute resolution.

## Resolution Fundamentals

### What Is Resolution?

Resolution is the process of determining the outcome of a prediction market:
1. Event occurs or deadline passes
2. Outcome is determined
3. Shares are settled at final value
4. Winners can claim payouts

### Resolution Sources

**Official Data:**
- Government statistics (economic data)
- Sports leagues (game results)
- Election boards (voting results)
- Company filings (earnings)

**Oracles:**
- Chainlink (on-chain data)
- UMA (human-powered oracle)
- API3 (first-party oracles)

**Dispute Mechanisms:**
- Community voting
- Arbitration panels
- Escalation procedures

## Decentralized Resolution

### How It Works

**Proposal Phase:**
- Anyone can propose an outcome
- Often requires staking tokens

**Challenge Period:**
- Time for others to dispute
- Must stake to challenge

**Voting (if disputed):**
- Token holders vote on outcome
- Economic incentives align with truth

**Finalization:**
- Outcome is confirmed
- Shares settle accordingly

### Major Protocols

**UMA Optimistic Oracle:**
- "Optimistic" = assume proposals are correct
- Only dispute if wrong
- Escalation to human voting if needed
- Used by Polymarket

**Augur:**
- REP token for reporting
- Stake to report outcomes
- Fork mechanism for disputes

### Risks of Decentralized Resolution

**Oracle Attacks:**
- Manipulation of resolution
- Bribing voters
- Economic attacks

**Ambiguity:**
- Unclear questions
- Edge cases not covered
- Multiple interpretations

**Delays:**
- Dispute periods extend settlement
- Capital locked during disputes

## Resolution Edge Cases

### Ambiguous Outcomes

**Example:** "Will Ethereum 2.0 launch in 2024?"
- What counts as "launch"?
- Testnet? Mainnet? Full transition?

**Best Practices:**
- Read market rules carefully before trading
- Understand exactly what triggers resolution
- Avoid markets with ambiguous criteria

### Cancelled Events

**Example:** "Will [event] happen on [date]?"
- Event is postponed or cancelled
- How does market resolve?

**Common Solutions:**
- Refund all participants
- Resolve as NO (event didn't happen as specified)
- Extend deadline

### Ties and Partial Outcomes

**Example:** "Who will win the game?"
- Game ends in a tie
- Not a listed outcome

**Resolution:**
- May resolve 50/50
- May refund
- May have tie provisions

### Multiple Valid Interpretations

**Example:** "Will price exceed X by end of day?"
- Time zone ambiguity
- Exchange-specific prices
- Brief spikes vs. closing price

**Learning:**
- Always check resolution details
- Assume least favorable interpretation

## Trading Around Resolution

### Pre-Resolution Strategies

**Event Convergence:**
As resolution approaches, prices converge to outcomes.

**Time Decay:**
Uncertainty premium decays as event nears.

**Information Asymmetry:**
Late information can create opportunities.

### At Resolution

**Instant Resolution:**
- Price immediately goes to $1 or $0
- Limited trading opportunity

**Gradual Resolution:**
- Complex events take time to settle
- Information revealed gradually
- Trading continues during period

### Post-Resolution

**Settlement Timing:**
- Automatic (smart contract)
- Manual claiming required
- Dispute period delays

**Tax Implications:**
- Gains realized at settlement
- Track all resolutions for reporting

## Dispute Resolution

### When Disputes Occur

**Legitimate Disputes:**
- Genuinely ambiguous outcomes
- Data source disagreements
- Rule interpretation differences

**Gaming Attempts:**
- Trying to manipulate outcomes
- Exploiting rule loopholes
- Delaying tactics

### Participating in Disputes

**If You Believe Market Is Wrong:**
1. Review the market rules carefully
2. Gather evidence for your interpretation
3. Follow protocol's dispute process
4. Stake required tokens
5. Present your case

**Cost-Benefit Analysis:**
- Dispute costs (stakes, time)
- Potential payout if successful
- Probability of winning dispute

### Dispute Outcomes

**Proposer Wins:**
- Original resolution stands
- Challenger loses stake

**Challenger Wins:**
- Resolution overturned
- Proposer loses stake

**Market Invalid:**
- Refund to all participants
- Neither side wins

## Platform-Specific Considerations

### Polymarket

**Resolution Process:**
- UMA Optimistic Oracle
- 2-hour challenge period
- DVM (Data Verification Mechanism) if disputed

**Best Practices:**
- Monitor positions during resolution
- Understand UMA process
- Have UMA tokens if you want to dispute

### Kalshi

**Resolution Process:**
- Centralized determination
- Official data sources
- Kalshi as final arbiter

**Best Practices:**
- Read market rules thoroughly
- Understand Kalshi's policies
- Limited recourse for disputes

### Augur

**Resolution Process:**
- REP token reporting
- Multiple rounds possible
- Fork for fundamental disputes

**Best Practices:**
- Understand REP staking
- Monitor reporting periods
- Be prepared for delays

## Risk Management Around Resolution

### Timing Considerations

**Exit Before Resolution:**
- If edge is small
- To avoid resolution risk
- When confident in outcome

**Hold Through Resolution:**
- Strong edge
- Clear outcome expected
- Worth resolution risk

### Resolution Risk Premium

Markets may trade slightly away from expected value due to:
- Resolution uncertainty
- Time value of money
- Platform risk

**Implication:**
Sometimes small edge isn't worth resolution risk.

### Diversifying Resolution Risk

- Spread positions across platforms
- Diversify resolution mechanisms
- Don't concentrate around single resolution date

Understanding resolution is as important as predicting outcomes. Many traders lose money not because their predictions were wrong, but because they misunderstood how the market would resolve. Always read the rules, consider edge cases, and factor in resolution risk to your trading decisions.`
  },

  // ==========================================
  // MACRO ECONOMICS - 4 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-macro-1",
    moduleId: "mod-macro-economics",
    title: "Understanding Inflation and Interest Rates",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 1,
    content: `# Understanding Inflation and Interest Rates

Inflation and interest rates are two of the most important economic forces affecting asset prices. Understanding their relationship is essential for any investor.

## What Is Inflation?

### Definition

Inflation is the rate at which the general level of prices for goods and services rises over time, eroding purchasing power.

**Simple Example:**
- 2020: Coffee costs $3.00
- 2024: Same coffee costs $4.00
- Inflation: ~33% over 4 years (~7.5% per year)

### Measuring Inflation

**Consumer Price Index (CPI):**
- Basket of consumer goods and services
- Most widely quoted measure
- "Headline CPI" includes everything
- "Core CPI" excludes food and energy (volatile)

**Personal Consumption Expenditures (PCE):**
- Fed's preferred measure
- Similar to CPI but different methodology
- Tends to run slightly lower than CPI

**Producer Price Index (PPI):**
- Measures prices at wholesale level
- Leading indicator for consumer prices

### Causes of Inflation

**Demand-Pull Inflation:**
- Too much money chasing too few goods
- Economy overheating
- Often from stimulus or credit expansion

**Cost-Push Inflation:**
- Higher input costs (labor, materials, energy)
- Supply chain disruptions
- Not driven by demand

**Built-In Inflation:**
- Expectations of future inflation
- Wage-price spirals
- Self-fulfilling prophecy

## Interest Rates Explained

### What Are Interest Rates?

Interest rates are the cost of borrowing money (or the return for lending it).

**Key Rates:**

**Federal Funds Rate:**
- Rate banks charge each other overnight
- Fed's primary policy tool
- Currently most watched rate

**Treasury Yields:**
- Returns on US government bonds
- Various maturities (2-year, 10-year, 30-year)
- Benchmark for other rates

**Prime Rate:**
- Rate banks charge best customers
- Typically Fed Funds + 3%

**Mortgage Rates:**
- Consumer home loan rates
- Track 10-year Treasury + spread

### The Yield Curve

**What It Is:**
Plot of yields across different maturities.

**Normal Curve:**
- Longer maturities = higher yields
- Compensation for tying up money longer
- Healthy economic signal

**Inverted Curve:**
- Short-term yields higher than long-term
- Historical recession predictor
- Signals economic concerns

**Flat Curve:**
- Similar yields across maturities
- Transition period
- Uncertainty about direction

## The Inflation-Interest Rate Relationship

### Central Bank Mandate

The Federal Reserve has a dual mandate:
1. Maximum employment
2. Price stability (~2% inflation target)

### How the Fed Fights Inflation

**Raising Interest Rates:**
1. Higher rates = more expensive to borrow
2. Less borrowing = less spending
3. Less spending = less demand
4. Less demand = lower price pressures

**Quantitative Tightening (QT):**
- Selling bonds from Fed's balance sheet
- Removes money from financial system
- Complementary to rate hikes

### The Transmission Mechanism

**Financial Markets:**
Higher rates →
- Lower stock valuations (higher discount rate)
- Lower bond prices
- Stronger dollar

**Real Economy:**
Higher rates →
- Lower business investment
- Reduced consumer spending
- Weaker housing market
- Eventually lower employment

**Lag Effect:**
Monetary policy takes 12-24 months to fully affect economy.

## Market Implications

### How Inflation Affects Different Assets

**Stocks:**
- Moderate inflation generally okay
- High inflation hurts valuations
- Input costs squeeze margins
- Growth stocks more sensitive

**Bonds:**
- Inverse relationship with rates
- Inflation erodes fixed payments
- TIPS provide inflation protection

**Real Estate:**
- Generally inflation hedge
- But higher rates hurt affordability
- Mixed effects in high inflation

**Crypto:**
- Narrative of "digital gold"
- Actually correlates with risk assets
- Sensitive to rate expectations

**Commodities:**
- Generally benefit from inflation
- Real assets maintain purchasing power
- Gold traditionally inflation hedge

### Trading Around Fed Decisions

**Fed Meeting Schedule:**
- 8 meetings per year
- Statements released at 2:00 PM ET
- Press conference follows

**What to Watch:**
- Rate decision (expected vs. actual)
- Dot plot (member projections)
- Forward guidance (language changes)
- Powell's comments

**Market Reaction:**
- Often volatile around announcements
- Initial reaction may reverse
- Focus on longer-term implications

## Current Economic Environment

### Reading the Data

**Key Indicators:**
- CPI release (monthly)
- Employment reports (monthly)
- Fed speeches and minutes
- Treasury auctions

**What Markets Care About:**
- Surprise vs. expectations
- Trend direction
- Fed's interpretation

### Scenario Analysis

**Higher for Longer:**
- Inflation remains sticky
- Rates stay elevated
- Pressure on valuations
- Strong dollar

**Soft Landing:**
- Inflation falls smoothly
- Gradual rate cuts
- Economy avoids recession
- Goldilocks scenario

**Hard Landing:**
- Aggressive cuts to fight recession
- Inflation falls from demand destruction
- Risk assets suffer, then recover
- Classic boom-bust cycle

Understanding inflation and interest rates provides context for all other investment decisions. These forces ripple through every asset class and drive market cycles.`
  },
  {
    id: "lesson-macro-2",
    moduleId: "mod-macro-economics",
    title: "Economic Indicators and GDP",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 2,
    content: `# Economic Indicators and GDP: Reading the Economic Dashboard

Economic indicators help us understand the current state and future direction of the economy. Learning to interpret these signals is crucial for investment decisions.

## Gross Domestic Product (GDP)

### What Is GDP?

GDP measures the total value of all goods and services produced in a country over a specific period. It's the broadest measure of economic activity.

**The GDP Equation:**
GDP = C + I + G + (X - M)

Where:
- C = Consumer spending
- I = Business investment
- G = Government spending
- X = Exports
- M = Imports

### Types of GDP

**Nominal GDP:**
- Measured in current dollars
- Includes inflation effects
- Not adjusted for price changes

**Real GDP:**
- Adjusted for inflation
- Allows comparison over time
- Used for growth calculations

**GDP Per Capita:**
- GDP divided by population
- Measure of average economic output
- Useful for country comparisons

### GDP Growth

**Annualized Rate:**
US GDP is reported as annualized quarterly growth.

**Example:**
"Q3 GDP grew at 4.9% annualized rate"
Means: If Q3 pace continued for full year, GDP would grow 4.9%

**Interpreting Growth:**
- 2-3%: Healthy, sustainable growth
- <1%: Slow growth, potential weakness
- >4%: Strong growth, potential overheating
- Negative: Contraction (recession indicator)

### Recession Definition

**Technical:**
Two consecutive quarters of negative GDP growth.

**Official:**
NBER Business Cycle Dating Committee determines recessions based on:
- Depth, diffusion, and duration of decline
- Multiple economic indicators
- Not just GDP

## Leading Economic Indicators

### What Are Leading Indicators?

Metrics that change before the economy changes direction. Useful for prediction.

### Key Leading Indicators

**Conference Board Leading Economic Index (LEI):**
Composite of 10 indicators including:
- Average weekly hours in manufacturing
- Initial jobless claims
- New orders for consumer goods
- Building permits
- Stock prices (S&P 500)
- Interest rate spread (10Y - Fed Funds)

**Yield Curve Inversion:**
- 10-year minus 2-year Treasury spread
- Inversion (negative) historically precedes recession
- Lead time: 6-18 months

**Initial Jobless Claims:**
- Weekly new unemployment claims
- Rising claims = weakening labor market
- Very timely indicator

**Purchasing Managers' Index (PMI):**
- Survey of manufacturing managers
- Above 50 = expansion
- Below 50 = contraction
- ISM Manufacturing PMI most watched

**Consumer Confidence:**
- University of Michigan survey
- Conference Board survey
- Consumer spending drives ~70% of GDP

## Coincident Indicators

### What Are They?

Indicators that move with the economy. Confirm current conditions.

### Key Coincident Indicators

**Employment:**
- Nonfarm payrolls
- Unemployment rate
- Labor force participation

**Industrial Production:**
- Manufacturing output
- Capacity utilization
- Factory orders

**Personal Income:**
- Wages and salaries
- Transfer payments
- Disposable income

**Retail Sales:**
- Consumer spending measure
- Core retail (ex-autos, gas)
- E-commerce trends

## Lagging Indicators

### What Are They?

Indicators that change after the economy. Confirm trends.

### Key Lagging Indicators

**Unemployment Rate:**
- Peaks after recession ends
- Confirms labor market trends

**Corporate Profits:**
- Report with delay
- Confirm business conditions

**Labor Cost:**
- Wages respond slowly
- Inflationary pressure indicator

**Consumer Credit:**
- Banks tighten after problems emerge
- Confirms credit cycle

## How to Use Economic Data

### The Release Calendar

**Weekly:**
- Initial jobless claims (Thursday)
- Fed speeches throughout week

**Monthly:**
- Employment report (first Friday)
- CPI (mid-month)
- Retail sales (mid-month)
- Industrial production (mid-month)
- PMI surveys (early month)

**Quarterly:**
- GDP (advance, second, final estimates)
- Earnings season

### Trading Around Releases

**Before Release:**
- Market prices in expectations
- Consensus estimates available
- Positions reflect anticipated outcome

**At Release:**
- Actual vs. expectations matters most
- Immediate volatility common
- Details can shift reaction

**After Release:**
- Narrative formation
- Fed interpretation
- Revised positions

### Building Economic Context

**Create a Dashboard:**
- Track key indicators
- Note trends over time
- Compare to expectations

**Form an Economic View:**
- Expansion, peak, contraction, trough?
- Where in the cycle are we?
- What's the trajectory?

**Apply to Investments:**
- Cyclical vs. defensive positioning
- Duration preferences in bonds
- Currency considerations

Understanding economic indicators gives you a framework for interpreting market movements and making informed investment decisions. The economy doesn't predict markets perfectly, but it provides essential context.`
  },
  {
    id: "lesson-macro-3",
    moduleId: "mod-macro-economics",
    title: "Central Banks and Monetary Policy",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 3,
    content: `# Central Banks and Monetary Policy

Central banks are the most powerful institutions in financial markets. Understanding their tools, objectives, and behavior is essential for any investor.

## What Central Banks Do

### Core Functions

**Monetary Policy:**
- Set interest rates
- Control money supply
- Achieve economic objectives

**Banking Supervision:**
- Regulate financial institutions
- Ensure financial stability
- Manage systemic risk

**Lender of Last Resort:**
- Provide emergency liquidity
- Prevent bank runs
- Stabilize financial system

**Currency Management:**
- Issue currency
- Manage exchange rates (some countries)
- Maintain payment systems

### Major Central Banks

**Federal Reserve (Fed) - USA:**
- Most influential globally
- Dual mandate: employment + price stability
- Dollar is global reserve currency

**European Central Bank (ECB):**
- Eurozone monetary policy
- Primary objective: price stability
- 20 member countries

**Bank of Japan (BoJ):**
- Decades of unconventional policy
- Yield curve control
- Massive balance sheet

**Bank of England (BoE):**
- Independent since 1997
- 2% inflation target
- Influential for Sterling markets

**People's Bank of China (PBOC):**
- Not fully independent
- Manages exchange rate
- Different policy framework

## Monetary Policy Tools

### Conventional Tools

**Interest Rate Policy:**
The primary tool for most central banks.

**How It Works:**
- Lower rates = cheaper borrowing = more spending
- Higher rates = more expensive borrowing = less spending

**Fed Funds Rate:**
- Range set by FOMC
- Banks lend to each other at this rate
- Influences all other rates

### Unconventional Tools

**Quantitative Easing (QE):**
Central bank buys assets to:
- Lower long-term rates
- Inject money into system
- Support asset prices

**What They Buy:**
- Government bonds (Treasuries)
- Mortgage-backed securities
- Corporate bonds (some central banks)
- ETFs (Bank of Japan)

**Quantitative Tightening (QT):**
Reverse of QE:
- Sell assets or let them mature
- Remove money from system
- Raise long-term rates

**Yield Curve Control:**
Target specific yields on specific maturities.
- Bank of Japan: Target 0% on 10-year
- Australia tried briefly

**Forward Guidance:**
Communicate future policy intentions:
- Reduces uncertainty
- Shapes expectations
- Can move markets without action

## The Fed in Detail

### Structure

**Federal Reserve Board:**
- 7 Governors (including Chair)
- Appointed by President
- Confirmed by Senate

**Federal Reserve Banks:**
- 12 regional banks
- New York Fed most important
- Execute monetary policy

**Federal Open Market Committee (FOMC):**
- Sets monetary policy
- 12 voting members (varies)
- 8 meetings per year

### Key Personnel

**Fed Chair:**
- Most powerful role
- Sets agenda
- Speaks for Fed
- Market-moving statements

**Vice Chair:**
- Second in command
- Banking supervision (Vice Chair for Supervision)

**Regional Presidents:**
- Some vote on FOMC
- Offer diverse perspectives
- Often give speeches

### Fed Communication

**FOMC Statement:**
- After each meeting
- Policy decision
- Economic assessment
- Forward guidance

**Press Conference:**
- After every meeting
- Chair takes questions
- Most detailed insight

**Minutes:**
- Released 3 weeks later
- Detailed discussion summary
- Can reveal debates

**Dot Plot:**
- Quarterly projections
- Each member's rate forecast
- Shows dispersion of views

## Reading Central Bank Tea Leaves

### What to Watch

**Language Changes:**
- "Patient" vs. "data dependent"
- "Transitory" vs. "persistent"
- Small word changes matter

**Dissents:**
- Who disagreed?
- Hawkish or dovish dissents?
- Signals future direction

**Data Emphasis:**
- What data are they watching?
- Thresholds mentioned
- Reaction function clues

### Hawkish vs. Dovish

**Hawkish:**
- Concerned about inflation
- Favors higher rates
- Prioritizes price stability

**Dovish:**
- Concerned about growth/employment
- Favors lower rates
- More tolerance for inflation

### Fed Funds Futures

**What They Are:**
- Futures contracts on Fed Funds rate
- Show market expectations for future rates

**How to Read:**
- Implied probability of rate changes
- Months/years ahead
- CME FedWatch tool

## Market Implications

### How Markets React

**Hawkish Surprise:**
- Stocks typically down
- Bond yields up
- Dollar stronger

**Dovish Surprise:**
- Stocks typically up
- Bond yields down
- Dollar weaker

### Policy Pivots

**Pivot Recognition:**
- Pattern of communication changes
- Data threshold approached
- Market starts repricing

**Trading Pivots:**
- Early recognition = opportunity
- But can be head fakes
- Confirmation important

### Don't Fight the Fed

**The Adage:**
Central bank policy is a powerful market force. Trading against it is difficult.

**In Practice:**
- Understand policy direction
- Position accordingly
- Respect the trend

Understanding central banks gives you insight into one of the most important drivers of financial markets. Pay attention to their words, their actions, and especially the gap between them.`
  },
  {
    id: "lesson-macro-4",
    moduleId: "mod-macro-economics",
    title: "Global Markets and Currencies",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 4,
    content: `# Global Markets and Currencies

Financial markets are deeply interconnected globally. Understanding currency dynamics and international capital flows is crucial for any investor.

## Currency Fundamentals

### What Drives Exchange Rates?

**Interest Rate Differentials:**
Higher rates attract capital:
- USD strength when Fed raises rates
- Carry trade dynamics

**Economic Growth:**
Stronger growth attracts investment:
- Better corporate earnings
- More opportunities

**Trade Balances:**
Net exporters see currency demand:
- Export income converted to local currency
- Current account impacts

**Capital Flows:**
Investment decisions affect currencies:
- Foreign investment inflows = currency strength
- Capital flight = currency weakness

**Risk Sentiment:**
Safe-haven currencies strengthen during stress:
- USD, JPY, CHF
- EM currencies weaken

### Major Currency Pairs

**The "Majors":**
- EUR/USD (Euro vs. Dollar) - Most traded
- USD/JPY (Dollar vs. Yen)
- GBP/USD (Pound vs. Dollar)
- USD/CHF (Dollar vs. Swiss Franc)

**Commodity Currencies:**
- AUD/USD (Australian Dollar)
- USD/CAD (Canadian Dollar)
- NZD/USD (New Zealand Dollar)

**Emerging Market:**
- USD/CNH (Chinese Yuan)
- USD/MXN (Mexican Peso)
- USD/BRL (Brazilian Real)

### Reading Currency Quotes

**Base and Quote Currency:**
EUR/USD = 1.10 means 1 Euro buys 1.10 USD

**Pips:**
- Smallest price move
- Usually 4th decimal (0.0001)
- For JPY pairs: 2nd decimal

## The Dollar's Special Role

### Reserve Currency Status

The USD is the world's primary:
- Reserve currency (~60% of central bank reserves)
- Trading currency (most commodity pricing)
- Funding currency (global debt issuance)

### Dollar Index (DXY)

**What It Is:**
Trade-weighted dollar vs. major currencies:
- EUR: 57.6%
- JPY: 13.6%
- GBP: 11.9%
- CAD: 9.1%
- SEK: 4.2%
- CHF: 3.6%

**Interpretation:**
- Rising DXY = Dollar strengthening
- Falling DXY = Dollar weakening

### Dollar Impact on Markets

**Strong Dollar Effects:**
- US multinationals hurt (earnings translation)
- EM stress (dollar-denominated debt)
- Commodity prices pressure (priced in USD)
- Global liquidity tighter

**Weak Dollar Effects:**
- US exports competitive
- EM relief
- Commodity support
- Global liquidity easier

## Global Capital Flows

### Types of Flows

**Foreign Direct Investment (FDI):**
- Long-term investments
- Building factories, acquisitions
- Relatively stable

**Portfolio Investment:**
- Stocks and bonds
- More mobile
- Responds to yields and growth

**Speculative Flows:**
- Short-term positioning
- Currency carry trades
- Hot money

### Carry Trade

**The Strategy:**
1. Borrow in low-interest-rate currency
2. Invest in high-interest-rate currency
3. Collect the interest differential

**Example:**
- Borrow Yen at 0%
- Buy Mexican Peso at 10%
- Earn ~10% spread

**Risks:**
- Currency moves can wipe out carry
- Carry trades unwind violently in stress
- Popular trades become crowded

## Emerging Markets

### EM Dynamics

**Growth Potential:**
- Faster economic growth
- Demographic tailwinds
- Catch-up potential

**Risks:**
- Currency volatility
- Political instability
- Less liquidity
- External vulnerabilities

### EM and the Dollar

**Dollar Strength Hurts EM:**
- Dollar-denominated debt more expensive
- Capital outflows
- Imported inflation
- Central bank responses (rate hikes)

**Dollar Weakness Helps EM:**
- Debt service easier
- Capital inflows
- Inflation pressure eases
- More policy flexibility

### Contagion Risk

When one EM has problems:
- Investors reassess similar countries
- Capital flight can spread
- "Risk-off" sentiment impacts all EM

## Global Macro Trading

### Themes and Trades

**Divergence:**
Countries on different economic paths:
- Long stronger economy's currency/assets
- Short weaker economy's

**Convergence:**
Expectation of closing gaps:
- Valuation-based trades
- Mean reversion

**Risk-On/Risk-Off:**
- Risk-on: Long EM, commodities, high-yield
- Risk-off: Long USD, JPY, Treasuries

### Cross-Asset Relationships

**Stocks and Currencies:**
- Weak local currency can help exporters
- Strong currency hurts competitiveness

**Bonds and Currencies:**
- Higher yields attract capital
- But currency risk remains

**Commodities and Currencies:**
- Commodity producers currency tracks prices
- AUD and iron ore
- CAD and oil

## Putting It Together

### Building a Global View

1. **Assess Major Regions:**
   - US, Europe, China, Japan
   - Growth and inflation trajectories
   - Policy direction

2. **Identify Divergences:**
   - Who's ahead, who's behind?
   - Policy differences
   - Valuation opportunities

3. **Consider Flows:**
   - Where is capital going?
   - What's driving flows?
   - Positioning extremes

4. **Risk Assessment:**
   - What could go wrong?
   - Tail risks
   - Hedging considerations

### Practical Application

**For Stock Investors:**
- Currency hedging decisions
- International diversification
- Sector impacts (exporters vs. domestic)

**For Crypto Investors:**
- Dollar dynamics matter
- Global liquidity conditions
- EM adoption trends

**For All Investors:**
- Macro context for all decisions
- Risk-on/risk-off regime
- Major policy shifts

Global markets are interconnected in complex ways. Understanding these relationships helps you see the bigger picture and make more informed investment decisions.`
  },

  // ==========================================
  // TECH STOCKS - 4 Comprehensive Lessons
  // ==========================================
  {
    id: "lesson-tech-1",
    moduleId: "mod-tech-stocks",
    title: "Understanding Tech Valuations",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 1,
    content: `# Understanding Tech Valuations

Tech stocks often trade at valuations that seem disconnected from traditional metrics. Understanding how to value high-growth tech companies is essential for investing in this sector.

## Traditional Valuation Metrics

### Price-to-Earnings (P/E) Ratio

**Formula:**
P/E = Stock Price / Earnings Per Share

**Application to Tech:**
- Many tech companies have no earnings
- When they do, P/E can be very high
- Need to look at future earnings potential

**Forward P/E:**
Price / Expected Future Earnings
- More relevant for growth companies
- Depends on earnings estimates

### Price-to-Sales (P/S) Ratio

**Formula:**
P/S = Market Cap / Annual Revenue

**Why It Matters for Tech:**
- Works when there's no profit
- Revenue is harder to manipulate
- Useful for growth comparison

**Benchmarks:**
- SaaS companies: 5-15x P/S common
- High-growth SaaS: 15-30x+ possible
- Mature tech: 2-5x P/S

### Enterprise Value to Revenue (EV/Revenue)

**Formula:**
EV/Revenue = (Market Cap + Debt - Cash) / Revenue

**Better Than P/S Because:**
- Accounts for capital structure
- Compares companies with different debt levels
- More accurate for acquisitions

## Growth-Adjusted Metrics

### PEG Ratio

**Formula:**
PEG = P/E Ratio / EPS Growth Rate

**Example:**
- P/E of 50, growing at 50% = PEG of 1.0
- P/E of 50, growing at 25% = PEG of 2.0

**Interpretation:**
- PEG < 1: Potentially undervalued
- PEG = 1: Fair value (Peter Lynch rule)
- PEG > 2: Potentially overvalued

**Limitations:**
- Assumes linear growth relationship
- Growth estimates uncertain
- Doesn't work for negative earnings

### Rule of 40

**Formula:**
Revenue Growth Rate + Profit Margin = 40%+

**Examples:**
- 40% growth + 0% margin = 40 ✓
- 20% growth + 20% margin = 40 ✓
- 30% growth + 5% margin = 35 ✗

**Why It Matters:**
- Balances growth and profitability
- Healthy SaaS companies exceed 40%
- Benchmark for quality

## SaaS-Specific Metrics

### Annual Recurring Revenue (ARR)

**Definition:**
Annualized value of subscription contracts.

**Why Important:**
- Predictable revenue stream
- Foundation for valuation
- Growth rate is key

### Net Revenue Retention (NRR)

**Formula:**
(Starting ARR + Expansions - Churns - Contractions) / Starting ARR

**Interpretation:**
- >100%: Customers spending more over time
- >120%: Exceptional (land and expand working)
- <100%: Losing revenue from existing customers

**Benchmark:**
Elite SaaS: 120%+
Good SaaS: 100-120%
Concerning: <100%

### Customer Acquisition Cost (CAC)

**Definition:**
Cost to acquire a new customer (sales, marketing, etc.)

### Lifetime Value (LTV)

**Definition:**
Total revenue expected from a customer over their lifetime.

### LTV:CAC Ratio

**Benchmark:**
- >3:1 = Healthy
- 5:1+ = Excellent
- <3:1 = Potentially unsustainable

## Discounted Cash Flow for Tech

### The DCF Challenge

Traditional DCF requires:
- Predictable cash flows
- Reasonable growth assumptions
- Terminal value estimation

**Tech Problems:**
- High growth makes projections uncertain
- Many years to profitability
- Terminal value dominates (sensitivity)

### Reverse DCF

**The Approach:**
Instead of projecting cash flows, ask:
"What does current price imply about future growth?"

**Example:**
At current price, what growth rate is implied?
- If implied growth is 40% for 10 years... realistic?
- If implied growth is 20%... potentially attractive?

### Stage-Based Valuation

Value each phase separately:
1. High-growth phase (years 1-5)
2. Slower growth phase (years 6-10)
3. Terminal value (beyond year 10)

## Comparables Analysis

### Finding Peer Groups

Group by:
- Business model (SaaS, marketplace, adtech)
- Growth rate
- Market size
- Profitability profile

### Common Multiples

**For SaaS:**
- EV/Revenue
- EV/ARR
- EV/Gross Profit

**For Profitable Tech:**
- EV/EBITDA
- P/E (forward)
- FCF yield

### Premium/Discount Factors

Higher valuation for:
- Faster growth
- Better margins
- Stronger competitive position
- Larger TAM

Lower valuation for:
- Slowing growth
- Margin compression
- Increasing competition
- Execution concerns

## Interest Rate Sensitivity

### Why Tech Is Sensitive

**Duration Effect:**
Tech earnings are far in the future. Higher discount rates hurt present value more for distant cash flows.

**Simple Math:**
$100 in 10 years at 5% discount = $61.39
$100 in 10 years at 10% discount = $38.55

**Implication:**
Rising rates hurt high-growth tech more than value stocks.

### The Rate Environment

**Low Rates:**
- Growth premium expands
- High multiples justified
- "TINA" (There Is No Alternative)

**High Rates:**
- Growth premium compresses
- Multiples contract
- Cash flows matter more

## Putting It All Together

### Valuation Framework

1. **Understand the Business:**
   - Growth drivers
   - Competitive position
   - Market opportunity

2. **Choose Appropriate Metrics:**
   - Profitable? P/E, EV/EBITDA
   - High-growth? EV/Revenue, Rule of 40
   - SaaS? ARR multiples, NRR

3. **Compare to Peers:**
   - Similar growth rates
   - Similar business models
   - Similar profitability

4. **Sanity Check:**
   - What does price imply?
   - Is it realistic?
   - What would change your view?

Tech valuations require different tools than traditional investing. Focus on growth quality, competitive advantages, and long-term market opportunity—but always ground your analysis in realistic assumptions.`
  },
  {
    id: "lesson-tech-2",
    moduleId: "mod-tech-stocks",
    title: "Analyzing Earnings and Guidance",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 2,
    content: `# Analyzing Tech Earnings and Guidance

Earnings reports are the most important regular events for tech investors. Understanding how to analyze them—and trade around them—is essential.

## The Earnings Report Structure

### Key Components

**Income Statement:**
- Revenue (top-line growth)
- Gross profit and margin
- Operating expenses
- Net income

**Key Metrics:**
- Revenue growth (YoY)
- Operating margin trends
- Free cash flow
- EPS (GAAP and non-GAAP)

**Guidance:**
- Next quarter expectations
- Full-year outlook
- Commentary on trends

### Reporting Cadence

**Pre-Announcement:**
- Analyst estimates compiled
- "Whisper numbers" circulate
- Options pricing implies expected move

**Earnings Release:**
- Usually after hours or pre-market
- Press release with key metrics
- 8-K filing

**Conference Call:**
- Management presentation
- Q&A with analysts
- Often where key insights emerge

## What to Focus On

### For High-Growth Tech

**Revenue Growth:**
- Absolute growth rate
- Acceleration or deceleration
- Beat vs. expectations

**Leading Indicators:**
- Bookings and backlog
- Pipeline commentary
- Customer additions

**Unit Economics:**
- CAC trends
- LTV trends
- Payback periods

### For Profitable Tech

**Margins:**
- Gross margin trends
- Operating leverage
- EBITDA margin

**Cash Flow:**
- Free cash flow generation
- Cash conversion
- Capital allocation

**Shareholder Returns:**
- Buybacks
- Dividends
- Balance sheet strength

### Universal Signals

**Guidance Quality:**
- Beat and raise = strong signal
- Beat but maintain = cautious
- Beat but lower = concerning
- Miss and lower = red flag

**Commentary Tone:**
- Confident vs. hedging
- Specific vs. vague
- Forward-looking statements

## Beat vs. Expectations

### The Expectations Game

**Consensus Estimates:**
- Average of analyst estimates
- Published by financial data providers
- What "beat" or "miss" is measured against

**Whisper Numbers:**
- Unofficial, higher expectations
- What buy-side really expects
- Can beat consensus but miss whispers

### Price Reaction

**Beat + Raise + Strong Guidance:**
Stock likely up. Magnitude depends on how much.

**Beat But Lowered Guidance:**
Stock often down. Future matters more than past.

**Miss + Strong Guidance:**
Mixed. May recover if guidance convincing.

**Miss + Lower Guidance:**
Stock likely down significantly.

### The "Beat Expectations" Trap

**Management Games:**
- Guide conservatively
- Analysts adjust
- Creates low bar
- Easy "beat"

**How to See Through It:**
- Track guidance accuracy over time
- Compare to buy-side expectations
- Look at growth trajectory, not just beat

## Guidance Deep Dive

### Types of Guidance

**Next Quarter:**
Most accurate, near-term visibility.

**Full Year:**
Less accurate, shows trajectory.

**Long-Term Targets:**
Aspirational, track record matters.

### Reading Between the Lines

**Language Matters:**
- "Strong momentum" vs. "solid"
- "Accelerating" vs. "stable"
- "Visibility" references
- Macroeconomic hedging

**What They Don't Say:**
- Notably absent topics
- Questions deflected
- Vague areas

### Guidance Ranges

**Wide Range:**
- Less visibility
- Higher uncertainty
- Possibly sandbagging

**Narrow Range:**
- Good visibility
- More confidence
- Less room for error

## Segment Analysis

### Breaking Down Revenue

**By Product:**
- Which products growing faster?
- Margin differences
- Future mix shift

**By Geography:**
- Regional strength/weakness
- Currency impacts
- Expansion opportunities

**By Customer Type:**
- Enterprise vs. SMB
- New vs. existing
- Concentration risk

### Cohort Analysis

**For Subscription Businesses:**
- How do older cohorts behave?
- Expansion patterns
- Churn trends

## Non-GAAP vs. GAAP

### The Difference

**GAAP (Generally Accepted Accounting Principles):**
- Official accounting standards
- Includes stock-based comp
- One-time items included

**Non-GAAP:**
- Company's "adjusted" view
- Excludes stock-comp (often)
- Excludes one-time items

### Why It Matters

**Management Prefers Non-GAAP:**
- Usually looks better
- Removes "noise"
- Shows "operating performance"

**Investors Should Care About GAAP:**
- Stock-based comp is real dilution
- One-time items repeat
- GAAP prevents manipulation

**Best Practice:**
Look at both. Understand the gap. Trend matters.

## Trading Around Earnings

### Pre-Earnings

**Positioning:**
- Long if expecting beat
- Options for asymmetric exposure
- Size for volatility

**Risk Management:**
- Define max loss
- Consider selling some before
- Hedging strategies

### Post-Earnings

**Gap Up/Down:**
- Initial reaction isn't always final
- Analyze the report yourself
- Look for overreaction

**Follow-Through:**
- Strong gaps often continue
- Weak gaps may reverse
- Volume confirms direction

### Volatility Considerations

**IV Crush:**
Options expensive before earnings (implied volatility high).
After earnings, IV drops. Options lose value even if stock moves.

**Implication:**
- Buying options into earnings = expensive
- Need large move to profit
- Consider selling options strategies

Earnings are the most information-dense moments for tech investors. Preparation, quick analysis, and disciplined response are key to trading them successfully.`
  },
  {
    id: "lesson-tech-3",
    moduleId: "mod-tech-stocks",
    title: "Tech Sector Dynamics",
    lessonType: "article",
    estimatedMinutes: 15,
    xpReward: 100,
    sortOrder: 3,
    content: `# Tech Sector Dynamics: Understanding the Competitive Landscape

The tech sector is diverse and constantly evolving. Understanding the different sub-sectors, competitive dynamics, and secular trends is crucial for successful tech investing.

## Tech Sub-Sectors

### Software as a Service (SaaS)

**Business Model:**
- Subscription revenue
- Cloud-delivered software
- High gross margins (70-80%+)
- Recurring revenue

**Key Players:**
Salesforce, Microsoft, Adobe, ServiceNow, Workday

**What to Watch:**
- ARR growth
- Net retention rates
- CAC payback
- Rule of 40

### Cloud Infrastructure

**Business Model:**
- Computing, storage, networking as a service
- Usage-based pricing
- Massive capital expenditure
- Scale advantages

**Key Players:**
AWS (Amazon), Azure (Microsoft), GCP (Google)

**What to Watch:**
- Cloud revenue growth
- Market share shifts
- Margin trends
- Enterprise adoption

### Semiconductors

**Business Model:**
- Design and/or manufacturing chips
- Cyclical industry
- High R&D requirements
- IP-intensive

**Key Players:**
NVIDIA, AMD, Intel, TSMC, Broadcom, Qualcomm

**What to Watch:**
- End-market demand (datacenter, mobile, auto)
- Inventory levels
- Pricing power
- Technology leadership

### Internet/Advertising

**Business Model:**
- Free services to users
- Monetize through advertising
- Network effects
- Data advantages

**Key Players:**
Google, Meta, Amazon (ads), Snap, Pinterest

**What to Watch:**
- User growth/engagement
- Ad revenue per user (ARPU)
- Pricing trends
- Privacy/regulatory changes

### E-commerce/Marketplaces

**Business Model:**
- Transaction fees or take rates
- Logistics infrastructure
- Network effects between buyers/sellers

**Key Players:**
Amazon, Shopify, MercadoLibre, Etsy

**What to Watch:**
- GMV (Gross Merchandise Value)
- Take rate trends
- Fulfillment efficiency
- Seller/buyer growth

### Fintech

**Business Model:**
- Transaction processing
- Lending
- Banking services
- Insurance

**Key Players:**
PayPal, Block (Square), Adyen, Stripe, SoFi

**What to Watch:**
- Payment volume growth
- Take rates
- Credit performance
- Regulatory environment

## Competitive Moats in Tech

### Network Effects

**Definition:**
Product becomes more valuable as more people use it.

**Examples:**
- Social networks (more users = more content)
- Marketplaces (more sellers = more buyers)
- Payment networks (more merchants = more users)

**Strength:**
Very strong—hard to compete once established.

### Switching Costs

**Definition:**
Cost (time, money, effort) to change to competitor.

**Examples:**
- Enterprise software (data migration, retraining)
- Cloud platforms (code dependencies, data location)
- Productivity tools (workflow disruption)

**Strength:**
Strong for enterprise, weaker for consumer.

### Economies of Scale

**Definition:**
Lower costs at higher volumes.

**Examples:**
- Cloud infrastructure (data centers)
- E-commerce fulfillment
- Chip manufacturing

**Strength:**
Moderate—can be overcome with investment.

### Data Advantages

**Definition:**
Proprietary data improves products.

**Examples:**
- AI training data
- Recommendation engines
- Ad targeting

**Strength:**
Increasingly important for AI era.

## Secular Trends

### Artificial Intelligence

**Impact Areas:**
- Cloud infrastructure (training and inference)
- Software (AI-powered features)
- Semiconductors (specialized chips)
- Enterprise (productivity tools)

**Investment Implications:**
- NVIDIA dominant in GPUs
- Cloud providers benefiting
- Software incumbents vs. AI-native
- Infrastructure buildout

### Cloud Migration

**Status:**
Still early—most workloads still on-premise.

**Runway:**
Multi-year growth ahead.

**Winners:**
Cloud infrastructure providers, cloud-native software.

### Digital Transformation

**Definition:**
Companies modernizing technology.

**Drivers:**
- Competitive pressure
- Customer expectations
- Efficiency gains

**Beneficiaries:**
Enterprise software, cloud, digital services.

### Cybersecurity

**Drivers:**
- Increasing attacks
- Regulatory requirements
- Digital surface expansion

**Trend:**
Consolidation, platform approach, AI-enhanced.

## Tech Cycles

### The Innovation Cycle

1. **Emergence:** New technology appears
2. **Hype:** Valuations soar, expectations peak
3. **Disillusionment:** Reality sets in
4. **Maturation:** Real value creation
5. **Mainstream:** Widespread adoption

**Current Examples:**
- AI: Between Hype and Maturation
- Crypto: Between Disillusionment and Maturation
- Cloud: Maturation to Mainstream

### Economic Sensitivity

**Cyclical Aspects:**
- Ad spending (follows economy)
- E-commerce (consumer spending)
- Enterprise IT budgets

**Secular Aspects:**
- Long-term digital transformation
- Mission-critical software
- Infrastructure modernization

### Interest Rate Sensitivity

**More Sensitive:**
- Unprofitable growth stocks
- Long-duration cash flows
- Speculative tech

**Less Sensitive:**
- Cash-generative tech
- Near-term profitability
- Established franchises

## Portfolio Considerations

### Diversification Within Tech

**By Sub-Sector:**
- Don't concentrate in one area
- Balance software, hardware, internet

**By Growth Profile:**
- High-growth (higher risk, higher reward)
- Established growth (more predictable)
- Value tech (mature, cash-generative)

**By Size:**
- Mega-caps (FAANG)
- Mid-cap growth
- Small-cap speculative

### Risk Management

**Position Sizing:**
- Larger positions in higher-conviction names
- Smaller in speculative ideas
- Consider correlations

**Catalysts:**
- Earnings dates
- Product launches
- Regulatory events

Understanding tech sector dynamics helps you identify opportunities and manage risks in this constantly evolving landscape.`
  },
  {
    id: "lesson-tech-4",
    moduleId: "mod-tech-stocks",
    title: "The Magnificent 7 and Big Tech",
    lessonType: "article",
    estimatedMinutes: 18,
    xpReward: 125,
    sortOrder: 4,
    content: `# The Magnificent 7 and Big Tech Analysis

The "Magnificent 7" (Apple, Microsoft, Google, Amazon, NVIDIA, Meta, Tesla) dominate market indices and tech investing. Understanding these giants is essential for any technology investor.

## The Magnificent 7 Overview

### Market Dominance

**Combined Stats (approximate):**
- ~30% of S&P 500 market cap
- Larger than most countries' stock markets
- Dominant in their respective sectors

### Why They Matter

**Index Impact:**
When these stocks move, the market moves.

**Economic Bellwethers:**
Their performance reflects broader tech/economic trends.

**Investment Decision:**
Hard to avoid—even "diversified" funds are concentrated.

## Company Profiles

### Apple (AAPL)

**Business:**
- iPhone (50%+ of revenue)
- Services (growing, high margin)
- Mac, iPad, Wearables
- Hardware + ecosystem model

**Competitive Advantages:**
- Brand loyalty
- Ecosystem lock-in
- Premium positioning
- Vertical integration

**Key Metrics:**
- iPhone unit sales/ASP
- Services revenue growth
- Installed base growth
- Gross margin trends

**Bull Case:** Services growth, emerging markets, AR/VR opportunity
**Bear Case:** iPhone maturation, China exposure, regulatory risk

### Microsoft (MSFT)

**Business:**
- Intelligent Cloud (Azure, enterprise)
- Productivity (Office 365, LinkedIn)
- Personal Computing (Windows, Xbox)

**Competitive Advantages:**
- Enterprise relationships
- Full-stack cloud
- AI leadership (OpenAI partnership)
- Sticky products

**Key Metrics:**
- Azure growth rate
- Office 365 commercial seats
- Gaming revenue
- AI monetization

**Bull Case:** AI/Copilot monetization, cloud share gains
**Bear Case:** Cloud growth deceleration, competition

### Alphabet/Google (GOOGL)

**Business:**
- Google Ads (Search, YouTube)
- Cloud Platform
- Other Bets (Waymo, etc.)

**Competitive Advantages:**
- Search monopoly
- YouTube scale
- Android ecosystem
- AI capabilities

**Key Metrics:**
- Search revenue growth
- YouTube growth
- Cloud profitability
- TAC (Traffic Acquisition Costs)

**Bull Case:** AI search enhancement, cloud profitability, YouTube
**Bear Case:** Regulatory threats, AI disruption to search, cloud competition

### Amazon (AMZN)

**Business:**
- E-commerce (North America, International)
- AWS (cloud)
- Advertising
- Subscriptions (Prime)

**Competitive Advantages:**
- Logistics infrastructure
- AWS scale
- Prime ecosystem
- Flywheel effects

**Key Metrics:**
- AWS revenue and operating margin
- Retail operating margin
- Advertising growth
- Prime membership

**Bull Case:** AWS reacceleration, retail margins, AI opportunity
**Bear Case:** Retail competition, cloud competition, investment cycles

### NVIDIA (NVDA)

**Business:**
- Data Center (AI/ML training and inference)
- Gaming
- Professional Visualization
- Automotive

**Competitive Advantages:**
- GPU architecture leadership
- CUDA ecosystem
- AI software stack
- First-mover in AI chips

**Key Metrics:**
- Data center revenue
- Gaming recovery
- Gross margin
- Product cycle transitions

**Bull Case:** AI infrastructure buildout, inference market, software
**Bear Case:** AMD/custom chip competition, customer concentration, valuation

### Meta (META)

**Business:**
- Family of Apps (Facebook, Instagram, WhatsApp)
- Reality Labs (VR/AR, metaverse)
- Advertising-driven

**Competitive Advantages:**
- User scale (3+ billion DAU)
- Social graph
- Advertising technology
- AI for content/ads

**Key Metrics:**
- DAU/MAU trends
- ARPU by region
- Ad pricing trends
- Reality Labs losses

**Bull Case:** Reels monetization, AI ads, efficiency gains
**Bear Case:** TikTok competition, Reality Labs losses, regulatory

### Tesla (TSLA)

**Business:**
- Automotive (EVs)
- Energy (storage, solar)
- FSD (autonomous driving)
- AI/Robotics

**Competitive Advantages:**
- EV/battery technology
- Manufacturing efficiency
- Supercharger network
- Brand/CEO following

**Key Metrics:**
- Deliveries and production
- Automotive margins
- FSD progress
- Energy revenue

**Bull Case:** FSD breakthrough, robotaxi, AI/robotics, energy
**Bear Case:** EV competition, margin pressure, FSD timeline, valuation

## Analyzing Big Tech

### Common Themes

**AI Investment:**
All are investing heavily in AI infrastructure and capabilities.

**Platform Dominance:**
Each controls critical platforms in their domain.

**Cash Generation:**
Massive free cash flow enables investment and returns.

**Regulatory Scrutiny:**
All face antitrust and regulatory concerns.

### Competitive Dynamics

**Cloud:**
Amazon vs. Microsoft vs. Google
Three-way battle for enterprise cloud.

**AI:**
NVIDIA as picks-and-shovels play
Microsoft (OpenAI) vs. Google (Gemini) in AI products

**Advertising:**
Google/Meta duopoly, Amazon growing share

**Consumer Hardware:**
Apple's premium position vs. Android ecosystem

### Valuation Comparison

**Metrics to Compare:**
- P/E (forward)
- EV/Sales
- FCF yield
- PEG ratio

**Growth vs. Value:**
- NVIDIA: Highest growth, highest multiple
- Apple: Lower growth, quality premium
- Meta: Value play within Mag 7
- Tesla: Story stock, volatility premium

## Investment Considerations

### Owning All vs. Selection

**Index Approach:**
Buy market-cap weighted exposure (S&P 500, QQQ)
- Pro: Diversification, simplicity
- Con: Forced concentration in largest

**Stock Picking:**
Select based on individual analysis
- Pro: Potential outperformance
- Con: Concentration risk, more work

### Concentration Risk

**If You Own the Index:**
Already heavily exposed to Mag 7.

**If You Also Own Individual Stocks:**
May be overweight unintentionally.

**Solution:**
Track total exposure across all holdings.

### Correlation Considerations

**They Often Move Together:**
Risk-on/risk-off dynamics affect all.

**But Have Different Drivers:**
Individual company factors matter.

**Implication:**
Diversification benefit is limited within group.

## Trading Big Tech

### Event Catalysts

**Earnings:**
Highly watched, market-moving events.

**Product Launches:**
Apple events, NVIDIA announcements.

**Regulatory:**
Antitrust cases, legislation.

**AI Developments:**
Major AI announcements across all players.

### Sentiment Cycles

**Rotation Within Tech:**
Money flows between growth and value tech.

**Macro Sensitivity:**
Rising rates hurt higher-multiple names more.

**Narrative Shifts:**
AI leaders vs. laggards perception.

The Magnificent 7 are the most important stocks in the market. Understanding their businesses, competitive positions, and how they trade is essential for any serious tech investor.`
  }
];

export async function seedPredictionAndMacroLessons() {
  console.log("Starting prediction, macro, and tech lessons seed...");
  
  for (const lesson of predictionAndMacroLessons) {
    try {
      const existing = await db.select()
        .from(learningLessons)
        .where(eq(learningLessons.id, lesson.id))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(learningLessons)
          .set({
            title: lesson.title,
            content: lesson.content,
            estimatedMinutes: lesson.estimatedMinutes,
            xpReward: lesson.xpReward,
            lessonType: lesson.lessonType,
            sortOrder: lesson.sortOrder
          })
          .where(eq(learningLessons.id, lesson.id));
        console.log(`Updated lesson: ${lesson.title}`);
      } else {
        await db.insert(learningLessons).values({
          id: lesson.id,
          moduleId: lesson.moduleId,
          title: lesson.title,
          content: lesson.content,
          lessonType: lesson.lessonType as any,
          estimatedMinutes: lesson.estimatedMinutes,
          xpReward: lesson.xpReward,
          sortOrder: lesson.sortOrder
        });
        console.log(`Created lesson: ${lesson.title}`);
      }
    } catch (error) {
      console.error(`Error seeding lesson ${lesson.id}:`, error);
    }
  }
  
  console.log("Prediction, macro, and tech lessons seed complete!");
}

