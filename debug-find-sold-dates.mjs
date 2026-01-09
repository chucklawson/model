// Find where "Date sold" values appear in relation to symbols
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

    // Find where date patterns appear near DIA
    console.log('=== Finding DIA symbol and nearby dates ===\n');

    for (let i = 0; i < Math.min(300, lines.length); i++) {
      const line = lines[i].trim();

      if (line === 'DIA') {
        console.log(`Found DIA at line ${i}`);
        console.log('Context (20 lines before and after):');
        for (let j = Math.max(0, i - 20); j <= Math.min(lines.length - 1, i + 20); j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`${marker} [${j}] "${lines[j]}"`);
        }
        console.log('\n');
        break; // Only show first occurrence
      }
    }

    // Also look for the structure around the first date sold values
    console.log('\n=== Finding structure around 01/08/2025 (likely a sold date) ===\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '01/08/2025') {
        console.log(`Found 01/08/2025 at line ${i}`);
        console.log('Context (10 lines before and after):');
        for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 10); j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`${marker} [${j}] "${lines[j]}"`);
        }
        console.log('\n');
        break; // Only show first occurrence
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
