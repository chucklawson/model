// Check the exact format of fractional lots
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

  console.log('=== Fractional lot examples ===\n');
  console.log('QQQ lot with 0.0260 shares (line 185):\n');

  for (let i = 185; i <= 190; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nQQQ lot with 0.0450 shares (line 188):\n');

  for (let i = 188; i <= 193; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nDIA fractional lots:\n');
  console.log('Lot with 0.0010 shares (line 131):\n');
  for (let i = 131; i <= 134; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nLot with 0.0040 shares (line 134):\n');
  for (let i = 134; i <= 137; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }

  console.log('\n\nLet me check if these are 3-line or 4-line format:\n');

  // Check line 131 (DIA 0.0010)
  const line131_1 = lines[131];
  const line131_2 = lines[132];
  const line131_3 = lines[133];
  const line131_4 = lines[134];

  console.log('Line 131 lot:');
  console.log(`  Line 1: "${line131_1}"`);
  console.log(`  Line 2: "${line131_2}"`);
  console.log(`  Line 3: "${line131_3}"`);
  console.log(`  Line 3 starts with qty? ${/^[\d.]+\s+/.test(line131_3.trim())}`);
  console.log(`  Line 4: "${line131_4}"`);
  console.log(`  Line 4 starts with qty? ${/^[\d.]+\s+/.test(line131_4.trim())}`);

  const qtyMatch3 = line131_3.match(/^([\d.]+)\s+/);
  console.log(`  Qty from line 3: ${qtyMatch3 ? qtyMatch3[1] : 'NO MATCH'}`);

  console.log('\n\nLine 185 lot (QQQ 0.0260):');
  const line185_1 = lines[185];
  const line185_2 = lines[186];
  const line185_3 = lines[187];
  const line185_4 = lines[188];

  console.log(`  Line 1: "${line185_1}"`);
  console.log(`  Line 2: "${line185_2}"`);
  console.log(`  Line 3: "${line185_3}"`);
  console.log(`  Line 3 starts with qty? ${/^[\d.]+\s+/.test(line185_3.trim())}`);
  console.log(`  Line 4: "${line185_4}"`);
  console.log(`  Line 4 starts with qty? ${/^[\d.]+\s+/.test(line185_4.trim())}`);

  const qtyMatch3_185 = line185_3.match(/^([\d.]+)\s+/);
  console.log(`  Qty from line 3: ${qtyMatch3_185 ? qtyMatch3_185[1] : 'NO MATCH'}`);
}

debug();
