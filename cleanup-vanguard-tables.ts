import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './amplify/data/resource.js';
import amplifyOutputs from './src/amplify_outputs.json' assert { type: 'json' };

// Configure Amplify
Amplify.configure(amplifyOutputs);
const client = generateClient<Schema>();

/**
 * Delete all records from Vanguard import tables
 * Use this script to clean up before re-importing with the new schema that has custom primary keys
 */
async function cleanupVanguardTables() {
  console.log('🧹 Starting cleanup of Vanguard import tables...\n');

  try {
    // Clean Transaction table
    console.log('📊 Cleaning Transaction table...');
    const { data: transactions } = await client.models.Transaction.list();
    console.log(`Found ${transactions?.length || 0} transactions to delete`);

    if (transactions && transactions.length > 0) {
      let deletedCount = 0;
      for (const txn of transactions) {
        // Use the identifier field - could be 'id' (old schema) or 'transactionId' (new schema)
        const identifier = txn.transactionId ? { transactionId: txn.transactionId } : { id: (txn as any).id };
        await client.models.Transaction.delete(identifier);
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount}/${transactions.length} transactions...`);
        }
      }
      console.log(`✅ Deleted ${deletedCount} transactions\n`);
    } else {
      console.log('✅ No transactions to delete\n');
    }

    // Clean CompletedTransaction table
    console.log('💰 Cleaning CompletedTransaction table...');
    const { data: completed } = await client.models.CompletedTransaction.list();
    console.log(`Found ${completed?.length || 0} completed transactions to delete`);

    if (completed && completed.length > 0) {
      let deletedCount = 0;
      for (const ct of completed) {
        // Use the identifier field - could be 'id' (old schema) or composite key (new schema)
        const identifier = ct.buyTransactionId && ct.sellTransactionId
          ? { buyTransactionId: ct.buyTransactionId, sellTransactionId: ct.sellTransactionId }
          : { id: (ct as any).id };
        await client.models.CompletedTransaction.delete(identifier);
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount}/${completed.length} completed transactions...`);
        }
      }
      console.log(`✅ Deleted ${deletedCount} completed transactions\n`);
    } else {
      console.log('✅ No completed transactions to delete\n');
    }

    // Clean DividendTransaction table
    console.log('💵 Cleaning DividendTransaction table...');
    const { data: dividends } = await client.models.DividendTransaction.list();
    console.log(`Found ${dividends?.length || 0} dividend transactions to delete`);

    if (dividends && dividends.length > 0) {
      let deletedCount = 0;
      for (const div of dividends) {
        // Use the identifier field - could be 'id' (old schema) or 'transactionId' (new schema)
        const identifier = div.transactionId ? { transactionId: div.transactionId } : { id: (div as any).id };
        await client.models.DividendTransaction.delete(identifier);
        deletedCount++;
        if (deletedCount % 100 === 0) {
          console.log(`  Deleted ${deletedCount}/${dividends.length} dividend transactions...`);
        }
      }
      console.log(`✅ Deleted ${deletedCount} dividend transactions\n`);
    } else {
      console.log('✅ No dividend transactions to delete\n');
    }

    // Clean ImportHistory table
    console.log('📝 Cleaning ImportHistory table...');
    const { data: imports } = await client.models.ImportHistory.list();
    console.log(`Found ${imports?.length || 0} import history records to delete`);

    if (imports && imports.length > 0) {
      let deletedCount = 0;
      for (const imp of imports) {
        await client.models.ImportHistory.delete({ id: imp.id });
        deletedCount++;
      }
      console.log(`✅ Deleted ${deletedCount} import history records\n`);
    } else {
      console.log('✅ No import history to delete\n');
    }

    console.log('✨ Cleanup complete! You can now re-import your Vanguard CSV with the new schema.');
    console.log('The new schema uses custom primary keys to prevent duplicates at the database level.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

cleanupVanguardTables();
