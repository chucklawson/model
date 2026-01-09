// Check what's after the wash sale line that's stopping QQQ parsing
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function debug() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Lines 118-165 (QQQ lots area) ===\n');

  for (let i = 118; i <= 165; i++) {
    const line = lines[i];
    const isDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim());
    const isWashSale = line.trim().match(/^[+\-]\$/);
    const isHide = line.includes('Hide lot details');

    let marker = '    ';
    if (i === 118) marker = 'LOT1';
    if (i === 122) marker = 'WASH';
    if (isDate) marker = 'DATE';
    if (isHide) marker = 'HIDE';
    if (isWashSale) marker = 'WASH';

    console.log(`${marker} [${i}] "${line.substring(0, 90)}"`);
  }
}

debug();
