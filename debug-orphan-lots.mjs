// Look for lot data rows that might not have "Hide lot details" markers
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

    console.log('=== Looking for date patterns near BRK B and QQQ ===\n');

    // Find BRK B and QQQ sections and look for date patterns nearby
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === 'BRK B' || line === 'QQQ') {
        console.log(`\nFound ${line} at line ${i}`);
        console.log('Looking for date patterns in next 50 lines:');

        let foundDates = [];
        for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
          // Look for date pattern at start of line
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
            foundDates.push(j);
          }
          // Stop if we hit another symbol
          if (j > i + 5 && lines[j].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
            break;
          }
        }

        if (foundDates.length > 0) {
          console.log(`  Found ${foundDates.length} lines with date patterns:`);
          foundDates.forEach(lineNum => {
            console.log(`    [${lineNum}] "${lines[lineNum]}"`);
          });
        } else {
          console.log('  No date patterns found (section is collapsed)');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
