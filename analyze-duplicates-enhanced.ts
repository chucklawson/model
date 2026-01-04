// Enhanced Duplicate Analysis - Shows ALL fields for transactions with same key
import { readFileSync } from 'fs';
import { parseVanguardCSV } from './src/utils/vanguardCsvParser';
import type { VanguardTransaction } from './src/types';

const filePath = 'D:\\Market\\VanguardTransactions\\OfxDownload.csv';

// Current key generation (same as production code)
function generateTransactionId(txn: VanguardTransaction): string {
  // Convert principalAmount to fixed decimal string, handle undefined
  const principalAmt = txn.principalAmount !== undefined
    ? txn.principalAmount.toFixed(2)
    : 'undefined';

  return `${txn.accountNumber}-${txn.tradeDate}-${txn.symbol}-${txn.transactionType}-${txn.shares}-${principalAmt}`;
}

// Format currency values
function formatCurrency(value: number | undefined): string {
  if (value === undefined) return 'N/A';
  return `$${value.toFixed(2)}`;
}

// Format field value for display
function formatField(value: any): string {
  if (value === undefined || value === null) return 'N/A';
  if (typeof value === 'number') return value.toString();
  return value.toString();
}

async function analyzeEnhanced() {
  try {
    console.log('=== ENHANCED DUPLICATE ANALYSIS ===\n');

    // Read and parse CSV
    const csvContent = readFileSync(filePath, 'utf-8');
    const parsed = parseVanguardCSV(csvContent);

    console.log(`Total transactions in CSV: ${parsed.transactions.length}`);
    console.log(`Total holdings in CSV: ${parsed.holdings.length}\n`);

    // Group transactions by generated key
    const keyGroups = new Map<string, VanguardTransaction[]>();

    parsed.transactions.forEach(txn => {
      const txnId = generateTransactionId(txn);

      if (!keyGroups.has(txnId)) {
        keyGroups.set(txnId, []);
      }
      keyGroups.get(txnId)!.push(txn);
    });

    // Find keys with multiple transactions (potential false duplicates)
    const duplicateKeys = Array.from(keyGroups.entries())
      .filter(([_, transactions]) => transactions.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // Sort by most duplicates first

    console.log('=== SUMMARY ===');
    console.log(`Unique keys: ${keyGroups.size}`);
    console.log(`Keys with multiple transactions: ${duplicateKeys.length}`);
    console.log(`Total "duplicate" transactions: ${duplicateKeys.reduce((sum, [_, txns]) => sum + txns.length, 0)}`);
    console.log(`Unique transactions: ${keyGroups.size}\n`);

    if (duplicateKeys.length === 0) {
      console.log('✅ No duplicate keys found! Current key generation is working correctly.\n');
      return;
    }

    console.log('=== DETAILED COMPARISON OF "DUPLICATES" ===\n');
    console.log('Showing transactions that share the same key but may actually be different:\n');

    // Show detailed comparison for first 10 duplicate groups
    const showCount = Math.min(10, duplicateKeys.length);

    for (let i = 0; i < showCount; i++) {
      const [key, transactions] = duplicateKeys[i];

      console.log(`\n${'='.repeat(80)}`);
      console.log(`DUPLICATE GROUP ${i + 1}/${showCount}`);
      console.log(`Key: ${key}`);
      console.log(`Count: ${transactions.length} transactions with identical key`);
      console.log(`${'='.repeat(80)}\n`);

      // Show each transaction in this group
      transactions.forEach((txn, idx) => {
        console.log(`--- Transaction ${idx + 1}/${transactions.length} ---`);
        console.log(`Account Number:     ${txn.accountNumber}`);
        console.log(`Trade Date:         ${txn.tradeDate}`);
        console.log(`Settlement Date:    ${formatField(txn.settlementDate)}`);
        console.log(`Transaction Type:   ${txn.transactionType}`);
        console.log(`Symbol:             ${txn.symbol}`);
        console.log(`Shares:             ${txn.shares}`);
        console.log(`Share Price:        ${formatCurrency(txn.sharePrice)}`);
        console.log(`Principal Amount:   ${formatCurrency(txn.principalAmount)}`);
        console.log(`Net Amount:         ${formatCurrency(txn.netAmount)}`);
        console.log(`Commissions/Fees:   ${formatCurrency(txn.commissionsAndFees)}`);
        console.log(`Accrued Interest:   ${formatCurrency(txn.accruedInterest)}`);
        console.log(`Description:        ${formatField(txn.transactionDescription)}`);
        console.log(`Investment Name:    ${formatField(txn.investmentName)}`);
        console.log(`Account Type:       ${formatField(txn.accountType)}\n`);
      });

      // Analyze differences
      console.log('🔍 FIELD COMPARISON:');
      const fields = [
        'settlementDate',
        'sharePrice',
        'principalAmount',
        'netAmount',
        'commissionsAndFees',
        'accruedInterest',
        'transactionDescription',
        'investmentName',
        'accountType'
      ];

      const differences: string[] = [];

      fields.forEach(field => {
        const values = transactions.map(t => (t as any)[field]);
        const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))];

        if (uniqueValues.length > 1) {
          differences.push(`  ❌ ${field}: Has ${uniqueValues.length} different values`);
          uniqueValues.forEach(val => {
            const count = values.filter(v => JSON.stringify(v) === val).length;
            console.log(`     - ${val} (${count} occurrence${count > 1 ? 's' : ''})`);
          });
        } else {
          differences.push(`  ✅ ${field}: Identical across all transactions`);
        }
      });

      console.log('\n📊 VERDICT:');
      const hasAnyDifference = differences.some(d => d.includes('❌'));

      if (hasAnyDifference) {
        console.log('🚨 FALSE DUPLICATE DETECTED!');
        console.log('These transactions have the same key but different field values.');
        console.log('They should NOT be treated as duplicates.\n');
        differences.filter(d => d.includes('❌')).forEach(d => console.log(d));
      } else {
        console.log('✅ TRUE DUPLICATE - All fields are identical');
      }
    }

    if (duplicateKeys.length > showCount) {
      console.log(`\n... and ${duplicateKeys.length - showCount} more duplicate groups not shown.`);
    }

    // Summary of findings
    console.log(`\n${'='.repeat(80)}`);
    console.log('SUMMARY OF FINDINGS');
    console.log(`${'='.repeat(80)}\n`);

    let trueDuplicates = 0;
    let falseDuplicates = 0;

    duplicateKeys.forEach(([_, transactions]) => {
      const fields = ['settlementDate', 'sharePrice', 'principalAmount', 'netAmount',
                     'commissionsAndFees', 'transactionDescription'];

      let hasAnyDifference = false;
      fields.forEach(field => {
        const values = transactions.map(t => (t as any)[field]);
        const uniqueValues = [...new Set(values.map(v => JSON.stringify(v)))];
        if (uniqueValues.length > 1) {
          hasAnyDifference = true;
        }
      });

      if (hasAnyDifference) {
        falseDuplicates += transactions.length;
      } else {
        trueDuplicates += transactions.length;
      }
    });

    console.log(`True Duplicates (identical in all fields): ${trueDuplicates}`);
    console.log(`False Duplicates (different fields, same key): ${falseDuplicates}`);
    console.log(`\nRECOMMENDATION:`);

    if (falseDuplicates > 0) {
      console.log('❌ Current key generation is INSUFFICIENT!');
      console.log('Add additional fields to generateTransactionId() to ensure uniqueness.');
      console.log('\nSuggested fields to add:');
      console.log('  - sharePrice (different prices = different transactions)');
      console.log('  - principalAmount or netAmount (different amounts = different transactions)');
      console.log('  - settlementDate (if varies for same trade date)');
    } else {
      console.log('✅ Current key generation appears correct (only true duplicates found)');
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

analyzeEnhanced();
