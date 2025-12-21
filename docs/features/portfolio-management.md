# Portfolio Management

Master the core features of the Tickers page - your central hub for tracking, managing, and analyzing your investment portfolio.

## Overview

The Tickers page is where you'll spend most of your time in the Investment Portfolio Manager. It provides a comprehensive view of all your stock positions with real-time data, advanced filtering, and powerful management tools.

**Key Features:**
- Real-time stock quotes and after-hours prices
- Multi-portfolio organization
- Manual position entry and CSV bulk import/export
- Dividend tracking and yield calculations
- Portfolio filtering and performance metrics
- Position-level notes and annotations

## Page Layout

### Header Section

**Portfolio Filter (Left)**
- Dropdown to filter by portfolio
- Shows all portfolios you've created
- "All Portfolios" view shows everything

**Action Buttons (Right)**
- **+ Add Lot:** Manually add a new position
- **Import CSV:** Bulk import positions
- **Export to CSV:** Download all positions

### Portfolio Metrics Bar

Real-time summary of your filtered portfolio:
- **Total Cost:** Total amount invested (Quantity × Cost Per Share for all lots)
- **Current Value:** Current market value (Quantity × Current Price)
- **Today's Change:** Dollar and percentage change for the current trading day
- **Total Gain/Loss:** Overall profit or loss (Current Value - Total Cost)
- **Yield:** Estimated dividend yield across all positions

### Positions Table

Sortable table with all your stock lots:
- Ticker symbol
- Company name
- Quantity (shares owned)
- Cost per share
- Total cost
- Current price
- Current value
- Gain/Loss ($ and %)
- Purchase date
- Portfolio name
- Action buttons (Edit, Delete)

## Adding Positions Manually

### Step-by-Step: Add a New Lot

1. Click the **+ Add Lot** button (top left)
2. A form/modal will appear with the following fields:

#### Required Fields

**Ticker Symbol**
- Enter the stock symbol (e.g., AAPL, MSFT, GOOGL)
- Automatically converted to uppercase
- App will fetch current quote to verify ticker exists

**Quantity**
- Number of shares purchased
- Can include decimals for fractional shares (e.g., 10.5)
- Must be greater than 0

**Cost Per Share**
- Price paid per share (not total cost)
- Enter as decimal number (e.g., 150.25)
- Total cost is calculated automatically

**Purchase Date**
- Date the shares were purchased
- Use date picker or enter manually
- Format: MM/DD/YYYY

**Portfolio**
- Select existing portfolio from dropdown
- Or type a new portfolio name to create one
- Portfolios are created automatically on save

#### Optional Fields

**Is Dividend**
- Check this box if the lot represents dividend reinvestment
- Helps separate dividend shares from original purchases
- Affects yield calculations and reporting

**Notes**
- Free-form text field for annotations
- Use for tracking: purchase reason, strategy, reminders
- Examples: "Long-term hold", "Tech sector", "Earnings play"

3. Click **Save** or **Add Lot**
4. The new position appears in the table immediately

### Example: Adding a Position

**Scenario:** You bought 100 shares of Apple on January 15, 2024, at $150.25 per share.

1. Click **+ Add Lot**
2. Fill in:
   - Ticker: AAPL
   - Quantity: 100
   - Cost Per Share: 150.25
   - Purchase Date: 01/15/2024
   - Portfolio: Default (or "Tech Stocks")
   - Notes: "Strong earnings growth, long-term hold"
3. Click **Save**
4. **Result:** New lot appears with:
   - Total Cost: $15,025.00
   - Current Value: (100 × current AAPL price)
   - Gain/Loss: Calculated automatically

## Managing Existing Positions

### Editing a Position

1. Locate the position in the table
2. Click the **Edit** button (pencil icon)
3. Modify any fields (except ticker symbol - this is usually locked)
4. Click **Save**

**Common edits:**
- Adjusting quantity (after selling partial shares)
- Updating cost basis (after wash sales or adjustments)
- Changing portfolio assignment
- Adding or updating notes

### Deleting a Position

1. Locate the position in the table
2. Click the **Delete** button (trash icon)
3. Confirm deletion in the popup
4. **Note:** This action cannot be undone

**When to delete:**
- Sold entire position
- Entered position by mistake
- Consolidating duplicate lots

**When NOT to delete:**
- Partial sale: Edit the quantity instead
- Moving to another portfolio: Edit the portfolio field instead

## Portfolio Organization

### Creating Portfolios

Portfolios help you organize positions by account, strategy, or goal.

**Two ways to create:**

1. **When Adding a Lot:**
   - Type a new portfolio name in the Portfolio field
   - It's created automatically when you save

2. **When Importing CSV:**
   - Use any portfolio name in the CSV
   - All unique portfolio names are created automatically

### Portfolio Use Cases

**By Account Type:**
- Retirement (IRA, 401k)
- Taxable Brokerage
- HSA or ESA
- Trust Account

