# CSV Import Guide

Learn how to bulk import your investment portfolio using CSV files. This powerful feature allows you to quickly load all your positions at once instead of entering them manually.

## Overview

The CSV import feature allows you to:
- Import multiple stock positions simultaneously
- Bulk load data from other portfolio trackers or brokerages
- Update your portfolio efficiently
- Migrate from spreadsheets to the app

This guide covers the CSV file format, import process, validation rules, and troubleshooting.

## CSV File Format

### Required Columns

Your CSV file **must** include these five columns (in any order, but these exact names):

| Column Name | Description | Format | Example |
|-------------|-------------|--------|---------|
| **Ticker** | Stock symbol | Text, uppercase recommended | AAPL |
| **Date** | Purchase date | M/D/YYYY | 1/15/2024 |
| **Quantity** | Number of shares | Positive number | 100 |
| **Cost** | Cost per share (not total cost) | Decimal number | 150.25 |
| **Portfolio** | Portfolio name | Text | Default |

### Optional Columns

You can include additional columns, but they will be ignored during import:
- Notes
- Total Cost (calculated automatically)
- Current Value (calculated automatically)
- Any other custom fields

### Column Details

#### Ticker
- **Format:** Stock ticker symbol
- **Examples:** AAPL, MSFT, GOOGL, VTI
- **Case:** Automatically converted to uppercase
- **Validation:** Must be a valid ticker symbol (will fetch quote to verify)

#### Date
- **Format:** M/D/YYYY (month/day/year)
- **Examples:**
  - 1/15/2024
  - 12/5/2023
  - 3/1/2022
- **Invalid:**
  - 2024-01-15 (wrong format)
  - 01/15/2024 (leading zeros acceptable but not required)
  - Jan 15 2024 (wrong format)

#### Quantity
- **Format:** Positive number (can include decimals for fractional shares)
- **Examples:** 100, 50.5, 1.25
- **Validation:** Must be greater than 0

#### Cost
- **Format:** Cost PER SHARE (not total cost)
- **Examples:** 150.25, 89.99, 1200.50
- **Validation:** Must be greater than 0
- **Note:** Total cost is calculated as Quantity × Cost

#### Portfolio
- **Format:** Text string (portfolio name)
- **Examples:** Default, Retirement, Trading, Dividend Growth, Tech Stocks
- **Behavior:**
  - Portfolios are automatically created if they don't exist
  - Case-sensitive ("default" ≠ "Default")
  - Whitespace is trimmed
- **Best Practice:** Use consistent naming

## Sample CSV File

### Basic Example

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
MSFT,2/20/2024,50,380.00,Retirement
GOOGL,3/10/2024,75,140.50,Trading
TSLA,4/5/2024,25,245.75,Default
```

### Advanced Example with Multiple Portfolios

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
AAPL,3/20/2024,50,145.00,Default
MSFT,2/20/2024,50,380.00,Retirement
GOOGL,3/10/2024,75,140.50,Trading
TSLA,4/5/2024,25,245.75,Default
NVDA,5/12/2024,40,890.00,Tech Portfolio
VTI,6/1/2024,200,220.00,Retirement
SCHD,7/15/2024,100,75.50,Dividend
KO,8/1/2024,150,58.25,Dividend
PG,8/15/2024,80,145.00,Dividend
```

### With Fractional Shares

```csv
Ticker,Date,Quantity,Cost,Portfolio
AMZN,1/1/2024,5.5,175.30,Trading
BRK.B,2/1/2024,2.75,450.25,Retirement
VOO,3/1/2024,12.33,420.50,Index Funds
```

## Step-by-Step Import Process

### Step 1: Prepare Your CSV File

1. Create a new CSV file in Excel, Google Sheets, or any text editor
2. Add the required column headers: Ticker, Date, Quantity, Cost, Portfolio
3. Fill in your position data
4. **Save as CSV format** (not .xlsx or .xls)

**In Excel:**
- File → Save As → Choose "CSV (Comma delimited) (*.csv)"

**In Google Sheets:**
- File → Download → Comma Separated Values (.csv)

### Step 2: Access the Import Feature

