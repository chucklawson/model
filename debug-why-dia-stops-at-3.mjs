// Debug why DIA parsing stops after 3 lots instead of continuing to 9
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

  console.log('=== DIA Direct Lots Section (starts at line 118) ===\n');
  console.log('Simulating parser logic:\n');

  let m = 118; // Start of DIA lots (after QQQ symbol)
  let lotNum = 0;
  let totalQty = 0;

  while (m + 2 < lines.length && lotNum < 10) {
    const line1 = lines[m];

    console.log(`\n[${m}] Checking line: "${line1.substring(0, 70)}"`);

    // Skip wash sale adjustments
    if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
      console.log(`  → SKIP wash sale`);
      m++;
      continue;
    }

    // Check if date line
    const isDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim());
    console.log(`  → Is date? ${isDate}`);

    if (!isDate) {
      console.log(`  → STOP: Not a date line`);
      break;
    }

    // Check if "Hide lot details"
    if (line1.includes('Hide lot details')) {
      console.log(`  → STOP: Hide lot details marker`);
      break;
    }

    const line2 = lines[m + 1];
    const line3 = lines[m + 2];
    const line4 = m + 3 < lines.length ? lines[m + 3] : null;

    console.log(`  Line 2: "${line2.substring(0, 70)}"`);
    console.log(`  Line 3: "${line3.substring(0, 70)}"`);
    if (line4) console.log(`  Line 4: "${line4.substring(0, 70)}"`);

    // Check format
    const line3HasQty = /^[\d.]+\s+/.test(line3.trim());
    const line4HasQty = line4 && /^[\d.]+\s+/.test(line4.trim());

    console.log(`  Line 3 has qty? ${line3HasQty}`);
    console.log(`  Line 4 has qty? ${line4HasQty}`);

    let qtyLine = null;
    let usedLines = 3;

    if (line3HasQty) {
      qtyLine = line3;
      usedLines = 3;
    } else if (line4HasQty) {
      qtyLine = line4;
      usedLines = 4;
    } else {
      console.log(`  → NO QUANTITY FOUND - parser would skip/fail`);
      console.log(`  → This might cause parser to stop or skip this lot`);
      m += 3;
      continue;
    }

    const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      lotNum++;
      totalQty += qty;
      console.log(`  ✓ Lot ${lotNum}: ${qtyMatch[1]} shares (${usedLines}-line format) | Total: ${totalQty.toFixed(4)}`);
    }

    m += usedLines;
  }

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Stopped at line ${m}`);
  console.log(`Total lots parsed: ${lotNum}`);
  console.log(`Total quantity: ${totalQty.toFixed(4)} shares`);
  console.log(`Expected: 18.0970 shares (9 lots)`);
  console.log(`Missing: ${(18.097 - totalQty).toFixed(4)} shares (${9 - lotNum} lots)`);

  if (lotNum < 9) {
    console.log(`\n\n=== WHY DID IT STOP? ===`);
    console.log(`Line ${m}: "${lines[m].substring(0, 90)}"`);
    console.log(`\nThis line caused the parser to stop.`);
  }
}

debug();
