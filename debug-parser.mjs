import { parseVanguardPdf } from './src/utils/vanguardPdfParser.ts';

async function debug() {
  try {
    const result = await parseVanguardPdf('D:\\Market\\VanguardTransactions\\customActivityReport (6).pdf');

    console.log('Account Number:', result.accountNumber);
    console.log('Transactions found:', result.transactions.length);

    if (result.transactions.length > 0) {
      console.log('\n=== First Transaction ===');
      console.log(JSON.stringify(result.transactions[0], null, 2));
    } else {
      console.log('\nNo transactions were parsed!');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debug();
