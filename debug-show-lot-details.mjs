// Find "Show lot details" markers for collapsed sections
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

    // Count markers
    let showLotDetailsCount = 0;
    let hideLotDetailsCount = 0;

    console.log('=== Searching for "Show lot details" (collapsed) markers ===\n');

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Show lot details')) {
        showLotDetailsCount++;
        console.log(`\n[${i}] Found "Show lot details" (collapsed section)`);
        // Show context
        console.log('Context (10 lines before and 5 after):');
        for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 5); j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`${marker} [${j}] "${lines[j]}"`);
        }
      }
      if (lines[i].includes('Hide lot details')) {
        hideLotDetailsCount++;
      }
    }

    console.log('\n\n=== SUMMARY ===');
    console.log(`"Show lot details" markers (collapsed): ${showLotDetailsCount}`);
    console.log(`"Hide lot details" markers (expanded): ${hideLotDetailsCount}`);
    console.log(`Total sections: ${showLotDetailsCount + hideLotDetailsCount}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
