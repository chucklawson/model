// Find BRK B symbol and show context
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findBRKB() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Searching for BRK B ===\n');

  for (let i = 0; i < 300; i++) {
    const line = lines[i].trim();
    if (line === 'BRK B' || line.startsWith('BRK B ')) {
      console.log(`Found BRK B at line ${i}`);
      console.log(`Context (lines ${i} to ${i+10}):\n`);

      for (let j = i; j <= Math.min(i + 10, lines.length - 1); j++) {
        const marker = j === i ? '>>> ' : '    ';
        console.log(`${marker}[${j}] "${lines[j].substring(0, 80)}"`);
      }

      // Check for "Hide lot details"
      let hasMarker = false;
      let markerLine = -1;
      for (let j = i + 1; j <= Math.min(i + 30, lines.length - 1); j++) {
        if (lines[j].includes('Hide lot details')) {
          hasMarker = true;
          markerLine = j;
          break;
        }
      }

      console.log(`\n${hasMarker ? `>>> "Hide lot details" found at line ${markerLine}` : '>>> NO "Hide lot details" marker found'}\n`);
      break;
    }
  }

  console.log('\n=== Lines 13-20 for comparison ===\n');
  for (let i = 13; i <= 20; i++) {
    console.log(`[${i}] "${lines[i]}"`);
  }
}

findBRKB();
