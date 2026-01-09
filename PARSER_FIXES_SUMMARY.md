# Vanguard Realized Gains Parser - Fixes Summary

## Issues Identified and Fixed

### 1. **Inverted Lot Format** (CRITICAL)
**Problem**: Fractional lots in "Hide lot details" sections use inverted format:
- Normal format: `Date → Method → Quantity`
- Inverted format: `Quantity → Date → Method`

**Impact**:
- DIA missing 0.098 shares (fractional lots: 0.001, 0.004, 0.053, 0.004, 0.016, 0.02)
- QQQ missing 0.071 shares (fractional lots: 0.026, 0.045)

**Fix**: Added detection for both formats in "Hide lot details" parsing:
```typescript
const line1IsDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim());
const line1IsQty = /^[\d.]+\s+\$/.test(line1.trim());

if (line1IsDate) {
  // Normal format: Date -> Method -> Qty
  lot = parseLotFromTableRows(line1, line2, line3, line4, ...);
} else if (line1IsQty && line2 && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line2.trim())) {
  // Inverted format: Qty -> Date -> Method
  lot = parseLotFromTableRows(line2, line3, line1, null, ...);
}
```

**Result**:
- ✅ DIA: **18.0970** shares (was 17.999, now EXACT)
- ✅ QQQ: **33.0710** shares (was 33.0, now EXACT)

### 2. **Built-in Validation**
**Added**: Automatic validation comparing parsed vs expected quantities

**Features**:
- Tracks expected quantity from each symbol's summary line
- Calculates actual quantity from parsed lots
- Compares with 0.001 share tolerance
- Reports matched, mismatched, and missing symbols

**Return Type**:
```typescript
interface VanguardRealizedGainsData {
  accountNumbers: string[];
  lots: VanguardRealizedGainsLot[];
  validation: {
    totalSymbols: number;
    matchedSymbols: number;
    missingSymbols: number;
    mismatchedSymbols: number;
    symbolSummaries: SymbolValidation[];
  };
}
```

## Current Parser Capabilities

✅ **Supported Lot Formats:**
1. 3-line normal: `Date → Method → Qty`
2. 4-line normal: `Date → Method(part1) → Method(part2) → Qty`
3. 3-line inverted: `Qty → Date → Method`

✅ **Noise Handling:**
- Wash sale adjustment lines (`+$` / `-$`)
- Warning messages
- Table headers
- Page breaks

✅ **Multi-Column PDF Support:**
- Quantity-based symbol matching (0.5 share tolerance)
- Duplicate prevention (symbols marked as matched)
- Handles lots with/without "Hide lot details" markers

## Test Results (Final)

**Total Symbols**: 61
**Matched (Exact)**: 46 (75%)
**Missing (No lots)**: 15 (25%)
**Mismatched**: 0

### Key Symbols (User's Primary Concern):
| Symbol | Expected | Actual | Lots | Status |
|--------|----------|--------|------|--------|
| BRK B | 60.0000 | 60.0000 | 14 | ✅ MATCH |
| DIA | 18.0970 | 18.0970 | 9 | ✅ MATCH |
| QQQ | 33.0710 | 33.0710 | 10 | ✅ MATCH |

### Other Matched Symbols (Sample):
- AAPL: 20.0000 ✅
- AVGO: 57.3660 ✅ (8 lots)
- META: 62.0000 ✅ (23 lots)
- NVDA: 435.0000 - No lots found
- MSFT: 40.0000 - No lots found

**Total Lots Parsed**: 257

## Files Modified

1. **src/utils/vanguardRealizedGainsParser.ts**
   - Added inverted format detection
   - Added validation logic
   - Updated type imports

2. **src/utils/vanguardRealizedGainsTypes.ts**
   - Added `SymbolValidation` interface
   - Extended `VanguardRealizedGainsData` with validation field

3. **final-comprehensive-test.mjs**
   - Added inverted format support
   - Updated to match parser logic

## Remaining Issues

**15 symbols with no lots found** (likely different document sections or formats):
- BLK, CRM, MSFT, NVDA, ORCL, PLTR (high-value stocks)
- Multiple symbols with expected quantities but no parsed lots

**Possible causes**:
- Different PDF section structure
- Different lot format not yet detected
- Lots in completely separate document pages

## Usage

```typescript
import { parseVanguardRealizedGainsPdf } from './src/utils/vanguardRealizedGainsParser';

const result = await parseVanguardRealizedGainsPdf(pdfFile);

// Check validation
console.log(`Matched: ${result.validation.matchedSymbols}/${result.validation.totalSymbols}`);

// Find mismatches
result.validation.symbolSummaries
  .filter(s => !s.isMatch && s.actualQuantity > 0)
  .forEach(s => {
    console.log(`${s.symbol}: Expected ${s.expectedQuantity}, Got ${s.actualQuantity}`);
  });

// Export lots
const csvData = result.lots.map(lot => ({
  account: lot.accountNumber,
  symbol: lot.symbol,
  dateAcquired: lot.dateAcquired,
  dateSold: lot.dateSold,
  quantity: lot.quantity,
  // ... other fields
}));
```

## Next Steps

To handle the 15 missing symbols, investigate:
1. PDF structure for symbols like MSFT, NVDA (large holdings)
2. Different lot table formats
3. Lots appearing in different sections (e.g., separate pages)
4. Alternative parsing strategies for complex multi-column layouts
