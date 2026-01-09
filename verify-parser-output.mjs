// Verify what the parser is actually outputting
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function testParser() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    const buffer = await readFile(pdfPath);

    // Use the updated test parser logic
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    const text = result.text;
    await parser.destroy();

    const lines = text.split('\n');

    console.log('=== Parsing with quantity-matching logic ===\n');

    // Track symbols and their expected quantities
    const symbols = [];

    for (let i = 0; i < 200; i++) {
      const line = lines[i].trim();
      const symbolMatch = line.match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);

      if (symbolMatch && i + 2 < lines.length) {
        const symbol = symbolMatch[1];
        const nameCandidate = lines[i + 1].trim();
        const summaryLine = lines[i + 2];

        if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5) {
          const qtyMatch = summaryLine.match(/^([\d,.]+)\s+\$/);
          if (qtyMatch) {
            const expectedQty = parseFloat(qtyMatch[1].replace(/,/g, ''));
            symbols.push({ line: i, symbol, name: nameCandidate, expectedQty });
            console.log(`Found ${symbol} at line ${i}: expected ${expectedQty} shares`);
          }
        }
      }
    }

    console.log(`\n=== Found ${symbols.length} symbols ===\n`);

    // Now find "Hide lot details" sections and match them
    for (let i = 0; i < 200; i++) {
      if (lines[i].includes('Hide lot details')) {
        console.log(`\n"Hide lot details" at line ${i}`);

        // Parse lots after this marker
        let j = i + 1;
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        const lots = [];
        let totalQty = 0;

        while (j + 2 < lines.length) {
          const line1 = lines[j];

          // Skip wash sale adjustment lines
          if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
            j++;
            continue;
          }

          if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
            break;
          }

          // Get quantity from line 3 or 4
          const line3 = lines[j + 2];
          const line4 = j + 3 < lines.length ? lines[j + 3] : null;

          let qtyLine = line3;
          if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
            qtyLine = line4;
            j += 4;
          } else {
            j += 3;
          }

          const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
          if (qtyMatch) {
            const qty = parseFloat(qtyMatch[1]);
            totalQty += qty;
            lots.push(qty);
          }
        }

        console.log(`  Parsed ${lots.length} lots, total quantity: ${totalQty.toFixed(4)}`);

        // Match against symbols
        let matched = false;
        for (const sym of symbols) {
          if (Math.abs(sym.expectedQty - totalQty) < 0.01) {
            console.log(`  >>> MATCHED to ${sym.symbol} (${sym.name})`);
            matched = true;
            break;
          }
        }

        if (!matched) {
          console.log(`  >>> NO MATCH FOUND`);
          console.log(`  Nearby symbols:`);
          symbols.forEach(s => {
            if (s.line < i && i - s.line < 50) {
              console.log(`    ${s.symbol}: ${s.expectedQty} shares (line ${s.line}, diff: ${Math.abs(s.expectedQty - totalQty).toFixed(4)})`);
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testParser();
