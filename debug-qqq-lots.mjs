// Debug QQQ lot parsing
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

    console.log('=== Checking lines 111-160 for QQQ ===\n');

    for (let i = 111; i <= 160; i++) {
      const line = lines[i];
      let label = '';

      if (line.trim().match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
        label = '<<< SYMBOL';
      } else if (line.includes('Hide lot details') || line.includes('Show lot details')) {
        label = '<<< LOT MARKER';
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line.trim())) {
        label = '<<< DATE';
      }

      console.log(`[${String(i).padStart(3)}] ${label.padEnd(20)} "${line}"`);
    }

    // Now simulate parser logic for QQQ
    console.log('\n\n=== Simulating parser for QQQ section ===\n');

    let currentAccount = '68411173';
    let currentSymbol = null;
    let lotsFound = 0;

    for (let i = 111; i < 160; i++) {
      const line = lines[i];

      // Update symbol
      const symbolMatch = line.trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
      if (symbolMatch) {
        const symbol = symbolMatch[1];
        for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
          const nameCandidate = lines[j].trim();
          if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('lot details')) {
            currentSymbol = { symbol, name: nameCandidate };
            console.log(`Line ${i}: Found symbol ${symbol}`);
            break;
          }
        }
      }

      // Check for "Hide lot details"
      if (line.includes('Hide lot details')) {
        console.log(`\nLine ${i}: "Hide lot details" - current symbol = ${currentSymbol ? currentSymbol.symbol : 'NONE'}`);

        if (currentSymbol) {
          // Try to parse lots
          let j = i + 1;

          // Skip warnings
          while (j < lines.length && (
            lines[j].includes('wash sale') ||
            lines[j].includes('disallowed') ||
            lines[j].includes('More information')
          )) {
            console.log(`  Line ${j}: Skipping warning`);
            j++;
          }

          // Try to parse lots
          while (j + 2 < lines.length) {
            const line1 = lines[j];
            const line2 = lines[j + 1];
            const line3 = lines[j + 2];

            if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
              console.log(`  Line ${j}: Not a date, stopping`);
              break;
            }

            // Check if it has tab-separated data (actual lot record)
            if (line1.includes('\t')) {
              lotsFound++;
              console.log(`  Line ${j}: LOT ${lotsFound} - "${line1.substring(0, 60)}..."`);
            } else {
              console.log(`  Line ${j}: Date only, no tab - might be wash sale ref`);
            }

            j += 3;
          }
        }
      }
    }

    console.log(`\n\nTotal QQQ lots found: ${lotsFound}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

debugPdf();