**By Strategy:**
- Dividend Growth
- Growth Stocks
- Value Investing
- Trading / Active

**By Sector:**
- Tech Stocks
- Healthcare
- Financials
- Energy

**By Goal:**
- Long-term Holds
- Short-term Trades
- Retirement Income
- Wealth Building

### Filtering by Portfolio

1. Use the **Portfolio Filter** dropdown (top left)
2. Select a specific portfolio to view only those positions
3. Select "All Portfolios" to view everything

**Benefits:**
- Focus on specific accounts
- Analyze strategy performance
- Review sector allocation
- Track individual account growth

### Portfolio Metrics

When filtered to a single portfolio, metrics update to show:
- Total invested in that portfolio
- Current value of that portfolio
- Today's performance for that portfolio
- Portfolio-specific gain/loss

## Bulk Operations

### CSV Import

Import multiple positions at once:

1. Prepare a CSV file (see [CSV Import Guide](../guides/csv-import.md))
2. Click **Import CSV**
3. Select your file
4. Review import preview
5. Confirm import

**Use cases:**
- Migrating from another system
- Bulk loading brokerage data
- Initial portfolio setup
- Quarterly updates

### CSV Export

Export your current positions:

1. (Optional) Filter to specific portfolio
2. Click **Export to CSV**
3. Choose save location
4. File downloads with all visible positions

**Use cases:**
- Backup your data
- Analyze in Excel/Google Sheets
- Share with financial advisor
- Tax reporting

**Export includes:**
- All fields: Ticker, Quantity, Cost, Date, Portfolio, Notes
- Current prices and values
- Calculated gain/loss

## Understanding Position Data

### Cost Basis

**Cost Per Share:**
- The price you paid per share
- Used for gain/loss calculations
- Can be adjusted for wash sales or corporate actions

**Total Cost:**
- Quantity × Cost Per Share
- Your total investment in this lot

### Current Value

**Current Price:**
- Latest market price (real-time or 15-min delayed)
- Updates automatically when page loads
- Shows after-hours price if available

**Current Value:**
- Quantity × Current Price
- What your position is worth now

### Gain/Loss

**Dollar Gain/Loss:**
- Current Value - Total Cost
- Green if positive, red if negative

**Percentage Gain/Loss:**
- ((Current Value - Total Cost) / Total Cost) × 100
- Shows return on investment for this lot

### After-Hours Data

If trading activity continues after market close:
- After-hours price is displayed
- Shows change from market close
- Green/red indicator for after-hours movement

**Example:**
- Market Close: $150.00
- After Hours: $151.50 (+1.00%)
- Display shows both prices

## Dividend Features

### Marking Dividend Lots

When you reinvest dividends, you can mark those lots separately:

1. Add a lot as normal
2. Check "Is Dividend" checkbox
3. These lots are tracked separately

**Benefits:**
- Separate dividend reinvestment from original purchases
- Calculate true cost basis
- Track dividend accumulation
- Analyze reinvestment impact

### Dividend Yield Display

For dividend-paying stocks:
- Annual dividend yield is displayed
- Based on current price and dividend rate
- Helps evaluate income potential

### Viewing Dividend History

For detailed dividend tracking:
- Visit the **Historical Dividends** page
- See all dividend payments over time
- Track dividend growth rates

## Real-Time Data and Pricing

### Market Hours

**Regular Trading Hours:**
- Monday-Friday: 9:30 AM - 4:00 PM Eastern
- Prices update in real-time (or near real-time)

**After-Hours Trading:**
- After 4:00 PM Eastern
- After-hours quotes shown when available
- Not all stocks have active after-hours trading

**Weekends and Holidays:**
- Markets closed
- Prices show last trading day's close

### Price Updates

**When Prices Refresh:**
- Page load
- Manual page refresh
- After adding/editing positions

**Note:** Prices don't auto-refresh while viewing the page. Refresh the page to get latest quotes.

### Data Source

All market data comes from the Financial Modeling Prep (FMP) API:
- Configure your API key in Settings
- See [API Setup Guide](../guides/api-setup.md) for details

## Advanced Features

### Multiple Lots of Same Stock

You can have multiple lots of the same ticker:

**Example: Apple positions**
- Lot 1: 100 shares @ $150, purchased 1/15/2024
- Lot 2: 50 shares @ $145, purchased 3/20/2024
- Lot 3: 25 shares @ $155, purchased 5/10/2024

**Benefits:**
- Track separate purchases with different cost bases
- Identify which lots to sell for tax purposes
- Monitor timing of purchases
- Calculate weighted average cost if needed

### Position Notes and Annotations

Use the Notes field to:
- Document purchase rationale
- Track strategy or thesis
- Set price targets or stop losses
- Note corporate actions or splits
- Link to research or articles

**Example notes:**
- "Target price: $200, stop loss: $130"
- "Hold until dividend reaches 4%"
- "Rebalance quarterly to maintain 10% allocation"
- "Monitor earnings - next report 10/15"

