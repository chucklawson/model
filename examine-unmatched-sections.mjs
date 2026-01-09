// Examine the 3 unmatched lot sections
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function examine() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  const unmatchedLines = [1494, 2269, 2332];

  console.log('=== Examining unmatched lot sections ===\n');

  for (const lineNum of unmatchedLines) {
    console.log(`\n========== Line ${lineNum} ==========`);
    console.log(`Context (lines ${lineNum - 20} to ${lineNum + 10}):\n`);

    // Look backward for symbols
    const nearbySymbols = [];
    for (let i = Math.max(0, lineNum - 100); i < lineNum; i++) {
      const symbolMatch = lines[i].trim().match(/^([A-Z]{2,5})\s*$/);
      if (symbolMatch && i + 2 < lines.length) {
        const name = lines[i + 1].trim();
        const summaryLine = lines[i + 2];
        const qtyMatch = summaryLine.match(/^([\d,.]+)\s+\$/);
        if (qtyMatch) {
          const expectedQty = parseFloat(qtyMatch[1].replace(/,/g, ''));
          nearbySymbols.push({ line: i, symbol: symbolMatch[1], expectedQty });
        }
      }
    }

    for (let i = lineNum - 20; i <= lineNum + 10; i++) {
      const marker = i === lineNum ? '>>> ' : '    ';
      console.log(`${marker}[${i}] "${lines[i].substring(0, 80)}"`);
    }

    console.log(`\nNearby symbols (last 50 lines before this section):`);
    nearbySymbols.slice(-5).forEach(s => {
      console.log(`  [${s.line}] ${s.symbol}: ${s.expectedQty} shares`);
    });
  }
}

examine();
