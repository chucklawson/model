// Debug script to see what appears BEFORE "Hide lot details"
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

    const hideDetailLines = [];
    lines.forEach((line, idx) => {
      if (line.includes('Hide lot details')) {
        hideDetailLines.push(idx);
      }
    });

    console.log(`Found ${hideDetailLines.length} "Hide lot details" markers`);
    console.log('\nShowing 15 lines BEFORE first 3 "Hide lot details" markers:\n');

    hideDetailLines.slice(0, 3).forEach(idx => {
      console.log(`=== Context for "Hide lot details" at line ${idx} ===`);
      for (let i = Math.max(0, idx - 15); i < idx; i++) {
        console.log(`  [${i}] "${lines[i]}"`);
      }
      console.log(`>>> [${idx}] "${lines[idx]}"`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
