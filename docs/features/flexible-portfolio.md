# Portfolio Visualization

Analyze your portfolio's performance with interactive charts, year-to-date tracking, custom date range analysis, and technical indicators.

## Overview

The Portfolios page (also called Flexible Portfolio) provides a visual, performance-oriented view of your holdings. While the Tickers page focuses on individual lot management, the Portfolios page focuses on:

- **Today's performance** at a glance
- **Portfolio cards** showing each ticker's current holdings and evaluation
- **Year-to-Date (YTD) Performance** analysis with four chart types
- **Custom Range Performance** analysis for any date range you choose
- **Technical indicators** including moving averages, Bollinger Bands, RSI, and Stochastic Oscillator

**Navigation:** Click **Portfolios** in the top navigation bar.

**Requirement:** A configured Financial Modeling Prep API key is required for real-time data. See the [API Setup Guide](../guides/api-setup.md).

## Page Layout

### Header Section

The page header displays:

- **"Portfolios"** title with the active portfolio filter applied
- **Today's Change** - A prominent box showing:
  - Today's percentage change (green if positive, red if negative)
  - An up or down trend indicator arrow

### Portfolio Filter

A dropdown control to filter which portfolio(s) to display. Your selection is persisted to local storage so it remembers your choice between sessions.

- **All Portfolios** - Shows all holdings across every portfolio
- **Specific Portfolio** - Shows only holdings in the selected portfolio

### Portfolio Cards

Below the header, your holdings appear as individual ticker cards showing:

- Ticker symbol and company name
- Current value and allocation percentage
- Cost basis
- Gain/loss (dollar and percentage)
- Interactive selection for detailed evaluation with technical charts

---

## Year-to-Date (YTD) Performance

The YTD Performance analysis shows how your portfolio has performed from January 1 of the current year through today.

### How to Access

Look for the **YTD Performance** button or link on the Portfolios page, which opens the analysis in a modal dialog.

### Portfolio Filter

At the top of the YTD modal, you can select which portfolios to include:

- Individual checkboxes for each portfolio
- **Select All** and **Deselect All** buttons
- At least one portfolio must be selected
- Shows the count: "Selected: [Portfolio Names] (X of Y)"

### Performance Summary Cards

Five stats cards at the top provide a quick overview:

| Card | Description |
|------|-------------|
| **Current Portfolio Value** | Total market value of all selected positions today |
| **Cost Basis** | Total original investment amount |
| **YTD Baseline Value** | Portfolio value on January 1 plus any new purchases during the year |
| **All-Time Gain** | Difference between current value and cost basis (purple if positive, red if negative) |
| **YTD Gain** | Difference between current value and the YTD baseline (green if positive, red if negative) |

### Charts (4 Tabs)

#### 1. Portfolio Growth (Line Chart)

A line chart showing your portfolio's daily value from January 1 through today.

- **Line color:** Green if YTD gain is positive, red if negative
- **Gradient area fill** below the line for visual emphasis
- **Dashed reference line** at the baseline value (January 1 starting value)
- **Tooltip:** Hover to see the date, portfolio value, and gain ($ and %)

#### 2. Top Performers (Bar Chart)

A bar chart ranking every ticker in your portfolio by its YTD gain percentage.

- **Green bars** for positive gainers, **red bars** for losers
- **Reference line** at 0%
- For large portfolios (30+ tickers), shows the top 15 and bottom 15
- **Clickable bars** to drill into individual ticker details
- **Tooltip:** Shows ticker, YTD gain %, dollar gain, and current value

#### 3. Allocation (Pie/Donut Chart)

A donut chart showing the current allocation of your portfolio by ticker.

- Labels appear only for positions above 3% allocation
- **Clickable slices** to view ticker details
- **Legend** on the right side with ticker names and colors
- **Total portfolio value** displayed below the chart
- **Tooltip:** Shows ticker, dollar value, and allocation percentage

#### 4. Breakdown (Stacked Area Chart)

A stacked area chart showing how each ticker has contributed to total portfolio value over time.

- Shows the **top 10 tickers** by current value
- Remaining tickers grouped as **"Others"**
- **Gradient fills** for each area
- **Tooltip:** Shows the date, total value, and every ticker's contribution sorted by size

### Data Quality Warnings

If any ticker has incomplete or missing price data, a yellow warning box appears listing the affected tickers and issues.

---

## Custom Range Performance

Analyze your portfolio's performance over any date range you choose, not just year-to-date.

### How to Access

Look for the **Custom Range Performance** button or link on the Portfolios page, which opens the analysis in a modal dialog.

### Selecting a Date Range

#### Preset Buttons

Quick-select buttons for common lookback periods:

| Button | Period |
|--------|--------|
| **YTD** | January 1 to today |
| **1M** | Last 30 days |
| **3M** | Last 90 days |
| **6M** | Last 180 days |
| **9M** | Last 270 days |
| **1Y** | Last 365 days |
| **All Time** | From the earliest purchase date in your portfolio |

The active preset is highlighted with a blue/emerald background and ring.

#### Custom Dates

You can also enter specific start and end dates manually:

- **Start Date** - Constrained to be on or before the end date
- **End Date** - Constrained to be on or before today

After changing dates, click **Recalculate** to update the analysis. The display shows "Showing X days of performance data" for context.

### Portfolio Filter

Same as the YTD modal: individual portfolio checkboxes with Select All / Deselect All options.

### Performance Summary Cards

Six stats cards (same as YTD but referencing the custom range instead):

| Card | Description |
|------|-------------|
| **Current Portfolio Value** | Total market value today |
| **Cost Basis** | Total original investment amount |
| **Range Start Value** | Portfolio value at the start of the selected range plus any new purchases |
| **All-Time Gain** | Gains from original cost basis |
| **Range Gain** | Gains within the selected date range only |

