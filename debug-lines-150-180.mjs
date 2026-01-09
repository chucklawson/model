// View lines 150-180 to understand structure after first QQQ lots
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

    console.log('=== Lines 150-180 ===\n');
    for (let i = 150; i <= 180; i++) {
      let label = '';
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[i].trim())) {
        label = '<<< DATE';
      } else if (lines[i].includes('Hide lot details')) {
        label = '<<< MARKER';
      } else if (lines[i].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
        label = '<<< SYMBOL';
      }
      console.log(`[${String(i).padStart(3)}] ${label.padEnd(15)} "${lines[i]}"`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
