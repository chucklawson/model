// Debug why only 9 lots are parsed when there are 97 "Hide lot details" markers
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function debugPdf() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    const buffer = await readFile(pdfPath);
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    const text = result.text;
    await parser.destroy();

    const lines = text.split('\n');

    // Track current account and symbol as we scan through the PDF
    let currentAccount = null;
    let currentSymbol = null;

    // Find all "Hide lot details" markers
    let successfulParses = 0;
    let failedAccount = 0;
    let failedSymbol = 0;
    let failedNoData = 0;

    for (let i = 0; i < lines.length; i++) {
      // Update current account when we encounter an account header
      const accountMatch = lines[i].match(/Brokerage Account\s*—\s*(\d{8})/);
      if (accountMatch) {
        currentAccount = accountMatch[1];
        currentSymbol = null;
        continue;
      }

      // Update current symbol when we encounter a symbol line
      const symbolMatch = lines[i].trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
      if (symbolMatch && currentAccount) {
        const symbol = symbolMatch[1];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nameCandidate = lines[j].trim();
          if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
            currentSymbol = { symbol, name: nameCandidate };
            break;
          }
        }
      }

      if (lines[i].includes('Hide lot details')) {
        const account = currentAccount;
        const symbolInfo = currentSymbol;

        if (!account) {
          failedAccount++;
          console.log(`\n[${i}] Failed to find account for "Hide lot details"`);
          console.log(`  Context (10 lines before):`);
          for (let k = Math.max(0, i - 10); k < i; k++) {
            console.log(`    [${k}] "${lines[k]}"`);
          }
          continue;
        }

        if (!symbolInfo) {
          failedSymbol++;
          console.log(`\n[${i}] Failed to find symbol for "Hide lot details" (account: ${account})`);
          console.log(`  Context (10 lines before):`);
          for (let k = Math.max(0, i - 10); k < i; k++) {
            console.log(`    [${k}] "${lines[k]}"`);
          }
          continue;
        }

        // Check if there's data after this marker
        let j = i + 1;
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        // Check if next line starts with a date
        if (j < lines.length && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
          successfulParses++;
        } else {
          failedNoData++;
          console.log(`\n[${i}] No data rows found after "Hide lot details" (account: ${account}, symbol: ${symbolInfo.symbol})`);
          console.log(`  Next 5 lines:`);
          for (let k = i + 1; k <= Math.min(i + 5, lines.length - 1); k++) {
            console.log(`    [${k}] "${lines[k]}"`);
          }
        }
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Total "Hide lot details" markers: ${successfulParses + failedAccount + failedSymbol + failedNoData}`);
    console.log(`Successful parses (has account, symbol, and data): ${successfulParses}`);
    console.log(`Failed - no account found: ${failedAccount}`);
    console.log(`Failed - no symbol found: ${failedSymbol}`);
    console.log(`Failed - no data rows after marker: ${failedNoData}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
