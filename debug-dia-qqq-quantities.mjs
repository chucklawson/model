// Debug exact quantities for DIA and QQQ
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function debug() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== DIA LOTS (starting at line 111) ===\n');
  console.log('Expected: 18.0970 shares\n');

  let k = 118; // First lot line for QQQ per earlier tests
  let totalQty = 0;
  let lotNum = 0;

  // Find where DIA lots actually are
  console.log('Lines 16-25 (DIA area):\n');
  for (let i = 16; i <= 25; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nParsing DIA direct lots starting at line 111...\n');

  // Actually the test showed DIA at line 111, let me check what's there
  console.log('Lines 111-150:\n');
  for (let i = 111; i <= 150; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;

    // Check if it's a date line
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim())) {
      console.log(`>>> [${i}] "${line}"`);

      // Try to extract quantity from this lot or next 3 lines
      for (let j = i; j <= i + 3 && j < lines.length; j++) {
        const qtyMatch = lines[j].match(/^([\d.]+)\s+\$/);
        if (qtyMatch) {
          const qty = parseFloat(qtyMatch[1]);
          lotNum++;
          totalQty += qty;
          console.log(`    Lot ${lotNum}: ${qtyMatch[1]} shares (running total: ${totalQty.toFixed(4)})`);
          break;
        }
      }
    } else if (i < 120) {
      console.log(`    [${i}] "${line.substring(0, 80)}"`);
    }
  }

  console.log(`\n\nDIA Total: ${lotNum} lots, ${totalQty.toFixed(4)} shares`);
  console.log(`Expected: 18.0970`);
  console.log(`Difference: ${Math.abs(totalQty - 18.097).toFixed(4)} shares`);

  // Now check QQQ
  console.log('\n\n=== QQQ LOTS ===\n');
  console.log('Expected: 33.0710 shares\n');

  console.log('Lines 111-120 (QQQ area):\n');
  for (let i = 111; i <= 120; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nLet me parse QQQ starting at line 118:\n');

  k = 118;
  totalQty = 0;
  lotNum = 0;

  while (k + 3 < lines.length && lotNum < 15) {
    const line1 = lines[k];

    if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
      console.log(`[${k}] STOP: "${line1.substring(0, 60)}"`);
      break;
    }

    const line2 = lines[k + 1];
    const line3 = lines[k + 2];
    const line4 = lines[k + 3];

    console.log(`[${k}] "${line1.substring(0, 70)}"`);
    console.log(`    Line 2: "${line2.substring(0, 70)}"`);
    console.log(`    Line 3: "${line3.substring(0, 70)}"`);
    console.log(`    Line 4: "${line4.substring(0, 70)}"`);

    // Check line 3 and 4 for quantity
    let qtyLine = null;
    let usedLines = 3;

    if (/^[\d.]+\s+/.test(line3.trim())) {
      qtyLine = line3;
      usedLines = 3;
    } else if (/^[\d.]+\s+/.test(line4.trim())) {
      qtyLine = line4;
      usedLines = 4;
    }

    if (qtyLine) {
      const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
      if (qtyMatch) {
        const qty = parseFloat(qtyMatch[1]);
        lotNum++;
        totalQty += qty;
        console.log(`    >>> Lot ${lotNum}: ${qtyMatch[1]} shares (format: ${usedLines}-line, total: ${totalQty.toFixed(4)})\n`);
      }
    }

    k += usedLines;
  }

  console.log(`\n\nQQQ Total: ${lotNum} lots, ${totalQty.toFixed(4)} shares`);
  console.log(`Expected: 33.0710`);
  console.log(`Difference: ${Math.abs(totalQty - 33.071).toFixed(4)} shares`);
}

debug();
