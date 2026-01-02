# Session Notes - January 2, 2026

## Current Status
Working on fixing FMP API integration after completing Vanguard CSV import feature.

## What Was Fixed Today

### 1. Vanguard Import Duplicate Records Bug ✅ FIXED
- **Problem**: Import created massive duplicates (5,296 extra records across DividendTransaction and CompletedTransaction tables)
- **Root Cause**: `vanguardImporter.ts` lines 301 and 371 didn't check for existing records before creating CompletedTransaction and DividendTransaction entries
- **Fix**: Added duplicate checks using `client.models.CompletedTransaction.list()` and `client.models.DividendTransaction.list()` with filters
- **Cleanup**: Created `cleanup-duplicates-aws.ts` to remove existing duplicates
- **Verified**: Fresh import works correctly with exact counts:
  - Transaction: 2,259
  - CompletedTransaction: 626
  - DividendTransaction: 288

### 2. Import Modal UX Issue ✅ FIXED
- **Problem**: Modal closed immediately after import, user couldn't see results
- **Fix**: Removed `setShowVanguardImportModal(false)` from `onImportComplete` callback in `Tickers.tsx:776`
- **Result**: Modal now stays open showing results until user clicks "Done"

### 3. Amplify Configuration Bug ✅ FIXED
- **Problem**: "Amplify has not been configured" errors, ERR_CERT_VERIFIER_CHANGED
- **Root Cause**: `src/main.tsx:6` had wrong import path `"../amplify_outputs.json"`
- **Fix**: Changed to `"./amplify_outputs.json"`
- **File Location**: `src/amplify_outputs.json` (38,707 bytes)

### 4. FMP API Lambda Bug ✅ FIXED (BLOCKED BY AMPLIFY CONFIG)
- **Problem**: Lambda returning `{"error":"No API key configured. Please add your FMP API key in settings."}`
- **Root Cause**: Lambda was using `QueryCommand` on `owner` field, but FmpApiKey table has no GSI on owner (only `id` as primary key)
  - You can only Query on indexed fields (partition key, sort key, or GSI)
  - The Query operation was failing silently, returning no results
- **Fix**: Changed `amplify/functions/fmp-proxy/handler.ts`:
  - Line 3: Changed `QueryCommand` to `ScanCommand`
  - Line 30: Changed `KeyConditionExpression` to `FilterExpression`
