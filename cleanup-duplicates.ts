// ============================================
// Cleanup Duplicate Records Script
// ============================================
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource';
import outputs from './src/amplify_outputs.json';

// Configure Amplify
Amplify.configure(outputs);

const client = generateClient<Schema>();

interface RecordWithId {
  id: string;
  [key: string]: any;
}

/**
 * Remove duplicate records, keeping only the oldest (first created)
 */
async function cleanupDuplicateDividends() {
  console.log('\n=== CLEANING UP DUPLICATE DIVIDENDS ===\n');

  // Fetch all dividend records
  const { data: allDividends } = await client.models.DividendTransaction.list();

  if (!allDividends || allDividends.length === 0) {
    console.log('No dividend records found');
    return;
  }

  console.log(`Total dividend records: ${allDividends.length}`);

  // Group by unique key (transactionId)
  const grouped = new Map<string, RecordWithId[]>();

  for (const div of allDividends) {
    const key = div.transactionId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(div as RecordWithId);
  }

  // Find duplicates
  let duplicateCount = 0;
  const toDelete: string[] = [];

  for (const [key, records] of grouped.entries()) {
    if (records.length > 1) {
      // Sort by createdAt (keep oldest)
      records.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      // Mark all except the first for deletion
      for (let i = 1; i < records.length; i++) {
        toDelete.push(records[i].id);
        duplicateCount++;
      }

      console.log(`Found ${records.length - 1} duplicates for transaction ${key.substring(0, 30)}...`);
    }
  }

  console.log(`\nUnique transactions: ${grouped.size}`);
  console.log(`Duplicate records to delete: ${duplicateCount}`);

  // Delete duplicates
  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');
    let deleted = 0;

    for (const id of toDelete) {
      try {
        await client.models.DividendTransaction.delete({ id });
        deleted++;

        if (deleted % 50 === 0) {
          console.log(`Deleted ${deleted}/${toDelete.length}...`);
        }
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error);
      }
    }

    console.log(`\n✅ Deleted ${deleted} duplicate dividend records`);
  } else {
    console.log('\n✅ No duplicates found');
  }
}

/**
 * Remove duplicate completed transactions
 */
async function cleanupDuplicateCompletedTransactions() {
  console.log('\n=== CLEANING UP DUPLICATE COMPLETED TRANSACTIONS ===\n');

  // Fetch all completed transaction records
  const { data: allCompleted } = await client.models.CompletedTransaction.list();

  if (!allCompleted || allCompleted.length === 0) {
    console.log('No completed transaction records found');
    return;
  }

  console.log(`Total completed transaction records: ${allCompleted.length}`);

  // Group by unique key (buyTransactionId + sellTransactionId)
  const grouped = new Map<string, RecordWithId[]>();

  for (const ct of allCompleted) {
    const key = `${ct.buyTransactionId}|${ct.sellTransactionId}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(ct as RecordWithId);
  }

  // Find duplicates
  let duplicateCount = 0;
  const toDelete: string[] = [];

  for (const [key, records] of grouped.entries()) {
    if (records.length > 1) {
      // Sort by completedDate (keep oldest)
      records.sort((a, b) =>
        new Date(a.completedDate).getTime() - new Date(b.completedDate).getTime()
      );

      // Mark all except the first for deletion
      for (let i = 1; i < records.length; i++) {
        toDelete.push(records[i].id);
        duplicateCount++;
      }

      console.log(`Found ${records.length - 1} duplicates for ${records[0].symbol} buy/sell pair`);
    }
  }

  console.log(`\nUnique completed transactions: ${grouped.size}`);
  console.log(`Duplicate records to delete: ${duplicateCount}`);

  // Delete duplicates
  if (toDelete.length > 0) {
    console.log('\nDeleting duplicates...');
    let deleted = 0;

    for (const id of toDelete) {
      try {
        await client.models.CompletedTransaction.delete({ id });
        deleted++;

        if (deleted % 50 === 0) {
          console.log(`Deleted ${deleted}/${toDelete.length}...`);
        }
      } catch (error) {
        console.error(`Failed to delete ${id}:`, error);
      }
    }

    console.log(`\n✅ Deleted ${deleted} duplicate completed transaction records`);
  } else {
    console.log('\n✅ No duplicates found');
  }
}

/**
 * Main cleanup function
 */
async function cleanup() {
  try {
    console.log('='.repeat(60));
    console.log('DUPLICATE RECORD CLEANUP SCRIPT');
    console.log('='.repeat(60));

    await cleanupDuplicateDividends();
    await cleanupDuplicateCompletedTransactions();

    console.log('\n='.repeat(60));
    console.log('✅ CLEANUP COMPLETE');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run cleanup
cleanup();
