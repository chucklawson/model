// Parse the "Hide lot details" section at line 161 to see QQQ's actual lots
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

  console.log('=== Parsing "Hide lot details" section at line 161 ===\n');
  console.log('This should be QQQ\'s lots (expected 33.0710 shares)\n');

  let j = 162; // Start after "Hide lot details"
  let totalQty = 0;
  let lotNum = 0;

  // Skip warnings
  while (j < lines.length && (
    lines[j].includes('wash sale') ||
    lines[j].includes('disallowed') ||
    lines[j].includes('More information')
  )) {
    console.log(`[${j}] SKIP warning: "${lines[j].substring(0, 60)}"`);
    j++;
  }

  console.log(`Starting lot parsing at line ${j}\n`);

  while (j + 2 < lines.length && lotNum < 15) {
    const line1 = lines[j];

    // Skip wash sale adjustments
    if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
      console.log(`[${j}] SKIP wash sale: "${line1.substring(0, 60)}"`);
      j++;
      continue;
    }

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
      console.log(`Lot ${lotNum} (${format}): ${qtyMatch[1]} shares | Total: ${totalQty.toFixed(4)}`);
      console.log(`    Date: "${line1.substring(0, 30)}"`);
      console.log(`    Qty line: "${qtyLine.substring(0, 60)}"\n`);
    }

    j += format === '3-line' ? 3 : 4;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total lots: ${lotNum}`);
  console.log(`Total quantity: ${totalQty.toFixed(4)} shares`);
  console.log(`Expected (QQQ): 33.0710 shares`);
  console.log(`Difference: ${Math.abs(totalQty - 33.071).toFixed(4)} shares`);
  console.log(`\nStatus: ${Math.abs(totalQty - 33.071) < 0.001 ? '✓ EXACT MATCH' : Math.abs(totalQty - 33.071) < 0.1 ? '~ CLOSE (fractional missing)' : '✗ MISMATCH'}`);
}

debug();
