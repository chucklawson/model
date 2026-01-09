// Debug why BLK's direct lots aren't being parsed
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function testBLK() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Testing BLK parsing (simulating parser logic) ===\n');

  const i = 428; // BLK line
  const symbol = 'BLK';

  console.log(`Symbol found at line ${i}: "${lines[i]}"`);

  // Find name (j)
  for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
    const nameCandidate = lines[j].trim();
    console.log(`\n[${j}] Name candidate: "${nameCandidate}"`);

    if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
      console.log(`  ✓ Valid name: "${nameCandidate}"\n`);

      // Check for lot data starting at j+1
      let k = j + 1;
      console.log(`Starting lot search at k = ${k}\n`);

      while (k < Math.min(i + 30, lines.length)) {
        const checkLine = lines[k].trim();
        console.log(`[${k}] checkLine: "${checkLine.substring(0, 80)}"`);

        // Check stop conditions
        if (checkLine.match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
          console.log(`  → STOP: Another symbol`);
          break;
        }

        if (checkLine.includes('Hide lot details')) {
          console.log(`  → STOP: Hide lot details marker`);
          break;
        }

        if (checkLine.includes('Date acquired') || checkLine.includes('-- ') || checkLine === 'Total') {
          console.log(`  → STOP: Table header`);
          break;
        }

        // Check for lot data
        const isDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(checkLine);
        const hasTab = lines[k].includes('\t');

        console.log(`  → isDate: ${isDate}, hasTab: ${hasTab}`);

        if (isDate && hasTab) {
          console.log(`  → ✓ FOUND LOT DATA! Starting at line ${k}\n`);
          console.log(`  Parsing lots from here...\n`);

          let m = k;
          let lotCount = 0;
          while (m + 2 < lines.length && lotCount < 10) {
            const line1 = lines[m];

            // Skip wash sale
            if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
              console.log(`    [${m}] SKIP wash sale`);
              m++;
              continue;
            }

            if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
              console.log(`    [${m}] STOP (not a date)`);
              break;
            }

            const line3 = lines[m + 2];
            const line4 = m + 3 < lines.length ? lines[m + 3] : null;

            const line3HasQty = /^[\d.]+\s+/.test(line3.trim());
            const line4HasQty = line4 && /^[\d.]+\s+/.test(line4.trim());

            if (line3HasQty || line4HasQty) {
              const qtyLine = line3HasQty ? line3 : line4;
              const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
              if (qtyMatch) {
                lotCount++;
                console.log(`    Lot ${lotCount}: ${qtyMatch[1]} shares at line ${m}`);
                m += line3HasQty ? 3 : 4;
              } else {
                m += 3;
              }
            } else {
              console.log(`    [${m}] No qty found`);
              m += 3;
            }
          }

          console.log(`\n  Total lots found: ${lotCount}`);
          return;
        }

        k++;
      }

      break;
    }
  }
}

testBLK();
