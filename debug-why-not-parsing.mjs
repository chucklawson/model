// Debug why QQQ lots at 118+ aren't being parsed
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

    console.log('=== Simulating symbol detection for QQQ at line 111 ===\n');

    const i = 111;  // QQQ symbol line
    const symbol = 'QQQ';

    // Find investment name
    let nameCandidate = null;
    for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
      const candidate = lines[j].trim();
      if (candidate && !candidate.match(/^\d/) && candidate.length > 5 && !candidate.includes('Hide lot details')) {
        nameCandidate = candidate;
        console.log(`Line ${j}: Found name: "${nameCandidate}"`);

        // Now check for lot data
        let k = j + 1;
        console.log(`\nScanning from line ${k} for lot data...`);

        while (k < Math.min(i + 30, lines.length)) {
          const checkLine = lines[k].trim();

          console.log(`Line ${k}: "${checkLine.substring(0, 60)}..."`);

          // Stop if we hit another symbol
          if (checkLine.match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
            console.log(`  → STOP: Hit another symbol`);
            break;
          }

          // Stop if we hit a "Hide lot details" marker
          if (checkLine.includes('Hide lot details')) {
            console.log(`  → STOP: Hit "Hide lot details" marker`);
            break;
          }

          // Stop if we hit table headers or page markers
          if (checkLine.includes('Date acquired') || checkLine.includes('-- ') || checkLine === 'Total') {
            console.log(`  → STOP: Hit table header/page marker`);
            break;
          }

          // Check if this line starts with a date and has tabs
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(checkLine) && lines[k].includes('\t')) {
            console.log(`  → FOUND LOT DATA! Starting to parse from line ${k}`);

            // Count how many lots we would parse
            let m = k;
            let lotCount = 0;
            while (m + 2 < lines.length) {
              const line1 = lines[m];

              if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
                break;
              }

              if (line1.includes('Hide lot details')) {
                break;
              }

              lotCount++;
              m += 3;
            }

            console.log(`  → Would parse ${lotCount} lots from lines ${k} to ${m-1}`);
            break;
          }

          k++;
        }

        break;
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
