# Portfolio Management

Master the core features of the Tickers page — your central hub for tracking, managing, and analyzing your investment portfolio.

## Overview

The Tickers page is where you'll spend most of your time in the Investment Portfolio Manager. It provides a comprehensive view of all your stock positions with real-time data, advanced filtering, and powerful management tools.

**Key Features:**
- Real-time stock quotes and after-hours prices
- Multi-portfolio organization with persistent filtering
- Long positions and short sale positions tracked separately
- Manual position entry and CSV bulk import/export
- Dividend tracking and yield calculations
- Watchlist entries for monitoring potential purchases
- Stock split adjustments
- Performance analysis modal

## Page Layout

### Header Bar

A scrollable action bar contains:

- **Refresh** — Re-fetches prices and reloads lots
- **Manage Portfolios** — Opens the Portfolio Manager to create or delete portfolios
- **Import CSV** — Bulk import positions from a CSV file
- **Export Tickers** — Download all visible positions to CSV
- **Performance** — Opens the Custom Range Performance modal
- **Add First Lot** — Opens the new-ticker form to add a brand-new ticker to your portfolio

### Portfolio Stats Bar

Real-time summary cards below the header:

| Card | Description |
|------|-------------|
| **Today's Change** | Dollar change for the current trading day across all positions (short positions invert the sign) |
| **Total Cost** | Sum of all lot cost bases (or proceeds for short lots) |
| **Value** | Current market value of the entire filtered portfolio |
| **Tickers** | Count of distinct tickers with actual holdings (excludes watchlist entries) |

When only the **Dividend** portfolio is selected, two additional cards appear:

| Card | Description |
|------|-------------|
| **Dividend Yield %** | Portfolio weighted yield based on `baseYield` × cost for each ticker |
| **Annual Dividend Income** | Projected annual dividend income in dollars |

### Positions Table (Summary Spreadsheet)

Each row represents a unique ticker + position type combination:

| Column | Description |
|--------|-------------|
| **Type** | Green **LONG** badge or red **SHORT** badge |
| **Ticker** | Stock symbol |
| **Company** | Company name |
| **Shares** | Total shares across all lots |
| **Avg Cost** | Weighted average cost per share |
| **Total Cost** | Total invested (or total short proceeds) |
| **Current Price** | Latest market price |
| **Current Value** | Shares × current price |
| **P&L ($)** | Gain or loss in dollars |
| **P&L (%)** | Return percentage |
| **Portfolios** | Portfolio(s) this ticker belongs to |

**Important:** If you hold both long and short lots for the same ticker, they appear as **two separate rows** — one with a LONG badge and one with a SHORT badge.

**Watchlist entries** (0 shares, $0 cost) appear in the table when you are viewing a specific portfolio. They are excluded from totals and the Tickers count.

---

## Adding a New Ticker

Use **Add First Lot** in the header to add a ticker that is not yet in your portfolio.

### Form Fields

**Ticker Symbol** *(required)*
- Enter the stock symbol (e.g., AAPL, MSFT, GOOGL)
- Automatically converted to uppercase

