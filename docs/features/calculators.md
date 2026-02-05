# Calculators

Five financial calculators to help you evaluate investments, plan for retirement, analyze mortgages, and understand banking stocks.

## Overview

The Calculators page provides five specialized tools, each accessible from its own card:

1. **P/E Growth Calculator** - Project future stock prices based on earnings growth and P/E ratios
2. **Rule of 72 Calculator** - Learn about compound interest and investment doubling time
3. **Mortgage Calculator** - Analyze home purchases with taxes, insurance, PMI, and investment comparisons
4. **Drawdown Calculator** - Plan retirement withdrawals and portfolio depletion scenarios
5. **Bank Metrics Calculator** - Evaluate banking stocks with 13 financial metrics and sector benchmarks

**Navigation:** Click **Calculators** in the top navigation bar.

---

## P/E Growth Calculator

Evaluate stock valuations by projecting future stock prices based on earnings growth rates and price-to-earnings ratios. This calculator can auto-fetch current stock data and analyst estimates from the API.

### Modes

The calculator has two primary modes:

#### Mode 1: Future Return After X Years

Calculate what a stock's price could be after a specified number of years, given an earnings growth rate and future P/E ratio.

#### Mode 2: Years to Target P/E

Calculate how many years it would take for a stock's P/E ratio to reach a target level, assuming a given earnings growth rate.

### Data Source Options (Mode 1 only)

- **Manual Growth Rate** - Enter your own estimated earnings growth rate
- **Use Analyst Estimates** - Fetch consensus analyst EPS estimates from the API, which auto-calculates an implied growth rate

### Input Fields

| Field | Description | When Used |
|-------|-------------|-----------|
| **Ticker Symbol** | Stock symbol (e.g., AAPL). Type or select from your portfolio dropdown. | Both modes |
| **Earnings Growth Rate (%)** | Expected annual EPS growth rate. Default: 10%. Can be auto-calculated from analyst estimates. | Both modes |
| **Target P/E Ratio** | The P/E ratio you expect the stock to reach. | Years to Target mode only |
| **Number of Years** | How many years to project forward. Default: 5. | Future Return mode only |
| **Future P/E Ratio** | The P/E ratio you expect at the end of the projection. Auto-populated with current P/E. | Future Return mode only |
| **EPS Override** | Manually override the current EPS value fetched from the API. | Both modes |

### Auto-Fetch Features

When you enter or select a ticker, the calculator automatically fetches:

- **Current Price** - Latest market price
- **EPS (TTM)** - Trailing twelve months earnings per share
- **Current P/E Ratio** - Price-to-earnings ratio
- **Sector and Industry** - Company classification
- **Sector P/E Benchmark** - Average P/E for the stock's sector
- **Expected Growth Rate** - From your portfolio's stored 5-year growth estimate (if available)

When using analyst estimates:
- **Year-by-year EPS estimates** with low, average, and high ranges
- **Number of analysts** contributing estimates
- **Implied annual growth rate** calculated from the estimates

### Results Display

**Current Stock Data Panel:**
- Current Price, EPS, Current P/E, and Sector P/E
- Industry and Sector classification
- EPS Override comparison (if used)

**Calculation Results:**

*Years to Target mode:*
- Number of years to reach target P/E
- Stock price at the target P/E
- Total return percentage
- Investment summary comparing original price to projected price

*Future Return mode:*
- Future EPS at the end of the projection
- Applied future P/E ratio
- Projected stock price
- Total return percentage
- **Annual Projection Table** showing for each year:
  - Calendar year
  - Projected EPS
  - P/E ratio
  - Stock price
  - Annual growth percentage
  - Cumulative return percentage

**Assumptions Panel:**
- Earnings growth method (analyst vs. manual)
- Growth rate used
- Current P/E and EPS values
- Disclaimers about dividends and special events

### Tips

