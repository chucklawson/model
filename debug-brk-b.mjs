// Debug why BRK-B lots are not being parsed
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

    // Find BRK B symbol
    console.log('=== Finding BRK B symbol ===\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === 'BRK B' || line.includes('BRK B')) {
        console.log(`Found BRK B at line ${i}: "${line}"`);
        console.log('Context (30 lines before and after):');
        for (let j = Math.max(0, i - 30); j <= Math.min(lines.length - 1, i + 30); j++) {
          const marker = j === i ? '>>>' : '   ';
          console.log(`${marker} [${j}] "${lines[j]}"`);
        }
        console.log('\n--- Next occurrence ---\n');
      }
    }

    // Also check for "BERKSHIRE" to see the investment name
    console.log('\n=== Finding BERKSHIRE HATHAWAY ===\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('BERKSHIRE')) {
        console.log(`Found at line ${i}: "${lines[i]}"`);
        console.log('Context (10 lines):');
        for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
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
