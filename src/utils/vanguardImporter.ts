// ============================================
// FILE: src/utils/vanguardImporter.ts
// Vanguard CSV Import Orchestration
// ============================================

import { parseVanguardCSV } from './vanguardCsvParser';
import { validateVanguardCSV } from './vanguardCsvValidator';
import { matchTransactions } from './lotMatching';
import { processDividends } from './dividendProcessor';
import {
  generateFileHash,
  generateBatchId,
  checkDuplicateImport,
  deduplicateInternalTransactions,
  createImportHistory,
} from './importDeduplication';
import type {
  VanguardTransaction,
} from '../types';
import type { AmplifyClient } from './importDeduplication';

// ===== TYPES =====

export interface ImportProgress {
  stage: 'hashing' | 'parsing' | 'validating' | 'deduplicating' | 'importing-transactions' | 'matching' | 'importing-completed' | 'processing-dividends' | 'finalizing';
  current: number;
  total: number;
  message: string;
}

export interface ImportStats {
  totalRows: number;
  holdingsCount: number;
  transactionsCount: number;
  newTransactions: number;
  duplicateTransactions: number;
  matchedPairs: number;
  dividendsProcessed: number;
  errors: string[];
  warnings: string[];
  batchId: string;
  importHistoryId?: string;
  csvDuplicates?: VanguardTransaction[]; // Duplicates found within the CSV
  csvDuplicatePairs?: Array<{ original: VanguardTransaction; duplicate: VanguardTransaction }>; // Original + duplicate pairs
}

export interface ImportOptions {
  matchingMethod: MatchingMethod;
  skipDuplicateFile?: boolean; // If true, skip import if file hash already exists
  forceImport?: boolean; // If true, import even if duplicates found
}

// ===== MAIN IMPORT FUNCTION =====

/**
 * Import Vanguard CSV file with full orchestration
 *
 * @param fileContent - CSV file content as string
 * @param fileName - Original file name
 * @param options - Import options
 * @param client - Amplify Data client
 * @param onProgress - Progress callback function
 * @returns Import statistics
 */
