// Count lots by symbol using the test parser
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import the parsing function from test script
const testScript = await readFile('./test-realized-gains-parser.mjs', 'utf-8');

// Extract and run just the parsing
const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
const buffer = await readFile(pdfPath);

console.log('Parsing PDF...');

// Run npm to execute the test script and capture output
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

try {
  const {stdout} = await execAsync('node test-realized-gains-parser.mjs');
  const lines = stdout.split('\n');

  const symbolLines = lines.filter(l => l.includes('Symbol:'));
  const symbols = {};

  symbolLines.forEach(line => {
    const match = line.match(/Symbol: ([A-Z\s]+)/);
    if (match) {
      const symbol = match[1].trim();
      symbols[symbol] = (symbols[symbol] || 0) + 1;
    }
  });

  console.log('\n=== LOT COUNTS ===');
  Object.keys(symbols).sort().forEach(s => {
    console.log(`${s.padEnd(15)} ${symbols[s]} lots`);
  });

  console.log(`\nTotal: ${symbolLines.length} lots`);

} catch (error) {
  console.error('Error:', error.message);
}
