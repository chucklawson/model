// Search the ENTIRE PDF for all BRK B occurrences and check for lots
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

    console.log('=== Searching ENTIRE PDF for BRK B ===\n');
    console.log(`Total lines in PDF: ${lines.length}\n`);

    // Find ALL lines containing "BRK"
    const brkLines = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('BRK')) {
        brkLines.push(i);
      }
    }

    console.log(`Found ${brkLines.length} lines containing "BRK"\n`);

    // For each BRK occurrence, show context
    brkLines.forEach((lineNum, idx) => {
      console.log(`\n=== Occurrence ${idx + 1} at line ${lineNum} ===`);
      console.log(`Line ${lineNum}: "${lines[lineNum]}"`);

      // Count dates in next 50 lines
      let dateCount = 0;
      let datesWithTabs = 0;
      for (let j = lineNum + 1; j < Math.min(lineNum + 50, lines.length); j++) {
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
          dateCount++;
          if (lines[j].includes('\t')) {
            datesWithTabs++;
          }
        }
        // Stop at next symbol
        if (j > lineNum + 5 && lines[j].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
          break;
        }
      }

      console.log(`  Dates in next 50 lines: ${dateCount}`);
      console.log(`  Dates with tabs (lot data): ${datesWithTabs}`);

      if (datesWithTabs > 0) {
        console.log(`  >>> THIS SECTION HAS LOT DATA! <<<`);
        console.log(`  Context (next 20 lines):`);
        for (let k = lineNum; k < Math.min(lineNum + 20, lines.length); k++) {
          console.log(`    [${k}] "${lines[k].substring(0, 80)}"`);
        }
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
