// Real Vanguard Import to DynamoDB
import { readFileSync } from 'fs';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { importVanguardCSV } from './src/utils/vanguardImporter';
import type { ImportProgress } from './src/utils/vanguardImporter';
import type { Schema } from './amplify/data/resource';

// Load AWS configuration
const outputs = JSON.parse(readFileSync('./amplify_outputs.json', 'utf-8'));
Amplify.configure(outputs);

const client = generateClient<Schema>();

const filePath = 'D:\\Market\\VanguardTransactions\\OfxDownload.csv';

async function runRealImport() {
  try {
    console.log('=== VANGUARD CSV IMPORT (REAL DATABASE) ===\n');

    // Read CSV file
    console.log('📄 Reading CSV file...');
    const csvContent = readFileSync(filePath, 'utf-8');
    console.log(`✅ Read ${csvContent.length} bytes\n`);

    // Track progress
    const onProgress = (progress: ImportProgress) => {
      console.log(`[${progress.current}%] ${progress.stage}: ${progress.message}`);
    };

    // Import with FIFO
    console.log('🔄 Importing to DynamoDB with FIFO method...\n');
    const startTime = Date.now();

    const stats = await importVanguardCSV(
      csvContent,
      'OfxDownload.csv',
      { matchingMethod: 'FIFO' },
      client,
      onProgress
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Display results
    console.log('\n=== IMPORT RESULTS ===');
    console.log(`Duration: ${duration}s`);
    console.log(`Total rows: ${stats.totalRows}`);
    console.log(`Holdings: ${stats.holdingsCount}`);
    console.log(`Transactions: ${stats.transactionsCount}`);
    console.log(`  New: ${stats.newTransactions}`);
    console.log(`  Duplicates: ${stats.duplicateTransactions}`);
    console.log(`Matched pairs: ${stats.matchedPairs}`);
    console.log(`Dividends processed: ${stats.dividendsProcessed}`);
    console.log(`Batch ID: ${stats.batchId}`);
    console.log(`Import History ID: ${stats.importHistoryId}`);

    // Errors and warnings
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No errors');
    }

    if (stats.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${stats.warnings.length}):`);
      stats.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('\n❌ Import failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run import
runRealImport();
