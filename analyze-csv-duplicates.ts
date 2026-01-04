// Analyze CSV for internal duplicates
import { readFileSync } from 'fs';
import { parseVanguardCSV } from './src/utils/vanguardCsvParser';

const filePath = 'D:\\Market\\VanguardTransactions\\OfxDownload.csv';

function generateTransactionId(txn: any): string {
  // Convert principalAmount to fixed decimal string, handle undefined
  const principalAmt = txn.principalAmount !== undefined
    ? txn.principalAmount.toFixed(2)
    : 'undefined';

  return `${txn.accountNumber}-${txn.tradeDate}-${txn.symbol}-${txn.transactionType}-${txn.shares}-${principalAmt}`;
}

async function analyzeDuplicates() {
  try {
    console.log('=== CSV DUPLICATE ANALYSIS ===\n');

    // Read and parse CSV
    const csvContent = readFileSync(filePath, 'utf-8');
    const parsed = await parseVanguardCSV(csvContent);

    console.log(`Total transactions in CSV: ${parsed.transactions.length}`);
    console.log(`Total holdings in CSV: ${parsed.holdings.length}\n`);

    // Check for duplicates within transactions
    const seen = new Map<string, number>();
    const duplicates: Array<{ txnId: string; count: number; firstOccurrence: any }> = [];

    parsed.transactions.forEach((txn, _index) => {
      const txnId = generateTransactionId(txn);

      if (seen.has(txnId)) {
        const count = seen.get(txnId)! + 1;
        seen.set(txnId, count);

        // Track this duplicate
        const existing = duplicates.find(d => d.txnId === txnId);
        if (existing) {
          existing.count = count;
        } else {
          duplicates.push({
            txnId,
            count,
            firstOccurrence: txn
          });
        }
      } else {
        seen.set(txnId, 1);
      }
    });

    const uniqueCount = seen.size;
    const duplicateCount = parsed.transactions.length - uniqueCount;

    console.log('=== TRANSACTION DEDUPLICATION ===');
    console.log(`Unique transactions: ${uniqueCount}`);
    console.log(`Duplicate transactions: ${duplicateCount}`);
    console.log(`Total CSV rows: ${parsed.transactions.length}\n`);

    if (duplicates.length > 0) {
      console.log(`=== DUPLICATE DETAILS (${duplicates.length} unique duplicated transactions) ===`);
      duplicates.slice(0, 20).forEach(dup => {
        const txn = dup.firstOccurrence;
        console.log(`${txn.symbol} | ${txn.tradeDate} | ${txn.transactionType} | ${txn.shares} shares`);
        console.log(`  Appears ${dup.count} times in CSV`);
      });

      if (duplicates.length > 20) {
        console.log(`  ... and ${duplicates.length - 20} more duplicated transactions`);
      }
    }

    // Analyze matches from unique transactions
    const uniqueTransactions = Array.from(seen.keys()).map(txnId => {
      return parsed.transactions.find(t => generateTransactionId(t) === txnId)!;
    });

    // Count buy/sell transactions
    const buys = uniqueTransactions.filter(t =>
      t.transactionType === 'Buy' || (t.shares > 0 && t.transactionType !== 'Dividend')
    );
    const sells = uniqueTransactions.filter(t =>
      t.transactionType === 'Sell' || (t.shares < 0 && !t.transactionDescription.includes('Dividend'))
    );
    const dividends = uniqueTransactions.filter(t =>
      t.transactionType === 'Dividend' || t.transactionDescription.includes('Dividend')
    );

    console.log('\n=== TRANSACTION BREAKDOWN (After Deduplication) ===');
    console.log(`Buy transactions: ${buys.length}`);
    console.log(`Sell transactions: ${sells.length}`);
    console.log(`Dividend transactions: ${dividends.length}`);
    console.log(`Other: ${uniqueTransactions.length - buys.length - sells.length - dividends.length}`);

  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

analyzeDuplicates();
