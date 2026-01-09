// Find all symbols and track which have lot details
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

    // Track current account and symbol
    let currentAccount = null;
    let currentSymbol = null;
    const symbolSections = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Update current account
      const accountMatch = line.match(/Brokerage Account\s*—\s*(\d{8})/);
      if (accountMatch) {
        currentAccount = accountMatch[1];
        currentSymbol = null;
        continue;
      }

      // Update current symbol
      const symbolMatch = line.trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
      if (symbolMatch && currentAccount) {
        const symbol = symbolMatch[1];
        // Look for investment name
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nameCandidate = lines[j].trim();
          if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('lot details')) {
            currentSymbol = { symbol, name: nameCandidate, line: i };

            // Check if next few lines have "Hide lot details" or "Show lot details"
            let hasLotDetails = false;
            let lotDetailsType = null;
            for (let k = i + 1; k < Math.min(i + 30, lines.length); k++) {
              if (lines[k].includes('Hide lot details')) {
                hasLotDetails = true;
                lotDetailsType = 'expanded';
                break;
              }
              if (lines[k].includes('Show lot details')) {
                hasLotDetails = true;
                lotDetailsType = 'collapsed';
                break;
              }
              // Stop if we hit another symbol
              if (lines[k].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
                break;
              }
            }

            symbolSections.push({
              account: currentAccount,
              symbol,
              name: nameCandidate,
              line: i,
              hasLotDetails,
              lotDetailsType
            });
            break;
          }
        }
      }
    }

    console.log('=== ALL SYMBOL SECTIONS ===\n');

    // Group by account
    const byAccount = {};
    symbolSections.forEach(s => {
      if (!byAccount[s.account]) byAccount[s.account] = [];
      byAccount[s.account].push(s);
    });

    Object.keys(byAccount).forEach(account => {
      console.log(`\nAccount ${account}:`);
      byAccount[account].forEach((s, idx) => {
        const marker = s.hasLotDetails ? `[${s.lotDetailsType}]` : '[NO LOT DETAILS]';
        console.log(`  ${idx + 1}. ${s.symbol.padEnd(10)} ${marker.padEnd(15)} line ${s.line}`);
      });
    });

    console.log('\n\n=== SUMMARY ===');
    console.log(`Total symbols found: ${symbolSections.length}`);
    console.log(`With expanded lot details: ${symbolSections.filter(s => s.lotDetailsType === 'expanded').length}`);
    console.log(`With collapsed lot details: ${symbolSections.filter(s => s.lotDetailsType === 'collapsed').length}`);
    console.log(`Without lot details: ${symbolSections.filter(s => !s.hasLotDetails).length}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
