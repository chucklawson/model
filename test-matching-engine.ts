// Test matching engine with real Vanguard data
import { readFileSync } from 'fs';
import { parseVanguardCSV } from './src/utils/vanguardCsvParser';
import { matchTransactions, getMatchingSummary, groupResultsBySymbol, groupResultsByTaxYear } from './src/utils/lotMatching';
import { processDividends, getDividendSummary } from './src/utils/dividendProcessor';

const filePath = 'D:\\Market\\VanguardTransactions\\OfxDownload.csv';

try {
  console.log('=== VANGUARD TRANSACTION MATCHING ENGINE TEST ===\n');

  // Parse CSV
  console.log('📄 Reading and parsing CSV...');
  const csvText = readFileSync(filePath, 'utf-8');
  const parsed = parseVanguardCSV(csvText);

  console.log(`✅ Parsed ${parsed.holdings.length} holdings and ${parsed.transactions.length} transactions\n`);

  // Match transactions with FIFO
  console.log('🔄 Matching buy/sell transactions (FIFO method)...');
  const fifoMatches = matchTransactions(parsed.transactions, 'FIFO');
  const fifoSummary = getMatchingSummary(fifoMatches);

  console.log(`\n=== FIFO MATCHING RESULTS ===`);
  console.log(`Total matches: ${fifoSummary.totalMatches}`);
  console.log(`Total shares matched: ${fifoSummary.totalShares.toFixed(3)}`);
  console.log(`Total realized gain/loss: $${fifoSummary.totalGainLoss.toFixed(2)}`);
  console.log(`  Short-term (${fifoSummary.shortTermCount} transactions): $${fifoSummary.shortTermGainLoss.toFixed(2)}`);
  console.log(`  Long-term (${fifoSummary.longTermCount} transactions): $${fifoSummary.longTermGainLoss.toFixed(2)}`);

  // Group by symbol
  const bySymbol = groupResultsBySymbol(fifoMatches);
  console.log(`\n=== BY SYMBOL (Top 10) ===`);
  const symbols = Object.keys(bySymbol).sort((a, b) => bySymbol[b].length - bySymbol[a].length);
  symbols.slice(0, 10).forEach(symbol => {
    const matches = bySymbol[symbol];
    const gainLoss = matches.reduce((sum, m) => sum + m.realizedGainLoss, 0);
    console.log(`${symbol}: ${matches.length} matches, $${gainLoss.toFixed(2)} gain/loss`);
  });

  // Group by tax year
  const byTaxYear = groupResultsByTaxYear(fifoMatches);
  console.log(`\n=== BY TAX YEAR ===`);
  Object.keys(byTaxYear).sort().forEach(year => {
    const matches = byTaxYear[Number(year)];
    const yearSummary = getMatchingSummary(matches);
    console.log(`${year}: ${matches.length} transactions, $${yearSummary.totalGainLoss.toFixed(2)} total`);
    console.log(`  ST: $${yearSummary.shortTermGainLoss.toFixed(2)}, LT: $${yearSummary.longTermGainLoss.toFixed(2)}`);
  });

  // Compare LIFO
  console.log(`\n🔄 Matching with LIFO method...`);
  const lifoMatches = matchTransactions(parsed.transactions, 'LIFO');
  const lifoSummary = getMatchingSummary(lifoMatches);

  console.log(`\n=== LIFO vs FIFO COMPARISON ===`);
  console.log(`Method | Total Gain/Loss | Short-Term | Long-Term`);
  console.log(`FIFO   | $${fifoSummary.totalGainLoss.toFixed(2).padStart(14)} | $${fifoSummary.shortTermGainLoss.toFixed(2).padStart(10)} | $${fifoSummary.longTermGainLoss.toFixed(2).padStart(9)}`);
  console.log(`LIFO   | $${lifoSummary.totalGainLoss.toFixed(2).padStart(14)} | $${lifoSummary.shortTermGainLoss.toFixed(2).padStart(10)} | $${lifoSummary.longTermGainLoss.toFixed(2).padStart(9)}`);

  const difference = lifoSummary.totalGainLoss - fifoSummary.totalGainLoss;
  console.log(`\nDifference: $${difference.toFixed(2)} (LIFO ${difference > 0 ? 'higher' : 'lower'})`);

  // Process dividends
  console.log(`\n💰 Processing dividend transactions...`);
  const dividends = processDividends(parsed.transactions);
  const divSummary = getDividendSummary(dividends);

  console.log(`\n=== DIVIDEND SUMMARY ===`);
  console.log(`Total dividends: $${divSummary.totalDividends.toFixed(2)}`);
  console.log(`  Reinvested: $${divSummary.reinvestedDividends.toFixed(2)} (${divSummary.reinvestmentCount} transactions)`);
  console.log(`  Cash: $${divSummary.cashDividends.toFixed(2)} (${divSummary.dividendCount - divSummary.reinvestmentCount} transactions)`);

  console.log(`\nTop dividend-paying symbols:`);
  const divSymbols = Object.keys(divSummary.bySymbol)
    .sort((a, b) => divSummary.bySymbol[b].totalDividends - divSummary.bySymbol[a].totalDividends);
  divSymbols.slice(0, 10).forEach(symbol => {
    const info = divSummary.bySymbol[symbol];
    console.log(`  ${symbol}: $${info.totalDividends.toFixed(2)} (${info.count} payments)`);
  });

  console.log(`\nDividends by tax year:`);
  Object.keys(divSummary.byTaxYear).sort().forEach(year => {
    const info = divSummary.byTaxYear[Number(year)];
    console.log(`  ${year}: $${info.totalDividends.toFixed(2)} (${info.count} payments)`);
  });

  console.log(`\n✅ Matching engine test completed successfully!`);

} catch (error) {
  console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  process.exit(1);
}