**Short Sale** *(optional toggle)*
- Leave unchecked for a standard long purchase
- Check to record a short sale (see [Short Positions](#short-positions) below)

**Portfolio** *(required — select at least one)*
- Checkboxes for each portfolio you have created
- Must select at least one to save

**Number of Shares** *(required)*
- Supports decimals for fractional shares
- Enter 0 to create a watchlist entry

**Cost Per Share / Sale Price Per Share** *(required)*
- For long positions: the price you paid per share
- For short sales: the price at which you sold short

**Purchase Date** *(required)*

**Dividend Reinvestment** *(optional)*
- Check if this lot represents dividend reinvestment shares
- Dividend lots are excluded from purchase indicators on charts

**Notes** *(optional)*

### Creating Portfolios

Portfolios must be created before they appear in the checkbox list. Use **Manage Portfolios** in the header to create them first. CSV import creates portfolios automatically.

---

## Adding Lots to an Existing Ticker

Click any row in the summary table to open the **Ticker Detail Modal** for that ticker. Inside the modal you can add additional lots (e.g., subsequent purchases) using the same form fields described above.

---

## Short Positions

The app fully supports recording short sales separately from long positions.

### What is a Short Sale?

A short sale is a bearish trade where you sell borrowed shares hoping to buy them back later at a lower price. Your profit is the difference between your sale price and the later cover price.

### Recording a Short Sale

1. Open **Add First Lot** (or click an existing ticker and add a lot)
2. Check **Short Sale**
3. The form relabels:
   - "Cost Per Share" becomes **"Sale Price Per Share"** (the price at which you shorted)
   - "Total Cost" becomes **"Total Proceeds"** (the cash you received)
4. Fill in shares and sale price
5. Save

### How Short P&L Works

| Metric | Calculation |
|--------|-------------|
| **Proceeds** | Shares × Sale Price (stored as `totalCost`) |
| **Cover Cost** | Shares × Current Price |
| **Short P&L** | Proceeds − Cover Cost |
| **Profitable when** | Current price is **below** your sale price |

A short is profitable when the stock price falls after you short it. The P&L shows green when positive (price fell) and red when negative (price rose against you).

### Mixed Positions (Long + Short on Same Ticker)

If you hold both long and short lots of the same ticker:
- The summary table shows **two rows** — one LONG and one SHORT
- The Ticker Detail Modal shows **separate stats sections** for long and short
- The long stats show: Shares, Cost Basis, Avg Cost, Current Value, P&L
- The short stats show: Short Shares, Proceeds, Avg Sale Price, Cover Cost, Short P&L
- Today's Change inverts for the short row (rising price = negative change)

---

## Watchlist Entries

You can add a ticker with 0 shares and $0 cost to monitor it without having a position.

**Use case:** Track stocks you are considering buying.

**Behavior:**
- Appears in the table when viewing a specific portfolio
- Excluded from portfolio totals and the Tickers count
- Clicking the row opens the Ticker Detail Modal where you can add a real lot when you decide to buy

---

## Stock Splits

When a stock in your portfolio undergoes a split, use the **Stock Split** feature inside the Ticker Detail Modal to automatically adjust all lots.

1. Click the ticker row to open its detail modal
2. Click the **Stock Split** button
3. Enter the split ratio (e.g., 2 : 1 for a 2-for-1 split)
4. Review the preview table showing the new share counts and adjusted cost per share
5. Click **Save Split** to apply, or **Cancel** to discard

The split multiplies shares by the ratio and divides the cost per share by the same ratio, preserving your total cost basis.

---

## Managing Existing Positions

### Editing a Lot

1. Click the ticker row in the summary table
2. Find the lot in the detail modal's lot list
3. Click the **Edit** button on the lot
4. Modify fields and save

### Deleting a Lot

1. Click the ticker row to open the detail modal
2. Click the **Delete** button on the lot
3. Confirm deletion

**Note:** Deletion cannot be undone. Export your data first if you need a record.

### Recording a Partial Sale

Do not delete the lot. Instead:
1. Open the lot for editing
2. Reduce the quantity to the remaining shares
3. Save

---

## Portfolio Organization

### Creating Portfolios

Use **Manage Portfolios** in the header to create, rename, or delete portfolios. Portfolios created via CSV import are added automatically.

### Portfolio Filter

The filter bar above the table lets you show positions from one or more portfolios. Your selection persists between sessions (stored in browser local storage).

- Leave all portfolios deselected to view **All Portfolios**
- Select one or more to filter to those portfolios

### Portfolio Use Cases

**By Account Type:** Retirement (IRA, 401k), Taxable Brokerage, HSA

**By Strategy:** Dividend Growth, Growth Stocks, Value Investing, Trading

**By Goal:** Long-term Holds, Short-term Trades, Watchlist

---

## Import / Export

### CSV Import

Bulk-import positions from a CSV file. See the [CSV Import Guide](../guides/csv-import.md) for format details.

**Note:** All CSV-imported lots are treated as long positions. Short sales must be entered manually.

### CSV Export

Click **Export Tickers** to download all currently visible lots as a CSV file. Use this for backups, Excel analysis, or tax records.

---

## Understanding Position Data

### Long Position Math

| Metric | Calculation |
|--------|-------------|
| Total Cost | Shares × Cost Per Share |
| Current Value | Shares × Current Price |
| P&L ($) | Current Value − Total Cost |
| P&L (%) | P&L ($) / Total Cost × 100 |

### Short Position Math

| Metric | Calculation |
|--------|-------------|
| Proceeds | Shares × Sale Price |
| Cover Cost | Shares × Current Price |
| P&L ($) | Proceeds − Cover Cost |
| P&L (%) | P&L ($) / Proceeds × 100 |

---

## Tips and Best Practices

### Organize with Portfolios
Create separate portfolios that align with your brokerage accounts or strategies. Use **Manage Portfolios** before adding lots so your portfolios are ready to select.

### Track Each Purchase Separately
Keep separate lots for each buy — this simplifies tax-lot identification and lets you calculate time-weighted returns per entry.

### Use the Watchlist
Add 0-share entries to track tickers you are researching. When you buy, open the detail modal and add the real lot.

### Export Regularly
Export to CSV monthly or quarterly for backups and tax records.

### Mark Dividend Reinvestments
Check "Dividend Reinvestment" on DRIP lots to separate them from original purchases and keep accurate cost basis tracking.

---

## Troubleshooting

### Prices Not Updating
- Click **Refresh** in the header
- Verify your API key is configured in Settings
- Prices poll automatically every 10 minutes during regular trading hours

### A Ticker Shows Two Rows
This is expected when you hold both long and short lots of the same ticker. Each position type (LONG/SHORT) appears as a separate row.

### Watchlist Ticker Not Visible
Watchlist entries (0 shares) only appear when you have a specific portfolio selected in the filter — they are hidden in the "All Portfolios" view.

### Portfolio Not Appearing in Filter
Create the portfolio first using **Manage Portfolios**, then assign lots to it.

### Metrics Don't Match Brokerage
This app uses simple cost basis (price paid × shares). It does not apply wash-sale adjustments or lot-matching rules. Consult your brokerage for official tax reporting.

---

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start-guide.md) - Getting started
- [CSV Import Guide](../guides/csv-import.md) - Bulk import instructions
- [API Setup](../guides/api-setup.md) - Configuring market data
- [Portfolio Visualization](flexible-portfolio.md) - Charts and performance analysis
- [Historical Dividends](historical-dividends.md) - Dividend tracking
