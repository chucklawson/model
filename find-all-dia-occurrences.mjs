// Find ALL occurrences of DIA in the PDF
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findAllDIA() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== ALL occurrences of "DIA" in the PDF ===\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('DIA')) {
      console.log(`[${i}] "${line.substring(0, 80)}"`);
    }
  }

  console.log('\n=== Looking for DIA as standalone symbol ===\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === 'DIA' || line.startsWith('DIA ')) {
      console.log(`\nFound standalone DIA at line ${i}`);
      console.log(`Context (${i} to ${i+25}):\n`);

      for (let j = i; j <= Math.min(i + 25, lines.length - 1); j++) {
        const marker = j === i ? '>>> ' : '    ';
        console.log(`${marker}[${j}] "${lines[j].substring(0, 80)}"`);
      }

      // Look for date lines (potential lots)
      let foundLots = false;
      for (let j = i + 1; j <= Math.min(i + 25, lines.length - 1); j++) {
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
          if (!foundLots) {
            console.log(`\n>>> LOTS FOUND starting at line ${j}`);
            foundLots = true;
          }
        }
      }

      if (!foundLots) {
        console.log(`\n>>> NO LOTS FOUND after this DIA occurrence`);
      }
    }
  }
}

findAllDIA();
