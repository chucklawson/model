// Test the Vanguard Realized Gains Parser with the actual PDF
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure PDF.js worker using local file with file:// protocol
const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

// Import parser functions inline since we can't import TS directly
async function parseVanguardRealizedGainsPdf(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  // Parse account numbers
  const accountPattern = /Brokerage Account\s*—\s*(\d{8})/g;
  const accountMatches = [];
  let match;
  while ((match = accountPattern.exec(text)) !== null) {
    if (!accountMatches.includes(match[1])) {
      accountMatches.push(match[1]);
    }
  }

  if (accountMatches.length === 0) {
    throw new Error('Could not find any account numbers in PDF');
  }

  const lines = text.split('\n');
  const lots = [];

  // Helper: Parse lot from 3-line or 4-line table rows
  function parseLotFromTableRows(line1, line2, line3, line4, accountNumber, symbol, investmentName) {
    const parts1 = line1.split('\t');
    if (parts1.length < 2) return null;

    let dateSold = '';
    let dateAcquired = '';
    let eventAndMethod = '';

    if (parts1.length >= 3) {
      dateSold = parts1[0].trim();
      dateAcquired = parts1[1].trim();
      eventAndMethod = parts1.slice(2).join(' ').trim();
    } else {
      dateAcquired = parts1[0].trim();
      eventAndMethod = parts1.slice(1).join(' ').trim();
    }

    const eventMatch = eventAndMethod.match(/^(Sell|Buy|Dividend|Reinvestment)\s+(.*)$/);
    let event = 'Sell';
    let costBasisPart1 = '';

    if (eventMatch) {
      event = eventMatch[1];
      costBasisPart1 = eventMatch[2];
    } else {
      costBasisPart1 = eventAndMethod;
    }

    const costBasisPart2 = line2.trim();

    // Determine if we have 3-line or 4-line format
    const line3Trimmed = line3.trim();
    const line3StartsWithQuantity = /^[\d.]+\s+/.test(line3Trimmed);

    let costBasisMethod;
    let amountsLine;

    if (line3StartsWithQuantity) {
      // 3-line format
      costBasisMethod = (costBasisPart1 + ' ' + costBasisPart2).trim();
      amountsLine = line3;
    } else if (line4) {
      // 4-line format
      const costBasisPart3 = line3Trimmed;
      costBasisMethod = (costBasisPart1 + ' ' + costBasisPart2 + ' ' + costBasisPart3).trim();
      amountsLine = line4;
    } else {
      return null;
    }

    const parts3 = amountsLine.split('\t');
    if (parts3.length < 2) return null;

    const amountsPart = parts3[0].trim();
    const gainsPart = parts3.slice(1).join(' ').trim();

    const amountsTokens = amountsPart.split(/\s+/);
    if (amountsTokens.length < 3) return null;

    const quantity = amountsTokens[0];
    const totalCost = amountsTokens[1];
    const proceeds = amountsTokens[2];

    const gainsTokens = gainsPart.split(/\s+/);
    let shortTermGain = '—';
    let longTermGain = '—';
    let totalGain = '—';

    if (gainsTokens.length >= 3) {
      shortTermGain = gainsTokens[0];
      longTermGain = gainsTokens[1];
      totalGain = gainsTokens[2];
    } else if (gainsTokens.length >= 1) {
      totalGain = gainsTokens[gainsTokens.length - 1];
    }

    if (!dateAcquired || !event || !quantity) return null;

    return {
      accountNumber,
      symbol,
      investmentName,
      dateSold,
      dateAcquired,
      event,
      costBasisMethod,
      quantity,
      totalCost,
      proceeds,
      shortTermCapitalGain: shortTermGain,
      longTermCapitalGain: longTermGain,
      totalCapitalGain: totalGain,
    };
  }

  // Track current account and symbol as we scan through the PDF
  let currentAccount = null;
  let currentSymbol = null;

  // Parse lots by looking for "Hide lot details" markers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Update current account when we encounter an account header
    const accountMatch = line.match(/Brokerage Account\s*—\s*(\d{8})/);
    if (accountMatch) {
      currentAccount = accountMatch[1];
      // Reset symbol when switching accounts
      currentSymbol = null;
      continue;
    }

    // Update current symbol when we encounter a symbol line
    const symbolMatch = line.trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
    if (symbolMatch && currentAccount) {
      const symbol = symbolMatch[1];
      // Look for investment name on next line(s)
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nameCandidate = lines[j].trim();
        if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
          currentSymbol = { symbol, name: nameCandidate };

          // Check if lot data appears directly after the symbol (without "Hide lot details" marker)
          let k = j + 1;
          while (k < Math.min(i + 30, lines.length)) {
            const checkLine = lines[k].trim();

            // Stop if we hit another symbol
            if (checkLine.match(/^[A-Z]{2,5}(\s+[A-Z])?$/)) {
              break;
            }

            // Stop if we hit a "Hide lot details" marker (those will be parsed separately)
            if (checkLine.includes('Hide lot details')) {
              break;
            }

            // Stop if we hit table headers or page markers
            if (checkLine.includes('Date acquired') || checkLine.includes('-- ') || checkLine === 'Total') {
              break;
            }

            // Check if this line starts with a date and has tabs (actual lot data)
            if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(checkLine) && lines[k].includes('\t')) {
              // Found lot data directly after symbol - parse it
              let m = k;
              while (m + 2 < lines.length) {
                const line1 = lines[m];
                const line2 = lines[m + 1];
                const line3 = lines[m + 2];
                const line4 = m + 3 < lines.length ? lines[m + 3] : null;

                // Stop if not a date line
                if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
                  break;
                }

                // Stop if we hit a marker or another symbol
                if (line1.includes('Hide lot details') || line2.includes('Hide lot details') || line3.includes('Hide lot details')) {
                  break;
                }

                const lot = parseLotFromTableRows(line1, line2, line3, line4, currentAccount, symbol, nameCandidate);
                if (lot) {
                  lots.push(lot);
                  const usedFourLines = line4 && /^[\d.]+\s+/.test(line4.trim());
                  m += usedFourLines ? 4 : 3;
                } else {
                  m += 3;
                }
              }
              break; // Done parsing lots for this symbol
            }

            k++;
          }

          break;
        }
      }
    }

    if (line.includes('Hide lot details')) {
      if (currentAccount && currentSymbol) {
        let j = i + 1;

        // Skip warning/info messages
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        // Parse table rows (each lot is 3 or 4 lines)
        while (j + 2 < lines.length) {
          const line1 = lines[j];
          const line2 = lines[j + 1];
          const line3 = lines[j + 2];
          const line4 = j + 3 < lines.length ? lines[j + 3] : null;

          // Check if line1 starts with a date
          if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
            break;
          }

          const lot = parseLotFromTableRows(line1, line2, line3, line4, currentAccount, currentSymbol.symbol, currentSymbol.name);
          if (lot) {
            lots.push(lot);
            const usedFourLines = line4 && /^[\d.]+\s+/.test(line4.trim());
            j += usedFourLines ? 4 : 3;
          } else {
            j += 3;
          }
        }
      }
    }
  }

  if (lots.length === 0) {
    throw new Error('No lot details found in PDF');
  }

  return {
    accountNumbers: accountMatches,
    lots,
  };
}

