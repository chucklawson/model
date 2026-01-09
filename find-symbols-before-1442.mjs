// Find symbols before line 1442
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findSymbols() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Symbols between lines 1300 and 1450 ===\n');

  for (let i = 1300; i < 1450; i++) {
    const line = lines[i].trim();
    const symbolMatch = line.match(/^([A-Z]{2,5})\s*$/);

    if (symbolMatch && i + 2 < lines.length) {
      const symbol = symbolMatch[1];
      const nameCandidate = lines[i + 1].trim();
      const summaryLine = lines[i + 2];

      if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5) {
        const qtyMatch = summaryLine.match(/^([\d,.]+)\s+\$/);
        if (qtyMatch) {
          const expectedQty = parseFloat(qtyMatch[1].replace(/,/g, ''));
          console.log(`[${i}] ${symbol}: ${expectedQty} shares`);
          console.log(`    Name: ${nameCandidate.substring(0, 50)}`);

          // Check for "Hide lot details"
          for (let j = i + 1; j <= Math.min(i + 50, lines.length - 1); j++) {
            if (lines[j].includes('Hide lot details')) {
              console.log(`    "Hide lot details" at line ${j} (${j - i} lines after symbol)`);
              break;
            }
          }
          console.log('');
        }
      }
    }
  }

  console.log('\n=== "Hide lot details" markers between 1300 and 1450 ===\n');
  for (let i = 1300; i < 1450; i++) {
    if (lines[i].includes('Hide lot details')) {
      console.log(`[${i}] Hide lot details`);
    }
  }
}

findSymbols();
