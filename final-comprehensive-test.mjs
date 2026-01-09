// Final comprehensive test with all fixes
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function testFinal() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    const buffer = await readFile(pdfPath);
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse({ data: uint8Array });
    const result = await parser.getText();
    const text = result.text;
    await parser.destroy();

    const lines = text.split('\n');

    console.log('=== FINAL COMPREHENSIVE TEST ===\n');
    console.log('Testing with:');
    console.log('1. Wash sale adjustment line skipping');
    console.log('2. Quantity-based symbol matching');
    console.log('3. 3-line and 4-line lot support\n');

    // Track ALL symbols with expected quantities (don't limit to 5)
    const symbols = {};
    const lots = [];

    // Find symbols and their expected quantities
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const symbolMatch = line.match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);

      if (symbolMatch && i + 2 < lines.length) {
        const symbol = symbolMatch[1];
        const nameCandidate = lines[i + 1].trim();
        const summaryLine = lines[i + 2];

        if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5) {
          const qtyMatch = summaryLine.match(/^([\d,.]+)\s+\$/);
          if (qtyMatch) {
            const expectedQty = parseFloat(qtyMatch[1].replace(/,/g, ''));
            if (!symbols[symbol]) {
              symbols[symbol] = { name: nameCandidate, expectedQty, actualQty: 0, lotCount: 0, matched: false };
            }
          }
        }
      }
    }

    // Parse lots appearing directly after symbols (without "Hide lot details" markers)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const symbolMatch = line.match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);

      if (symbolMatch && i + 2 < lines.length) {
        const symbol = symbolMatch[1];
        const nameCandidate = lines[i + 1].trim();

        if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
          // Look for lot data starting after summary line
          let k = i + 3;

          while (k < Math.min(i + 30, lines.length)) {
            const checkLine = lines[k].trim();

            // Stop conditions
            if (checkLine.match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) break;
            if (checkLine.includes('Hide lot details')) break;
            if (checkLine.includes('Date acquired') || checkLine.includes('-- ') || checkLine === 'Total') break;

            // Check for direct lot data
            if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(checkLine) && lines[k].includes('\t')) {
              const sectionLots = [];
              let sectionQty = 0;
              let m = k;

              while (m + 2 < lines.length) {
                const line1 = lines[m];

                // Skip wash sale adjustments
                if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
                  m++;
                  continue;
                }

                if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) break;
                if (line1.includes('Hide lot details')) break;

                const line3 = lines[m + 2];
                const line4 = m + 3 < lines.length ? lines[m + 3] : null;

                let qtyLine = line3;
                let usedLines = 3;
                if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
                  qtyLine = line4;
                  usedLines = 4;
                }

                const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
                if (qtyMatch) {
                  const qty = parseFloat(qtyMatch[1]);
                  sectionQty += qty;
                  sectionLots.push({ date: line1.substring(0, 10), qty });
                }

                m += usedLines;
              }

              // Match using quantity (0.5 tolerance)
              let matchedSymbol = null;
              let bestDiff = Infinity;

              for (const [sym, data] of Object.entries(symbols)) {
                if (data.matched) continue;

                const diff = Math.abs(data.expectedQty - sectionQty);
                if (diff < bestDiff && diff < 0.5) {
                  bestDiff = diff;
                  matchedSymbol = sym;
                }
              }

              if (matchedSymbol && sectionLots.length > 0) {
                symbols[matchedSymbol].actualQty += sectionQty;
                symbols[matchedSymbol].lotCount += sectionLots.length;
                symbols[matchedSymbol].matched = true;
                sectionLots.forEach(lot => {
                  lots.push({ symbol: matchedSymbol, ...lot });
                });
                console.log(`Line ${i}: Direct lots - matched ${sectionLots.length} lots (${sectionQty.toFixed(4)} shares) to ${matchedSymbol}`);
              }

              break; // Done with this symbol
            }

            k++;
          }
        }
      }
    }

    // Parse lots from "Hide lot details" sections
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Hide lot details')) {
        let j = i + 1;

        // Skip warnings
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        const sectionLots = [];
        let sectionQty = 0;

        while (j + 2 < lines.length) {
          const line1 = lines[j];
          const line2 = lines[j + 1];
          const line3 = lines[j + 2];
          const line4 = j + 3 < lines.length ? lines[j + 3] : null;

          // Skip wash sale adjustments
          if (line1.trim().match(/^[+\-]\$/) || line1.trim().match(/^\+[\d.]+/)) {
            j++;
            continue;
          }

          // Detect format: Normal (Date first) or Inverted (Qty first)
          const line1IsDate = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim());
          const line1IsQty = /^[\d.]+\s+\$/.test(line1.trim());

          if (line1IsDate) {
            // Normal format: Date -> Method -> Qty
            let qtyLine = line3;
            let usedLines = 3;
            if (!/^[\d.]+\s+/.test(line3.trim()) && line4 && /^[\d.]+\s+/.test(line4.trim())) {
              qtyLine = line4;
              usedLines = 4;
            }

            const qtyMatch = qtyLine.match(/^([\d.]+)\s+/);
            if (qtyMatch) {
              const qty = parseFloat(qtyMatch[1]);
              sectionQty += qty;
              sectionLots.push({ date: line1.substring(0, 10), qty });
            }

            j += usedLines;
          } else if (line1IsQty && line2 && /^\d{1,2}\/\d{1,2}\/\d{4}/.test(line2.trim())) {
            // Inverted format: Qty -> Date -> Method
            const qtyMatch = line1.match(/^([\d.]+)\s+/);
            if (qtyMatch) {
              const qty = parseFloat(qtyMatch[1]);
              sectionQty += qty;
              sectionLots.push({ date: line2.substring(0, 10), qty });
            }
            j += 3; // Inverted is always 3 lines
          } else {
            // Not a recognizable format, stop
            break;
          }
        }

        // Match against symbols using 0.5 share tolerance and prevent duplicates
        let matchedSymbol = null;
        let bestDiff = Infinity;

        for (const [sym, data] of Object.entries(symbols)) {
          // Skip already matched symbols to prevent duplicates
          if (data.matched) {
            continue;
          }

          const diff = Math.abs(data.expectedQty - sectionQty);
          if (diff < bestDiff && diff < 0.5) {
            bestDiff = diff;
            matchedSymbol = sym;
          }
        }

        if (matchedSymbol && sectionLots.length > 0) {
          symbols[matchedSymbol].actualQty += sectionQty;
          symbols[matchedSymbol].lotCount += sectionLots.length;
          symbols[matchedSymbol].matched = true; // Mark as matched to prevent duplicate assignment
          sectionLots.forEach(lot => {
            lots.push({ symbol: matchedSymbol, ...lot });
          });
          console.log(`Line ${i}: Matched ${sectionLots.length} lots (${sectionQty.toFixed(4)} shares) to ${matchedSymbol}`);
        } else if (sectionLots.length > 0) {
          console.log(`Line ${i}: ${sectionLots.length} lots (${sectionQty.toFixed(4)} shares) - NO MATCH (closest: ${bestDiff.toFixed(4)} diff)`);
        }
      }
    }

    console.log('\n\n=== SYMBOL SUMMARY ===\n');
    console.log('Symbol      Expected    Actual      Lots   Status');
    console.log('-------     --------    --------    ----   ------');

    for (const [sym, data] of Object.entries(symbols)) {
      const status = Math.abs(data.expectedQty - data.actualQty) < 0.01 ? '✓ MATCH' : '✗ MISMATCH';
      console.log(`${sym.padEnd(12)}${String(data.expectedQty).padStart(8)}  ${String(data.actualQty.toFixed(4)).padStart(8)}  ${String(data.lotCount).padStart(4)}   ${status}`);
    }

    console.log(`\n\nTotal lots parsed: ${lots.length}`);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testFinal();
