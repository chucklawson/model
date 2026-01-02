// ============================================
// FILE: src/utils/importDeduplication.ts
// Import Deduplication Utilities
// ============================================

import type { VanguardTransaction } from '../types';
import type { Schema } from '../../amplify/data/resource';
import type { SelectionSet } from 'aws-amplify/data';

// Type for Amplify Data client
export type AmplifyClient = ReturnType<typeof Schema.prototype.client>;

// ===== FILE-LEVEL DEDUPLICATION =====

/**
 * Generate SHA-256 hash of file content (browser-compatible)
 *
 * @param content - File content as string
 * @returns Promise resolving to SHA-256 hash in hexadecimal format
 */
export async function generateFileHash(content: string): Promise<string> {
  // Use Web Crypto API (available in browsers)
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Generate hash from File object (browser environment)
 *
 * @param file - File object from input element
 * @returns Promise resolving to SHA-256 hash
 */
export async function generateFileHashFromFile(file: File): Promise<string> {
  const content = await file.text();
  return generateFileHash(content);
}

/**
 * Check if file has already been imported
 *
 * @param fileHash - SHA-256 hash of file content
 * @param client - Amplify Data client
 * @returns ImportHistory record if duplicate found, null otherwise
 */
export async function checkDuplicateImport(
  fileHash: string,
  client: AmplifyClient
): Promise<any | null> {
  try {
    const { data: imports } = await client.models.ImportHistory.list({
      filter: {
        fileHash: { eq: fileHash }
      }
    });

    if (imports && imports.length > 0) {
      // Return the most recent import with this hash
      return imports.sort((a, b) =>
        new Date(b.importDate).getTime() - new Date(a.importDate).getTime()
      )[0];
    }

    return null;
  } catch (error) {
    console.error('Error checking duplicate import:', error);
    throw new Error(`Failed to check duplicate import: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ===== TRANSACTION-LEVEL DEDUPLICATION =====

/**
 * Generate unique key for a transaction
 * Used for duplicate detection
 *
 * @param txn - Vanguard transaction
 * @returns Unique transaction key
 */
export function generateTransactionKey(txn: VanguardTransaction): string {
  return `${txn.accountNumber}|${txn.tradeDate}|${txn.symbol}|${txn.shares}|${txn.transactionType}`;
}

/**
 * Check if transaction already exists in database
 *
 * @param txn - Vanguard transaction to check
 * @param client - Amplify Data client
 * @returns True if duplicate found, false otherwise
 */
export async function checkDuplicateTransaction(
  txn: VanguardTransaction,
  client: AmplifyClient
): Promise<boolean> {
  try {
    const { data: transactions } = await client.models.Transaction.list({
      filter: {
        and: [
          { accountNumber: { eq: txn.accountNumber } },
          { tradeDate: { eq: txn.tradeDate } },
          { symbol: { eq: txn.symbol } },
          { shares: { eq: txn.shares } },
          { transactionType: { eq: txn.transactionType } }
        ]
      }
    });

    return transactions !== null && transactions.length > 0;
  } catch (error) {
    console.error('Error checking duplicate transaction:', error);
    throw new Error(`Failed to check duplicate transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch check for duplicate transactions
 * More efficient than checking one at a time
 *
 * @param transactions - Array of transactions to check
 * @param client - Amplify Data client
 * @returns Array of booleans indicating duplicates (true = duplicate)
 */
export async function batchCheckDuplicateTransactions(
  transactions: VanguardTransaction[],
  client: AmplifyClient
): Promise<boolean[]> {
  // For now, check each transaction individually
  // This could be optimized with a custom GraphQL query
  const results = await Promise.all(
    transactions.map(txn => checkDuplicateTransaction(txn, client))
  );

  return results;
}

/**
 * Filter out duplicate transactions
 *
 * @param transactions - Array of transactions to filter
 * @param client - Amplify Data client
 * @returns Object with unique and duplicate transactions
 */
export async function filterDuplicateTransactions(
  transactions: VanguardTransaction[],
  client: AmplifyClient
): Promise<{
  unique: VanguardTransaction[];
  duplicates: VanguardTransaction[];
}> {
  const duplicateFlags = await batchCheckDuplicateTransactions(transactions, client);

  const unique: VanguardTransaction[] = [];
  const duplicates: VanguardTransaction[] = [];

  transactions.forEach((txn, index) => {
    if (duplicateFlags[index]) {
      duplicates.push(txn);
    } else {
      unique.push(txn);
    }
  });

  return { unique, duplicates };
}

// ===== IMPORT BATCH TRACKING =====

/**
 * Generate unique batch ID for import
 *
 * @param fileName - Name of file being imported
 * @returns Unique batch ID (timestamp-based)
 */
export function generateBatchId(fileName: string): string {
  const timestamp = new Date().getTime();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, '-');
  return `${sanitizedFileName}-${timestamp}`;
}

/**
 * Create ImportHistory record
 *
 * @param batchId - Unique batch ID
 * @param fileHash - SHA-256 hash of file
 * @param fileName - Original file name
 * @param stats - Import statistics
 * @param client - Amplify Data client
 * @returns Created ImportHistory record
 */
export async function createImportHistory(
  batchId: string,
  fileHash: string,
  fileName: string,
  stats: {
    totalTransactions: number;
    holdingsImported: number;
    transactionsImported: number;
    duplicatesSkipped: number;
    errorsEncountered: number;
    status: 'completed' | 'failed' | 'partial';
    errorMessage?: string;
    matchingMethodUsed?: string;
  },
  client: AmplifyClient
): Promise<any> {
  try {
    const { data: importHistory, errors } = await client.models.ImportHistory.create({
      batchId,
      importDate: new Date().toISOString(),
      sourceFileName: fileName,
      fileHash,
      totalTransactions: stats.totalTransactions,
      holdingsImported: stats.holdingsImported || 0,
      transactionsImported: stats.transactionsImported,
      duplicatesSkipped: stats.duplicatesSkipped,
      errorsEncountered: stats.errorsEncountered,
      status: stats.status,
      errorMessage: stats.errorMessage,
      matchingMethodUsed: stats.matchingMethodUsed,
      importedBy: 'system', // Could be user ID in future
    });

    if (errors) {
      throw new Error(`Failed to create import history: ${errors.map(e => e.message).join(', ')}`);
    }

    return importHistory;
  } catch (error) {
    console.error('Error creating import history:', error);
    throw new Error(`Failed to create import history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update ImportHistory record with final statistics
 *
 * @param importHistoryId - ID of ImportHistory record to update
 * @param updates - Fields to update
 * @param client - Amplify Data client
 */
export async function updateImportHistory(
  importHistoryId: string,
  updates: {
    status?: 'completed' | 'failed' | 'partial';
    errorMessage?: string;
    transactionsImported?: number;
    duplicatesSkipped?: number;
    errorsEncountered?: number;
  },
  client: AmplifyClient
): Promise<any> {
  try {
    const { data: updated, errors } = await client.models.ImportHistory.update({
      id: importHistoryId,
      ...updates,
    });

    if (errors) {
      throw new Error(`Failed to update import history: ${errors.map(e => e.message).join(', ')}`);
    }

    return updated;
  } catch (error) {
    console.error('Error updating import history:', error);
    throw new Error(`Failed to update import history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
