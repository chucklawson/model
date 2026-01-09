// Find ALL lot sections and identify which one has DIA's 18.0970 shares
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findDIALots() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== SEARCHING FOR LOT SECTION WITH 18.0970 SHARES (DIA) ===\n');
  console.log('DIA is at line 16 for account 68411173\n');

  // Parse ALL "Hide lot details" sections and direct lot sections
  const sections = [];

  // 1. Find "Hide lot details" sections
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
      const lots = [];

      while (j + 2 < lines.length) {
        const line1 = lines[j];
        const line2 = lines[j + 1];
        const line3 = lines[j + 2];

        if (line1.trim().match(/^[+\-]\$/)) {
          j++;
          continue;
        }

        const line1IsDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim());
        const line1IsQty = /^[\d.]+\s+\$/.test(line1.trim());

        if (line1IsDate) {
          const line4 = j + 3 < lines.length ? lines[j + 3] : null;
          let qtyLine = line3;
          let usedLines = 3;
          if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
            qtyLine = line4;
            usedLines = 4;
          }

          const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
          if (qtyMatch) {
            const qty = parseFloat(qtyMatch[1]);
            totalQty += qty;
            lotCount++;
            lots.push(qty);
          }
          j += usedLines;
        } else if (line1IsQty && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line2.trim())) {
          const qtyMatch = line1.match(/^([\d.]+)\s+/);
          if (qtyMatch) {
            const qty = parseFloat(qtyMatch[1]);
            totalQty += qty;
            lotCount++;
            lots.push(qty);
          }
          j += 3;
        } else {
          break;
        }
      }

      if (lotCount > 0) {
        sections.push({
          type: 'Hide lot details',
          line: i,
          lots: lotCount,
          total: totalQty,
          quantities: lots
        });
      }
    }
  }

  // 2. Find direct lot sections (without "Hide lot details")
  for (let i = 0; i < lines.length; i++) {
    const symbolMatch = lines[i].trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);

    if (symbolMatch) {
      // Look for lots directly after symbol
      for (let k = i + 3; k < Math.min(i + 30, lines.length); k++) {
        if (lines[k].includes('Hide lot details')) break;
        if (lines[k].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) break;

        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[k].trim()) && lines[k].includes('\t')) {
          let m = k;
          let totalQty = 0;
          let lotCount = 0;
          const lots = [];

          while (m + 2 < lines.length) {
            const line1 = lines[m];

            if (line1.trim().match(/^[+\-]\$/)) {
              m++;
              continue;
            }

            if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) break;
            if (line1.includes('Hide lot details')) break;

            const line3 = lines[m + 2];
            const line4 = m + 3 < lines.length ? lines[m + 3] : null;

            let qtyLine = line3;
            let usedLines = 3;
            if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
              qtyLine = line4;
              usedLines = 4;
            }

            const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
            if (qtyMatch) {
              const qty = parseFloat(qtyMatch[1]);
              totalQty += qty;
              lotCount++;
              lots.push(qty);
            }

            m += usedLines;
          }

          if (lotCount > 0) {
            sections.push({
              type: `Direct after ${symbolMatch[1]}`,
              line: i,
              lots: lotCount,
              total: totalQty,
              quantities: lots
            });
          }

          break;
        }
      }
    }
  }

  // Sort and show sections near 18.097
  console.log('All lot sections found:\n');
  sections
    .sort((a, b) => a.line - b.line)
    .forEach(s => {
      const isDIA = Math.abs(s.total - 18.097) < 0.01;
      const marker = isDIA ? '>>> DIA ✓' : '';
      console.log(`Line ${String(s.line).padStart(4)}: ${s.type.padEnd(30)} ${String(s.lots).padStart(2)} lots, ${s.total.toFixed(4).padStart(10)} shares ${marker}`);

      if (isDIA) {
        console.log(`       Quantities: ${s.quantities.map(q => q.toFixed(4)).join(', ')}`);
      }
    });

  // Find exact match for 18.097
  console.log('\n\n=== SECTIONS MATCHING DIA (18.0970 shares) ===\n');
  sections
    .filter(s => Math.abs(s.total - 18.097) < 0.01)
    .forEach(s => {
      console.log(`${s.type} at line ${s.line}:`);
      console.log(`  ${s.lots} lots totaling ${s.total.toFixed(4)} shares`);
      console.log(`  Individual quantities:`);
      s.quantities.forEach((q, i) => {
        console.log(`    Lot ${i + 1}: ${q.toFixed(4)}`);
      });
      console.log('');
    });
}

findDIALots();
