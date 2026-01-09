// Check if "Hide lot details" appears before or after lot data
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

    console.log('=== Analyzing "Hide lot details" marker positions ===\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Hide lot details')) {
        console.log(`\nLine ${i}: "Hide lot details"`);

        // Check 5 lines before and after for date patterns
        let datesBefore = 0;
        let datesAfter = 0;

        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
            datesBefore++;
          }
        }

        for (let j = i + 1; j < Math.min(lines.length, i + 11); j++) {
          if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
            datesAfter++;
          }
        }

        console.log(`  Dates in 10 lines before: ${datesBefore}`);
        console.log(`  Dates in 10 lines after: ${datesAfter}`);
        console.log(`  Pattern: ${datesBefore > 0 && datesAfter === 0 ? 'MARKER AT END' : datesAfter > 0 && datesBefore === 0 ? 'MARKER AT START' : 'UNCLEAR'}`);

        if (i >= 19 && i <= 19) {
          console.log(`  Context:`);
          for (let k = i - 3; k <= Math.min(lines.length - 1, i + 3); k++) {
            console.log(`    [${k}] "${lines[k]}"`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
