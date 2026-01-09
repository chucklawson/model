// List ALL lots starting from line 13 in order with running totals
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

    console.log('=== Account 68411173 Summary ===');
    console.log('BRK B:  60.0000 shares (line 15)');
    console.log('DIA:    18.0970 shares (line 18)');
    console.log('QQQ:    33.0710 shares (line 113)');
    console.log('');
    console.log('=== Lots starting from line 20 ===\n');

    let lotNum = 0;
    let runningTotal = 0;

    for (let i = 20; i < 200; i++) {
      const line = lines[i];

      // Stop at clear section breaks
      if (line.includes('Date acquired') || line.includes('-- ') || line.includes('BROKERED')) {
        console.log(`\n>>> Section break at line ${i}: "${line.substring(0, 60)}"`);
        break;
      }

      // Check for lot data
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim()) && line.includes('\t')) {
        // Look for quantity in next 3 lines
        if (i + 2 < lines.length) {
          const line3 = lines[i + 2];
          const line4 = i + 3 < lines.length ? lines[i + 3] : '';

          // Check if line3 has quantity or if it's line4
          let qtyLine = line3;
          let usedLines = 3;

          if (!/^[\d.]+\s+/.test(line3.trim()) && /^[\d.]+\s+/.test(line4.trim())) {
            qtyLine = line4;
            usedLines = 4;
          }

          const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
          if (qtyMatch) {
            const qty = parseFloat(qtyMatch[1]);
            lotNum++;
            runningTotal += qty;

            const date = line.substring(0, 10);
            console.log(`Lot ${String(lotNum).padStart(2)}: ${date} - ${String(qty).padStart(8)} shares | Running total: ${runningTotal.toFixed(4).padStart(10)}`);

            // Check for thresholds
            if (Math.abs(runningTotal - 60) < 0.01) {
              console.log(`       ^^^ This could be the end of BRK B (60.0000 shares) ^^^`);
            }
            if (Math.abs(runningTotal - 78.097) < 0.01) {
              console.log(`       ^^^ This could be the end of BRK B + DIA (78.097 shares) ^^^`);
            }

            i += (usedLines - 1);
          }
        }
      }
    }

    console.log(`\n\nTotal lots found: ${lotNum}`);
    console.log(`Total quantity: ${runningTotal.toFixed(4)} shares`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
