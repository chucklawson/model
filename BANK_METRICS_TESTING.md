# Bank Metrics Calculator - Testing Guide

## 🚀 Quick Start

1. **Development Server**: http://localhost:5174/
2. **Navigate to**: Calculators page
3. **Look for**: Orange "Bank Metrics" card
4. **Click**: "Launch Calculator" button

## 📋 Pre-Testing Checklist

### Ensure Financial Portfolio Exists
- [ ] Create or verify "Financial" portfolio exists
- [ ] Add bank tickers to Financial portfolio

### Recommended Test Tickers
| Ticker | Bank Name | Type |
|--------|-----------|------|
| JPM | JPMorgan Chase | Commercial Bank |
| BAC | Bank of America | Commercial Bank |
| WFC | Wells Fargo | Commercial Bank |
| C | Citigroup | Global Bank |
| GS | Goldman Sachs | Investment Bank |
| MS | Morgan Stanley | Investment Bank |

## 🧪 Test Scenarios

### Test 1: Basic Functionality
**Goal**: Verify calculator opens and loads data

1. Open Bank Metrics Calculator
2. Select "JPM" from dropdown
3. Keep period as "Annual"
4. Click "Calculate Metrics"
5. Wait for loading to complete

**Expected Results**:
- ✅ Company name displays: "JPMorgan Chase & Co."
- ✅ Three colored sections appear:
  - Green: Profitability & Efficiency
  - Blue: Asset Quality & Risk
  - Purple: Liquidity & Capital Adequacy
- ✅ 8 metrics show numerical values
- ✅ 2 metrics show "Not Available" (NPL Ratio, CAR)

### Test 2: Net Interest Margin (NIM) Calculation
**Goal**: Verify NIM is now calculated (was previously N/A)

1. Select "JPM" and calculate
2. Look at Profitability & Efficiency section
3. Find "Net Interest Margin (NIM)" card

**Expected Results**:
- ✅ Shows a percentage value (e.g., "2.45%")
- ✅ Description: "Interest income minus interest expense, as % of earning assets"
- ❌ Should NOT show "Not Available"

**Calculation Verification**:
- Formula: (Interest Income - Interest Expense) / Total Assets × 100
- Open browser console and check network tab
- Verify income-statement and balance-sheet APIs were called

### Test 3: Loan-to-Assets Ratio Calculation
**Goal**: Verify Loan-to-Assets is now calculated (was previously N/A)

1. Select "BAC" and calculate
2. Look at Asset Quality & Risk section
3. Find "Loan-to-Assets Ratio" card

**Expected Results**:
- ✅ Shows a percentage value (e.g., "52.30%")
- ✅ Description: "Proportion of assets tied up in loans"
- ❌ Should NOT show "Not Available"

**Calculation Verification**:
- Formula: (Receivables + Short-term Inv. + Long-term Inv.) / Total Assets × 100
- Balance sheet data should include netReceivables, investments

### Test 4: Period Toggle (Annual vs Quarterly)
**Goal**: Verify both periods work correctly

1. Select "WFC"
2. Choose "Annual" and calculate
3. Note the metric values
4. Switch to "Quarterly" and calculate again
5. Compare values

**Expected Results**:
- ✅ Quarterly values differ from annual
- ✅ All calculations complete successfully
- ✅ No errors in console

### Test 5: Multiple Bank Types
**Goal**: Verify calculations work across different bank types

Test each bank type:

**Commercial Bank (JPM)**:
- Expected: Full metrics suite
- NIM should be ~2-3%
- Loan-to-Assets ~50-60%

**Investment Bank (GS)**:
- Expected: Most metrics available
- NIM may be lower or N/A (different business model)
- Loan-to-Assets may be lower

**Global Bank (C)**:
- Expected: Full metrics suite
- Similar to commercial banks

### Test 6: Efficiency Ratio Calculation
**Goal**: Verify custom calculation from income statement

1. Select any bank ticker
2. Calculate metrics
3. Check Efficiency Ratio value

**Expected Results**:
- ✅ Shows percentage (typically 50-70% for banks)
- ✅ Formula: Operating Expenses / Revenue × 100
- Lower is better (more efficient)

### Test 7: Error Handling
**Goal**: Verify proper error messages

**Test A: No Financial Portfolio**
1. Remove all tickers from Financial portfolio
2. Open calculator
3. **Expected**: Yellow warning "No tickers found in Financial portfolio"

