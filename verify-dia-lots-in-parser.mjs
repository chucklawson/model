// Verify what the actual parser outputs for DIA account 68411173
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function verifyDIA() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== SEARCHING FOR ALL DIA LOTS IN ACCOUNT 68411173 ===\n');

  // Find all DIA occurrences
  const diaLines = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'DIA') {
      diaLines.push(i);
    }
  }

  console.log(`Found DIA symbol at ${diaLines.length} locations: ${diaLines.join(', ')}\n`);

  // For each DIA location, check account and show lots
  for (const lineNum of diaLines) {
    console.log(`\n========== DIA at line ${lineNum} ==========`);

    // Find account (look backward)
    let account = null;
    for (let i = lineNum - 1; i >= Math.max(0, lineNum - 200); i--) {
      const accountMatch = lines[i].match(/Brokerage Account\s*—\s*(\d{8})/);
      if (accountMatch) {
        account = accountMatch[1];
        break;
      }
    }

    console.log(`Account: ${account || 'NOT FOUND'}`);

    if (account !== '68411173') {
      console.log('Skipping (different account)');
      continue;
    }

    // Show context
    console.log(`\nContext (lines ${lineNum} to ${lineNum + 30}):`);
    for (let i = lineNum; i <= lineNum + 30 && i < lines.length; i++) {
      console.log(`[${i}] "${lines[i].substring(0, 90)}"`);
    }

    // Look for lots
    console.log('\n--- Parsing lots ---\n');

    // Check for direct lots (no "Hide lot details")
    let foundDirectLots = false;
    for (let i = lineNum + 1; i < Math.min(lineNum + 200, lines.length); i++) {
      if (lines[i].includes('Hide lot details')) break;
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[i].trim()) && lines[i].includes('\t')) {
        console.log(`Direct lots starting at line ${i}`);
        foundDirectLots = true;

        // Parse them
        let j = i;
        let totalQty = 0;
        let lotNum = 0;
        while (j + 3 < lines.length && lotNum < 20) {
          const line1 = lines[j];

          if (line1.trim().match(/^[+\-]\$/)) {
            j++;
            continue;
          }

          if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) break;
          if (line1.includes('Hide lot details')) break;

          const line3 = lines[j + 2];
          const line4 = lines[j + 3];

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
              console.log(`  Lot ${lotNum}: ${qtyMatch[1].padStart(8)} shares | Total: ${totalQty.toFixed(4)}`);
            }
          }

          j += usedLines;
        }

        console.log(`\nDirect lots total: ${lotNum} lots, ${totalQty.toFixed(4)} shares\n`);
        break;
      }
    }

    // Check for "Hide lot details" sections
    for (let i = lineNum + 1; i < Math.min(lineNum + 200, lines.length); i++) {
      if (lines[i].includes('Hide lot details')) {
        console.log(`\n"Hide lot details" at line ${i}`);

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
        let lotNum = 0;

        console.log('\nParsing lots with inverted format support:\n');

        while (j + 2 < lines.length && lotNum < 50) {
          const line1 = lines[j];
          const line2 = lines[j + 1];
          const line3 = lines[j + 2];

          // Skip wash sale
          if (line1.trim().match(/^[+\-]\$/)) {
            j++;
            continue;
          }

          const line1IsDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim());
          const line1IsQty = /^[\d.]+\s+\$/.test(line1.trim());

          if (line1IsDate) {
            // Normal format
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
              lotNum++;
              totalQty += qty;
              console.log(`  Lot ${lotNum} (normal): ${qtyMatch[1].padStart(8)} shares | Total: ${totalQty.toFixed(4)}`);
            }
            j += usedLines;
          } else if (line1IsQty && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line2.trim())) {
            // Inverted format
            const qtyMatch = line1.match(/^([\d.]+)\s+/);
            if (qtyMatch) {
              const qty = parseFloat(qtyMatch[1]);
              lotNum++;
              totalQty += qty;
              console.log(`  Lot ${lotNum} (inverted): ${qtyMatch[1].padStart(8)} shares | Total: ${totalQty.toFixed(4)}`);
            }
            j += 3;
          } else {
            break;
          }
        }

        console.log(`\n"Hide lot details" total: ${lotNum} lots, ${totalQty.toFixed(4)} shares\n`);
        break;
      }
    }
  }

  console.log('\n\n=== EXPECTED FOR DIA (Account 68411173) ===');
  console.log('From summary line: 18.0970 shares');
  console.log('\nAll lots must sum to this exact amount!');
}

verifyDIA();
