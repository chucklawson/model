// Find where BRK B lots with "Hide lot details" appear
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

    // Find all BRK B occurrences and check if "Hide lot details" appears nearby
    console.log('=== Searching for BRK B sections with lot details ===\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === 'BRK B' || line === 'BRK B ') {
        // Check next 20 lines for "Hide lot details"
        let foundHideLotDetails = false;
        let hideLotDetailsLine = -1;
        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes('Hide lot details')) {
            foundHideLotDetails = true;
            hideLotDetailsLine = j;
            break;
          }
          // Stop if we hit another symbol
          if (lines[j].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
            break;
          }
        }

        console.log(`\nLine ${i}: BRK B`);
        console.log(`  Has "Hide lot details"? ${foundHideLotDetails ? 'YES at line ' + hideLotDetailsLine : 'NO'}`);

        if (foundHideLotDetails) {
          console.log('  Context:');
          for (let k = i; k <= Math.min(hideLotDetailsLine + 10, lines.length - 1); k++) {
            const marker = k === i ? '>>> SYMBOL' : k === hideLotDetailsLine ? '>>> HIDE' : '   ';
            console.log(`  ${marker} [${k}] "${lines[k]}"`);
          }
        } else {
          console.log('  Next 10 lines:');
          for (let k = i; k <= Math.min(i + 10, lines.length - 1); k++) {
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
