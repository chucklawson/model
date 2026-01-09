// Examine the lot section at line 1442
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

  console.log('=== Context around line 1442 "Hide lot details" ===\n');
  console.log('Lines 1420-1465:\n');

  for (let i = 1420; i <= 1465; i++) {
    const marker = i === 1442 ? '>>> ' : '    ';
    console.log(`${marker}[${i}] "${lines[i]}"`);
  }

  console.log('\n=== Parsing lots after line 1442 ===\n');

  let j = 1443;
  let totalQty = 0;
  let lotNum = 0;

  while (j + 2 < lines.length) {
    const line1 = lines[j];

    if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
      console.log(`[${j}] SKIP wash sale: "${line1.substring(0, 60)}"`);
      j++;
      continue;
    }

    if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
      console.log(`[${j}] STOP: "${line1.substring(0, 60)}"`);
      break;
    }

    const line3 = lines[j + 2];
    const line4 = j + 3 < lines.length ? lines[j + 3] : null;

    let qtyLine = line3;
    let format = '3-line';
    if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
      qtyLine = line4;
      format = '4-line';
    }

    const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      lotNum++;
      totalQty += qty;
      console.log(`Lot ${lotNum} (${format}): ${qty} shares | Line ${j}: "${line1.substring(0, 70)}"`);
      console.log(`    Qty line: "${qtyLine.substring(0, 80)}"`);
    }

    j += format === '3-line' ? 3 : 4;
  }

  console.log(`\n=== TOTAL: ${lotNum} lots, ${totalQty} shares ===`);
  console.log(`DIA expects: 18.0970 shares`);
  console.log(`Difference: ${Math.abs(totalQty - 18.097).toFixed(4)} shares`);
}

examine();
