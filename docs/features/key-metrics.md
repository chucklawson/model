# Key Metrics

Analyze company financial statements and key performance metrics with an interactive spreadsheet view.

## Overview

The Key Metrics page lets you look up any public company's financial data and view it in a scrollable spreadsheet format. You can choose between quarterly and annual reporting periods, control how many periods to display, and view detailed company profile information.

**Navigation:** Click **Key Metrics** in the top navigation bar.

**Requirement:** A configured Financial Modeling Prep API key is required. See the [API Setup Guide](../guides/api-setup.md).

## Page Layout

### Header

The page header features an emerald-to-sky gradient background with the title "Key Metrics - Financial Analysis."

### Input Panel

A centered control panel with the following fields:

| Control | Description |
|---------|-------------|
| **Annual vs Quarterly Toggle** | Checkbox to switch between annual and quarterly data. Default: Quarterly. |
| **Ticker Symbol** | Text input for the stock symbol (e.g., AAPL). Auto-converts to uppercase. |
| **Periods to Show** | Number input (1-20) controlling how many reporting periods to display. Default: 8. |
| **Update Data Button** | Fetches financial data for the entered ticker. Also triggered by pressing Enter in either input field. |
| **Company Information Button** | Opens a detailed company profile modal. Disabled until a ticker is entered. |

### Spreadsheet Display

Below the input panel, financial data appears in a scrollable spreadsheet with:
- Sticky column and row headers that stay visible while scrolling
- Horizontal scrolling for many periods of data
- Vertical scrolling for the full list of metrics

## How to Use

### Step 1: Enter a Ticker

1. Type a stock symbol in the **Ticker Symbol** field (e.g., AAPL, MSFT, JPM)
2. The field automatically converts your input to uppercase

### Step 2: Configure Display Options

- **Period Type:** Check or uncheck the "Use Annual Periods vs. Quarterly" checkbox
  - **Quarterly** (default) shows Q1, Q2, Q3, Q4 data for recent quarters
  - **Annual** shows full-year (FY) data for recent fiscal years
- **Periods to Show:** Enter a number from 1 to 20 (default: 8)
  - More periods give you a longer historical view
  - Fewer periods keep the display compact and focused on recent data

### Step 3: Fetch Data

Click **Update Data** or press **Enter** in either input field. The spreadsheet populates with financial metrics.

### Step 4: Explore the Data

- Scroll horizontally to see all periods
- Scroll vertically to see all metrics
- Column and row headers stay fixed for reference

### Step 5: View Company Information (Optional)

Click the **Company Information** button (purple) to open a detailed profile modal.

## Company Information Modal

The Company Information modal provides a comprehensive company profile:

### Quick Info Cards

Three cards at the top showing:
- **Industry** - Sector and specific industry classification
- **Leadership** - CEO name
- **Employees** - Full-time employee count

### Company Description

A notebook-styled section with the full company description, displayed on a lined-paper background. Multi-paragraph descriptions are supported.

### Contact Information

Two cards showing:
- **Address** - Street address, city, state, ZIP code, and country
- **Contact** - Website link (opens in a new tab) and phone number

### Company Header

The modal header displays:
- Company logo (if available)
- Company name
- Ticker symbol
- Current stock price

## Key Metrics Explained

The spreadsheet displays a wide range of financial metrics. Here are the major categories:

### Valuation Metrics

| Metric | Description | How to Interpret |
|--------|-------------|-----------------|
| **P/E Ratio** | Price / Earnings per share | Lower may indicate undervaluation; compare to sector peers |
| **P/B Ratio** | Price / Book value per share | Below 1.0 may indicate undervaluation |
| **P/S Ratio** | Price / Revenue per share | Useful for comparing companies in the same industry |
| **EV/EBITDA** | Enterprise value / EBITDA | Common for comparing companies across capital structures |

### Per-Share Metrics

| Metric | Description |
|--------|-------------|
| **Revenue Per Share** | Total revenue divided by shares outstanding |
| **Net Income Per Share** | Net income divided by shares outstanding |
| **Operating Cash Flow Per Share** | Operating cash flow divided by shares outstanding |
| **Free Cash Flow Per Share** | Free cash flow divided by shares outstanding |
| **Book Value Per Share** | Total equity divided by shares outstanding |
| **Cash Per Share** | Cash and equivalents divided by shares outstanding |

### Profitability Metrics

| Metric | Description | How to Interpret |
|--------|-------------|-----------------|
| **ROE** | Return on equity (Net income / Shareholders' equity) | Higher indicates more efficient use of equity |
| **ROA** | Return on assets (Net income / Total assets) | Higher indicates more efficient use of assets |
| **Profit Margin** | Net income / Revenue | Higher means more of each dollar of revenue becomes profit |

### Financial Health

| Metric | Description | How to Interpret |
|--------|-------------|-----------------|
| **Debt to Equity** | Total debt / Shareholders' equity | Lower generally indicates less financial risk |
| **Current Ratio** | Current assets / Current liabilities | Above 1.0 means the company can cover short-term obligations |
| **Interest Coverage** | EBIT / Interest expense | Higher means the company can more easily service its debt |

### Dividend Metrics

| Metric | Description |
|--------|-------------|
| **Dividend Yield** | Annual dividend / Share price |
| **Payout Ratio** | Dividends paid / Net income |

## Analysis Tips

### Compare Over Time

- Use **8-12 quarterly periods** to spot seasonal trends
- Use **5-10 annual periods** to see long-term trajectory
- Look for consistent improvement or deterioration in key ratios

### Compare to Peers

- Metrics are most meaningful when compared to companies in the same sector
- Use the **Company Information** button to confirm the company's sector and industry
- Look up multiple competitors to build a comparison

### Red Flags to Watch For

- **Declining revenue per share** over multiple periods
- **Rising debt-to-equity** ratio
- **Falling ROE** or **ROA** over time
- **Payout ratio above 100%** (company paying more in dividends than it earns)
- **Negative free cash flow** for extended periods

### Positive Signals

- **Growing revenue and earnings per share** over time
- **Improving profit margins**
- **Stable or declining debt levels**
- **Consistent free cash flow generation**
- **Rising book value per share**

## Troubleshooting

### No Data Appears

- Verify your API key is configured in Settings
- Check that the ticker symbol is correct
- Some very new or small companies may have limited data
- Try switching between Annual and Quarterly views

### Spreadsheet Is Hard to Read

- Scroll horizontally to see all periods; headers stay fixed
- Reduce the number of periods for a more compact view
- Use a wider browser window for better visibility

### Company Information Button Is Disabled

- Enter a ticker symbol first
- The button enables after a valid ticker is entered in the input field

---

## Related Documentation

- [Portfolio Management](portfolio-management.md) - Track your positions
- [Research Tools](research-tools.md) - Company news and market research
- [Calculators](calculators.md) - Valuation calculators
- [Historical Dividends](historical-dividends.md) - Dividend tracking
- [API Setup Guide](../guides/api-setup.md) - Configure your API key
