// Find lots that appear directly after symbols without "Hide lot details" markers
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

    console.log('=== Finding symbols with lot data but NO "Hide lot details" marker ===\n');

    for (let i = 0; i < Math.min(600, lines.length); i++) {
      const line = lines[i].trim();

      // Check if this is a symbol line
      const symbolMatch = line.match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
      if (symbolMatch) {
        const symbol = symbolMatch[1];

        // Check if there's a "Hide lot details" marker in next 20 lines
        let hasMarker = false;
        let firstDateLine = -1;

        for (let j = i + 1; j < Math.min(i + 20, lines.length); j++) {
          if (lines[j].includes('Hide lot details')) {
            hasMarker = true;
            break;
          }

          // Look for date with tab (actual lot data)
          if (firstDateLine === -1 && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(lines[j].trim()) && lines[j].includes('\t')) {
            firstDateLine = j;
          }

          // Stop if we hit another symbol
          if (j > i + 2 && lines[j].trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
            break;
          }
        }

        if (!hasMarker && firstDateLine !== -1) {
          console.log(`\n${symbol} at line ${i}: LOT DATA WITHOUT MARKER`);
          console.log(`  First lot data at line ${firstDateLine}`);
          console.log(`  Context:`);
          for (let k = i; k <= Math.min(firstDateLine + 3, lines.length - 1); k++) {
            const marker = k === i ? '>>> SYMBOL' : k === firstDateLine ? '>>> LOT' : '   ';
            console.log(`  ${marker} [${k}] "${lines[k].substring(0, 80)}"`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
