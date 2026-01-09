// Debug script to find how "Date sold" appears in the PDF
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure PDF.js worker
const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function debugPdf() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    console.log('Reading PDF file:', pdfPath);

    const buffer = await readFile(pdfPath);
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    const text = result.text;
    await parser.destroy();

    const lines = text.split('\n');

    console.log('\n=== SEARCHING FOR "Date sold" ===');
    const dateSoldLines = [];
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes('date sold')) {
        dateSoldLines.push({ idx, line });
      }
    });

    console.log(`Found ${dateSoldLines.length} lines containing "date sold" (case-insensitive)`);
    console.log('\nFirst 10 matches:');
    dateSoldLines.slice(0, 10).forEach(({ idx, line }) => {
      console.log(`[${idx}] "${line}"`);
      console.log(`  Trimmed: "${line.trim()}"`);
      console.log(`  Length: ${line.length}, Trimmed length: ${line.trim().length}`);
      console.log(`  === 'Date sold': ${line.trim() === 'Date sold'}`);

      // Show surrounding lines
      console.log('  Context (3 lines before and after):');
      for (let i = Math.max(0, idx - 3); i <= Math.min(lines.length - 1, idx + 3); i++) {
        const marker = i === idx ? '>>>' : '   ';
        console.log(`    ${marker} [${i}] "${lines[i]}"`);
      }
      console.log('');
    });

    console.log('\n=== SEARCHING FOR LOT DETAIL SECTIONS ===');
    // Find "Hide lot details" markers
    const hideDetailLines = [];
    lines.forEach((line, idx) => {
      if (line.includes('Hide lot details')) {
        hideDetailLines.push(idx);
      }
    });

    console.log(`Found ${hideDetailLines.length} "Hide lot details" markers`);
    if (hideDetailLines.length > 0) {
      console.log('\nShowing lines after first 3 "Hide lot details" markers:');
      hideDetailLines.slice(0, 3).forEach(idx => {
        console.log(`\n[${idx}] "${lines[idx]}"`);
        console.log('Next 20 lines:');
        for (let i = idx + 1; i < Math.min(idx + 21, lines.length); i++) {
          console.log(`  [${i}] "${lines[i]}"`);
        }
      });
    }

    console.log('\n=== SEARCHING FOR COLON PATTERNS ===');
    const colonLines = lines.filter(line => line.includes(':'));
    console.log(`Found ${colonLines.length} lines with colons`);
    console.log('First 30 colon lines:');
    colonLines.slice(0, 30).forEach((line, idx) => {
      console.log(`  [${idx}] "${line.trim()}"`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
