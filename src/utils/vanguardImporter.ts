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
  generateFileHashFromFile,
  generateBatchId,
  checkDuplicateImport,
  filterDuplicateTransactions,
  createImportHistory,
} from './importDeduplication';
import type {
  VanguardTransaction,
  MatchingMethod,
  LotMatchingResult,
  ProcessedDividend,
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
      current: 25,
      total: 100,
      message: `Parsed ${parsed.holdings.length} holdings and ${parsed.transactions.length} transactions`,
    });

    // ===== STAGE 4: VALIDATE DATA =====
    onProgress?.({
      stage: 'validating',
      current: 30,
      total: 100,
      message: 'Validating data...',
    });

    const validation = validateVanguardCSV(parsed);

    if (!validation.isValid) {
      errors.push(...validation.errors.map(e => `Row ${e.row}: ${e.field} - ${e.message}`));

      // If there are critical errors, stop import
      if (errors.length > 0) {
        await createImportHistory(
          batchId,
          fileHash,
          fileName,
          {
            totalTransactions: parsed.transactions.length,
            holdingsImported: 0,
            transactionsImported: 0,
            duplicatesSkipped: 0,
            errorsEncountered: errors.length,
            status: 'failed',
            errorMessage: errors.join('; '),
            matchingMethodUsed: options.matchingMethod,
          },
          client
        );

        return {
          totalRows: parsed.holdings.length + parsed.transactions.length,
          holdingsCount: parsed.holdings.length,
          transactionsCount: parsed.transactions.length,
          newTransactions: 0,
          duplicateTransactions: 0,
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

    // ===== STAGE 5: FILTER DUPLICATE TRANSACTIONS =====
    onProgress?.({
      stage: 'deduplicating',
      current: 35,
      total: 100,
      message: 'Checking for duplicate transactions...',
    });

    const { unique, duplicates } = await filterDuplicateTransactions(
      parsed.transactions,
      client
    );

    onProgress?.({
      stage: 'deduplicating',
      current: 45,
      total: 100,
      message: `Found ${unique.length} new transactions, ${duplicates.length} duplicates`,
    });

    if (duplicates.length > 0) {
      warnings.push(`Skipped ${duplicates.length} duplicate transactions`);
    }

    // ===== STAGE 6: IMPORT TRANSACTIONS =====
    onProgress?.({
      stage: 'importing-transactions',
      current: 50,
      total: 100,
      message: `Importing ${unique.length} transactions...`,
    });

    const importedTransactions: string[] = [];

    for (let i = 0; i < unique.length; i++) {
      const txn = unique[i];

      try {
        const { data: transaction, errors: txnErrors } = await client.models.Transaction.create({
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
          importedTransactions.push(transaction.id);
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

    // ===== STAGE 7: MATCH TRANSACTIONS =====
    onProgress?.({
      stage: 'matching',
      current: 65,
      total: 100,
      message: 'Matching buy/sell transactions...',
    });

    const matchResults = matchTransactions(unique, options.matchingMethod);

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

    const completedTransactionIds: string[] = [];

    for (let i = 0; i < matchResults.length; i++) {
      const match = matchResults[i];

      try {
        const buyTxnId = generateTransactionId(match.buyTransaction);
        const sellTxnId = generateTransactionId(match.sellTransaction);

        // Check if this completed transaction already exists
        const { data: existing } = await client.models.CompletedTransaction.list({
          filter: {
            and: [
              { buyTransactionId: { eq: buyTxnId } },
              { sellTransactionId: { eq: sellTxnId } }
            ]
          }
        });

        if (existing && existing.length > 0) {
          // Already exists, skip creation
          completedTransactionIds.push(existing[0].id);
          warnings.push(`Skipped duplicate completed transaction for ${match.buyTransaction.symbol} (${buyTxnId.substring(0, 20)}...)`);
        } else {
          // Create new completed transaction
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
            completedTransactionIds.push(completed.id);
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

    // ===== STAGE 9: PROCESS DIVIDENDS =====
    onProgress?.({
      stage: 'processing-dividends',
      current: 85,
      total: 100,
      message: 'Processing dividend transactions...',
    });

    const dividends = processDividends(unique);

    // Import dividend transactions
    for (const div of dividends) {
      try {
        const txnId = generateTransactionId(div.originalTransaction);

        // Check if this dividend transaction already exists
        const { data: existing } = await client.models.DividendTransaction.list({
          filter: {
            transactionId: { eq: txnId }
          }
        });

        if (existing && existing.length > 0) {
          // Already exists, skip creation
          warnings.push(`Skipped duplicate dividend for ${div.symbol} on ${div.payDate}`);
        } else {
          // Create new dividend transaction
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
          }
        }
      } catch (error) {
        console.error('DividendTransaction exception:', error);
        warnings.push(`Failed to import dividend for ${div.symbol} on ${div.payDate} - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
        totalTransactions: parsed.transactions.length,
        holdingsImported: parsed.holdings.length,
        transactionsImported: unique.length,
        duplicatesSkipped: duplicates.length,
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

    return {
      totalRows: parsed.holdings.length + parsed.transactions.length,
      holdingsCount: parsed.holdings.length,
      transactionsCount: parsed.transactions.length,
      newTransactions: unique.length,
      duplicateTransactions: duplicates.length,
      matchedPairs: matchResults.length,
      dividendsProcessed: dividends.length,
      errors,
      warnings,
      batchId,
      importHistoryId,
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
 */
function generateTransactionId(txn: VanguardTransaction): string {
  return `${txn.accountNumber}-${txn.tradeDate}-${txn.symbol}-${txn.transactionType}-${txn.shares}`;
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
