// Find DIA symbol and show context
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function findDIA() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== Searching for DIA and nearby lots ===\n');

  for (let i = 0; i < 300; i++) {
    const line = lines[i].trim();
    if (line === 'DIA' || line.startsWith('DIA ')) {
      console.log(`Found DIA at line ${i}`);
      console.log(`Context (lines ${i} to ${i+30}):\n`);

      for (let j = i; j <= Math.min(i + 30, lines.length - 1); j++) {
        const marker = j === i ? '>>> ' : '    ';
        console.log(`${marker}[${j}] "${lines[j].substring(0, 80)}"`);
      }

      // Check if there's a "Hide lot details" marker
      let hasMarker = false;
      let markerLine = -1;
      for (let j = i + 1; j <= Math.min(i + 30, lines.length - 1); j++) {
        if (lines[j].includes('Hide lot details')) {
          hasMarker = true;
          markerLine = j;
          break;
        }
      }

      console.log(`\n${hasMarker ? `>>> "Hide lot details" found at line ${markerLine}` : '>>> NO "Hide lot details" marker found'}`);

      // Look for first date line
      for (let j = i + 1; j <= Math.min(i + 30, lines.length - 1); j++) {
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim())) {
          console.log(`>>> First date line at ${j}: "${lines[j].substring(0, 80)}"`);
          break;
        }
      }

      console.log('\n');
      break;
    }
  }
}

findDIA();
