// Check if DIA has lots appearing directly after summary line
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function checkDIA() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Detailed view of lines 10-80 (DIA area) ===\n');
  console.log('Looking for where DIA lots might appear\n');

  for (let i = 10; i <= 80; i++) {
    let marker = '    ';
    if (i === 13) marker = 'BRKB';
    if (i === 16) marker = 'DIA ';
    if (i === 19) marker = 'HIDE';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[i].trim())) marker = 'DATE';
    if (lines[i].includes('Hide') || lines[i].includes('lot')) marker = 'HIDE';

    console.log(`${marker} [${String(i).padStart(2)}] "${lines[i].substring(0, 90)}"`);
  }

  console.log('\n\n=== Checking columns manually ===');
  console.log('\nLooking at the raw text structure, we have:');
  console.log('- BRK B at line 13 (left column)');
  console.log('- DIA at line 16 (right column - interleaved!)');
  console.log('- "Hide lot details" at line 19');
  console.log('\nThe question is: does "Hide lot details" apply to BRK B or DIA or both?');
  console.log('\nLets count: if there are 14 lots totaling 60 shares, they belong to BRK B');
  console.log('Then where are DIAs 18.0970 shares worth of lots?');
}

checkDIA();
