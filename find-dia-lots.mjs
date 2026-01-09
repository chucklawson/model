// Find where DIA's 18.097 shares worth of lots are
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

    console.log('DIA summary shows: 18.0970 shares (line 18)');
    console.log('\nSearching for "Hide lot details" sections that might contain DIA lots...\n');

    // Search ALL "Hide lot details" markers
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Hide lot details')) {
        // Parse lots
        let j = i + 1;
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        let totalQty = 0;
        let lotCount = 0;

        while (j + 2 < lines.length) {
          const line1 = lines[j];

          // Skip wash sale adjustments
          if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
            j++;
            continue;
          }

          if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
            break;
          }

          const line3 = lines[j + 2];
          const line4 = j + 3 < lines.length ? lines[j + 3] : null;

          let qtyLine = line3;
          let usedLines = 3;
          if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
            qtyLine = line4;
            usedLines = 4;
          }

          const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
          if (qtyMatch) {
            totalQty += parseFloat(qtyMatch[1]);
            lotCount++;
          }

          j += usedLines;
        }

        if (lotCount > 0) {
          console.log(`Line ${i}: ${lotCount} lots, ${totalQty.toFixed(4)} shares`);

          // Check if this matches DIA
          if (Math.abs(totalQty - 18.097) < 0.01) {
            console.log(`  >>> MATCHES DIA (18.0970 shares) <<<\n`);
            // Show first few lots
            console.log(`  First 3 lots:`);
            let k = i + 1;
            while (k < lines.length && (
              lines[k].includes('wash sale') ||
              lines[k].includes('disallowed') ||
              lines[k].includes('More information')
            )) {
              k++;
            }
            for (let m = 0; m < 3 && k < lines.length; m++) {
              const dateMatch = lines[k].match(/^(\d{1,2}\/\d{1,2}\/\d{4})/);
              if (dateMatch) {
                console.log(`    ${m + 1}. ${lines[k].substring(0, 60)}`);
                k += 3; // Assume 3-line format for display
              } else {
                break;
              }
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