- Compare the **current P/E** to the **sector P/E** to see if the stock trades at a premium or discount to its sector
- Use **analyst estimates** for a data-driven growth rate, then compare with your own expectations
- The **EPS override** is useful when you believe trailing earnings don't reflect future potential (e.g., after a one-time charge)
- A stock with a high P/E but high growth may still be reasonably valued; use this calculator to model the math

---

## Rule of 72 Calculator

An educational calculator that teaches compound interest concepts through four interactive modes. The Rule of 72 is a simple way to estimate how long an investment will take to double: divide 72 by the annual return rate.

### Modes

#### Mode 1: Years to Double

Enter an interest rate to see how long your money will take to double.

**Inputs:**
- Starting Amount ($)
- Interest Rate (%) - input field plus a slider (0.1% to 20%)

**Results:**
- Time to double (Rule of 72 estimate)
- Exact doubling time (formula-based)
- Rule of 72 accuracy percentage
- Speed rating with feedback (Super Fast, Great, Steady, or Slow)
- Growth visualization chart

#### Mode 2: Required Rate

Enter a target number of years and find what interest rate is needed to double your money in that time.

**Inputs:**
- Starting Amount ($)
- Target Years to Double - input field plus a slider (1 to 30 years)

**Results:**
- Required interest rate
- Context about the rate (very low, moderate, great, excellent, etc.)
- Growth visualization chart

#### Mode 3: Compare Scenarios

Compare multiple interest rates side by side to see how dramatically small rate differences compound over time.

**Inputs:**
- Starting Amount ($)
- Four interest rate fields (defaults: 3%, 6%, 9%, 12%)

**Results:**
- Comparison table with columns:
  - Interest Rate
  - Years to Double
  - Speed Rating (Fast, Medium, Slow)
  - Future Value
- Learning insight showing how much faster the highest rate doubles compared to the lowest

#### Mode 4: Watch It Grow!

See a detailed year-by-year projection of your investment growth, including optional monthly contributions.

**Inputs:**
- Starting Amount ($)
- Interest Rate (%) - input field plus a slider (0.1% to 20%)
- Number of Years - input field plus a slider (1 to 50 years)
- Monthly Contribution ($) - optional, default $0

**Results:**
- Final Value (formatted with K/M suffixes for large numbers)
- Total Return percentage
- Times Doubled (count of doublings)
- Doubling Milestones list (which year each doubling occurs)
- Growth visualization chart
- Monthly projection table showing:
  - Year
  - Value
  - Growth
  - Contributions (if applicable)
  - Interest Earned
  - Doubling years highlighted in yellow

### Quick-Start Examples

Pre-filled scenario buttons for quick exploration:
- **Piggy Bank** - $100 at 3%
- **Savings Account** - $500 at 5%
- **Stock Investment** - $1,000 at 10%
- **Super Growth!** - $1,000 at 15%

### Educational Tips

Each mode includes expandable educational tips with explanations and real-world examples to help new investors understand compound interest concepts.

---

## Mortgage Calculator

A comprehensive mortgage analysis tool with PMI calculations, extra payment scenarios, and five interactive chart views including an investment opportunity cost comparison.

### Input Fields

#### Loan Basics

| Field | Description |
|-------|-------------|
| **Loan Amount** ($) | The total loan amount (home price minus down payment) |
| **Down Payment** | Percentage (0-50%) with slider, or dollar amount. The two stay synced. |
| **Interest Rate** (Annual) | Annual mortgage rate. Quick-select buttons offer preset rates. |
| **Loan Term** | Choose 15-year, 30-year, or custom term with a year input field. |

#### Additional Costs

| Field | Description |
|-------|-------------|
| **Property Tax** (Annual) | Annual property tax amount. Monthly breakdown shown. |
| **Home Insurance** (Annual) | Annual homeowner's insurance. Monthly breakdown shown. |
| **HOA Fees** (Monthly) | Monthly homeowners association fees. |