1. Sign in to Investment Portfolio Manager
2. Navigate to **Tickers** page
3. Click the **Import CSV** button (usually top right)

### Step 3: Select Your File

1. Click "Choose File" or drag-and-drop your CSV
2. The file will be validated automatically
3. Review any validation errors or warnings

### Step 4: Review Import Preview

Before finalizing, you'll see:
- Number of positions to be imported
- List of portfolios that will be created/updated
- Any warnings or validation issues

### Step 5: Confirm Import

1. Review the preview carefully
2. Click **Confirm Import** or **Import Positions**
3. Wait for the import to complete (may take a few seconds for large files)

### Step 6: Verify Your Data

1. Check the Tickers page for your imported positions
2. Use the portfolio filter to view specific portfolios
3. Verify quantities, costs, and dates are correct

## Validation Rules

The application validates your CSV before importing:

### File-Level Validation

✅ **Valid:**
- CSV file with .csv extension
- File size under 10MB
- Properly formatted CSV (comma-separated)

❌ **Invalid:**
- Excel files (.xlsx, .xls)
- Text files (.txt)
- Corrupt or improperly formatted files

### Column Validation

✅ **Valid:**
- All 5 required columns present (Ticker, Date, Quantity, Cost, Portfolio)
- Columns can be in any order
- Extra columns are ignored

❌ **Invalid:**
- Missing required columns
- Misspelled column names (e.g., "Symbol" instead of "Ticker")
- Empty column headers

### Data Validation

Each row is validated:

✅ **Valid Row:**
```csv
AAPL,1/15/2024,100,150.25,Default
```

❌ **Invalid Rows:**
```csv
AAPL,1/15/2024,0,150.25,Default          # Quantity must be > 0
AAPL,13/45/2024,100,150.25,Default       # Invalid date
AAPL,1/15/2024,100,-150.25,Default       # Cost cannot be negative
,1/15/2024,100,150.25,Default            # Ticker is required
AAPL,1/15/2024,abc,150.25,Default        # Quantity must be a number
```

### Ticker Validation

The app may verify that tickers are valid by fetching quotes. Invalid tickers will be flagged but might still be imported with a warning.

## Common Issues and Solutions

### Issue: "Missing required columns"

**Cause:** CSV doesn't have all required column headers.

**Solution:**
- Ensure your CSV has exactly these column names: Ticker, Date, Quantity, Cost, Portfolio
- Check spelling and capitalization
- Remove extra spaces from column headers

### Issue: "Invalid date format"

**Cause:** Dates are not in M/D/YYYY format.

**Solution:**
- Convert dates to M/D/YYYY format
- In Excel: Format cells as Custom → M/D/YYYY
- Acceptable: 1/15/2024, 01/15/2024
- Not acceptable: 2024-01-15, Jan 15 2024

### Issue: "Invalid ticker symbol"

**Cause:** Ticker doesn't exist or API can't find it.

**Solution:**
- Verify the ticker symbol on a financial site (Yahoo Finance, Google Finance)
- Check for typos (APPL vs AAPL)
- Ensure the ticker is for a US exchange (or supported by FMP API)
- Delisted or OTC stocks may not be available

### Issue: "File too large"

**Cause:** CSV file exceeds size limit.

**Solution:**
- Split into multiple smaller CSV files
- Import in batches (e.g., 50 positions at a time)
- Remove unnecessary columns to reduce file size

### Issue: "Duplicate positions"

**Note:** The app doesn't prevent duplicates - each CSV row creates a new "lot" entry.

**Behavior:**
- Same ticker, different dates: Separate lots (correct)
- Same ticker, same date: Duplicate lots (may be intentional)

**Solution:**
- If unintentional, manually delete duplicate lots after import
- Or clean your CSV file before importing

### Issue: "Portfolio names inconsistent"

**Cause:** Inconsistent capitalization or spelling.

**Example:**
```csv
AAPL,1/15/2024,100,150.25,Default
MSFT,2/20/2024,50,380.00,default    # Creates separate portfolio!
```

**Result:** Two portfolios: "Default" and "default"

