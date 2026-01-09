// Examine the exact structure around BRK-B
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

    console.log('=== Detailed analysis of lines 13-120 (BRK B through QQQ) ===\n');

    for (let i = 13; i <= 120; i++) {
      const line = lines[i];
      let label = '';

      if (line.trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
        label = '<<< SYMBOL';
      } else if (line.includes('Hide lot details') || line.includes('Show lot details')) {
        label = '<<< LOT MARKER';
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim())) {
        label = '<<< DATE (lot data)';
      }

      console.log(`[${String(i).padStart(3)}] ${label.padEnd(20)} "${line}"`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
