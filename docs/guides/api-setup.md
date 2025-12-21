# API Setup Guide

Learn how to configure the Financial Modeling Prep API to access real-time stock quotes, company data, and financial metrics in the Investment Portfolio Manager.

## Overview

The Investment Portfolio Manager uses the Financial Modeling Prep (FMP) API to provide:
- Real-time and after-hours stock quotes
- Company financial statements and metrics
- Historical price data
- Stock news and market information
- Dividend data

While the application may have a fallback shared API key, **we strongly recommend getting your own free API key** for reliable, uninterrupted access.

## Why Do I Need an API Key?

**Benefits of Your Own API Key:**
- ✅ Guaranteed access to market data
- ✅ 250 free requests per day (sufficient for most users)
- ✅ No rate limit conflicts with other users
- ✅ Faster, more reliable data fetching
- ✅ Access to all features

**Limitations Without API Key:**
- ❌ Shared fallback key may hit rate limits
- ❌ Slower performance during peak usage
- ❌ Some features may not work
- ❌ No guarantee of data availability

## Step-by-Step: Getting Your Free API Key

### Step 1: Create FMP Account

1. Visit [Financial Modeling Prep](https://financialmodelingprep.com/)
2. Click "Sign Up" or "Get API Key" (usually in the top right)
3. Fill in the registration form:
   - Email address
   - Password
   - Name (optional)
4. Verify your email address

### Step 2: Access Your Dashboard

1. Log in to your FMP account
2. Navigate to your Dashboard (usually shown immediately after login)
3. Look for "API Key" or "Your API Key" section
4. Your API key will be displayed as a long alphanumeric string

**Example format:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Step 3: Copy Your API Key

1. Click the "Copy" button next to your API key (or manually select and copy)
2. Keep this key secure - treat it like a password
3. Don't share your API key publicly

### Step 4: Add API Key to Application

1. Open Investment Portfolio Manager and sign in
2. Navigate to **Settings** from the top navigation bar
3. Find the "FMP API Key" input field
4. Paste your API key into the field
5. Click **Save** or **Update Settings**

**Success!** Your API key is now configured and stored securely in AWS.

### Step 5: Verify It's Working

1. Navigate to the **Tickers** page
2. Add a stock position or refresh the page
3. You should see live stock prices loading
4. If you see prices and company data, your API is configured correctly!

## API Tiers and Limits

Financial Modeling Prep offers several tiers. Most users will use the **Free Tier**.

### Free Tier
- **Cost:** $0/month
- **Requests:** 250 per day
- **Features:** All basic data (quotes, financials, news)
- **Best For:** Individual investors tracking personal portfolios

**Is 250 requests enough?**
Yes, for most users! Here's typical usage:
- Loading Tickers page with 20 stocks: ~20 requests
- Checking news: ~5 requests
- Viewing key metrics: ~5 requests
- **Total daily usage:** ~50-100 requests (well under 250)

### Starter Tier ($14/month)
- **Requests:** 500 per day
- **Features:** All free tier features + priority support
- **Best For:** Active traders or large portfolios (50+ stocks)

### Premium Tiers ($29+ per month)
- Higher request limits
- Real-time websocket data
- Advanced features

**Recommendation:** Start with the free tier. You can always upgrade if needed.

## Understanding Request Limits

### What Counts as a Request?

Each API call to FMP counts as one request:
- Fetching a stock quote: 1 request
- Loading company financials: 1 request
- Getting news: 1 request per query

### How the App Manages Requests

The application is designed to minimize API usage:
- **Caching:** Recent data is cached to avoid redundant requests
- **Batch Loading:** Multiple stocks loaded efficiently
- **Smart Refresh:** Only fetches data when needed

### What Happens If I Hit the Limit?

If you exceed your daily limit:
- You'll see "Rate limit exceeded" errors
- Data will not update until the next day (resets at midnight EST)
- Previously loaded data may still be visible

**Solution:** Wait until the next day, or upgrade to a higher tier.

## Security and Privacy

### Is My API Key Secure?

**Yes!** Your API key is:
- Stored server-side in AWS DynamoDB
- Encrypted in transit and at rest
- Never exposed in browser code
- Only accessible to your account

### Can I Change My API Key?

Yes! You can:
1. Generate a new API key in your FMP dashboard
2. Delete your old key
3. Update the key in Settings with the new one

### Should I Keep My Key Private?

**Yes!** Your API key is tied to your FMP account:
- Sharing it allows others to consume your request quota
- Public exposure could lead to rate limit abuse
- Treat it like a password

## Troubleshooting API Issues

### Error: "Invalid API Key"

**Cause:** The API key is incorrect or not configured.

**Solutions:**
1. Verify you copied the entire API key (check for extra spaces)
2. Log in to FMP and confirm the key is still active
3. Try copying and pasting the key again
4. Ensure you clicked "Save" in Settings

### Error: "Rate Limit Exceeded" or "429 Too Many Requests"

**Cause:** You've hit your daily request limit.

**Solutions:**
1. Wait until the next day (limit resets at midnight EST)
2. Reduce usage by limiting page refreshes
3. Consider upgrading to a higher tier
4. Check if you have the app open in multiple tabs/browsers

### Error: "No Data Available" or "Error Fetching Quote"

**Possible Causes:**
1. API key not configured
2. Invalid stock ticker
3. API service outage
4. Rate limit exceeded

**Solutions:**
1. Verify API key is saved in Settings
2. Confirm the ticker symbol is correct (e.g., AAPL not Apple)
3. Check [FMP Status Page](https://financialmodelingprep.com/) for outages
4. Try again in a few minutes

### Prices Not Updating

**Cause:** Data caching or API not responding.

**Solutions:**
1. Refresh the page (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Verify API key is configured
3. Check if market is open (NYSE: 9:30 AM - 4:00 PM ET)
4. After-hours data may have delays

### After-Hours Prices Missing

**Cause:** After-hours data may not always be available.

**Note:** After-hours quotes are shown when available, but not all stocks have active after-hours trading.

## API Key Management Best Practices

### Do:
- ✅ Keep your API key private
- ✅ Use your own key instead of shared fallback
- ✅ Monitor your usage in FMP dashboard
- ✅ Regenerate your key if you suspect it's compromised
- ✅ Check your email for FMP notifications about usage

### Don't:
- ❌ Share your API key publicly (GitHub, forums, etc.)
- ❌ Use the same key across multiple applications
- ❌ Store your key in unsecured locations
- ❌ Ignore rate limit warnings

## Fallback Shared Key Behavior

If you don't configure your own API key, the application may use a shared fallback key.

**Limitations:**
- Shared among all users without personal keys
- High risk of hitting rate limits during peak hours
- No guaranteed availability
- Slower performance
- May stop working at any time

**We strongly recommend getting your own free API key to avoid these issues.**

## Advanced: Monitoring Your Usage

### Check Usage in FMP Dashboard

1. Log in to [Financial Modeling Prep](https://financialmodelingprep.com/)
2. Go to your Dashboard
3. View "API Calls Today" or usage statistics
4. Track your consumption patterns

### Optimize Your Usage

**Tips to reduce API requests:**
1. Avoid refreshing pages unnecessarily
2. Close unused tabs with the app open
3. Use portfolio filtering to view fewer stocks at once
4. Export data to CSV for offline analysis

## Upgrading Your Plan

If you need more requests:

1. Log in to your FMP account
2. Navigate to "Pricing" or "Plans"
3. Select a higher tier (Starter, Professional, etc.)
4. Complete payment
5. Your limits will increase immediately
6. **No need to change your API key!** Same key, higher limits

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start-guide.md) - Initial setup
- [Troubleshooting](../reference/troubleshooting.md) - Common issues
- [Portfolio Management](../features/portfolio-management.md) - Using the Tickers page

## Summary

**Quick Checklist:**
- ✅ Create free FMP account
- ✅ Copy API key from dashboard
- ✅ Add key to Settings page in app
- ✅ Save and verify data is loading
- ✅ Monitor usage to stay under limits

With your own API key configured, you'll have reliable access to all the market data features in Investment Portfolio Manager. Happy investing!
