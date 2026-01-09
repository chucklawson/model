// Analyze the interleaved symbols and figure out which lots belong to which symbol
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

    console.log('=== Analyzing lines 13-70 (BRK B and DIA section) ===\n');

    // Show the structure with lot parsing
    for (let i = 13; i <= 70; i++) {
      const line = lines[i];
      let label = '';

      if (line.trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
        label = '<<< SYMBOL';
      } else if (line.includes('Hide lot details')) {
        label = '<<< MARKER';
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim()) && line.includes('\t')) {
        // This is a lot data line - try to parse it
        const parts = line.split('\t');
        if (parts.length >= 2) {
          const dateAndEvent = parts[0].trim();
          label = '<<< LOT DATA';
        }
      }

      console.log(`[${String(i).padStart(3)}] ${label.padEnd(15)} "${line.substring(0, 80)}"`);
    }

    // Now let's count: how many lots are there before the next symbol?
    console.log('\n\n=== Counting lots between BRK B and next clear symbol boundary ===\n');

    // According to the user, there should be 13 BRK B lots
    // Let's see if we can identify them

    // The summary line at 15 says "60.0000" shares total
    // Let's add up the quantities in the lot lines to see which ones sum to ~60

    let totalQuantity = 0;
    let lotCount = 0;

    for (let i = 20; i <= 63; i += 3) {
      if (i + 2 >= lines.length) break;

      const line1 = lines[i];
      const line2 = lines[i + 1];
      const line3 = lines[i + 2];

      if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
        break;
      }

      // Parse quantity from line3
      const parts3 = line3.split('\t');
      if (parts3.length > 0) {
        const amountsPart = parts3[0].trim();
        const match = amountsPart.match(/^([\d.]+)\s+/);
        if (match) {
          const qty = parseFloat(match[1]);
          totalQuantity += qty;
          lotCount++;
          console.log(`Lot ${lotCount} at line ${i}: quantity ${match[1]}, cumulative: ${totalQuantity}`);
        }
      }
    }

    console.log(`\nTotal lots found: ${lotCount}`);
    console.log(`Total quantity: ${totalQuantity}`);
    console.log(`BRK B summary line shows: 60.0000`);
    console.log(`Match: ${Math.abs(totalQuantity - 60) < 0.01 ? 'YES - these are BRK B lots!' : 'NO - these might be DIA lots'}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
