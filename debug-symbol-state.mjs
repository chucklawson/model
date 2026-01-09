// Track symbol state as parser scans through PDF
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

    // Simulate parser logic
    let currentAccount = null;
    let currentSymbol = null;

    console.log('=== Tracking symbol state for lines 10-210 ===\n');

    for (let i = 10; i <= 210; i++) {
      const line = lines[i];

      // Update current account
      const accountMatch = line.match(/Brokerage Account\s*—\s*(\d{8})/);
      if (accountMatch) {
        currentAccount = accountMatch[1];
        currentSymbol = null;
        console.log(`[${i}] ACCOUNT CHANGE: ${currentAccount}`);
        continue;
      }

      // Update current symbol
      const symbolMatch = line.trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
      if (symbolMatch && currentAccount) {
        const symbol = symbolMatch[1];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nameCandidate = lines[j].trim();
          if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
            currentSymbol = { symbol, name: nameCandidate };
            console.log(`[${i}] SYMBOL CHANGE: ${symbol} (${nameCandidate})`);
            break;
          }
        }
      }

      // Check for "Hide lot details"
      if (line.includes('Hide lot details')) {
        console.log(`[${i}] >>> HIDE LOT DETAILS - Current symbol: ${currentSymbol ? currentSymbol.symbol : 'NONE'}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
