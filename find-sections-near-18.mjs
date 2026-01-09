// Find all lot sections with quantities near 18.097
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findSections() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Searching for lot sections with ~18 shares ===\n');
  console.log('Target: 18.0970 shares for DIA\n');

  const targetQty = 18.097;
  const tolerance = 1.0; // Search within 1 share

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Hide lot details')) {
      let j = i + 1;

      // Skip warnings
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

      // Check if this section is close to target
      const diff = Math.abs(totalQty - targetQty);
      if (diff < tolerance && lotCount > 0) {
        console.log(`Line ${i}: ${lotCount} lots, ${totalQty.toFixed(4)} shares (diff: ${diff.toFixed(4)})`);

        // Show nearby symbols
        console.log('  Nearby symbols:');
        for (let k = Math.max(0, i - 50); k < i; k++) {
          const symMatch = lines[k].trim().match(/^([A-Z]{2,5})\s*$/);
          if (symMatch && k + 2 < lines.length) {
            const name = lines[k + 1].trim();
            const summary = lines[k + 2];
            const qtyMatch = summary.match(/^([\d,.]+)\s+\$/);
            if (qtyMatch) {
              const expectedQty = parseFloat(qtyMatch[1].replace(/,/g, ''));
              console.log(`    [${k}] ${symMatch[1]}: ${expectedQty} shares`);
            }
          }
        }
        console.log('');
      }
    }
  }
}

findSections();