#### Extra Payments (Expandable Section)

Add one or more extra payment schedules to see how they affect your payoff date and total interest:

- **Type:** One-time, recurring monthly, or recurring yearly
- **Amount:** Dollar amount of the extra payment
- **Start Month:** When the extra payment begins
- Add or remove multiple extra payment entries

#### Investment Comparison Settings

- **Expected Return Rate (%)** - The return you expect from investing instead of paying extra on the mortgage
- **Quick Buttons:**
  - Match Mortgage Rate
  - Conservative (4%)
  - S&P 500 Average (7%)
  - Aggressive (10%)

### Quick-Start Scenarios

Pre-filled buttons for common situations:
- FHA 3.5% down
- Conventional 20% down
- First-Time Buyer

### Results Display

Four primary result cards:

| Card | Shows |
|------|-------|
| **Monthly P&I** | Monthly principal and interest payment, plus total monthly payment with taxes/insurance/HOA |
| **Total Interest** | Lifetime interest paid over the loan, with payoff timeline |
| **Total Cost** | Total of principal plus interest |
| **Payoff Date** | Expected payoff date; shows months saved if extra payments are applied |

### Charts (5 Tabs)

#### 1. Principal vs Interest

Pie chart showing the split between total principal and total interest paid over the life of the loan.

#### 2. Remaining Balance

Line chart showing the declining loan balance over time. With extra payments, the balance drops faster and reaches zero sooner.

#### 3. Loan Term Comparison

Compares 15-year, 30-year, and your custom term side by side, showing total interest paid for each.

#### 4. Total Cost Breakdown

Stacked area chart showing the accumulation of principal, interest, taxes, and insurance payments over time.

#### 5. Investment Comparison

Three investment scenarios comparing what would happen if you invested money instead of using it for the mortgage:

- **Lump Sum** - Invest the down payment amount
- **Monthly Payment** - Invest what you'd pay in monthly mortgage payments
- **Draw-Down** - Invest the full loan amount and withdraw monthly payments

### Amortization Schedule Table

Below the charts, a full amortization schedule table shows month-by-month:
- Month number and date
- Principal paid
- Interest paid
- Extra payments (if any)
- Remaining balance
- Investment comparison columns (when on the investment tab)

### PMI (Private Mortgage Insurance)

PMI is automatically calculated when the down payment is less than 20%:
- Default PMI rate: 0.85% annually
- PMI is added to the monthly payment breakdown
- PMI typically drops off once you reach 20% equity

---

## Drawdown Calculator

Plan retirement withdrawals or any scenario where you're drawing down a portfolio over time. Visualize how long your money will last with different withdrawal rates and interest earnings.

### Input Fields

#### Investment Basics

| Field | Description |
|-------|-------------|
| **Beginning Balance** ($) | Starting portfolio value |
| **Annual Interest Rate** (%) | Expected annual return on remaining balance. Quick buttons: 3%, 4%, 5%, 6%, 7%, 8% |
| **Fixed Monthly Drawdown** ($) | Regular monthly withdrawal amount |

#### Duration

| Field | Description |
|-------|-------------|
| **Duration (Years)** | How many years to project. Quick buttons: 5, 10, 20, 30 years |
| **Start Date** | Month and year to begin (alternative to duration) |
| **End Date** | Month and year to end (alternative to duration) |

Duration and dates stay synchronized: changing one updates the other.

#### Variable Drawdowns (Expandable Section)

Add one-time, monthly, or yearly variable withdrawals on top of the fixed monthly drawdown:

- **Type:** One-time, recurring monthly, or recurring yearly
- **Amount:** Dollar amount
- **Start Month:** When the variable drawdown begins
- Add or remove multiple entries

### Quick-Start Scenarios

Pre-filled buttons for common situations:
- Conservative
- Moderate
- Aggressive
- Large Lump Sum

### Results Display

Four primary result cards:

