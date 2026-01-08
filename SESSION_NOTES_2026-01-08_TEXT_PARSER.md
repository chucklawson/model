# Session Notes - January 8, 2026 - Vanguard Text Parser

## Session Goal
Replace the problematic PDF-based Vanguard import with a simpler text file approach. Adobe Acrobat converts PDFs to .txt files, which are then parsed to generate CSV files.

---

## Changes Made

### 1. Removed Old "Import Vanguard" Functionality

**Deleted Files:**
- `src/Components/ImportVanguardCSVModal.tsx` and `.test.tsx`
- `src/Components/VanguardPreviewTable.tsx` and `.test.tsx`
- `src/Components/DuplicatesModal.tsx`
- `src/utils/vanguardRealizedGainsParser.ts` and `.test.ts`
- `src/utils/vanguardRealizedGainsCsvGenerator.ts` and `.test.ts`
- `src/utils/vanguardRealizedGainsTypes.ts`
- `src/utils/vanguardPdfParserBrowser.ts`
- `src/utils/vanguardPdfParser.ts`
- `src/utils/vanguardCsvValidator.ts` and `.test.ts`
- `src/utils/vanguardCsvGenerator.ts`
- `src/utils/vanguardPdfTypes.ts`
- `src/utils/vanguardImporter.ts` and `.integration.test.ts`
- `src/utils/vanguardCsvParser.ts` and `.test.ts`
- `src/utils/importDeduplication.ts` and `.test.ts`
- `src/utils/dividendProcessor.ts` and `.test.ts`
- `src/utils/lotMatching.ts` and `.test.ts`
- `src/types/transaction.ts`

**Updated Files:**
- `amplify/data/resource.ts` - Removed Transaction, CompletedTransaction, ImportHistory, LotMatchingConfig, and DividendTransaction models
- `src/types/index.ts` - Removed transaction types export
- `src/Pages/Tickers/Tickers.tsx` - Removed "Import Vanguard" button and modal

---

### 2. Created New "Vanguard" Text Import Feature

**New Files Created:**

1. **`src/Components/VanguardTextImportModal.tsx`**
   - Modal UI for uploading .txt files
   - Displays parsed data summary (accounts, lots, symbols)
   - Shows scrollable spreadsheet table with all parsed lots
   - Editable CSV filename input
   - Download progress indicator
   - Success/error messages

2. **`src/utils/vanguardTextParser.ts`**
   - Parses Vanguard Realized Gains text files
   - Extracts account numbers from multiple account types (Brokerage, Traditional IRA, Roth IRA, etc.)
   - Detects symbols (including multi-word like "BRK B")
   - Extracts company names
   - Parses lot details after "Hide lot details"
   - Skips wash sale messages and summary lines
   - Handles "—" placeholders for missing values

3. **`src/utils/vanguardTextToCsv.ts`**
   - Converts parsed data to CSV format
   - Downloads CSV file to browser

**Updated Files:**
- `src/Pages/Tickers/Tickers.tsx` - Added new "Vanguard" button and VanguardTextImportModal

---

## Text File Format Parsed

### Expected Pattern:
```
Charles Thomas Lawson — Brokerage Account — 68411173

STOCKS, OPTIONS, AND ETFS
BRK B

BERKSHIRE HATHAWAY INC CL B
 60.0000 $25,967.06 $28,983.84 +$603.16 +$2,496.91 +$3,100.07
The loss of $83.29 has been disallowed due to wash sale activity...

Hide lot details

Date sold Dateacquired Event Cost basismethod Quantity Total cost Proceeds Short termcapitalgain/loss Long termcapitalgain/loss Total capitalgain/loss
01/08/2025 08/15/2023 Sell First in, firstout (FIFO) 3.0000 $1,063.95 $1,351.64 — $287.69 $287.69
01/08/2025 08/28/2023 Sell First in, firstout (FIFO) 4.0000 $1,422.20 $1,802.19 — $379.99 $379.99
```

### What Gets Parsed:
- **Account Number**: Extracted from line with "Account" + 8 digits
- **Symbol**: All caps line before company name (e.g., "BRK B")
- **Company Name**: Line after symbol (e.g., "BERKSHIRE HATHAWAY INC CL B")
- **Lot Details**: Lines matching date pattern after "Hide lot details"
- **Skipped**: Wash sale messages, summary totals, section headers

### CSV Output Columns:
1. Account Number
2. Symbol
3. Company Name
4. Date Sold
5. Date Acquired
6. Event
7. Cost Basis Method
8. Quantity
9. Total Cost
10. Proceeds
11. Short Term Gain/Loss
12. Long Term Gain/Loss
13. Total Gain/Loss

---

## Modal Features

**Upload Section:**
- Drag & drop or browse for .txt files
- File size limit: 50MB
- Validates .txt extension

**After Upload:**
- **Summary Card**: Shows total lots, account count, unique symbols
- **Filename Input**: Edit CSV output filename
- **Spreadsheet Table**:
  - Scrollable (600px height)
  - Horizontal scrolling for wide data
  - Row numbers (#) for easy counting
  - Shows ALL parsed lots
  - Sticky header
- **Download Button**:
  - Converts to CSV
  - Shows "Converting..." with spinner
  - Shows "Download complete!" message for 3 seconds

---

## Current Status

### Working:
✅ Text file upload and parsing
✅ Account number extraction from Brokerage and IRA accounts
✅ Symbol and company name detection
✅ Lot detail parsing
✅ Wash sale message skipping
✅ CSV generation and download
✅ Spreadsheet preview in modal
✅ Download progress indicators

### Issues Found:
❌ **Missing lots from accounts 10743464 and 16780581**
   - Currently showing lots from: 68411173, 83097193
   - Not showing lots from: 10743464, 16780581
   - Likely different text pattern for these account types

---

## Next Steps

1. **Debug missing accounts**:
   - Examine text file structure for accounts 10743464 and 16780581
   - Identify different formatting patterns
   - Update parser to handle additional patterns

2. **Verify data accuracy**:
   - Compare CSV output with original text file in Excel
   - Ensure all lots are captured
   - Verify amounts and dates match

3. **Additional improvements** (if needed):
   - Handle edge cases in lot formatting
   - Add validation warnings for missing data
   - Improve error messages

---

## Files Modified This Session

**Created:**
- `src/Components/VanguardTextImportModal.tsx`
- `src/utils/vanguardTextParser.ts`
- `src/utils/vanguardTextToCsv.ts`

**Modified:**
- `src/Pages/Tickers/Tickers.tsx`
- `amplify/data/resource.ts`
- `src/types/index.ts`

**Deleted:**
- All old Vanguard import files (see section 1 above)

---

## Test File Location
`D:\Market\VanguardAnualSummaries\Realized Summary _ Vanguard_2025.txt`

---

## Git Commit Recommendation

**Commit Message:**
```
feat: Replace PDF Vanguard import with text file parser

- Remove old PDF-based Vanguard import system
- Add new text file import modal with spreadsheet preview
- Create parser for Vanguard Realized Gains .txt files
- Generate downloadable CSV from parsed text data
- Remove unused DynamoDB models (Transaction, ImportHistory, etc.)

Known issue: Some account types not parsing correctly (investigating)
```
