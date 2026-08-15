# StreamAiX Deployment Guide

## Overview
This guide covers everything needed to deploy StreamAiX to production, including API keys, pricing tiers, and optimization strategies.

## Required Environment Variables

### Essential API Keys (Required for Core Functionality)

#### 1. OpenAI API Key
```
OPENAI_API_KEY=sk-...
```
- **Purpose**: AI chatbot, content summarization, quality scoring, prediction extraction
- **Free Tier**: No (pay-as-you-go)
- **Recommended Starting Plan**: Pay-as-you-go (~$50-100/month based on usage)
- **Pricing**: https://openai.com/pricing
- **Setup**: https://platform.openai.com/api-keys

#### 2. Finnhub API Key
```
FINNHUB_API_KEY=...
```
- **Purpose**: Real-time stock market data, forex data
- **Free Tier**: Yes (60 API calls/minute, US stocks only)
- **Recommended Plan**: Starter ($59.99/month) - 300 calls/minute, global stocks
- **Pricing**: https://finnhub.io/pricing
- **Setup**: https://finnhub.io/register

#### 3. Database URL (Provided by Replit)
```
DATABASE_URL=postgresql://...
```
- **Purpose**: PostgreSQL database for all application data
- **Provided by**: Replit (automatically configured)
- **No additional setup required**

### API Keys for Enhanced Features

#### 4. CoinGecko API Key
```
COINGECKO_API_KEY=CG-...
```
- **Purpose**: Cryptocurrency prices and market data (primary crypto data source)
- **Current Status**: FREE tier exhausted (10,000 calls/month limit reached)
- **Free Tier**: 10,000 calls/month
- **⭐ Recommended for Production**: **Analyst Plan** ($129/month)
  - 500,000 calls/month
  - Real-time data
  - Priority support
  - Eliminates rate limiting issues
- **Pricing**: https://www.coingecko.com/en/api/pricing
- **Setup**: https://www.coingecko.com/en/api/pricing

#### 5. CoinMarketCap API Key
```
COINMARKETCAP_API_KEY=...
```
- **Purpose**: Cryptocurrency data (secondary fallback)
- **Current Status**: Monthly credit limit reached
- **Free Tier**: 333 calls/day (~10,000/month)
- **Recommended Plan**: Hobbyist ($29/month) - 10,000 calls/day
- **Pricing**: https://coinmarketcap.com/api/pricing/
- **Setup**: https://pro.coinmarketcap.com/signup

#### 6. Dune Analytics API Key
```
DUNE_API_KEY=...
```
- **Purpose**: Blockchain data, on-chain DEX prices (tertiary fallback)
- **Current Status**: Rate-limited (free tier ~2,500 credits/month)
- **Free Tier**: Yes (rate-limited)
- **Recommended Plan**: Plus ($390/month) - 10,000 credits/month
- **Pricing**: https://dune.com/pricing
- **Setup**: https://dune.com/settings/api

### Optional API Keys (For Social Features)

#### 7. Twitter API Keys (Currently Rate-Limited)
```
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_BEARER_TOKEN=...
```
- **Purpose**: Social sentiment analysis, influencer tracking
- **Current Status**: Rate-limited (429 errors)
- **Free Tier**: Very limited (3 requests per 15 minutes)
- **Recommended Plan**: Basic ($100/month) - 10,000 tweets/month
- **Pricing**: https://developer.twitter.com/en/products/twitter-api/pricing
- **Setup**: https://developer.twitter.com/en/portal/dashboard
- **Note**: Social features will gracefully degrade without this

## Production Deployment Checklist

### Phase 1: Pre-Deployment (Development Environment)

- [x] Verify all required secrets are configured
- [ ] Test with production-like API rate limits
- [ ] Enable error tracking (Sentry or similar)
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and alerts

### Phase 2: API Optimization

#### Immediate Actions (Free)
- [x] Implement TTL-based caching (already done)
- [x] Add graceful fallback UI when APIs fail (already done)
- [x] 3-tier API fallback system for crypto data (already done)
- [ ] Add request debouncing for real-time features
- [ ] Implement batch API requests where possible

#### Budget-Conscious Upgrades (Month 1)
**Total: ~$188/month**

1. **CoinGecko Analyst** ($129/month) - **HIGHEST PRIORITY**
   - Solves crypto data rate limiting
   - 500,000 calls/month
   - Real-time updates

2. **Finnhub Starter** ($59.99/month)
   - 300 calls/minute (5x free tier)
   - Global stock coverage
   - Better reliability

#### Full Production Upgrades (Month 2-3)
**Additional: ~$519/month**

3. **Twitter API Basic** ($100/month)
   - 10,000 tweets/month
   - Social sentiment features
   - Influencer tracking

4. **Dune Analytics Plus** ($390/month)
   - 10,000 credits/month
   - On-chain data reliability
   - Blockchain analytics

5. **CoinMarketCap Hobbyist** ($29/month)
   - 10,000 calls/day
   - Reliable secondary fallback

### Phase 3: Monitoring & Optimization

#### Set Up Monitoring
```bash
# Environment variables for monitoring
SENTRY_DSN=...  # Error tracking
LOGTAIL_TOKEN=...  # Log aggregation
```