### Charts (4 Tabs)

The Custom Range modal offers the same four chart types as YTD:

1. **Portfolio Growth** (Line Chart) - Value over the custom date range with a baseline reference line
2. **Top Performers** (Bar Chart) - Tickers ranked by range gain percentage
3. **Allocation** (Pie/Donut Chart) - Current portfolio allocation
4. **Breakdown** (Stacked Area Chart) - Ticker contribution over time, with top 10 tickers and "Others"

All charts function the same as their YTD equivalents but use data from the selected date range.

### Gain / Loss by Stock (Bar Chart)

Below the main chart area (visible on all tabs), an additional bar chart displays the dollar gain or loss for every stock in your portfolio over the selected date range.

- **One bar per stock**, sorted alphabetically by ticker symbol
- **Green bars** for gains, **red bars** for losses
- **Reference line** at $0 for quick visual separation of winners and losers
- **Dynamic height** - the chart grows taller as more tickers are included

**Tooltip (hover over a bar):**
- Ticker symbol
- Total gain/loss in dollars and percentage for the selected range
- **Portfolio breakdown** - lists each portfolio that owns the stock along with that portfolio's proportional share of the gain/loss

This chart provides a quick way to see which individual stocks are driving your portfolio's performance and how those gains or losses are distributed across your portfolios.

---

## Technical Indicators

When you drill into an individual ticker from the portfolio cards, the application can display several technical analysis charts:

### Price & Moving Averages (Composed Chart)

An overlay chart combining price data with multiple moving average indicators:

| Indicator | Color | Description |
|-----------|-------|-------------|
| **Daily Closing Price** | Blue-purple area + line | Actual daily closing prices |
| **Simple Moving Average (SMA)** | Blue | Average price over a rolling period |
| **Exponential Moving Average (EMA)** | Red | Weighted average giving more weight to recent prices |
| **50-Day Moving Average** | Pink | Medium-term trend indicator |
| **200-Day Moving Average** | Cyan | Long-term trend indicator |
| **Upper Bollinger Band** | Light blue (optional) | 2 standard deviations above the SMA |
| **Lower Bollinger Band** | Light blue (optional) | 2 standard deviations below the SMA |
| **Bollinger Mean** | Pink-magenta (optional) | Middle Bollinger Band (same as SMA) |

**Purchase Indicators:** If you have purchase lots for this ticker, green dashed lines and dots can be overlaid on the chart showing where and at what price you bought.

**How to read it:**
- Price above the 200-day MA generally indicates an uptrend
- Price below the 200-day MA generally indicates a downtrend
- Price touching the upper Bollinger Band may indicate overbought conditions
- Price touching the lower Bollinger Band may indicate oversold conditions

### Relative Strength Index (RSI)

A momentum oscillator that measures the speed and magnitude of price changes.

- **RSI Line:** Plotted on a 0-100 scale
- **Overbought Line:** Dashed reference at 70 (configurable)
- **Oversold Line:** Dashed reference at 30 (configurable)

**How to read it:**
- RSI above 70 = potentially overbought (price may be due for a pullback)
- RSI below 30 = potentially oversold (price may be due for a bounce)
- Divergence between RSI and price can signal trend reversals

### Stochastic Oscillator

A momentum indicator comparing a stock's closing price to its price range over a given period.

- **%K Line (Fast):** Green line, more sensitive to recent price changes
- **%D Line (Slow):** Blue line, smoothed version of %K
- **Overbought Line:** Dashed reference at 80
- **Oversold Line:** Dashed reference at 20

**How to read it:**
- Both lines above 80 = overbought condition
- Both lines below 20 = oversold condition
- %K crossing above %D = potential buy signal
- %K crossing below %D = potential sell signal

### Price-to-Earnings (P/E) Chart

A bar chart showing how the company's P/E ratio has changed over multiple reporting periods.

- **Green bars** for each period's P/E ratio
- **Reference line** at 0
- Helps visualize whether the stock is becoming more or less expensive relative to earnings

---

## Tips and Best Practices

### Daily Monitoring

- Check **Today's Change** on the Portfolios page header for a quick daily pulse
- The trend arrow gives you an instant visual signal

### Performance Reviews

- Use **YTD Performance** for annual reviews and tracking against benchmarks
- Use **Custom Range Performance** to evaluate performance over specific market events
- Compare different portfolios by toggling the portfolio filter

### Technical Analysis

- Use moving averages to identify the trend direction
- Combine RSI and Stochastic readings for stronger signals
- Watch for price approaching Bollinger Bands for potential reversal zones
- The purchase overlay helps you visualize your entry points relative to technical levels

### Portfolio Allocation

- Use the **Allocation pie chart** to check if any single position dominates your portfolio
- Review allocation quarterly and rebalance if needed
- Compare allocation across different portfolios using the filter

---

## Troubleshooting

### No Data Showing

- Verify your API key is configured in Settings
- Ensure you have positions in the selected portfolio
- Refresh the page

### Charts Not Loading

- Check your internet connection
- Verify you haven't exceeded your API request limit
- Try a shorter date range for Custom Range analysis

### YTD Shows $0 Gain

- If all positions were purchased this year, the YTD baseline equals the cost basis
- Check that historical price data is available for your tickers

---

## Related Documentation

- [Portfolio Management](portfolio-management.md) - Detailed position tracking on the Tickers page
- [Historical Dividends](historical-dividends.md) - Dividend income tracking
- [Research Tools](research-tools.md) - News and market research
- [Calculators](calculators.md) - Investment analysis calculators
- [Getting Started](../getting-started/quick-start-guide.md) - Initial setup