- **Deployed**: Successfully deployed at 10:38:00 AM via `npx ampx sandbox --once`
- **Status**: Lambda fix deployed but blocked by Amplify configuration issue (see #5)

### 5. Amplify Configuration Issue ✅ FIXED
- **Problem**: Browser console shows "Amplify has not been configured. Please call Amplify.configure() before using this service"
- **Root Cause**: `src/utils/fmpApiClient.ts:5` was calling `generateClient<Schema>()` at module load time (before Amplify.configure())
- **Fix**: Implemented lazy initialization in `fmpApiClient.ts`
  - Changed from eager initialization: `const amplifyClient = generateClient<Schema>();`
  - To lazy initialization: `getAmplifyClient()` function that only creates client when first needed
  - Updated all functions to use `getAmplifyClient()` instead of direct `amplifyClient` reference
- **Files Modified**: `src/utils/fmpApiClient.ts` (lines 5-12, 68, 74, 96)
- **Result**: Amplify now properly configured before any services are used

### 6. Lambda DynamoDB Reserved Keyword Issue ✅ FIXED
- **Problem**: Lambda returning "No API key configured" even though key exists in DynamoDB
- **Root Cause**: `owner` is a DynamoDB reserved keyword - cannot be used directly in FilterExpression
- **Error**: `ValidationException: Invalid FilterExpression: Attribute name is a reserved keyword; reserved keyword: owner`
- **Fix**: Added `ExpressionAttributeNames` to escape the reserved keyword in `amplify/functions/fmp-proxy/handler.ts:37`
  ```typescript
  FilterExpression: '#owner = :owner',
  ExpressionAttributeNames: {
    '#owner': 'owner'  // Escapes reserved keyword
  },
  ```
- **Deployed**: Successfully deployed at 1:15:11 PM via `npx ampx sandbox --once`
- **Verified**: CloudWatch logs show "Found active API key" and "Final apiKey status: Found"
- **Result**: ✅ Stock quotes now loading successfully from FMP API using DynamoDB-stored API key

## Current Database State

### DynamoDB Tables (aobfqsdvibajfnofx3qajb3tfe-NONE)
- Transaction: 2,259 records
- CompletedTransaction: 626 records
- DividendTransaction: 288 records
- ImportHistory: 1 record
- FmpApiKey: 1 record (owner format: `119ba570-40d1-70e8-274c-675adf4b102c::119ba570-40d1-70e8-274c-675adf4b102c`)

### Lambda Configuration
- **Function**: `amplify-model-Chuck-sandbox-fmpproxylambdaEFF83337-TePlmCFkDDIl`
- **URL**: `https://qy2fvggpm4zwvqdg3x3sp23bx40llynx.lambda-url.us-east-2.on.aws/`
- **Auth**: NONE
- **CORS**: AllowOrigins: *, AllowMethods: POST
- **Environment**: Defined in `.env` as `VITE_FMP_PROXY_URL`

## Files Modified This Session

### Modified Files
1. `src/utils/vanguardImporter.ts` - Added deduplication for CompletedTransaction (lines 304-312) and DividendTransaction (lines 393-398)
2. `src/Pages/Tickers/Tickers.tsx` - Removed premature modal close (line 776)
3. `src/main.tsx` - Fixed Amplify config import path (line 6)
4. `amplify/functions/fmp-proxy/handler.ts` - Changed Query to Scan (lines 3, 30)

### Created Files
1. `cleanup-duplicates-aws.ts` - Script to remove duplicate records
2. `reset-vanguard-tables.ts` - Script to empty all Vanguard import tables

## Next Steps After Reboot

1. **Test FMP API Integration**
   - Hard refresh browser (Ctrl+Shift+R)
   - Check if Tickers page loads stock data
   - Verify Network tab shows successful FMP API responses
   - If still failing, check CloudWatch logs for Lambda function

2. **Alternative Solutions if Still Broken**
   - Option A: Add GSI on `owner` field to FmpApiKey table (more efficient than Scan)
   - Option B: Add more logging to Lambda to debug owner field mismatch
   - Option C: Verify JWT token is being passed correctly to Lambda

3. **End-to-End Vanguard Import Test**
   - Once FMP API works, test complete import flow with modal
   - Test re-importing same file to verify deduplication warnings work
   - Verify Tickers page shows correct data after import

## Technical Details for Reference

### Lambda Handler Logic (handler.ts)
```typescript
// Line 26: Owner field format matches DynamoDB
const ownerField = `${userId}::${userId}`;

// Line 28-35: Now uses Scan instead of Query
const result = await dynamoClient.send(new ScanCommand({
  TableName: tableName,
  FilterExpression: 'owner = :owner',
  ExpressionAttributeValues: {
    ':owner': ownerField
  },
  Limit: 1
}));
```

### FmpApiKey Table Structure
- Primary Key: `id` (HASH)
- No GSI defined
- Owner field format: `userId::userId` (e.g., `119ba570-40d1-70e8-274c-675adf4b102c::119ba570-40d1-70e8-274c-675adf4b102c`)

## Commands for Quick Diagnostics

```bash
# Check DynamoDB table counts
aws dynamodb scan --table-name Transaction-aobfqsdvibajfnofx3qajb3tfe-NONE --region us-east-2 --select COUNT
aws dynamodb scan --table-name FmpApiKey-aobfqsdvibajfnofx3qajb3tfe-NONE --region us-east-2

# Check Lambda function
aws lambda get-function-configuration --function-name amplify-model-Chuck-sandbox-fmpproxylambdaEFF83337-TePlmCFkDDIl --region us-east-2

# Redeploy if needed
npx ampx sandbox --once

# Test Vanguard import
npx tsx test-vanguard-import.ts
```

## Known Issues

### All Issues Resolved ✅
- ✅ **FMP API Integration**: Now working - stock quotes loading successfully
- ✅ **Lambda API Key Lookup**: Successfully fetching from DynamoDB
- ✅ **Amplify Configuration**: Fixed with lazy initialization

### Resolved
- ✅ Vanguard CSV import duplication
- ✅ Modal closing prematurely
- ✅ Amplify configuration errors
- ✅ Lambda Query/Scan issue (deployed, needs testing)

## Environment Info
- Region: us-east-2
- Sandbox: Chuck
- Stack: amplify-model-Chuck-sandbox-b796989a6d
- Last Deploy: 10:38:00 AM, January 2, 2026