| Card | Shows |
|------|-------|
| **Final Balance** | Ending balance after all drawdowns. Status: "Depleted" or "Sustainable" |
| **Total Withdrawn** | Cumulative amount withdrawn, with average monthly drawdown |
| **Interest Earned** | Total interest generated on remaining balance, with annual rate |
| **Depletion Status** | Month number when portfolio depletes, or "Sustainable" if balance remains positive |

### Charts (4 Tabs)

#### 1. Balance Over Time

Line chart showing the portfolio balance over the entire projection period. The line trends downward as withdrawals exceed interest, or may stabilize if interest roughly matches withdrawals.

#### 2. Interest vs Drawdowns

Stacked area chart comparing interest earned each period against total withdrawals, showing the relationship between income generation and spending.

#### 3. Cumulative Withdrawals

Line chart showing the total amount withdrawn over time, accumulating month by month.

#### 4. Depletion Scenarios

Multiple-scenario comparison showing how different drawdown rates affect the portfolio, helping you find a sustainable withdrawal rate.

### Monthly Schedule Table

A detailed monthly projection table below the charts showing:
- Month number and date
- Beginning balance
- Interest earned
- Fixed drawdown
- Variable drawdown (if any)
- Total drawdown
- Ending balance

Months where the portfolio depletes are highlighted in red.

### Use Cases

- **Retirement Planning:** Model how long your nest egg will last at different withdrawal rates
- **Sabbatical Planning:** See if your savings can sustain a career break
- **Education Funding:** Model drawing from a 529 plan
- **Income Planning:** Understand the sustainable withdrawal rate for your portfolio

---

## Bank Metrics Calculator

Analyze banking stocks with 13 specialized financial metrics, sector benchmark comparisons, historical trend analysis, and an automated recommendation system.

### How to Use

1. Select a ticker from the dropdown (filtered to tickers in your "Financial" portfolio)
2. Choose **Annual** or **Quarterly** reporting period
3. Click **Calculate**
4. Review the 13 metrics organized in four sections

**Note:** Only tickers assigned to a portfolio named "Financial" appear in the dropdown. You must have banking stocks in a "Financial" portfolio to use this calculator.

### Metrics Sections

#### Section 1: Profitability & Efficiency (5 Metrics)

| Metric | Description | Sector Benchmark | Goal |
|--------|-------------|-----------------|------|
| **Return on Assets (ROA)** | Net income / Total assets | 1.05% | Higher is better |
| **Return on Equity (ROE)** | Net income / Shareholder equity | 10.5% | Higher is better |
| **Net Interest Margin (NIM)** | (Interest income - Interest expense) / Earning assets | 3.2% | Higher is better |
| **Efficiency Ratio** | Operating expenses / Revenue | 55.0% | Lower is better |
| **Net Profit Margin** | Net income / Revenue | 25.0% | Higher is better |

#### Section 2: Asset Quality & Risk (2 Metrics)

| Metric | Description | Sector Benchmark | Goal |
|--------|-------------|-----------------|------|
| **Non-Performing Loan (NPL) Ratio** | Non-performing loans / Total loans (FDIC data) | 0.8% | Lower is better |
| **Loan-to-Assets Ratio** | Total loans / Total assets | 65.0% | Higher is better |

#### Section 3: Liquidity & Capital Adequacy (3 Metrics)

| Metric | Description | Sector Benchmark | Goal |
|--------|-------------|-----------------|------|
| **Current Ratio** | Short-term assets / Short-term liabilities | 0.30 | Higher is better |
| **Capital Adequacy Ratio (CAR)** | Capital / Risk-weighted assets (FDIC data) | 13.0% | Higher is better |
| **Debt-to-Equity Ratio** | Total debt / Shareholder equity | 1.2 | Lower is better |

#### Section 4: Club Metrics (3 Metrics)

