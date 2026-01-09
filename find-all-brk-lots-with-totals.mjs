// Find all BRK B sections and count total lots + quantity
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

    console.log('=== Finding ALL BRK B sections and their lots ===\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === 'BRK B') {
        console.log(`\n=== BRK B found at line ${i} ===`);

        // Show summary line
        if (i + 2 < lines.length) {
          const summaryMatch = lines[i + 2].match(/([\d.]+)\s+\$/);
          if (summaryMatch) {
            console.log(`Summary shows: ${summaryMatch[1]} shares`);
          }
        }

        // Count lots in the next 100 lines (or until we hit another clear symbol)
        let lotCount = 0;
        let totalQty = 0;
        const lotDetails = [];

        for (let j = i + 1; j < Math.min(i + 150, lines.length); j++) {
          const line = lines[j];

          // Stop if we hit a clear section break
          if (line.includes('Date acquired') && line.includes('Event')) {
            console.log(`Section break at line ${j}`);
            break;
          }

          // Check for lot data
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim()) && line.includes('\t')) {
            // This is likely lot data - check next 3 lines for quantity
            if (j + 2 < lines.length) {
              const line3 = lines[j + 2];
              const qtyMatch = line3.match(/^([\d.]+)\s+/);
              if (qtyMatch) {
                const qty = parseFloat(qtyMatch[1]);
                lotCount++;
                totalQty += qty;
                lotDetails.push({ line: j, date: line.substring(0, 10), qty });
              }
            }
          }
        }

        console.log(`\nFound ${lotCount} lots`);
        console.log(`Total quantity: ${totalQty.toFixed(4)} shares`);

        if (lotDetails.length > 0 && lotDetails.length <= 15) {
          console.log(`\nLot details:`);
          lotDetails.forEach((lot, idx) => {
            console.log(`  ${idx + 1}. Line ${lot.line}: ${lot.date} - ${lot.qty} shares`);
          });
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
