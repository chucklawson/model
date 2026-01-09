// Find where missing symbols (DIA, AVGO, BLK, etc.) appear in PDF
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findMissing() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  // Symbols with 0 lots that we need to find
  const missingSymbols = ['DIA', 'AVGO', 'BLK', 'CRM', 'DELL', 'MSFT', 'NVDA', 'ORCL'];

  console.log('=== Searching for missing symbols ===\n');

  for (const symbol of missingSymbols) {
    console.log(`\n========== ${symbol} ==========`);

    let found = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === symbol || line.startsWith(`${symbol} `)) {
        found = true;
        console.log(`Found at line ${i}`);
        console.log(`Context (${i} to ${i + 20}):\n`);

        for (let j = i; j <= Math.min(i + 20, lines.length - 1); j++) {
          const marker = j === i ? '>>> ' : '    ';
          console.log(`${marker}[${j}] "${lines[j].substring(0, 80)}"`);
        }

        // Check for lot indicators
        let hasHideMarker = false;
        let hasDirectLots = false;

        for (let j = i + 1; j <= Math.min(i + 30, lines.length - 1); j++) {
          if (lines[j].includes('Hide lot details')) {
            hasHideMarker = true;
            console.log(`\n    >>> "Hide lot details" at line ${j}`);
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim()) && lines[j].includes('\t')) {
            if (!hasDirectLots) {
              hasDirectLots = true;
              console.log(`    >>> Direct lot data at line ${j}: "${lines[j].substring(0, 60)}"`);
            }
          }
        }

        if (!hasHideMarker && !hasDirectLots) {
          console.log(`    >>> NO lot details found (summary only?)`);
        }

        break; // Only show first occurrence
      }
    }

    if (!found) {
      console.log(`NOT FOUND in PDF`);
    }
  }
}

findMissing();
