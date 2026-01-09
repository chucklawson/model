// Analyze which symbols were parsed and count them
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFParse } from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerPath = join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.mjs');
const workerUrl = new URL(`file:///${workerPath.replace(/\\/g, '/')}`);
PDFParse.setWorker(workerUrl.href);

// Copy of parser logic
async function parseVanguardRealizedGainsPdf(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse({ data: uint8Array });
  const result = await parser.getText();
  const text = result.text;
  await parser.destroy();

  const accountPattern = /Brokerage Account\s*—\s*(\d{8})/g;
  const accountMatches = [];
  let match;
  while ((match = accountPattern.exec(text)) !== null) {
    if (!accountMatches.includes(match[1])) {
      accountMatches.push(match[1]);
    }
  }

  const lines = text.split('\n');
  const lots = [];

  function parseLotFromTableRows(line1, line2, line3, accountNumber, symbol, investmentName) {
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

    const eventMatch = eventAndMethod.match(/^(Sell|Buy|Dividend|Reinvestment|Cover Short)\s+(.*)$/);
    let event = 'Sell';
    let costBasisPart1 = '';

    if (eventMatch) {
      event = eventMatch[1];
      costBasisPart1 = eventMatch[2];
    } else {
      costBasisPart1 = eventAndMethod;
    }

    const costBasisPart2 = line2.trim();
    const costBasisMethod = (costBasisPart1 + ' ' + costBasisPart2).trim();

    const parts3 = line3.split('\t');
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

  // Track current account and symbol
  let currentAccount = null;
  let currentSymbol = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Update current account
    const accountMatch = line.match(/Brokerage Account\s*—\s*(\d{8})/);
    if (accountMatch) {
      currentAccount = accountMatch[1];
      currentSymbol = null;
      continue;
    }

    // Update current symbol
    const symbolMatch = line.trim().match(/^([A-Z]{1,5}(?:\s+[A-Z])?)\s*$/);
    if (symbolMatch && currentAccount) {
      const symbol = symbolMatch[1];
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nameCandidate = lines[j].trim();
        if (nameCandidate && !nameCandidate.match(/^\d/) && nameCandidate.length > 5 && !nameCandidate.includes('Hide lot details')) {
          currentSymbol = { symbol, name: nameCandidate };
          break;
        }
      }
    }

    if (line.includes('Hide lot details')) {
      if (currentAccount && currentSymbol) {
        let j = i + 1;

        // Skip warnings
        while (j < lines.length && (
          lines[j].includes('wash sale') ||
          lines[j].includes('disallowed') ||
          lines[j].includes('More information')
        )) {
          j++;
        }

        // Parse lots
        while (j + 2 < lines.length) {
          const line1 = lines[j];
          const line2 = lines[j + 1];
          const line3 = lines[j + 2];

          if (!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(line1.trim())) {
            break;
          }

          const lot = parseLotFromTableRows(line1, line2, line3, currentAccount, currentSymbol.symbol, currentSymbol.name);
          if (lot) {
            lots.push(lot);
          }

          j += 3;
        }
      }
    }
  }

  return { accountNumbers: accountMatches, lots };
}

async function analyzeLots() {
  try {
    const pdfPath = 'D:\\Market\\VanguardTransactions\\Realized Summary _ Vanguard_2025.pdf';
    const buffer = await readFile(pdfPath);
    const result = await parseVanguardRealizedGainsPdf(buffer);

    console.log('=== LOT COUNT BY SYMBOL ===\n');

    // Count by symbol
    const symbolCounts = {};
    result.lots.forEach(lot => {
      if (!symbolCounts[lot.symbol]) {
        symbolCounts[lot.symbol] = {
          count: 0,
          account: lot.accountNumber
        };
      }
      symbolCounts[lot.symbol].count++;
    });

    // Sort by count descending
    const sortedSymbols = Object.keys(symbolCounts).sort((a, b) => symbolCounts[b].count - symbolCounts[a].count);

    sortedSymbols.forEach(symbol => {
      console.log(`${symbol.padEnd(10)} ${String(symbolCounts[symbol].count).padStart(3)} lots  (account ${symbolCounts[symbol].account})`);
    });

    console.log(`\nTotal: ${result.lots.length} lots across ${sortedSymbols.length} symbols`);

    // Show account 68411173 specifically
    console.log('\n=== ACCOUNT 68411173 SPECIFICALLY ===\n');
    const account68411173 = result.lots.filter(lot => lot.accountNumber === '68411173');
    const symbolsIn68411173 = {};
    account68411173.forEach(lot => {
      if (!symbolsIn68411173[lot.symbol]) symbolsIn68411173[lot.symbol] = 0;
      symbolsIn68411173[lot.symbol]++;
    });

    Object.keys(symbolsIn68411173).sort().forEach(symbol => {
      console.log(`${symbol.padEnd(10)} ${symbolsIn68411173[symbol]} lots`);
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

analyzeLots();
