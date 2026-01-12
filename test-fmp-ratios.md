# Testing FMP for Bank Regulatory Metrics

## Test Plan: Check if FMP Provides NPL and CAR

### Endpoints to Test

1. **Financial Ratios API**
   ```
   /api/v3/ratios/{symbol}?period=annual
   ```

2. **As Reported Financial Statements**
   ```
   /api/v3/financial-statement-full-as-reported/{symbol}?period=annual
   ```

3. **Key Metrics TTM (Trailing Twelve Months)**
   ```
   /api/v3/key-metrics-ttm/{symbol}
   ```

### Test Script

Add this to your Bank Metrics Calculator temporarily to log what FMP returns:

```typescript
// In handleCalculate function, after existing API calls:

// Test additional FMP endpoints
const [ratiosData, asReportedData] = await Promise.all([
  callFmpApi({ endpoint: `/api/v3/ratios/${formData.ticker}`, queryParams: { period: formData.period } }),
  callFmpApi({ endpoint: `/api/v3/financial-statement-full-as-reported/${formData.ticker}`, queryParams: { period: formData.period } })
]);

console.log('=== FMP RATIOS DATA ===', ratiosData);
console.log('=== AS REPORTED DATA ===', asReportedData);

// Look for these fields in the responses:
const possibleNPLFields = [
  'nonPerformingLoans',
  'nplRatio',
  'allowanceForLoanLosses',
  'creditLosses',
  'loanLossProvision'
];

const possibleCARFields = [
  'capitalAdequacyRatio',
  'tier1Capital',
  'tier2Capital',
  'riskWeightedAssets',
  'regulatoryCapital'
];

console.log('Searching for NPL fields...');
possibleNPLFields.forEach(field => {
  if (ratiosData?.[0]?.[field]) console.log(`✓ Found: ${field} =`, ratiosData[0][field]);
  if (asReportedData?.[0]?.[field]) console.log(`✓ Found: ${field} =`, asReportedData[0][field]);
});

console.log('Searching for CAR fields...');
possibleCARFields.forEach(field => {
  if (ratiosData?.[0]?.[field]) console.log(`✓ Found: ${field} =`, ratiosData[0][field]);
  if (asReportedData?.[0]?.[field]) console.log(`✓ Found: ${field} =`, asReportedData[0][field]);
});
```

### Expected Outcomes

**Scenario A: FMP Has the Data**
- Fields will appear in console
- We can add them to the calculator immediately

**Scenario B: FMP Doesn't Have the Data**
- No fields found
- Need to use alternative data sources

## Alternative: Free US Bank Data Sources

### FDIC Call Reports (Comprehensive!)

FDIC publishes quarterly "Call Reports" for all US banks with complete regulatory data:

**FDIC BankFind Suite:**
- Website: https://banks.data.fdic.gov/
- API: https://banks.data.fdic.gov/docs/

**Example API Call:**
```
GET https://banks.data.fdic.gov/api/institutions?filters=NAME:Wells%20Fargo&fields=NPL,CAR&format=json
```

**Available Fields:**
- `NPTL` - Non-performing loans to total loans
- `RBCT1` - Tier 1 capital ratio
- `RBRWAJR` - Risk-based capital adequacy ratio
- And 100+ other regulatory metrics!

### Federal Reserve Statistical Releases

**Federal Reserve Y-9C Reports** (Bank Holding Companies):
- Contains consolidated regulatory data
- Includes capital ratios, NPL data, risk metrics
- Available via FRED API (free)

## Implementation Options

### Option A: Use FDIC API (Recommended for US Banks)

**Pros:**
- ✅ Free
- ✅ Official regulatory data
- ✅ Comprehensive coverage of US banks
- ✅ Quarterly updates
- ✅ Easy to parse JSON API

**Cons:**
- ❌ US banks only
- ❌ Requires additional API integration
- ❌ May need to match ticker symbols to FDIC cert numbers

**Implementation:**
```typescript
// Add FDIC API call
const fdicData = await fetch(
  `https://banks.data.fdic.gov/api/financials?filters=STNAME:${ticker}&fields=NPTL,RBCT1&format=json`
);

// Parse and extract NPL and CAR
const nplRatio = fdicData?.data?.[0]?.NPTL; // Non-performing to total loans
const car = fdicData?.data?.[0]?.RBCT1; // Tier 1 capital ratio
```

### Option B: Hybrid Approach

Use **FMP for most metrics** + **FDIC for regulatory metrics**:

1. FMP provides 8 standard metrics ✓
2. FDIC provides NPL and CAR for US banks ✓
3. Show "Not Available" for international banks

### Option C: Manual Entry

Add a note that users can manually find these metrics:
- **NPL:** Check bank's 10-K "Credit Risk" section
- **CAR:** Check bank's 10-K "Regulatory Capital" section

## Next Steps

1. **Test FMP endpoints** with the script above
2. **If not available in FMP**, decide on:
   - FDIC integration for US banks?
   - Keep as "Not Available"?
   - Add manual lookup instructions?

3. **Consider user base:**
   - If mostly US banks → FDIC is great
   - If international banks → May need Bloomberg/S&P
   - If casual use → "Not Available" is acceptable

## Recommendation

For a complete solution with US banks:

**Implement FDIC API integration:**
- NPL Ratio from FDIC field `NPTL`
- CAR from FDIC field `RBCT1` or `RBRWAJR`
- Add disclaimer: "Regulatory metrics available for US banks only"
- Show "Not Available for International Banks" for non-US tickers

This would give you a **complete 10/10 metrics** for US banks!