export async function importVanguardCSV(
  fileContent: string,
  fileName: string,
  options: ImportOptions,
  client: AmplifyClient,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportStats> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let batchId = '';
  let importHistoryId: string | undefined;

  try {
    // ===== STAGE 1: GENERATE FILE HASH =====
    onProgress?.({
      stage: 'hashing',
      current: 0,
      total: 100,
      message: 'Generating file hash...',
    });

    const fileHash = await generateFileHash(fileContent);
    batchId = generateBatchId(fileName);

    // ===== STAGE 2: CHECK FOR DUPLICATE IMPORT =====
    onProgress?.({
      stage: 'hashing',
      current: 10,
      total: 100,
      message: 'Checking for duplicate import...',
    });

    const existingImport = await checkDuplicateImport(fileHash, client);

    if (existingImport && !options.forceImport) {
      if (options.skipDuplicateFile) {
        // User chose to skip duplicate files
        return {
          totalRows: 0,
          holdingsCount: 0,
          transactionsCount: 0,
          newTransactions: 0,
          duplicateTransactions: 0,
          matchedPairs: 0,
          dividendsProcessed: 0,
          errors: [],
          warnings: [`File already imported on ${new Date(existingImport.importDate).toLocaleDateString()}. Import skipped.`],
          batchId,
        };
      } else {
        warnings.push(`This file was previously imported on ${new Date(existingImport.importDate).toLocaleDateString()}. Continuing with transaction-level deduplication.`);
      }
    }

    // ===== STAGE 3: PARSE CSV =====
    onProgress?.({
      stage: 'parsing',
      current: 15,
      total: 100,
      message: 'Parsing CSV file...',
    });

    const parsed = parseVanguardCSV(fileContent);

    onProgress?.({
      stage: 'parsing',
      current: 20,
      total: 100,
      message: `Parsed ${parsed.holdings.length} holdings and ${parsed.transactions.length} transactions`,
    });

    // ===== STAGE 3.5: DEDUPLICATE CSV INTERNALLY =====
    onProgress?.({
      stage: 'parsing',
      current: 22,
      total: 100,
      message: 'Removing duplicate rows from CSV...',
    });

    const { deduplicated: deduplicatedTransactions, duplicates: csvDuplicates, duplicateCount: csvDuplicateCount, duplicatePairs: csvDuplicatePairs } =
      deduplicateInternalTransactions(parsed.transactions);

    if (csvDuplicateCount > 0) {
      warnings.push(`Removed ${csvDuplicateCount} duplicate rows from CSV file`);
      console.log(`\n${'='.repeat(80)}`);
      console.log(`⚠️  REMOVED ${csvDuplicateCount} DUPLICATE ROWS FROM CSV FILE`);
      console.log(`${'='.repeat(80)}`);

      csvDuplicates.forEach((dup, index) => {
        console.log(`\n--- Duplicate #${index + 1} ---`);
        console.log(`Account Number:     ${dup.accountNumber}`);
        console.log(`Trade Date:         ${dup.tradeDate}`);
        console.log(`Settlement Date:    ${dup.settlementDate || 'N/A'}`);
        console.log(`Transaction Type:   ${dup.transactionType}`);
        console.log(`Symbol:             ${dup.symbol}`);
        console.log(`Shares:             ${dup.shares}`);
        console.log(`Share Price:        $${dup.sharePrice?.toFixed(2) || 'N/A'}`);
        console.log(`Principal Amount:   $${dup.principalAmount?.toFixed(2) || 'N/A'}`);
        console.log(`Net Amount:         $${dup.netAmount?.toFixed(2) || 'N/A'}`);
        console.log(`Commissions/Fees:   $${dup.commissionsAndFees.toFixed(2)}`);
        console.log(`Description:        ${dup.transactionDescription || 'N/A'}`);
        console.log(`Investment Name:    ${dup.investmentName || 'N/A'}`);
      });

      console.log(`\n${'='.repeat(80)}\n`);
    }

    onProgress?.({
      stage: 'parsing',
      current: 25,
      total: 100,
      message: `Cleaned ${deduplicatedTransactions.length} unique transactions from CSV`,
    });

    // Use deduplicated transactions for the rest of the import
    const cleanedParsed = {
      ...parsed,
      transactions: deduplicatedTransactions,
    };

    // ===== STAGE 4: VALIDATE DATA =====
    onProgress?.({
      stage: 'validating',
      current: 30,
      total: 100,
      message: 'Validating data...',
    });

    const validation = validateVanguardCSV(cleanedParsed);

    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `Row ${e.row}: ${e.field} - ${e.message}`));

      // If there are critical errors, stop import
      if (errors.length > 0) {
        await createImportHistory(
          batchId,
          fileHash,
          fileName,
          {
            totalTransactions: cleanedParsed.transactions.length,
            holdingsImported: 0,
            transactionsImported: 0,
            duplicatesSkipped: csvDuplicateCount,
            errorsEncountered: errors.length,
            status: 'failed',
            errorMessage: errors.join('; '),
            matchingMethodUsed: options.matchingMethod,
          },
          client
        );

        return {
          totalRows: cleanedParsed.holdings.length + cleanedParsed.transactions.length,
          holdingsCount: cleanedParsed.holdings.length,
          transactionsCount: cleanedParsed.transactions.length,
          newTransactions: 0,
          duplicateTransactions: csvDuplicateCount,
          matchedPairs: 0,
          dividendsProcessed: 0,
          errors,
          warnings: validation.warnings.map(w => `Row ${w.row}: ${w.field} - ${w.message}`),
          batchId,
        };
      }
    }

    // Add validation warnings
    warnings.push(...validation.warnings.map(w => `Row ${w.row}: ${w.field} - ${w.message}`));

    // ===== STAGE 5: PRE-LOAD EXISTING IDS (MOVED BEFORE FILTERING) =====
    onProgress?.({
      stage: 'deduplicating',
      current: 35,
      total: 100,
      message: 'Pre-loading existing transaction IDs...',
    });

    console.log(`\n===== PRE-LOADING EXISTING IDS =====`);
    const existingTransactionIds = await preloadExistingTransactionIds(client);
    const existingCompletedKeys = await preloadExistingCompletedTransactionKeys(client);
    const existingDividendIds = await preloadExistingDividendTransactionIds(client);

    console.log(`Pre-loaded ${existingTransactionIds.length} existing transaction IDs`);
    console.log(`Pre-loaded ${existingCompletedKeys.length} existing completed transaction keys`);
    console.log(`Pre-loaded ${existingDividendIds.length} existing dividend transaction IDs`);

    // ===== STAGE 6: FILTER DUPLICATE TRANSACTIONS USING BINARY SEARCH =====
    onProgress?.({
      stage: 'deduplicating',
      current: 40,
      total: 100,
      message: 'Checking for duplicate transactions in database...',
    });

    console.log(`\n===== TRANSACTION DEDUPLICATION =====`);
    console.log(`Total transactions from CSV (after internal dedup): ${cleanedParsed.transactions.length}`);

    // FIX: Use binary search instead of DB queries
    const unique: VanguardTransaction[] = [];
    const duplicates: VanguardTransaction[] = [];

    for (const txn of cleanedParsed.transactions) {
      const txnId = generateTransactionId(txn);
      if (binarySearch(existingTransactionIds, txnId)) {
        duplicates.push(txn);
      } else {
        unique.push(txn);
      }
    }

    console.log(`Binary search duplicate check results:`);
    console.log(`  Unique (new): ${unique.length}`);
    console.log(`  Duplicates (in DB): ${duplicates.length}`);
    console.log(`Sample unique transactions (first 3):`, unique.slice(0, 3).map(t => ({
      symbol: t.symbol,
      date: t.tradeDate,
      type: t.transactionType,
      shares: t.shares
    })));
    console.log(`Sample duplicate transactions (first 3):`, duplicates.slice(0, 3).map(t => ({
      symbol: t.symbol,
      date: t.tradeDate,
      type: t.transactionType,
      shares: t.shares
    })));

    onProgress?.({
      stage: 'deduplicating',
      current: 45,
      total: 100,
      message: `Found ${unique.length} new transactions, ${duplicates.length} duplicates`,
    });

    if (duplicates.length > 0) {
      warnings.push(`Skipped ${duplicates.length} duplicate transactions`);
    }

    // ===== STAGE 7: IMPORT TRANSACTIONS =====
    onProgress?.({
      stage: 'importing-transactions',
      current: 50,
      total: 100,
      message: `Importing ${unique.length} transactions...`,
    });

    const importedTransactions: string[] = [];
    let skippedDuplicateCount = 0;

    for (let i = 0; i < unique.length; i++) {
      const txn = unique[i];

      try {
        const txnId = generateTransactionId(txn);

        // Binary search to check if this transaction already exists
        if (binarySearch(existingTransactionIds, txnId)) {
          // Already exists, skip without attempting database write
          skippedDuplicateCount++;
          importedTransactions.push(txnId);
        } else {
          // Doesn't exist, create new transaction
          const { data: transaction, errors: txnErrors } = await client.models.Transaction.create({
            transactionId: txnId,
            accountNumber: txn.accountNumber,
            tradeDate: txn.tradeDate,
            settlementDate: txn.settlementDate,
            transactionType: txn.transactionType,
            transactionDescription: txn.transactionDescription,
            investmentName: txn.investmentName,
            symbol: txn.symbol,
            shares: txn.shares,
            sharePrice: txn.sharePrice,
            principalAmount: txn.principalAmount,
            commissionsAndFees: txn.commissionsAndFees || 0,
            netAmount: txn.netAmount,
            accruedInterest: txn.accruedInterest,
            accountType: txn.accountType,
            importBatchId: batchId,
            importDate: new Date().toISOString(),
            sourceFile: fileName,
            isMatched: false,
            rawData: JSON.stringify(txn),
          });

          if (txnErrors || !transaction) {
            const errorDetails = txnErrors ? txnErrors.map(e => e.message).join(', ') : 'No transaction returned';
            console.error('Transaction creation failed:', { symbol: txn.symbol, date: txn.tradeDate, errors: txnErrors });
            errors.push(`Failed to import transaction: ${txn.symbol} on ${txn.tradeDate} - ${errorDetails}`);
          } else {
            importedTransactions.push(transaction.transactionId);
            // Add to our in-memory cache for subsequent checks within this import
            existingTransactionIds.push(transaction.transactionId);
            existingTransactionIds.sort(); // Keep sorted for binary search
          }
        }

        // Update progress every 10 transactions
        if (i % 10 === 0) {
          onProgress?.({
            stage: 'importing-transactions',
            current: 50 + Math.floor((i / unique.length) * 15),
            total: 100,
            message: `Imported ${i + 1}/${unique.length} transactions...`,
          });
        }
      } catch (error) {
        errors.push(`Failed to import transaction: ${txn.symbol} on ${txn.tradeDate} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (skippedDuplicateCount > 0) {
      console.log(`Skipped ${skippedDuplicateCount} duplicate transactions via binary search`);
      warnings.push(`Skipped ${skippedDuplicateCount} duplicate transactions (already exist in database)`);
    }

    // ===== STAGE 7: MATCH TRANSACTIONS =====
    onProgress?.({
      stage: 'matching',
      current: 65,
      total: 100,
      message: 'Matching buy/sell transactions...',
    });

    console.log(`\n===== LOT MATCHING =====`);
    console.log(`Unique transactions to match: ${unique.length}`);
    console.log(`Matching method: ${options.matchingMethod}`);

    const matchResults = matchTransactions(unique, options.matchingMethod);

    console.log(`Match results: ${matchResults.length} pairs created`);
    console.log(`Sample matches (first 3):`, matchResults.slice(0, 3).map(m => ({
      symbol: m.buyTransaction.symbol,
      buyDate: m.buyTransaction.tradeDate,
      sellDate: m.sellTransaction.tradeDate,
      shares: m.matchedShares
    })));

    onProgress?.({
      stage: 'matching',
      current: 70,
      total: 100,
      message: `Matched ${matchResults.length} transaction pairs`,
    });

    // ===== STAGE 8: IMPORT COMPLETED TRANSACTIONS =====
    onProgress?.({
      stage: 'importing-completed',
      current: 75,
      total: 100,
      message: `Creating ${matchResults.length} completed transaction records...`,
    });

    console.log(`\n===== COMPLETED TRANSACTION PROCESSING =====`);
    console.log(`Total match results: ${matchResults.length}`);
    console.log(`Pre-loaded completed transaction keys: ${existingCompletedKeys.length}`);
    console.log(`Sample pre-loaded keys (first 3):`, existingCompletedKeys.slice(0, 3));

    const completedTransactionIds: string[] = [];
    let skippedCompletedCount = 0;
    let createdCompletedCount = 0;

    for (let i = 0; i < matchResults.length; i++) {
      const match = matchResults[i];

      try {
        const buyTxnId = generateTransactionId(match.buyTransaction);
        const sellTxnId = generateTransactionId(match.sellTransaction);
        const compositeKey = `${buyTxnId}|${sellTxnId}`;

        // Log first 5 and last 5 key checks for debugging
        if (i < 5 || i >= matchResults.length - 5) {
          console.log(`\n[Match ${i + 1}/${matchResults.length}] Checking composite key:`, compositeKey);
        }

        // Binary search to check if this completed transaction already exists
        const exists = binarySearch(existingCompletedKeys, compositeKey);

        if (i < 5 || i >= matchResults.length - 5) {
          console.log(`  Binary search result: ${exists ? 'FOUND (skipping)' : 'NOT FOUND (creating)'}`);
        }

        if (exists) {
          // Already exists, skip without attempting database write
          completedTransactionIds.push(`${buyTxnId}-${sellTxnId}`);
          skippedCompletedCount++;
        } else {
          // Doesn't exist, create new completed transaction
          if (i < 5 || i >= matchResults.length - 5) {
            console.log(`  Creating new CompletedTransaction...`);
          }

          const { data: completed, errors: completedErrors } = await client.models.CompletedTransaction.create({
            symbol: match.buyTransaction.symbol,
            buyTransactionId: buyTxnId,
            buyDate: match.buyTransaction.tradeDate,
            buyShares: match.matchedShares,
            buyPrice: match.buyTransaction.sharePrice || 0,
            buyFees: calculateProportionalFees(
              match.buyTransaction.commissionsAndFees || 0,
              match.matchedShares,
              match.buyTransaction.shares
            ),
            buyTotalCost: calculateCostBasis(match.buyTransaction, match.matchedShares),
            sellTransactionId: sellTxnId,
            sellDate: match.sellTransaction.tradeDate,
            sellShares: match.matchedShares,
            sellPrice: match.sellTransaction.sharePrice || 0,
            sellFees: calculateProportionalFees(
              match.sellTransaction.commissionsAndFees || 0,
              match.matchedShares,
              Math.abs(match.sellTransaction.shares)
            ),
            sellTotalProceeds: calculateProceeds(match.sellTransaction, match.matchedShares),
            realizedGainLoss: match.realizedGainLoss,
            realizedGainLossPercent: calculateGainLossPercent(
              calculateCostBasis(match.buyTransaction, match.matchedShares),
              match.realizedGainLoss
            ),
            holdingPeriodDays: match.holdingPeriodDays,
            isLongTerm: match.isLongTerm,
            taxYear: new Date(match.sellTransaction.tradeDate).getFullYear(),
            matchingMethod: options.matchingMethod,
            accountNumber: match.buyTransaction.accountNumber,
            completedDate: new Date().toISOString(),
          });

          if (completedErrors || !completed) {
            const errorDetails = completedErrors ? completedErrors.map(e => e.message).join(', ') : 'No completed transaction returned';
            console.error('CompletedTransaction creation failed:', { symbol: match.buyTransaction.symbol, errors: completedErrors });
            errors.push(`Failed to create completed transaction for ${match.buyTransaction.symbol} - ${errorDetails}`);
          } else {
            completedTransactionIds.push(`${completed.buyTransactionId}-${completed.sellTransactionId}`);
            createdCompletedCount++;

            // Add to our in-memory cache for subsequent checks within this import
            const cacheKey = `${completed.buyTransactionId}|${completed.sellTransactionId}`;
            existingCompletedKeys.push(cacheKey);
            existingCompletedKeys.sort(); // Keep sorted for binary search

            if (i < 5 || i >= matchResults.length - 5) {
              console.log(`  Created successfully! Added to cache: ${cacheKey}`);
              console.log(`  Cache now has ${existingCompletedKeys.length} keys`);
            }
          }
        }

        // Update progress every 50 matches
        if (i % 50 === 0) {
          onProgress?.({
            stage: 'importing-completed',
            current: 75 + Math.floor((i / matchResults.length) * 10),
            total: 100,
            message: `Created ${i + 1}/${matchResults.length} completed transaction records...`,
          });
        }
      } catch (error) {
        errors.push(`Failed to create completed transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`\n===== COMPLETED TRANSACTION SUMMARY =====`);
    console.log(`Total matches processed: ${matchResults.length}`);
    console.log(`Skipped (duplicates): ${skippedCompletedCount}`);
    console.log(`Created (new): ${createdCompletedCount}`);
    console.log(`Final cache size: ${existingCompletedKeys.length}`);
    console.log(`Expected cache size: ${existingCompletedKeys.length}`);

    if (skippedCompletedCount > 0) {
      console.log(`\n⚠️  WARNING: Skipped ${skippedCompletedCount} duplicate completed transactions`);
    }

    // ===== STAGE 9: PROCESS DIVIDENDS =====
    onProgress?.({
      stage: 'processing-dividends',
      current: 85,
      total: 100,
      message: 'Processing dividend transactions...',
    });

    const dividends = processDividends(unique);

    // Import dividend transactions
    let skippedDividendCount = 0;
    for (const div of dividends) {
      try {
        const txnId = generateTransactionId(div.originalTransaction);

        // Binary search to check if this dividend transaction already exists
        if (binarySearch(existingDividendIds, txnId)) {
          // Already exists, skip without attempting database write
          skippedDividendCount++;
        } else {
          // Doesn't exist, create new dividend transaction
          const { data: dividend, errors: divErrors } = await client.models.DividendTransaction.create({
            transactionId: txnId,
            symbol: div.symbol,
            payDate: div.payDate,
            exDividendDate: div.exDividendDate,
            dividendPerShare: div.dividendPerShare || 0,
            totalDividend: div.totalDividend,
            shares: div.shares,
            isReinvested: div.isReinvested,
            reinvestmentTransactionId: div.reinvestmentTransactionId,
            isQualified: div.isQualified,
            taxYear: div.taxYear,
            accountNumber: div.accountNumber,
          });

          if (divErrors || !dividend) {
            const errorDetails = divErrors ? divErrors.map(e => e.message).join(', ') : 'No dividend returned';
            console.error('DividendTransaction creation failed:', { symbol: div.symbol, date: div.payDate, errors: divErrors });
            warnings.push(`Failed to import dividend for ${div.symbol} on ${div.payDate} - ${errorDetails}`);
          } else {
            // Add to our in-memory cache for subsequent checks within this import
            existingDividendIds.push(dividend.transactionId);
            existingDividendIds.sort(); // Keep sorted for binary search
          }
        }
      } catch (error) {
        console.error('DividendTransaction exception:', error);
        warnings.push(`Failed to import dividend for ${div.symbol} on ${div.payDate} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (skippedDividendCount > 0) {
      console.log(`Skipped ${skippedDividendCount} duplicate dividend transactions via binary search`);
    }

    // ===== STAGE 10: CREATE IMPORT HISTORY =====
    onProgress?.({
      stage: 'finalizing',
      current: 90,
      total: 100,
      message: 'Finalizing import...',
    });

    const importHistory = await createImportHistory(
      batchId,
      fileHash,
      fileName,
      {
        totalTransactions: cleanedParsed.transactions.length,
        holdingsImported: cleanedParsed.holdings.length,
        transactionsImported: unique.length,
        duplicatesSkipped: duplicates.length + csvDuplicateCount,
        errorsEncountered: errors.length,
        status: errors.length === 0 ? 'completed' : 'partial',
        errorMessage: errors.length > 0 ? errors.join('; ') : undefined,
        matchingMethodUsed: options.matchingMethod,
      },
      client
    );

    importHistoryId = importHistory?.id;

    // ===== COMPLETE =====
    onProgress?.({
      stage: 'finalizing',
      current: 100,
      total: 100,
      message: 'Import complete!',
    });

    // Calculate actual new records created (excluding duplicates)
    const actualNewTransactions = importedTransactions.length - skippedDuplicateCount;
    const actualNewCompleted = createdCompletedCount;
    const actualNewDividends = dividends.length - skippedDividendCount;

    console.log(`\n===== IMPORT SUMMARY STATS =====`);
    console.log(`CSV Transactions: ${cleanedParsed.transactions.length}`);
    console.log(`Unique Transactions (after CSV dedup): ${unique.length}`);
    console.log(`Database Duplicates Skipped: ${duplicates.length}`);
    console.log(`Binary Search Duplicates Skipped: ${skippedDuplicateCount}`);
    console.log(`Actual New Transactions Created: ${actualNewTransactions}`);
    console.log(`\nMatch Results: ${matchResults.length}`);
    console.log(`Completed Transactions Skipped: ${skippedCompletedCount}`);
    console.log(`Actual New Completed Created: ${actualNewCompleted}`);
    console.log(`\nDividends Processed: ${dividends.length}`);
    console.log(`Dividend Duplicates Skipped: ${skippedDividendCount}`);
    console.log(`Actual New Dividends Created: ${actualNewDividends}`);

    return {
      totalRows: cleanedParsed.holdings.length + cleanedParsed.transactions.length,
      holdingsCount: cleanedParsed.holdings.length,
      transactionsCount: actualNewTransactions, // FIX: Return actual new transactions, not total CSV count
      newTransactions: unique.length,
      duplicateTransactions: duplicates.length + csvDuplicateCount + skippedDuplicateCount,
      matchedPairs: actualNewCompleted, // FIX: Return actual new completed transactions, not total matches
      dividendsProcessed: actualNewDividends, // FIX: Return actual new dividends, not total processed
      errors,
      warnings,
      batchId,
      importHistoryId,
      csvDuplicates, // Include the actual duplicate transaction objects
      csvDuplicatePairs, // Include original + duplicate pairs
    };

  } catch (error) {
    // Create failed import history
    if (batchId) {
      try {
        await createImportHistory(
          batchId,
          await generateFileHash(fileContent),
          fileName,
          {
            totalTransactions: 0,
            holdingsImported: 0,
            transactionsImported: 0,
            duplicatesSkipped: 0,
            errorsEncountered: 1,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            matchingMethodUsed: options.matchingMethod,
          },
          client
        );
      } catch (historyError) {
        console.error('Failed to create import history:', historyError);
      }
    }

    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Import from File object (browser environment)
 */
export async function importVanguardCSVFromFile(
  file: File,
  options: ImportOptions,
  client: AmplifyClient,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportStats> {
  const content = await file.text();
  return importVanguardCSV(content, file.name, options, client, onProgress);
}

// ===== HELPER FUNCTIONS =====

/**
 * Generate unique transaction ID for linking
 * Includes principalAmount to distinguish multiple same-day transactions with different amounts
 */
function generateTransactionId(txn: VanguardTransaction): string {
  // Convert principalAmount to fixed decimal string, handle undefined
  const principalAmt = txn.principalAmount !== undefined
    ? txn.principalAmount.toFixed(2)
    : 'undefined';

  const txnId = `${txn.accountNumber}-${txn.tradeDate}-${txn.symbol}-${txn.transactionType}-${txn.shares}-${principalAmt}`;

  // Debug: Log first few transaction IDs to verify new format
  if (Math.random() < 0.01) { // Log ~1% of transactions
    console.log('🔑 Generated transaction ID:', txnId);
  }

  return txnId;
}

/**
 * Binary search to check if a key exists in sorted array
 */
function binarySearch(sortedArray: string[], target: string): boolean {
  let left = 0;
  let right = sortedArray.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedArray[mid] === target) {
      return true;
    } else if (sortedArray[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return false;
}

/**
 * Pre-load all existing Transaction IDs from database
 */
async function preloadExistingTransactionIds(client: AmplifyClient): Promise<string[]> {
  const ids: string[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const { data, nextToken: token } = await client.models.Transaction.list({
      limit: 1000,
      nextToken: nextToken as string | undefined,
      selectionSet: ['transactionId'], // Only fetch the ID field
    });

    if (data) {
      ids.push(...data.map(t => t.transactionId));
    }

    nextToken = token;
  } while (nextToken);

  // Sort for binary search
  return ids.sort();
}

/**
 * Pre-load all existing CompletedTransaction composite keys from database
 */
async function preloadExistingCompletedTransactionKeys(client: AmplifyClient): Promise<string[]> {
  const keys: string[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const { data, nextToken: token } = await client.models.CompletedTransaction.list({
      limit: 1000,
      nextToken: nextToken as string | undefined,
      selectionSet: ['buyTransactionId', 'sellTransactionId'], // Only fetch the key fields
    });

    if (data) {
      keys.push(...data.map(t => `${t.buyTransactionId}|${t.sellTransactionId}`));
    }

    nextToken = token;
  } while (nextToken);

  // Sort for binary search
  return keys.sort();
}

/**
 * Pre-load all existing DividendTransaction IDs from database
 */
async function preloadExistingDividendTransactionIds(client: AmplifyClient): Promise<string[]> {
  const ids: string[] = [];
  let nextToken: string | null | undefined = undefined;

  do {
    const { data, nextToken: token } = await client.models.DividendTransaction.list({
      limit: 1000,
      nextToken: nextToken as string | undefined,
      selectionSet: ['transactionId'], // Only fetch the ID field
    });

    if (data) {
      ids.push(...data.map(t => t.transactionId));
    }

    nextToken = token;
  } while (nextToken);

  // Sort for binary search
  return ids.sort();
}

/**
 * Calculate proportional fees
 */
function calculateProportionalFees(
  totalFees: number,
  matchedShares: number,
  totalShares: number
): number {
  if (totalShares === 0) return 0;
  return (totalFees * matchedShares) / totalShares;
}

/**
 * Calculate cost basis for matched shares
 */
function calculateCostBasis(
  buyTxn: VanguardTransaction,
  matchedShares: number
): number {
  const price = buyTxn.sharePrice || 0;
  const fees = calculateProportionalFees(
    buyTxn.commissionsAndFees || 0,
    matchedShares,
    buyTxn.shares
  );
  return (matchedShares * price) + fees;
}

/**
 * Calculate proceeds for matched shares
 */
function calculateProceeds(
  sellTxn: VanguardTransaction,
  matchedShares: number
): number {
  const price = sellTxn.sharePrice || 0;
  const fees = calculateProportionalFees(
    sellTxn.commissionsAndFees || 0,
    matchedShares,
    Math.abs(sellTxn.shares)
  );
  return (matchedShares * price) - fees;
}

/**
 * Calculate gain/loss percentage
 */
function calculateGainLossPercent(
  costBasis: number,
  gainLoss: number
): number {
  if (costBasis === 0) return 0;
  return (gainLoss / costBasis) * 100;
}
