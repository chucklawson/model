# 📝 Session Notes: Vanguard PDF to CSV Converter - 2026-01-04

## ✅ Work Completed This Session

### 1. **PDF to CSV Converter Implementation**

#### Files Created:
- **`src/utils/vanguardPdfTypes.ts`**
  - Shared TypeScript interfaces for PDF transaction data
  - Exports: `VanguardPdfTransaction`, `VanguardPdfData`

- **`src/utils/vanguardPdfParserBrowser.ts`**
  - Browser-compatible PDF parser (uses File API, not Node.js `fs`)
  - Parses Vanguard PDF transaction reports
  - Features:
    - Multi-line transaction handling
    - Wrapped number concatenation (e.g., "$595.330 0" → "$595.3300")
    - MARGIN account type handling ("MARGI N" → "MARGIN")
    - Complex transaction type parsing (e.g., "Corp Action (Cash in Lieu)")
  - Exports: `parseVanguardPdfFromFile()`, `convertVanguardPdfToCsv()`
  - **PDF.js Worker Config**: `PDFParse.setWorker('https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.mjs')`

#### Files Modified:
- **`src/Components/ImportVanguardCSVModal.tsx`**
  - Added "Convert PDF to CSV" section in upload step
  - Features:
    - PDF file picker with 100MB size limit
    - Auto-populated output filename
    - Convert & download button
    - Error display for conversion failures
  - Downloads converted CSV to browser Downloads folder

- **`src/utils/vanguardCsvGenerator.ts`**
  - Updated to import types from shared `vanguardPdfTypes.ts`

- **`src/utils/vanguardPdfParser.ts`** (CLI version)
  - Updated to use shared types

### 2. **Technical Issues Resolved**

✅ **Module Import Errors**: Created shared types file to prevent browser from loading Node.js modules
✅ **PDF.js Worker Setup**: Used `PDFParse.setWorker()` method instead of `GlobalWorkerOptions`
✅ **Worker 404 Error**: Fixed CDN URL from cdnjs to unpkg with correct path
✅ **File Size Limits**: Set 100MB max for PDFs
✅ **Type Import Syntax**: Used `import type` for interfaces

### 3. **Testing Results**

**CLI Tool** (Node.js version):
- ✅ 8-page PDF (9 transactions) - Passed validation
- ✅ 40-page PDF (116 transactions) - Passed validation

**Browser Converter**:
- ✅ PDF parsing works
- ✅ CSV generation works
- ✅ CSV download works
- ❌ **Generated CSV fails validation on import**

---

## 🔴 Current Problem: CSV Validation Failure

### Issue Description
After successfully converting PDF to CSV and downloading it, when trying to import the generated CSV using the existing Vanguard CSV importer, validation fails with multiple errors.

### Validation Errors Reported
```
- Shares must be negative for sell transactions
- Share price must be positive for sell transactions
- Shares must be positive for buy transactions
- Share price must be positive for buy transactions
- Settlement date cannot be before trade date
```
*(Multiple occurrences of each error)*

### Sample CSV Data (First 10 Rows)
```csv
Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,
83097193,2025-03-17,2025-03-18,Buy,,AMERICAN EXPRESS CO,AXP,4.00000,263.7800,-1055.12,0,-1055.12,0.0,MARGIN,
83097193,2025-03-21,2025-03-24,Sell,,AMERICAN EXPRESS CO,AXP,-4.00000,267.7300,1070.92,0.03,1070.89,0.0,MARGIN,
83097193,2023-08-08,2023-08-10,Buy,,DUPONT DE NEMOURS INC,DD,14.00000,77.3000,-1082.20,0,-1082.20,0.0,MARGIN,
83097193,2023-10-13,2023-10-17,Sell,,DUPONT DE NEMOURS INC,DD,-14.00000,75.8400,1061.76,0.01,1061.75,0.0,MARGIN,
```

### Analysis of Sample Data
**The sample data looks PERFECT**:
- ✅ Buy transactions have positive shares (4.00000, 14.00000)
- ✅ Sell transactions have negative shares (-4.00000, -14.00000)
- ✅ Share prices are positive (263.7800, 267.7300, 77.3000)
- ✅ Settlement dates come after trade dates
- ✅ All required fields populated
- ✅ Correct number format (5 decimals for shares, 4 for prices, 2 for amounts)

### Mystery
**Why is validation failing when the data looks correct?**

Possible causes to investigate next session:
1. **Hidden transactions with bad data**: Maybe transactions further down in CSV have issues (shares=0, missing prices, wrong dates)
2. **Encoding issues**: UTF-8 BOM, line ending differences (CRLF vs LF)
3. **Trailing commas**: Extra commas at end of rows might cause parser misalignment
4. **Parser column mismatch**: CSV parser might be reading columns in wrong order
5. **Cached validation state**: Browser might be showing old validation errors
6. **Different CSV file**: User might be loading wrong CSV file by mistake

---

## 📂 Key File Locations

### Browser-Side (Working):
- `src/utils/vanguardPdfTypes.ts` - Shared interfaces
- `src/utils/vanguardPdfParserBrowser.ts` - Browser PDF parser
- `src/utils/vanguardCsvGenerator.ts` - CSV generator (used by both CLI and browser)
- `src/Components/ImportVanguardCSVModal.tsx` - UI with PDF converter

### CLI-Side (Working):
- `convert-vanguard-pdf.ts` - CLI script (Node.js)
- `src/utils/vanguardPdfParser.ts` - Node.js PDF parser

### Validation:
- `src/utils/vanguardCsvValidator.ts` - Validation logic
- `src/utils/vanguardCsvParser.ts` - CSV parser

---

## 🔍 Next Session Action Items

1. **Debug validation in browser**:
   - Add console.log to validator to see which exact rows fail
   - Check if row numbers in errors match actual CSV row numbers

2. **Compare files**:
   - Generate CSV using CLI tool (known working)
   - Generate CSV using browser converter
   - Do byte-by-byte diff to find differences

3. **Test incremental**:
   - Import first 5 rows only
   - Import first 10 rows
   - Binary search to find problematic row

4. **Check edge cases**:
   - Look for transactions with "—" in PDF (Corp Actions, Dividends without shares)
   - Look for transactions with settlement date = trade date
   - Look for transactions spanning year boundaries

5. **Verify parser**:
   - Add logging to CSV parser to show exactly how it's reading each column
   - Confirm column order matches header order

---

## 💻 Commands to Test Next Session

```bash
# Test CLI conversion (known working)
npm run convert-pdf -- "path/to/pdf" --validate

# Check encoding of generated file
file downloaded-file.csv

# Compare CLI vs Browser generated CSV
diff cli-generated.csv browser-generated.csv
```

---

## 📊 Session Statistics

- **Files Created**: 1 (vanguardPdfTypes.ts)
- **Files Modified**: 4 (Modal, Generator, Browser Parser, Node Parser)
- **Lines Added**: ~400
- **Issues Resolved**: 5 (imports, worker config, URL, file size, type syntax)
- **Outstanding Issues**: 1 (validation failure mystery)

---

**Status**: PDF conversion feature is functionally complete but validation issue blocks end-to-end workflow. Sample data looks correct but full CSV fails validation. Need deeper debugging in next session to identify root cause.
