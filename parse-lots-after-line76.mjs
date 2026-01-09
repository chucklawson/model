// Parse lots after line 76 "Hide lot details"
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function parseLots() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Parsing lots after line 76 "Hide lot details" ===\n');
  console.log('Context lines 76-110:\n');

  for (let i = 76; i <= 110; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\n=== Parsing lots ===\n');

  let j = 77; // Start after "Hide lot details" at line 76
  let totalQty = 0;
  let lotNum = 0;

  // Skip warnings
  while (j < lines.length && (
    lines[j].includes('wash sale') ||
    lines[j].includes('disallowed') ||
    lines[j].includes('More information') ||
    lines[j].includes('The loss') ||
    lines[j].includes('has been added')
  )) {
    console.log(`[${j}] SKIP warning: "${lines[j].substring(0, 80)}"`);
    j++;
  }

  while (j + 2 < lines.length) {
    const line1 = lines[j];

    // Skip wash sale adjustments
    if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
      console.log(`[${j}] SKIP wash sale adjustment: "${line1.substring(0, 60)}"`);
      j++;
      continue;
    }

    // Check for date
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
      console.log(`[${j}] STOP (not a date): "${line1.substring(0, 60)}"`);
      break;
    }

    const line2 = lines[j + 1];
    const line3 = lines[j + 2];
    const line4 = j + 3 < lines.length ? lines[j + 3] : null;

    // Determine format
    const line3HasQty = /^[\d.]+\s+/.test(line3.trim());
    const line4HasQty = line4 && /^[\d.]+\s+/.test(line4.trim());

    let qtyLine, format;
    if (line3HasQty) {
      qtyLine = line3;
      format = '3-line';
    } else if (line4HasQty) {
      qtyLine = line4;
      format = '4-line';
    } else {
      console.log(`[${j}] No qty found, skipping`);
      j += 3;
      continue;
    }

    const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
    if (qtyMatch) {
      const qty = parseFloat(qtyMatch[1]);
      lotNum++;
      totalQty += qty;
      console.log(`Lot ${lotNum} (${format}): ${qty.toFixed(4)} shares | Total: ${totalQty.toFixed(4)}`);
      console.log(`    Date: "${line1.substring(0, 70)}"`);
    }

    j += format === '3-line' ? 3 : 4;

    if (lotNum >= 20) {
      console.log('\n(Stopping after 20 lots for brevity)');
      break;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total lots: ${lotNum}`);
  console.log(`Total quantity: ${totalQty.toFixed(4)} shares`);
  console.log(`\nDIA expects: 18.0970 shares`);
  console.log(`Difference: ${Math.abs(totalQty - 18.097).toFixed(4)} shares`);
  console.log(`\nMatch: ${Math.abs(totalQty - 18.097) < 0.01 ? 'DIA ✓ PERFECT MATCH!' : Math.abs(totalQty - 18.097) < 0.5 ? 'DIA ✓ CLOSE MATCH' : '✗ NO MATCH'}`);
}

parseLots();