**Test B: Invalid Ticker**
1. (Can't select invalid ticker from dropdown, but test validation)
2. **Expected**: Proper error handling if API fails

**Test C: API Failure**
1. Disconnect internet briefly
2. Try to calculate
3. **Expected**: Red error message with clear explanation

## 📊 Validation Checklist

### UI/UX Validation
- [ ] Modal opens smoothly
- [ ] Orange/amber gradient header
- [ ] Ticker dropdown only shows Financial portfolio tickers
- [ ] Period toggle (Annual/Quarterly) works
- [ ] Loading spinner appears during calculation
- [ ] Close button (X) works

### Metric Calculations
**Should Show Values** (8 metrics):
- [ ] Return on Assets (ROA) - from FMP
- [ ] Return on Equity (ROE) - from FMP
- [ ] Net Interest Margin (NIM) - **CALCULATED**
- [ ] Efficiency Ratio - **CALCULATED**
- [ ] Net Profit Margin - from FMP
- [ ] Loan-to-Assets Ratio - **CALCULATED**
- [ ] Current Ratio - from FMP
- [ ] Debt-to-Equity Ratio - from FMP

**Should Show "Not Available"** (2 metrics):
- [ ] Non-Performing Loan (NPL) Ratio
- [ ] Capital Adequacy Ratio (CAR)

### Color-Coded Sections
- [ ] **Green Section**: Profitability & Efficiency (5 metrics)
- [ ] **Blue Section**: Asset Quality & Risk (2 metrics)
- [ ] **Purple Section**: Liquidity & Capital Adequacy (3 metrics)

### Data Accuracy
- [ ] Metric values are reasonable (not NaN, Infinity, or negative)
- [ ] Percentages formatted correctly (e.g., "12.45%")
- [ ] Ratios formatted correctly (e.g., "1.23")
- [ ] Company name displays correctly

## 🐛 Common Issues & Solutions

### Issue: "No tickers found in Financial portfolio"
**Solution**: Add bank tickers to a portfolio named exactly "Financial" (case-sensitive)

### Issue: All metrics show "Not Available"
**Solution**:
1. Check browser console for API errors
2. Verify FMP API key is configured
3. Ensure ticker symbol is valid

### Issue: NIM shows "Not Available"
**Possible Causes**:
1. Interest income/expense data missing from income statement
2. Total assets missing from balance sheet
3. Values are zero or null

**Debug Steps**:
1. Open browser DevTools → Network tab
2. Find income-statement and balance-sheet API calls
3. Check response data for required fields

### Issue: Loan-to-Assets shows "Not Available"
**Possible Causes**:
1. Balance sheet fields missing (netReceivables, investments)
2. All loan-like assets are zero
3. Total assets is zero or null

**Debug Steps**:
1. Check balance-sheet API response
2. Verify netReceivables, shortTermInvestments, longTermInvestments fields exist

## 🎯 Success Criteria

The Bank Metrics Calculator is working correctly if:

1. ✅ Opens without errors
2. ✅ Shows only Financial portfolio tickers
3. ✅ Fetches data from 4 FMP endpoints (quote, key-metrics, income-statement, balance-sheet)
4. ✅ Displays 8 calculated metrics with values
5. ✅ Shows 2 "Not Available" metrics (NPL Ratio, CAR)
6. ✅ **NIM is calculated** (not "Not Available")
7. ✅ **Loan-to-Assets is calculated** (not "Not Available")
8. ✅ Efficiency Ratio is calculated
9. ✅ Period toggle works (Annual/Quarterly)
10. ✅ Error handling works gracefully

## 📸 Screenshot Reference

### Expected Layout
```
┌─────────────────────────────────────────────────────┐
│ 🏢 Bank Metrics Calculator                      ✕  │
│ Analyze key financial metrics for banking...       │
├─────────────────────────────────────────────────────┤
│ [Ticker Dropdown: JPM ▼]                           │
│ [Annual] [Quarterly]                                │
│ [Calculate Metrics Button]                          │
├─────────────────────────────────────────────────────┤
│ JPMorgan Chase & Co.                                │
│ JPM - Annual Metrics                                │
├─────────────────────────────────────────────────────┤
│ 📈 Profitability & Efficiency (GREEN)               │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │ ROA  │ │ ROE  │ │ NIM  │ │ Eff. │ │ NPM  │     │
│ │12.5% │ │15.2% │ │2.45% │ │55.3% │ │28.1% │     │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘     │
├─────────────────────────────────────────────────────┤
│ 🛡️ Asset Quality & Risk (BLUE)                      │
│ ┌────────────┐ ┌────────────┐                      │
│ │ NPL Ratio  │ │Loan/Assets │                      │
│ │    N/A     │ │   52.30%   │                      │
│ └────────────┘ └────────────┘                      │
├─────────────────────────────────────────────────────┤
│ 💧 Liquidity & Capital Adequacy (PURPLE)            │
│ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │Current│ │ CAR  │ │ D/E  │                        │
│ │ 1.23 │ │ N/A  │ │ 2.15 │                        │
│ └──────┘ └──────┘ └──────┘                        │
└─────────────────────────────────────────────────────┘
```

## 📝 Test Report Template

After testing, document your results:

```
Date: _______________
Tester: _______________

Test Results:
[ ] Calculator opens successfully
[ ] Financial portfolio tickers load correctly
[ ] Calculations complete without errors
[ ] NIM shows calculated value (not N/A)
[ ] Loan-to-Assets shows calculated value (not N/A)
[ ] All 8 available metrics display correctly
[ ] NPL Ratio shows "Not Available" ✓
[ ] CAR shows "Not Available" ✓
[ ] Period toggle works (Annual/Quarterly)

Sample Values (JPM - Annual):
- ROA: _______%
- ROE: _______%
- NIM: _______% (should have value)
- Efficiency Ratio: _______%
- Loan-to-Assets: _______% (should have value)

Issues Found:
_________________________________
_________________________________

Notes:
_________________________________
_________________________________
```

## 🔍 Advanced Debugging

### Check API Responses

Open browser DevTools → Console, add this:
```javascript
// Log API responses
window.addEventListener('fetch', (e) => {
  console.log('API Call:', e.request.url);
});
```

### Verify Calculation Logic

In browser console:
```javascript
// Manual NIM calculation
const interestIncome = 50000;  // from income statement
const interestExpense = 10000;  // from income statement
const totalAssets = 1000000;    // from balance sheet
const nim = ((interestIncome - interestExpense) / totalAssets) * 100;
console.log('Manual NIM:', nim + '%');
```

## ✅ Final Validation

Your Bank Metrics Calculator implementation is **production-ready** if:
1. All test scenarios pass
2. NIM and Loan-to-Assets calculate correctly
3. No console errors
4. Performance is acceptable (<3 seconds to load)
5. Error handling is graceful