| Metric | Description | Sector Benchmark | Goal |
|--------|-------------|-----------------|------|
| **Return on Tangible Common Equity (ROTCE)** | Net income / Tangible common equity | 15.0% | Higher is better |
| **Tangible Book Value Per Share (TBVPS)** | Tangible book value / Common shares | $55.00 | Higher is better |
| **Common Equity Tier 1 Ratio (CET1)** | CET1 capital / Risk-weighted assets (FDIC data) | 12.0% | Higher is better |

### Metric Cards

Each metric is displayed as a card containing:

- **Current value** of the metric
- **Mini area chart** showing the last 10 periods of historical data
- **Trend line** (dashed) using linear regression:
  - Green trend line = metric is improving over time
  - Red trend line = metric is declining over time
- **Sector comparison** showing "Above Average" or "Below Average" relative to the sector benchmark, color-coded green or red

### Recommendation Summary

After calculating, a summary card appears with:

- **Star Rating** (1-5 stars) based on the overall composite score
- **Buy/Hold/Sell Recommendation** based on scoring
- **Overall Score** (0-100) broken down into:
  - **Safety Score** (0-25): Based on CAR, CET1, NPL, Debt-to-Equity
  - **Profitability Score** (0-25): Based on ROA, ROE, ROTCE, NIM, Net Profit Margin
  - **Trend Momentum Score** (0-50): Based on whether metrics are improving or declining
- **Confidence Level** (High, Medium, or Low)
- **Performance vs Sector** - Count of metrics above the sector average
- **Key Strengths** - Top 3 strongest metrics with trend direction arrows
- **Areas of Concern** - Bottom 3 weakest metrics with trend direction arrows

### Data Sources

The Bank Metrics Calculator pulls data from two sources:

- **Financial Modeling Prep API** - Quote, key metrics, income statement, balance sheet data
- **FDIC Regulatory Data** - NPL Ratio, Capital Adequacy Ratio, and CET1 Ratio (US banks only)

Some FDIC metrics may show "N/A" if regulatory data is unavailable for a particular institution.

---

## Tips and Best Practices

### General Calculator Tips

- All calculators support **quick-start presets** to get started quickly
- Results update when you click the calculate/update button (not in real-time as you type)
- Charts are interactive: hover to see tooltips with exact values
- All calculators work within a modal dialog; click the X or Close button to return to the Calculators page

### P/E Growth Calculator

- Compare **manual growth rates** with **analyst estimates** to calibrate your expectations
- A stock trading above its sector P/E isn't necessarily overvalued if its growth rate is higher
- Use EPS override when you have insight into future earnings that trailing data doesn't capture

### Rule of 72

- Use the **Compare** mode to see how even 1-2% differences in return compound dramatically over decades
- The **Watch It Grow** mode with monthly contributions shows the power of dollar-cost averaging
- The Rule of 72 is an approximation; it's most accurate for rates between 6% and 10%

### Mortgage Calculator

- Always include property tax, insurance, and HOA for an accurate monthly payment picture
- Use the **Investment Comparison** chart to evaluate the opportunity cost of a large down payment
- Model **extra payments** to see how even small additional payments reduce total interest

### Drawdown Calculator

- The 4% rule (withdrawing 4% of your portfolio annually) is a common retirement starting point
- Use **variable drawdowns** to model one-time expenses like a new car or home repair
- Watch the **Depletion Scenarios** chart to find your sustainable withdrawal rate

### Bank Metrics Calculator

- Assign banking stocks to a portfolio named **"Financial"** to make them available in this calculator
- Pay attention to **trend direction** (improving vs. declining) as much as absolute values
- A bank that scores below benchmarks but is **trending up** may be a turnaround opportunity

---

## Related Documentation

- [Portfolio Management](portfolio-management.md) - Track your investments
- [Research Tools](research-tools.md) - Research before investing
- [Key Metrics](key-metrics.md) - Analyze company financial statements
- [API Setup Guide](../guides/api-setup.md) - Configure your API key
