# Quick Start Guide

Get started with Investment Portfolio Manager in just 5 minutes! This guide will walk you through creating your account, configuring the API, and adding your first investments.

## Overview

Investment Portfolio Manager is a web application for tracking your investment portfolio with real-time market data, analytics, and research tools. This quick start guide will help you set up your account and start tracking your investments.

## Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- An email address for account creation
- (Optional) Financial Modeling Prep API key for enhanced features

## Step 1: Create Your Account

1. Navigate to the Investment Portfolio Manager application
2. Click "Create Account" on the authentication screen
3. Enter your email address and create a secure password
4. Verify your email address using the verification code sent to your inbox
5. Sign in with your new credentials

The application uses AWS Amplify authentication for secure, cloud-based account management.

## Step 2: Configure API Access (Recommended)

To access real-time stock quotes and company data, you'll need to configure a Financial Modeling Prep API key.

### Option A: Use Your Own API Key (Recommended)

1. Visit [Financial Modeling Prep](https://financialmodelingprep.com/) and create a free account
2. Copy your API key from the dashboard
3. In the app, navigate to **Settings** (top navigation bar)
4. Paste your API key in the "FMP API Key" field
5. Click "Save"

**Free Tier Limits:** 250 requests per day (sufficient for most users)

### Option B: Use Shared Key (Limited)

If you skip this step, the application may use a fallback shared API key, but this has strict rate limits and may not work reliably for all users.

**For full functionality, we strongly recommend getting your own free API key.**

See the [API Setup Guide](../guides/api-setup.md) for detailed instructions.

## Step 3: Add Your First Investment

You have two options for adding investments: manual entry or CSV import.

### Option A: Manual Entry (Quick for Few Positions)

1. Navigate to **Tickers** from the top navigation
2. Click the **+ Add Lot** button (top left)
3. Fill in the form:
   - **Ticker**: Stock symbol (e.g., AAPL, MSFT)
   - **Quantity**: Number of shares
   - **Cost Per Share**: Purchase price
   - **Purchase Date**: Date of purchase
   - **Portfolio**: Choose "Default" or create a new portfolio name
   - **Notes**: (Optional) Add notes about this purchase
4. Click **Save**

Your position will now appear in the Tickers table with current value, gain/loss, and other metrics.

### Option B: CSV Import (Best for Multiple Positions)

1. Navigate to **Tickers**
2. Click the **Import CSV** button (top right)
3. Select your CSV file (must have columns: Ticker, Date, Quantity, Cost, Portfolio)
4. Review the import summary
5. Click **Confirm Import**

See the [CSV Import Guide](../guides/csv-import.md) for detailed format specifications and examples.

## Step 4: Explore the Dashboard

Now that you have data in the system, explore the main features:

### Tickers Page
- View all your positions in a sortable table
- See real-time prices, daily changes, and portfolio metrics
- Filter by portfolio using the dropdown
- Export your data to CSV
- View total portfolio value and today's performance

### Portfolio Page
- Visual 3D globe representation of your portfolio
- Interactive portfolio overview
- Filter and analyze by portfolio

### Research Page
- **Stock News**: Search for news about specific companies
- **Market News**: General market updates
- **Treasury Yields**: Compare current treasury rates

### Calculators
- **P/E Growth Calculator**: Evaluate stock valuations
- **Rule of 72**: Calculate investment doubling time
- **Mortgage Calculator**: Plan home purchases with taxes, insurance, and PMI

### Key Metrics
- Analyze company financials
- View quarterly and annual data
- Compare metrics over time

## Step 5: Organize Your Portfolio (Optional)

As you add more investments, you can organize them into multiple portfolios:

1. When adding a lot (manual or CSV), specify a portfolio name
2. Portfolios are automatically created when you first use them
3. Use the portfolio filter dropdown to view specific portfolios
4. Example portfolios: "Retirement", "Trading", "Dividend Growth", "Tech Stocks"

## Quick Tips for Success

### 1. Use Portfolios to Organize
Create separate portfolios for different investment strategies:
- Retirement accounts (IRA, 401k)
- Taxable brokerage accounts
- Trading vs long-term holds
- Sector-specific portfolios

### 2. Mark Dividend Lots
When adding dividend reinvestment positions:
- Check the "Is Dividend" checkbox
- This separates dividend reinvestments from your original purchases
- Helps calculate accurate yield and cost basis

### 3. Regular Updates
- The app automatically fetches current prices when you load pages
- Prices refresh to show live market data and after-hours quotes
- No manual refresh needed!

### 4. Export Regularly
Use the Export to CSV feature to:
- Back up your portfolio data
- Analyze in Excel or Google Sheets
- Keep records for tax purposes

### 5. Check After-Hours
The Tickers page shows after-hours price changes:
- Green/red indicators for after-hours movement
- Helps you stay informed outside market hours

## Common First Steps

**Already have a portfolio elsewhere?**
1. Export from your current system to CSV
2. Format it to match our CSV specification
3. Import via the Import CSV button
4. All your positions will be loaded at once!

**Starting fresh?**
1. Add your first position manually to learn the interface
2. Explore the research tools to find new investments
3. Use the calculators to evaluate opportunities
4. Build your portfolio over time

**Want to try it out?**
1. Add a sample position (e.g., 10 shares of AAPL)
2. Explore the interface with real data
3. Delete test positions and add your actual investments when ready

## Troubleshooting

### "No data available" or "Error fetching quote"
- Verify your API key is configured in Settings
- Check that you entered a valid stock ticker symbol
- Ensure you haven't exceeded your daily API limit (250 requests on free tier)

### CSV Import Fails
- Verify your file has the required columns: Ticker, Date, Quantity, Cost, Portfolio
- Check date format is M/D/YYYY (e.g., 1/15/2024)
- Ensure no special characters in portfolio names
- See the [CSV Import Guide](../guides/csv-import.md) for details

### Prices Not Updating
- Refresh the page to fetch latest quotes
- Verify API key is configured
- Check if market is open (US stock exchanges: 9:30 AM - 4:00 PM ET)

## Next Steps

Now that you're set up, explore these guides:

- [API Setup Guide](../guides/api-setup.md) - Detailed API configuration and troubleshooting
- [Portfolio Management](../features/portfolio-management.md) - Advanced portfolio features
- [CSV Import Guide](../guides/csv-import.md) - Bulk import specifications
- [Calculators Guide](../features/calculators.md) - How to use the financial calculators

## Need More Help?

- Check the [Troubleshooting Guide](../reference/troubleshooting.md) for common issues
- Review feature-specific documentation for detailed instructions
- Verify your API setup if you're having data issues

Welcome to Investment Portfolio Manager - happy investing!
