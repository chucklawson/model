# Export Data

Learn how to export your portfolio data for backup, analysis, and tax reporting.

## Overview

The Export feature allows you to download your portfolio data as a CSV file for:
- Backup and record-keeping
- Analysis in Excel or Google Sheets
- Tax reporting and documentation
- Sharing with financial advisors
- Migration to other systems

## How to Export

### Export All Positions

1. Navigate to the **Tickers** page
2. Ensure "All Portfolios" is selected in the filter (top left)
3. Click the **Export to CSV** button (top right)
4. Choose a location to save the file
5. The file will download with all your positions

### Export a Specific Portfolio

1. Navigate to the **Tickers** page
2. Use the portfolio filter dropdown to select a specific portfolio
3. Click the **Export to CSV** button
4. Only positions in the selected portfolio will be exported

## Export File Format

The exported CSV file includes all position data:

### Columns Included

- **Ticker** - Stock symbol
- **Date** - Purchase date
- **Quantity** - Number of shares
- **Cost** - Cost per share
- **Portfolio** - Portfolio name
- **Notes** - Position notes (if any)
- **Current Price** - Latest market price
- **Current Value** - Quantity × Current Price
- **Gain/Loss** - Profit or loss ($ and %)

### File Format

- **Format:** CSV (Comma Separated Values)
- **Encoding:** UTF-8
- **Compatible with:** Excel, Google Sheets, Numbers, any spreadsheet software

## Common Use Cases

### 1. Backup Your Data

**Recommended frequency:** Monthly or quarterly

1. Export all portfolios
2. Save with date in filename (e.g., "portfolio-2024-01-15.csv")
3. Store in cloud storage (Google Drive, Dropbox, etc.)
4. Keep multiple versions for history

### 2. Tax Reporting

At year-end:

1. Export all positions
2. Open in Excel
3. Filter by purchase/sale dates
4. Calculate capital gains/losses
5. Provide to tax preparer

**Note:** Consult a tax professional for official reporting.

### 3. Portfolio Analysis

Export and analyze:

- **Asset allocation** - Percentage by sector, market cap, etc.
- **Performance** - Best and worst performers
- **Cost basis** - Weighted average costs
- **Tax implications** - Long-term vs short-term holdings

### 4. Sharing with Advisor

1. Export your portfolio
2. Share CSV file with financial advisor
3. Discuss strategy and recommendations

### 5. Data Migration

Moving to another system:

1. Export from Investment Portfolio Manager
2. Transform data to match new system's format
3. Import into new system

## Working with Exported Data

### Open in Excel

1. Open Excel
2. File → Open
3. Select your CSV file
4. Data will load automatically

### Open in Google Sheets

1. Go to Google Sheets
2. File → Import
3. Upload your CSV file
4. Import data

### Tips for Analysis

**Sort and Filter:**
- Sort by Gain/Loss to find top performers
- Filter by Portfolio to analyze specific accounts
- Sort by Purchase Date to identify holding periods

**Create Pivot Tables:**
- Summarize by portfolio
- Group by ticker (if multiple lots)
- Calculate totals and averages

**Charts and Graphs:**
- Pie chart of portfolio allocation
- Bar chart of top positions
- Line chart of cost basis over time

## Re-importing Exported Data

You can import an exported file back into the app:

1. Save the exported CSV
2. Make edits if needed (add positions, update data)
3. Use the Import CSV feature to reload
4. **Caution:** This will create duplicate lots if you import existing positions

**Best practice:** Delete existing data before re-importing to avoid duplicates.

## Export Best Practices

### Regular Exports

- Export monthly for regular backups
- Export before major changes
- Export annually for tax records

### File Naming

Use descriptive, dated filenames:
- `portfolio-backup-2024-01-15.csv`
- `retirement-account-2024-Q4.csv`
- `taxable-year-end-2024.csv`

### Version Control

Keep multiple versions:
- Monthly snapshots
- Year-end versions
- Pre/post major trades

### Security

Protect your data:
- Store exports in secure locations
- Encrypt sensitive files
- Don't share publicly
- Use secure cloud storage

## Limitations

The export feature:
- ✅ Exports all position data
- ✅ Includes current prices and values
- ✅ Saves notes and metadata
- ❌ Doesn't export historical price data
- ❌ Doesn't export chart data
- ❌ Doesn't export dividend history (separate export)

## Troubleshooting

### Export Button Not Working

1. Ensure you're on the Tickers page
2. Check browser pop-up blocker settings
3. Try a different browser
4. Refresh the page and try again

### File Won't Open

1. Ensure the file has .csv extension
2. Try opening with a text editor first
3. Check file isn't corrupted
4. Re-export if necessary

### Missing Data

1. Verify portfolio filter isn't hiding data
2. Check "All Portfolios" is selected for full export
3. Ensure positions exist before export

## Related Documentation

- [CSV Import](csv-import.md) - Import data
- [Portfolio Organization](portfolio-management.md) - Organize portfolios
- [Portfolio Management](../features/portfolio-management.md) - Manage positions
- [Troubleshooting](../reference/troubleshooting.md) - Common issues

## Summary

Export features:
- ✅ Download all portfolio data as CSV
- ✅ Export all portfolios or specific ones
- ✅ Use for backup, analysis, and tax reporting
- ✅ Compatible with all spreadsheet software
- ✅ Regular exports recommended

Keep your data safe and accessible with regular exports!