async function testParser() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    console.log('Reading PDF file:', pdfPath);

    const buffer = await readFile(pdfPath);

    console.log('Parsing PDF with new tab-separated table parser...\n');
    const result = await parseVanguardRealizedGainsPdf(buffer);

    console.log('=== PARSING RESULTS ===');
    console.log('Account numbers found:', result.accountNumbers);
    console.log('Total lots parsed:', result.lots.length);

    console.log('\n=== FIRST 5 LOTS ===');
    result.lots.slice(0, 5).forEach((lot, idx) => {
      console.log(`\n[Lot ${idx + 1}]`);
      console.log('  Account:', lot.accountNumber);
      console.log('  Symbol:', lot.symbol);
      console.log('  Investment:', lot.investmentName);
      console.log('  Date Sold:', lot.dateSold);
      console.log('  Date Acquired:', lot.dateAcquired);
      console.log('  Event:', lot.event);
      console.log('  Cost Basis Method:', lot.costBasisMethod);
      console.log('  Quantity:', lot.quantity);
      console.log('  Total Cost:', lot.totalCost);
      console.log('  Proceeds:', lot.proceeds);
      console.log('  Short Term Gain:', lot.shortTermCapitalGain);
      console.log('  Long Term Gain:', lot.longTermCapitalGain);
      console.log('  Total Gain:', lot.totalCapitalGain);
    });

    console.log('\n=== LOT COUNT BY SYMBOL ===');
    const symbolCounts = {};
    result.lots.forEach(lot => {
      const key = `${lot.accountNumber}:${lot.symbol}`;
      if (!symbolCounts[key]) {
        symbolCounts[key] = { account: lot.accountNumber, symbol: lot.symbol, count: 0 };
      }
      symbolCounts[key].count++;
    });

    Object.values(symbolCounts).sort((a, b) => b.count - a.count).forEach(({account, symbol, count}) => {
      console.log(`  ${symbol.padEnd(10)} ${String(count).padStart(3)} lots  (account ${account})`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testParser();
