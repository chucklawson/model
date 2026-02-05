# Historical Dividends

Track dividend payment history and current yield for any public company with an interactive spreadsheet view.

## Overview

The Historical Dividends page lets you look up any stock's dividend payment history and view it in a detailed spreadsheet format. Key features include:

- **Current yield** display for the selected ticker
- **Configurable period count** (1-20 periods)
- **Spreadsheet view** of historical dividend data including payment dates, amounts, and yields
- Works with any dividend-paying public company available through the Financial Modeling Prep API

**Navigation:** Click **Dividends** in the top navigation bar.

**Requirement:** A configured Financial Modeling Prep API key is required. See the [API Setup Guide](../guides/api-setup.md).

## Page Layout

### Header

The page header features a lime-to-emerald gradient background with the title "Historical Dividends."

### Input Panel

A centered control panel with the following fields:

| Control | Description |
|---------|-------------|
| **Ticker Symbol** | Text input for the stock symbol (e.g., KO, JNJ, PG). Auto-converts to uppercase. |
| **Periods to Show** | Number input (1-20) controlling how many dividend periods to display. Default: 8. |
| **Update Data Button** | Fetches dividend history for the entered ticker. Also triggered by pressing Enter in either input field. |

### Current Yield Display

When dividend data is available and the current yield is greater than 0%, a highlighted card appears showing:

- **Current Yield** percentage (formatted to 2 decimal places)
- Displayed in a green-bordered card with a green-to-emerald gradient background
- Calculated from the stock's current dividend payments and current price

### Spreadsheet Display

Below the controls, dividend history appears in a scrollable spreadsheet with:
- Sticky column and row headers that stay visible while scrolling
- Horizontal scrolling for many periods of data
- Vertical scrolling for the full list of dividend data fields

## How to Use

### Step 1: Enter a Ticker

1. Type a stock symbol in the **Ticker Symbol** field (e.g., KO for Coca-Cola, JNJ for Johnson & Johnson)
2. The field automatically converts your input to uppercase

### Step 2: Set Period Count

Enter the number of dividend periods you want to see (1-20, default: 8).

- For **quarterly dividends** (most US stocks), 8 periods shows about 2 years of history
- For **monthly dividends** (some REITs and funds), 12 periods shows 1 year
- For **annual dividends** (some international stocks), 5-10 periods shows 5-10 years
- Use more periods (15-20) for a longer historical view

### Step 3: Fetch Data

Click **Update Data** or press **Enter** in either input field. The spreadsheet populates with dividend history.

### Step 4: Review the Data

- Check the **current yield** card at the top
- Scroll through the spreadsheet to see individual dividend payments
- Look for patterns: growing dividends, consistent payments, or any cuts

## Understanding the Data

### Current Yield

The current yield is calculated as:

```
Current Yield = (Annual Dividend / Current Stock Price) x 100
```

This tells you what percentage return you'd earn from dividends alone at the current stock price.

### Dividend History Fields

The spreadsheet typically includes:

| Field | Description |
|-------|-------------|
| **Ex-Dividend Date** | The date on or after which the stock trades without the dividend. You must own shares before this date to receive the dividend. |
| **Record Date** | The date the company checks its records to determine eligible shareholders. |
| **Payment Date** | The date the dividend is actually paid to shareholders. |
| **Declaration Date** | The date the company announces the dividend. |
| **Dividend Amount** | The dollar amount per share for that period. |
| **Adjusted Dividend** | The dividend amount adjusted for stock splits. |

### Key Dates Explained

**Ex-Dividend Date** is the most important date for investors:
- Buy **before** the ex-dividend date to receive the dividend
- Buy **on or after** the ex-dividend date and the seller receives the dividend instead
- Stock price typically drops by approximately the dividend amount on the ex-dividend date

## Analysis Tips

### Evaluating Dividend Stocks

1. **Dividend Growth:** Look for a pattern of increasing dividends over time. Consistent growth is a sign of financial health.

2. **Dividend Consistency:** Look for regular, uninterrupted payments. Cuts or suspensions may indicate financial trouble.

3. **Yield Trends:** If the yield is unusually high compared to historical levels, check whether it's because the stock price has dropped (which could signal trouble) or because the dividend was recently increased.

4. **Payment Frequency:** Most US stocks pay quarterly. Some REITs and funds pay monthly. International stocks may pay semi-annually or annually.

### Comparing Dividend Stocks

To compare dividend stocks:
1. Look up each ticker's yield and history
2. Compare growth rates of dividend payments
3. Consider consistency of payments alongside yield
4. A lower yield with consistent growth may outperform a higher yield with stagnant or declining payments

### Dividend Reinvestment

If you're reinvesting dividends:
- Track reinvestment lots on the [Tickers page](portfolio-management.md) by checking the "Is Dividend" box
- This separates dividend reinvestment shares from your original purchases
- Helps calculate your true cost basis and track compounding

## Common Dividend-Paying Stock Categories

| Category | Typical Yield | Examples |
|----------|--------------|---------|
| **Dividend Aristocrats** | 2-4% | Stocks with 25+ years of consecutive dividend increases |
| **REITs** | 3-8% | Real estate investment trusts required to pay 90% of taxable income |
| **Utilities** | 3-5% | Stable cash flows support consistent dividends |
| **Consumer Staples** | 2-4% | Companies like Coca-Cola, Procter & Gamble |
| **Financial Sector** | 2-4% | Banks and insurance companies |
| **High-Yield ETFs** | 3-7% | Dividend-focused exchange-traded funds |

## Troubleshooting

### No Dividend Data Appears

- Verify your API key is configured in Settings
- Check that the ticker symbol is correct
- Not all stocks pay dividends (e.g., many growth stocks like AMZN or GOOGL)
- Try a well-known dividend payer like KO, JNJ, or PG to verify the feature works

### Current Yield Shows 0%

- The stock may not currently pay a dividend
- The stock may have recently suspended its dividend
- Data may not be available yet for a newly initiated dividend

### Data Seems Incomplete

- Some stocks have limited historical data, especially if recently IPO'd
- International stocks may have less data available
- Try reducing the period count if data is sparse

---

## Related Documentation

- [Portfolio Management](portfolio-management.md) - Mark dividend reinvestment lots
- [Key Metrics](key-metrics.md) - View dividend-related financial metrics
- [CSV Import](../guides/csv-import.md) - Import dividend reinvestment positions
- [Export Data](../guides/export-data.md) - Export dividend data for tax purposes
- [API Setup Guide](../guides/api-setup.md) - Configure your API key
