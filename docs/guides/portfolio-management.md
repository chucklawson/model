# Portfolio Organization

Learn how to organize your investments across multiple portfolios for better tracking and analysis.

## Overview

The Investment Portfolio Manager supports multiple portfolios, allowing you to organize your positions by:
- Brokerage accounts (Fidelity, Vanguard, etc.)
- Account types (Taxable, IRA, 401k, HSA)
- Investment strategies (Growth, Dividend, Value, Trading)
- Asset classes or sectors (Tech, Healthcare, Bonds)

## Creating Portfolios

Portfolios are created automatically when you first use them.

### Method 1: When Adding a Position

1. Go to Tickers page
2. Click "+ Add Lot"
3. In the Portfolio field, type a new portfolio name
4. Save the position
5. **The portfolio is created automatically**

### Method 2: When Importing CSV

1. Include portfolio names in your CSV file
2. Import the file
3. **All unique portfolio names are created automatically**

## Portfolio Naming Best Practices

### Clear and Descriptive Names

**Good:**
- "Fidelity IRA"
- "Vanguard 401k"
- "Robinhood Trading"
- "Dividend Growth"

**Avoid:**
- "Portfolio 1" (not descriptive)
- "test" (not meaningful)
- "P1", "P2" (unclear)

### Consistent Naming

- Choose a naming convention and stick to it
- Be consistent with capitalization
- Remember: "Retirement" ≠ "retirement" (case-sensitive)

## Organizing by Account Type

### Retirement Accounts

Separate by account type:
- "Traditional IRA"
- "Roth IRA"
- "401k Employer"
- "HSA"

**Benefits:**
- Track retirement savings separately
- Understand asset location
- Monitor required minimum distributions (RMDs)

### Taxable Accounts

Keep taxable accounts separate:
- "Taxable Brokerage"
- "Trading Account"
- "Emergency Fund Stocks"

**Benefits:**
- Tax planning and tax-loss harvesting
- Track basis for capital gains
- Manage taxable dividend income

## Organizing by Strategy

### Growth vs Income

- "Growth Stocks"
- "Dividend Income"
- "Value Investing"
- "Index Funds"

**Benefits:**
- Track strategy performance
- Rebalance strategies independently
- Evaluate what works

### Active vs Passive

- "Long-term Holds"
- "Active Trading"
- "Set and Forget"

**Benefits:**
- Monitor trading activity
- Compare active vs passive returns
- Adjust approach based on results

## Organizing by Asset Class

- "US Large Cap"
- "International Stocks"
- "Small Cap Growth"
- "REITs"
- "Bond ETFs"

**Benefits:**
- Asset allocation visibility
- Rebalancing across classes
- Risk management

## Managing Multiple Portfolios

### Using the Portfolio Filter

On the Tickers page:
1. Use the portfolio dropdown (top left)
2. Select "All Portfolios" to view everything
3. Select a specific portfolio to view only those positions

### Portfolio-Specific Metrics

When filtered to one portfolio:
- Total value of that portfolio
- Today's performance for that portfolio
- Portfolio-specific gain/loss

### Comparing Portfolios

1. Export each portfolio to CSV
2. Analyze in Excel or Google Sheets
3. Compare:
   - Total returns
   - Risk (volatility)
   - Expense ratios
   - Dividend yield

## Moving Positions Between Portfolios

To reassign a position:

1. Go to Tickers page
2. Find the position to move
3. Click "Edit"
4. Change the Portfolio field
5. Save

## Deleting or Renaming Portfolios

**Currently:** There's no direct "delete portfolio" or "rename portfolio" function.

**Workaround for renaming:**
1. Edit each lot in the old portfolio
2. Change portfolio name to new name
3. Old portfolio disappears when empty

**Workaround for deleting:**
1. Delete or reassign all lots in that portfolio
2. Portfolio disappears automatically when empty

## Best Practices

### Start Simple

Begin with basic organization:
- "Default" for main holdings
- "Retirement" for retirement accounts
- Add more as needed

### Don't Over-Organize

Avoid creating too many portfolios:
- More portfolios = more complexity
- Harder to track overall performance
- Stick to 3-7 portfolios for most users

### Regular Reviews

Monthly or quarterly:
- Review each portfolio's performance
- Rebalance if needed
- Consolidate unused portfolios

### Align with Brokerage

Mirror your brokerage account structure:
- One portfolio per brokerage account
- Easier to reconcile
- Simpler tax reporting

## Example Organization Schemes

### By Brokerage Account

```
- Fidelity IRA
- Fidelity Taxable
- Vanguard 401k
- Robinhood Trading
```

### By Strategy

```
- Core Holdings
- Dividend Growth
- Speculative
- Cash Reserves
```

### By Goal

```
- Retirement
- House Down Payment
- Kids College
- Emergency Fund
```

### Combined Approach

```
- IRA - Dividend Growth
- IRA - Index Funds
- 401k - Target Date
- Taxable - Trading
- Taxable - Long Term
```

## Related Documentation

- [Portfolio Management](../features/portfolio-management.md) - Tickers page features
- [CSV Import](csv-import.md) - Bulk importing with portfolios
- [Quick Start](../getting-started/quick-start-guide.md) - Getting started

## Summary

Key takeaways:
- Portfolios are created automatically when first used
- Use clear, descriptive names
- Organize by account, strategy, or goal
- Use portfolio filter to view specific portfolios
- Keep it simple - don't over-organize
- Regular reviews and rebalancing
