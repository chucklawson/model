// Debug why parser stops at lot 9 instead of lot 14
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

    console.log('=== Simulating parser from line 19 "Hide lot details" ===\n');

    let j = 20; // Start after "Hide lot details" at line 19
    let lotNum = 0;

    while (j + 2 < lines.length) {
      const line1 = lines[j];

      // Skip wash sale adjustment lines
      if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
        console.log(`\n[${j}] SKIPPING wash sale adjustment: "${line1.substring(0, 60)}"`);
        j++;
        continue;
      }

      const line2 = lines[j + 1];
      const line3 = lines[j + 2];
      const line4 = j + 3 < lines.length ? lines[j + 3] : null;

      console.log(`\n[${j}] Checking: "${line1.substring(0, 60)}"`);

      // Check if line1 starts with a date
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
        console.log(`  -> NOT a date line, STOPPING`);
        console.log(`  Total lots found: ${lotNum}`);
        break;
      }

      console.log(`  -> IS a date line`);

      // Check if line3 or line4 has quantity
      const line3StartsWithQty = /^[\d.]+\s+/.test(line3.trim());
      const line4StartsWithQty = line4 && /^[\d.]+\s+/.test(line4.trim());

      if (line3StartsWithQty) {
        const qtyMatch = line3.match(/^([\d.]+)\s+/);
        lotNum++;
        console.log(`  -> 3-line format, Lot ${lotNum}, qty: ${qtyMatch[1]}`);
        console.log(`     Line 2: "${line2.substring(0, 60)}"`);
        console.log(`     Line 3: "${line3.substring(0, 60)}"`);
        j += 3;
      } else if (line4StartsWithQty) {
        const qtyMatch = line4.match(/^([\d.]+)\s+/);
        lotNum++;
        console.log(`  -> 4-line format, Lot ${lotNum}, qty: ${qtyMatch[1]}`);
        j += 4;
      } else {
        console.log(`  -> No quantity found in line 3 or 4, treating as 3-line and moving on`);
        j += 3;
      }

      if (lotNum >= 15) {
        console.log(`\nReached 15 lots, stopping debug`);
        break;
      }
    }

    console.log(`\n\nFinal: Parsed ${lotNum} lots, stopped at line ${j}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
