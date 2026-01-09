// Show EXACTLY what lots the parser assigns to DIA for account 68411173
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

async function showDIAOutput() {
  const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
  const buffer = await readFile(pdfPath);
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const lines = text.split('\n');

  console.log('=== SIMULATING EXACT PARSER LOGIC FOR DIA (Account 68411173) ===\n');

  // Track ALL symbols with expected quantities (like the real parser does)
  const allSymbols = [];

  // Find all symbols
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
          allSymbols.push({
            symbol,
            name: nameCandidate,
            expectedQty,
            lineNum: i,
            matched: false
          });
        }
      }
    }
  }

  console.log(`Found ${allSymbols.length} symbols\n`);

  // Find DIA
  const diaSymbol = allSymbols.find(s => s.symbol === 'DIA');
  if (!diaSymbol) {
    console.log('ERROR: DIA not found in symbol list!');
    return;
  }

  console.log(`DIA found at line ${diaSymbol.lineNum}:`);
  console.log(`  Expected quantity: ${diaSymbol.expectedQty} shares`);
  console.log(`  Name: ${diaSymbol.name}\n`);

  // Now parse lots-without-markers sections (like the real parser)
  const diaLots = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const symbolMatch = line.match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);

    if (symbolMatch) {
      const symbol = symbolMatch[1];
      const nameCandidate = lines[i + 1].trim();

      if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5) {
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

            console.log(`\n>>> Found lot section after symbol "${symbol}" at line ${i} (lots start at ${k})`);

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
                sectionLots.push({ date: line1.substring(0, 10), qty, qtyString: qtyMatch[1] });
              }

              m += usedLines;
            }

            // Match using quantity (0.5 tolerance like real parser)
            let matchedSymbol = null;
            let bestDiff = Infinity;

            for (const sym of allSymbols) {
              if (sym.matched) continue;

              const diff = Math.abs(sym.expectedQty - sectionQty);
              if (diff < bestDiff && diff < 0.5) {
                bestDiff = diff;
                matchedSymbol = sym;
              }
            }

            console.log(`  Section total: ${sectionQty.toFixed(4)} shares (${sectionLots.length} lots)`);
            console.log(`  Best match: ${matchedSymbol ? matchedSymbol.symbol : 'NONE'} (diff: ${bestDiff.toFixed(4)})`);

            if (matchedSymbol && matchedSymbol.symbol === 'DIA') {
              console.log(`  ✓ MATCHED TO DIA!`);
              matchedSymbol.matched = true;
              diaLots.push(...sectionLots);

              console.log(`\n  DIA lot details:`);
              sectionLots.forEach((lot, idx) => {
                console.log(`    Lot ${idx + 1}: ${lot.qtyString.padStart(8)} shares (${lot.date})`);
              });
            }

            break; // Done with this symbol
          }

          k++;
        }
      }
    }
  }

  // Final summary
  console.log('\n\n=== FINAL DIA RESULTS ===\n');
  console.log(`Expected: ${diaSymbol.expectedQty} shares`);
  console.log(`Parsed:   ${diaLots.reduce((sum, lot) => sum + lot.qty, 0).toFixed(4)} shares`);
  console.log(`Lots:     ${diaLots.length}\n`);

  if (diaLots.length === 0) {
    console.log('❌ NO LOTS FOUND FOR DIA!\n');
  } else {
    console.log('All DIA lots:');
    diaLots.forEach((lot, idx) => {
      console.log(`  ${String(idx + 1).padStart(2)}. ${lot.qtyString.padStart(8)} shares (${lot.date})`);
    });

    const total = diaLots.reduce((sum, lot) => sum + lot.qty, 0);
    console.log(`\nTotal: ${total.toFixed(4)} shares`);
    console.log(`Match: ${Math.abs(total - diaSymbol.expectedQty) < 0.001 ? '✓ EXACT' : '✗ MISMATCH'}`);
  }
}

showDIAOutput();