### Sorting the Table

Click column headers to sort:
- Ticker (alphabetical)
- Quantity (largest to smallest)
- Total Cost (highest to lowest)
- Current Value (highest to lowest)
- Gain/Loss (best to worst)
- Purchase Date (newest to oldest)

**Use cases:**
- Find largest positions
- Identify biggest gainers/losers
- Sort by purchase date to review holding periods

## Performance Tracking

### Today's Performance

The metrics bar shows:
- Today's dollar change across all positions
- Today's percentage change
- Green if up, red if down

**Use case:** Quick daily portfolio check

### Total Gain/Loss

See overall performance:
- Total Gain/Loss shows cumulative profit/loss
- Percentage return shows ROI since purchase
- Helps evaluate overall strategy success

### Portfolio-Specific Performance

Filter to a single portfolio:
- See performance for that specific account/strategy
- Compare portfolios against each other
- Evaluate which strategies are working

## Tips and Best Practices

### 1. Organize with Portfolios

Don't put everything in "Default":
- Create meaningful portfolios
- Align with your brokerage accounts
- Or organize by strategy/goal

### 2. Use Notes Effectively

Document key information:
- Why you bought
- Target price or exit strategy
- Important dates (earnings, ex-dividend)
- Links to research

### 3. Track Lots Separately

Avoid averaging down into one lot:
- Keep separate lots for each purchase
- Helps with tax-loss harvesting
- Better tracking of performance by timing

### 4. Regular Exports

Export your data monthly or quarterly:
- Creates backups
- Allows Excel analysis
- Useful for tax season

### 5. Monitor After-Hours

Check after-hours activity:
- Earnings announcements often occur after close
- Can inform next-day trading decisions

### 6. Mark Dividend Reinvestments

Always mark dividend lots:
- Accurately calculates cost basis
- Tracks true dividend accumulation
- Better tax reporting

### 7. Review and Rebalance

Use the portfolio view to:
- Identify overweight positions
- Rebalance to target allocations
- Monitor sector concentrations

## Common Workflows

### Workflow 1: Adding a New Purchase

After buying stock at your brokerage:
1. Go to Tickers page
2. Click **+ Add Lot**
3. Enter ticker, quantity, cost, date
4. Assign to appropriate portfolio
5. Add notes about purchase rationale
6. Save
7. Verify it appears in table

### Workflow 2: Recording a Sale

After selling shares:
1. Find the lot you sold
2. Option A: Sold entire lot → Click **Delete**
3. Option B: Sold partial → Click **Edit** → Reduce quantity → Save

**Tax Note:** Keep records of sales for tax reporting. Consider exporting before deleting.

### Workflow 3: Monthly Review

End of month portfolio review:
1. Filter to "All Portfolios"
2. Review Total Gain/Loss
3. Check each portfolio individually
4. Identify top gainers and losers
5. Export to CSV for records
6. Update notes with any strategy changes

### Workflow 4: Quarterly Rebalancing

1. Export current portfolio to CSV
2. Open in Excel to calculate allocations
3. Identify overweight/underweight positions
4. Make trades at brokerage
5. Update lots in app (sell some, buy others)
6. Verify new allocations

## Troubleshooting

### Prices Not Updating

**Solutions:**
- Refresh the page (Ctrl+R or Cmd+R)
- Verify API key is configured in Settings
- Check if market is open
- See [API Setup Guide](../guides/api-setup.md)

### Wrong Stock Quote

**Cause:** Ticker symbol is ambiguous or incorrect.

**Solution:**
- Verify ticker on Yahoo Finance or Google Finance
- Some tickers have class distinctions (e.g., BRK.A vs BRK.B)
- Edit the lot and correct the ticker

### Portfolio Not Showing in Filter

**Cause:** No positions in that portfolio, or data sync issue.

**Solution:**
- Refresh the page
- Verify positions are assigned to that portfolio
- Check for typos in portfolio names (case-sensitive)

### Metrics Don't Match Brokerage

**Possible causes:**
- Different cost basis calculation methods
- Wash sale adjustments not reflected
- Fractional share rounding
- Timing of price updates

**Note:** This app shows simple cost basis (price paid × quantity). Consult your brokerage for official tax reporting.

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start-guide.md) - Getting started
- [CSV Import Guide](../guides/csv-import.md) - Bulk import instructions
- [API Setup](../guides/api-setup.md) - Configuring market data
- [Portfolio Visualization](flexible-portfolio.md) - Visual portfolio view
- [Historical Dividends](historical-dividends.md) - Dividend tracking

## Summary

The Tickers page is your portfolio command center:
- **Add positions:** Manually or via CSV
- **Organize:** Use portfolios strategically
- **Track:** Real-time prices and performance
- **Analyze:** Gain/loss, yields, and metrics
- **Export:** Backup and analyze in Excel

Master these features to effectively manage and grow your investment portfolio!
