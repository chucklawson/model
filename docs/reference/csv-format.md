# CSV Format Specification

Technical reference for the CSV import file format.

## Overview

This document provides the technical specification for CSV files used to import portfolio positions into the Investment Portfolio Manager.

For a user-friendly import guide, see the [CSV Import Guide](../guides/csv-import.md).

## File Format Specification

### File Requirements

- **Format:** CSV (Comma Separated Values)
- **Encoding:** UTF-8
- **Delimiter:** Comma (`,`)
- **Line Ending:** CRLF (`\r\n`) or LF (`\n`)
- **Header Row:** Required (first row)
- **File Extension:** `.csv`
- **Maximum File Size:** 10 MB (recommended)

### Required Columns

The CSV file **must** contain exactly these five columns with these exact names (case-sensitive):

| Column Name | Type | Format | Required | Description |
|-------------|------|--------|----------|-------------|
| `Ticker` | String | Text | Yes | Stock ticker symbol |
| `Date` | String | M/D/YYYY | Yes | Purchase date |
| `Quantity` | Number | Decimal | Yes | Number of shares |
| `Cost` | Number | Decimal | Yes | Cost per share |
| `Portfolio` | String | Text | Yes | Portfolio name |

### Column Specifications

#### Ticker

- **Type:** String
- **Format:** 1-10 alphanumeric characters
- **Case:** Converted to uppercase automatically
- **Valid characters:** Letters (A-Z), numbers (0-9), dots (.), hyphens (-)
- **Examples:** `AAPL`, `MSFT`, `BRK.B`, `GOOGL`

**Validation:**
- Must not be empty
- Must be a valid stock ticker (verified via API)
- Delisted or invalid tickers may be rejected

#### Date

- **Type:** String
- **Format:** `M/D/YYYY` or `MM/DD/YYYY`
- **Examples:**
  - `1/15/2024` (valid)
  - `01/15/2024` (valid)
  - `12/1/2024` (valid)
  - `2024-01-15` (invalid)

**Validation:**
- Must be a valid calendar date
- Month: 1-12
- Day: 1-31 (validated against month)
- Year: 1900-2100 (recommended: within 50 years of current date)

**Parsing rules:**
- Leading zeros optional
- Slashes required as separators
- Year must be 4 digits

#### Quantity

- **Type:** Number (Integer or Decimal)
- **Format:** Positive number, up to 4 decimal places
- **Range:** > 0
- **Examples:** `100`, `50.5`, `1.2345`

**Validation:**
- Must be greater than 0
- Decimal places: 0-4 (supports fractional shares)
- No commas or currency symbols

#### Cost

- **Type:** Number (Decimal)
- **Format:** Positive number, typically 2-4 decimal places
- **Range:** > 0
- **Examples:** `150.25`, `89.99`, `1200.5000`

**Important:** This is the **cost per share**, not total cost. Total cost is calculated as `Quantity × Cost`.

**Validation:**
- Must be greater than 0
- Decimal places: 0-4 recommended
- No currency symbols ($, €, etc.)
- No commas (use `1500.50` not `1,500.50`)

#### Portfolio

- **Type:** String
- **Format:** Free text, max 100 characters
- **Case-sensitive:** `"Default"` ≠ `"default"`
- **Examples:** `Default`, `Retirement`, `Dividend Growth`, `Tech Stocks`

**Validation:**
- Must not be empty
- Leading/trailing whitespace is trimmed
- Valid characters: Letters, numbers, spaces, hyphens, underscores
- Special characters should be avoided

**Behavior:**
- Portfolios are created automatically if they don't exist
- Existing portfolios are used if they match exactly (case-sensitive)

### Optional Columns

Additional columns may be included but will be ignored during import:
- `Notes`
- `Total Cost`
- `Current Value`
- `Gain/Loss`
- Custom fields

### Row Validation

Each data row is validated:

**Valid row:**
```csv
AAPL,1/15/2024,100,150.25,Default
```

**Invalid rows (examples):**
```csv
,1/15/2024,100,150.25,Default          # Missing ticker
AAPL,13/45/2024,100,150.25,Default     # Invalid date
AAPL,1/15/2024,0,150.25,Default        # Quantity must be > 0
AAPL,1/15/2024,-100,150.25,Default     # Quantity can't be negative
AAPL,1/15/2024,100,-150.25,Default     # Cost can't be negative
AAPL,1/15/2024,abc,150.25,Default      # Quantity must be number
AAPL,1/15/2024,100,150.25,             # Portfolio can't be empty
```

## Example Files

### Minimal Valid File

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
```

### Complete Example

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
AAPL,3/20/2024,50,145.00,Default
MSFT,2/20/2024,50,380.00,Retirement
GOOGL,3/10/2024,75,140.50,Trading
TSLA,4/5/2024,25,245.75,Default
```

### With Quoted Fields

If portfolio names contain commas or special characters:

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,"Retirement, IRA"
MSFT,2/20/2024,50,380.00,"Trading, Active"
```

### With Optional Columns (Ignored)

```csv
Ticker,Date,Quantity,Cost,Portfolio,Notes
AAPL,1/15/2024,100,150.25,Default,Long-term hold
MSFT,2/20/2024,50,380.00,Retirement,Growth stock
```

## Import Process

### Validation Steps

1. **File validation**
   - Check file extension (.csv)
   - Check file size (< 10 MB recommended)
   - Verify proper CSV format

2. **Header validation**
   - Verify all 5 required columns present
   - Check exact column names (case-sensitive)
   - Extra columns allowed but ignored

3. **Row validation** (for each row)
   - Ticker: not empty, valid format
   - Date: valid M/D/YYYY format
   - Quantity: number > 0
   - Cost: number > 0
   - Portfolio: not empty

4. **Data import**
   - Create portfolios as needed
   - Insert each lot into database
   - Fetch current quotes to verify tickers

### Error Handling

**File-level errors** (import fails completely):
- Invalid file format
- Missing required columns
- File too large

**Row-level errors** (specific rows rejected):
- Invalid date format
- Non-numeric quantity or cost
- Negative values
- Missing ticker or portfolio

**Validation errors:**
- Invalid ticker (doesn't exist)
- API rate limit exceeded

## Technical Notes

### Character Encoding

Files must be UTF-8 encoded. If using Excel:
- Save as "CSV UTF-8 (Comma delimited)"
- Regular "CSV" may use different encoding

### Quote Characters

Fields containing commas must be quoted:

```csv
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,"Fidelity, IRA"
```

### Empty Fields

Empty fields are not allowed for required columns:

```csv
AAPL,1/15/2024,,150.25,Default    # Invalid: Quantity is empty
```

### Comments

CSV files don't officially support comments, but lines starting with `#` are ignored (custom behavior):

```csv
# This is a comment
Ticker,Date,Quantity,Cost,Portfolio
AAPL,1/15/2024,100,150.25,Default
```

## Related Documentation

- [CSV Import Guide](../guides/csv-import.md) - User-friendly import guide
- [Portfolio Management](../features/portfolio-management.md) - Managing positions
- [Troubleshooting](troubleshooting.md) - Common import issues

## Summary

**Requirements checklist:**
- ✅ CSV file with .csv extension
- ✅ UTF-8 encoding
- ✅ Header row with exact column names: Ticker, Date, Quantity, Cost, Portfolio
- ✅ Date format: M/D/YYYY
- ✅ Quantity and Cost: positive numbers
- ✅ All required fields filled for each row

Follow this specification for successful imports!
