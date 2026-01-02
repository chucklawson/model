// Test Vanguard Import with Real Data (Mock Database)
import { readFileSync } from 'fs';
import { importVanguardCSV } from './src/utils/vanguardImporter';
import type { ImportProgress } from './src/utils/vanguardImporter';

const filePath = 'D:\\Market\\VanguardTransactions\\OfxDownload.csv';

// ===== MOCK AMPLIFY CLIENT =====

function createMockClient() {
  const createdTransactions: any[] = [];
  const createdCompletedTransactions: any[] = [];
  const createdDividends: any[] = [];
  const createdImportHistories: any[] = [];

  return {
    models: {
      ImportHistory: {
        list: async () => ({ data: [] }),
        create: async (data: any) => {
          const record = { id: `import-${Date.now()}`, ...data };
          createdImportHistories.push(record);
          return { data: record, errors: null };
        },
      },
      Transaction: {
        list: async () => ({ data: [] }), // No duplicates for first import
        create: async (data: any) => {
          const record = { id: `txn-${createdTransactions.length}`, ...data };
          createdTransactions.push(record);
          return { data: record, errors: null };
        },
      },
      CompletedTransaction: {
        create: async (data: any) => {
          const record = { id: `completed-${createdCompletedTransactions.length}`, ...data };
          createdCompletedTransactions.push(record);
          return { data: record, errors: null };
        },
      },
      DividendTransaction: {
        create: async (data: any) => {
          const record = { id: `div-${createdDividends.length}`, ...data };
          createdDividends.push(record);
          return { data: record, errors: null };
        },
      },
    },
    _created: {
      transactions: createdTransactions,
      completedTransactions: createdCompletedTransactions,
      dividends: createdDividends,
      importHistories: createdImportHistories,
    },
  } as any;
}

// ===== MAIN TEST =====

async function testVanguardImport() {
  try {
    console.log('=== VANGUARD CSV IMPORT TEST (MOCK DATABASE) ===\n');

    // Read CSV file
    console.log('📄 Reading CSV file...');
    const csvContent = readFileSync(filePath, 'utf-8');
    console.log(`✅ Read ${csvContent.length} bytes\n`);

    // Create mock client
    const mockClient = createMockClient();

    // Track progress
    const progressUpdates: ImportProgress[] = [];
    const onProgress = (progress: ImportProgress) => {
      progressUpdates.push(progress);
      console.log(`[${progress.current}%] ${progress.stage}: ${progress.message}`);
    };

    // Import with FIFO
    console.log('\n🔄 Importing with FIFO method...\n');
    const startTime = Date.now();

    const stats = await importVanguardCSV(
      csvContent,
      'OfxDownload.csv',
      { matchingMethod: 'FIFO' },
      mockClient,
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
      stats.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more`);
      }
    } else {
      console.log('\n✅ No errors');
    }

    if (stats.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${stats.warnings.length}):`);
      stats.warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`));
      if (stats.warnings.length > 10) {
        console.log(`  ... and ${stats.warnings.length - 10} more`);
      }
    }

    // Database records created (mocked)
    console.log('\n=== MOCK DATABASE RECORDS CREATED ===');
    console.log(`Transactions: ${mockClient._created.transactions.length}`);
    console.log(`Completed Transactions: ${mockClient._created.completedTransactions.length}`);
    console.log(`Dividends: ${mockClient._created.dividends.length}`);
    console.log(`Import Histories: ${mockClient._created.importHistories.length}`);

    // Sample completed transactions
    if (mockClient._created.completedTransactions.length > 0) {
      console.log('\n=== SAMPLE COMPLETED TRANSACTIONS (Top 5) ===');
      mockClient._created.completedTransactions.slice(0, 5).forEach((ct, idx) => {
        console.log(`${idx + 1}. ${ct.symbol}: ${ct.buyShares} shares`);
        console.log(`   Buy: ${ct.buyDate} @ $${ct.buyPrice}`);
        console.log(`   Sell: ${ct.sellDate} @ $${ct.sellPrice}`);
        console.log(`   Gain/Loss: $${ct.realizedGainLoss.toFixed(2)} (${ct.isLongTerm ? 'Long-term' : 'Short-term'})`);
        console.log(`   Holding period: ${ct.holdingPeriodDays} days`);
      });
    }

    // Group completed transactions by symbol
    const bySymbol: Record<string, any[]> = {};
    mockClient._created.completedTransactions.forEach(ct => {
      if (!bySymbol[ct.symbol]) bySymbol[ct.symbol] = [];
      bySymbol[ct.symbol].push(ct);
    });

    console.log('\n=== COMPLETED TRANSACTIONS BY SYMBOL (Top 10) ===');
    const symbols = Object.keys(bySymbol).sort((a, b) => bySymbol[b].length - bySymbol[a].length);
    symbols.slice(0, 10).forEach(symbol => {
      const txns = bySymbol[symbol];
      const totalGainLoss = txns.reduce((sum, t) => sum + t.realizedGainLoss, 0);
      console.log(`${symbol}: ${txns.length} transactions, $${totalGainLoss.toFixed(2)} total gain/loss`);
    });

    // Group by tax year
    const byTaxYear: Record<number, any[]> = {};
    mockClient._created.completedTransactions.forEach(ct => {
      if (!byTaxYear[ct.taxYear]) byTaxYear[ct.taxYear] = [];
      byTaxYear[ct.taxYear].push(ct);
    });

    console.log('\n=== COMPLETED TRANSACTIONS BY TAX YEAR ===');
    Object.keys(byTaxYear).sort().forEach(year => {
      const txns = byTaxYear[Number(year)];
      const shortTerm = txns.filter(t => !t.isLongTerm);
      const longTerm = txns.filter(t => t.isLongTerm);
      const totalGainLoss = txns.reduce((sum, t) => sum + t.realizedGainLoss, 0);
      const stGainLoss = shortTerm.reduce((sum, t) => sum + t.realizedGainLoss, 0);
      const ltGainLoss = longTerm.reduce((sum, t) => sum + t.realizedGainLoss, 0);

      console.log(`${year}: ${txns.length} transactions, $${totalGainLoss.toFixed(2)} total`);
      console.log(`  Short-term (${shortTerm.length}): $${stGainLoss.toFixed(2)}`);
      console.log(`  Long-term (${longTerm.length}): $${ltGainLoss.toFixed(2)}`);
    });

    // Dividend summary
    console.log('\n=== DIVIDEND SUMMARY ===');
    const totalDividends = mockClient._created.dividends.reduce((sum, d) => sum + d.totalDividend, 0);
    const reinvestedCount = mockClient._created.dividends.filter(d => d.isReinvested).length;
    const cashCount = mockClient._created.dividends.length - reinvestedCount;

    console.log(`Total dividends: ${mockClient._created.dividends.length}`);
    console.log(`  Reinvested: ${reinvestedCount}`);
    console.log(`  Cash: ${cashCount}`);
    console.log(`Total amount: $${totalDividends.toFixed(2)}`);

    // Progress tracking
    console.log('\n=== PROGRESS TRACKING ===');
    console.log(`Total progress updates: ${progressUpdates.length}`);
    const stages = [...new Set(progressUpdates.map(p => p.stage))];
    console.log(`Stages completed: ${stages.join(', ')}`);

    console.log('\n✅ Import test completed successfully!');

  } catch (error) {
    console.error('\n❌ Import test failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run test
testVanguardImport();
