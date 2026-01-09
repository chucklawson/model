// Test the parser with built-in validation
import { readFile } from 'fs/promises';
import { parseVanguardRealizedGainsPdf } from './src/utils/vanguardRealizedGainsParser.js';

async function testParser() {
  try {
    console.log('=== Testing Vanguard Realized Gains Parser with Validation ===\n');

    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    const buffer = await readFile(pdfPath);
    const file = new File([buffer], 'test.pdf', { type: 'application/pdf' });

    console.log('Parsing PDF...\n');
    const result = await parseVanguardRealizedGainsPdf(file);

    console.log(`Total lots parsed: ${result.lots.length}`);
    console.log(`Accounts found: ${result.accountNumbers.join(', ')}\n`);

    // Display validation results
    const { validation } = result;
    console.log('=== VALIDATION SUMMARY ===\n');
    console.log(`Total symbols found: ${validation.totalSymbols}`);
    console.log(`✓ Matched (exact):   ${validation.matchedSymbols}`);
    console.log(`✗ Mismatched:        ${validation.mismatchedSymbols}`);
    console.log(`⚠ Missing (no lots): ${validation.missingSymbols}\n`);

    // Show key symbols (BRK-B, DIA, QQQ)
    console.log('=== KEY SYMBOLS ===\n');
    const keySymbols = ['BRK B', 'DIA', 'QQQ'];
    validation.symbolSummaries
      .filter(s => keySymbols.includes(s.symbol))
      .forEach(s => {
        const status = s.isMatch ? '✓ MATCH' : '✗ MISMATCH';
        console.log(`${s.symbol}:`);
        console.log(`  Expected: ${s.expectedQuantity.toFixed(4)} shares`);
        console.log(`  Actual:   ${s.actualQuantity.toFixed(4)} shares`);
        console.log(`  Lots:     ${s.lotCount}`);
        console.log(`  Status:   ${status}`);
        if (!s.isMatch) {
          console.log(`  Diff:     ${s.difference.toFixed(4)} shares`);
        }
        console.log('');
      });

    // Show all mismatches
    if (validation.mismatchedSymbols > 0) {
      console.log('\n=== MISMATCHED SYMBOLS ===\n');
      validation.symbolSummaries
        .filter(s => !s.isMatch && s.actualQuantity > 0)
        .forEach(s => {
          console.log(`${s.symbol}: Expected ${s.expectedQuantity.toFixed(4)}, Got ${s.actualQuantity.toFixed(4)} (diff: ${s.difference.toFixed(4)})`);
        });
    }

    // Show missing symbols
    if (validation.missingSymbols > 0) {
      console.log('\n=== MISSING SYMBOLS (No lots found) ===\n');
      validation.symbolSummaries
        .filter(s => s.actualQuantity === 0)
        .forEach(s => {
          console.log(`${s.symbol}: Expected ${s.expectedQuantity.toFixed(4)} shares`);
        });
    }

    // Final status
    console.log('\n=== OVERALL STATUS ===\n');
    if (validation.missingSymbols === 0 && validation.mismatchedSymbols === 0) {
      console.log('✓ ALL SYMBOLS MATCHED PERFECTLY!');
      console.log(`  ${validation.matchedSymbols}/${validation.totalSymbols} symbols have exact quantity matches`);
    } else {
      console.log('⚠ SOME ISSUES DETECTED:');
      if (validation.missingSymbols > 0) {
        console.log(`  ${validation.missingSymbols} symbols have no lots`);
      }
      if (validation.mismatchedSymbols > 0) {
        console.log(`  ${validation.mismatchedSymbols} symbols have quantity mismatches`);
      }
      console.log(`  ${validation.matchedSymbols}/${validation.totalSymbols} symbols match correctly`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testParser();