**Solution:**
- Use consistent naming throughout your CSV
- Decide on capitalization (e.g., always "Default" not "default")
- Clean up portfolio names before import

## Advanced CSV Preparation

### Exporting from Other Tools

#### From Excel or Google Sheets

1. Organize your data with required columns
2. Format dates as M/D/YYYY
3. Ensure numbers don't have currency symbols ($)
4. Export/Download as CSV

#### From Brokerage Statements

Many brokerages allow exporting positions:

1. Export your positions report
2. Open in Excel or Google Sheets
3. **Map columns** to required format:
   - Symbol → Ticker
   - Shares → Quantity
   - Purchase Price → Cost
   - Purchase Date → Date
   - Account Name → Portfolio
4. Remove extra columns (or leave them, they'll be ignored)
5. Save as CSV

#### From Other Portfolio Trackers

1. Export data from your current tracker
2. Reformat to match required columns
3. Adjust date format if necessary
4. Import into Investment Portfolio Manager

### Bulk Data Entry Template

Download or create this template to get started:

```csv
Ticker,Date,Quantity,Cost,Portfolio
,,,,[Portfolio Name]
,,,,[Portfolio Name]
,,,,[Portfolio Name]
```

Fill in the rows and import!

## Best Practices

### 1. Test with Small File First

Before importing 100+ positions:
- Create a test CSV with 3-5 positions
- Import and verify it works correctly
- Then import the full dataset

### 2. Backup Your Data

Before large imports:
- Export your current data to CSV (if you have existing positions)
- Keep a copy of your import file
- This allows you to restore if something goes wrong

### 3. Use Consistent Naming

- Decide on portfolio naming conventions
- Use the same capitalization (Default vs default)
- Avoid special characters in portfolio names

### 4. Verify After Import

After importing:
- Check the Tickers page for all positions
- Verify total portfolio value makes sense
- Spot-check a few positions for accuracy

### 5. Organize Lots by Portfolio

Group your CSV by portfolio for easier verification:

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/1/2024,100,150,Retirement
MSFT,1/1/2024,50,380,Retirement
GOOGL,1/1/2024,75,140,Retirement
TSLA,2/1/2024,25,245,Trading
NVDA,2/1/2024,40,890,Trading
```

## CSV Format Technical Specification

For reference, here's the technical spec:

### File Format
- **Encoding:** UTF-8
- **Delimiter:** Comma (,)
- **Line Ending:** CRLF (\\r\\n) or LF (\\n)
- **Header Row:** Required (first row)
- **Quote Character:** " (double quote) for fields containing commas

### Data Types
- **Ticker:** String, 1-10 characters
- **Date:** String, M/D/YYYY format
- **Quantity:** Number (integer or decimal)
- **Cost:** Number (decimal, 2-4 decimal places recommended)
- **Portfolio:** String, max 100 characters

### Example with Quoted Fields

If your portfolio names contain commas:

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,"Retirement, IRA"
MSFT,2/20/2024,50,380.00,"Trading, Active"
```

## Exporting Your Data

To export your current positions:

1. Go to **Tickers** page
2. Click **Export to CSV** button
3. Choose location to save file
4. Use this format as a template for future imports

The exported file will match the import format exactly!

## Related Documentation

- [Quick Start Guide](../getting-started/quick-start-guide.md) - Getting started with the app
- [Portfolio Management](../features/portfolio-management.md) - Managing your positions
- [CSV Format Reference](../reference/csv-format.md) - Technical CSV specification
- [Troubleshooting](../reference/troubleshooting.md) - Common issues

## Summary Checklist

**Before Importing:**
- ✅ CSV file has required columns: Ticker, Date, Quantity, Cost, Portfolio
- ✅ Dates in M/D/YYYY format
- ✅ Quantities and costs are positive numbers
- ✅ Portfolio names are consistent
- ✅ File is saved as .csv format

**After Importing:**
- ✅ Check Tickers page for all positions
- ✅ Verify totals are correct
- ✅ Use portfolio filter to review each portfolio
- ✅ Spot-check a few positions for accuracy

With CSV import, you can quickly load hundreds of positions in seconds. Happy importing!