#### Key Metrics to Track
- API response times
- API rate limit consumption
- Error rates by endpoint
- Database query performance
- User session duration

#### Cost Optimization Tips
1. **Use caching aggressively**: Cache responses for 1-5 minutes depending on data type
2. **Batch requests**: Combine multiple API calls where possible
3. **Lazy load data**: Only fetch data when user navigates to that section
4. **Monitor usage patterns**: Identify and optimize high-traffic endpoints
5. **Use WebSockets**: Reduce API calls for real-time features

### Phase 4: Performance Optimization

#### Frontend
- [ ] Enable React production build
- [ ] Configure Vite build optimizations
- [ ] Implement code splitting
- [ ] Add service worker for offline support
- [ ] Compress images and assets
- [ ] Enable gzip/brotli compression

#### Backend
- [ ] Add Redis for session storage (optional)
- [ ] Configure database connection pooling
- [ ] Add database indexes for common queries
- [ ] Enable query result caching
- [ ] Set up CDN for static assets

#### Database Optimization
```sql
-- Add indexes for common queries (if needed)
CREATE INDEX idx_summaries_user_id ON summaries(user_id);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_markets_category ON prediction_markets(category);
```

## Deployment Steps

### 1. Set Environment Variables in Replit

Navigate to Replit Secrets and add:

```bash
# Required
OPENAI_API_KEY=sk-...
FINNHUB_API_KEY=...

# Recommended for production
COINGECKO_API_KEY=CG-...
COINMARKETCAP_API_KEY=...
DUNE_API_KEY=...

# Optional
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_BEARER_TOKEN=...
```

### 2. Push Database Schema
```bash
npm run db:push
```

### 3. Build for Production
```bash
npm run build
```

### 4. Test Production Build Locally
```bash
npm run preview
```

### 5. Deploy via Replit
- Click "Publish" in Replit
- Configure custom domain (optional)
- Enable autoscaling (recommended)

## Post-Deployment

### Immediate Tasks (First 24 Hours)
1. Monitor error logs
2. Check API rate limit usage
3. Verify database connections
4. Test all critical user flows
5. Monitor performance metrics

### First Week
1. Analyze API usage patterns
2. Optimize high-traffic endpoints
3. Fine-tune caching strategies
4. Gather user feedback
5. Address any critical bugs

### Ongoing Maintenance
1. Weekly API cost review
2. Monthly performance audits
3. Quarterly security updates
4. Regular database backups
5. Update dependencies

## Cost Summary

### Minimum Viable Production (Month 1)
- Replit Hosting: Varies by tier
- OpenAI API: ~$50-100 (pay-as-you-go)
- CoinGecko Analyst: $129
- Finnhub Starter: $59.99
- **Total: ~$239-289/month**

### Full-Featured Production (Month 2+)
- Minimum Viable: $239-289
- Twitter API Basic: $100
- Dune Analytics Plus: $390
- CoinMarketCap Hobbyist: $29
- **Total: ~$758-808/month**

### Cost Optimization Strategies
1. Start with CoinGecko + Finnhub only
2. Add Twitter API when social features are heavily used
3. Add Dune Analytics if crypto analytics are priority
4. Monitor usage monthly and adjust tiers as needed
5. Consider annual plans for 15-20% savings

## Troubleshooting

### Common Issues

#### 1. API Rate Limiting
**Symptoms**: 429 errors, "API rate-limited" messages
**Solutions**:
- Upgrade to paid API tier
- Increase cache TTL
- Implement request throttling
- Add retry logic with exponential backoff

#### 2. Database Connection Issues
**Symptoms**: "Connection refused", timeout errors
**Solutions**:
- Check DATABASE_URL is correct
- Verify database is running
- Increase connection pool size
- Add connection retry logic

#### 3. Slow Page Loads
**Symptoms**: Long time to interactive, high TTFB
**Solutions**:
- Enable lazy loading
- Optimize database queries
- Add Redis caching
- Use CDN for static assets
- Enable compression

## Support & Resources

- **Replit Documentation**: https://docs.replit.com
- **OpenAI Status**: https://status.openai.com
- **CoinGecko Status**: https://status.coingecko.com
- **Finnhub Status**: https://status.finnhub.io

## Security Best Practices

1. **Never commit API keys to git**
2. **Use Replit Secrets for all sensitive data**
3. **Enable HTTPS only** (automatic on Replit)
4. **Implement rate limiting** on your own endpoints
5. **Regularly rotate API keys**
6. **Monitor for unusual API usage**
7. **Keep dependencies updated**
8. **Use CSP headers** for XSS protection
9. **Validate all user inputs**
10. **Implement proper authentication**

## Next Steps

After successful deployment:

1. **Monitor**: Set up alerts for API limits and errors
2. **Optimize**: Review performance metrics weekly
3. **Scale**: Upgrade API tiers based on actual usage
4. **Iterate**: Gather user feedback and improve
5. **Document**: Keep this guide updated with learnings

---

**Questions or Issues?**  
Check the logs in `/tmp/logs/` or review error messages in the Replit console.
