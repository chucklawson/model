import { parseVanguardPdf } from './src/utils/vanguardPdfParser.ts';

async function debug() {
  try {
    const result = await parseVanguardPdf('D:\\Market\\VanguardTransactions\\customActivityReport (7).pdf');

    console.log('Account Number:', result.accountNumber);
    console.log('Transactions found:', result.transactions.length);

    // Show first 5 transactions
    console.log('\n=== First 5 Transactions ===');
    for (let i = 0; i < Math.min(5, result.transactions.length); i++) {
      console.log(`\nTransaction ${i + 1}:`);
      console.log(JSON.stringify(result.transactions[i], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debug();
