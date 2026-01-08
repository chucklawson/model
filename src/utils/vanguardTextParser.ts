// ============================================
// Vanguard Text File Parser
// Converts Vanguard Realized Gains text to structured data
// ============================================

export interface VanguardLot {
  accountNumber: string;
  symbol: string;
  companyName: string;
  dateSold: string;
  dateAcquired: string;
  event: string;
  costBasisMethod: string;
  quantity: string;
  totalCost: string;
  proceeds: string;
  shortTermGainLoss: string;
  longTermGainLoss: string;
  totalGainLoss: string;
}

export interface ParsedVanguardText {
  lots: VanguardLot[];
  accountNumbers: string[];
  totalLots: number;
}

/**
 * Parse Vanguard Realized Gains text file
 */
export function parseVanguardText(content: string): ParsedVanguardText {
  const lines = content.split('\n');
  const lots: VanguardLot[] = [];
  const accountNumbers: string[] = [];

  let currentAccount = '';
  let currentSymbol = '';
  let currentCompanyName = '';
  let inLotDetails = false;
  let expectingCompanyName = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (line === '') {
      continue;
    }

    // Detect account number
    // Format examples:
    // "Charles Thomas Lawson – Brokerage Account – 68411173"
    // "Charles Thomas Lawson – Traditional IRA Account – 12345678"
    // "Charles Thomas Lawson – Roth IRA Account – 87654321"
    // Extract the account number (8 digits) that appears after any "Account" keyword
    if (line.includes('Account') && /\d{8}/.test(line)) {
      // Look for 8 consecutive digits anywhere in the line
      const accountMatch = line.match(/(\d{8})/);
      if (accountMatch) {
        currentAccount = accountMatch[1];
        if (!accountNumbers.includes(currentAccount)) {
          accountNumbers.push(currentAccount);
        }
      }
      continue;
    }

    // Detect section headers - reset state but don't change account
    if (line === 'STOCKS, OPTIONS, AND ETFS' || line === 'BROKERED CDS, BONDS') {
      inLotDetails = false;
      currentSymbol = '';
      currentCompanyName = '';
      expectingCompanyName = false;
      continue;
    }

    // Detect symbol - appears as all caps line (can have spaces like "BRK B")
    // Followed by company name on next line
    // Pattern: all uppercase letters/numbers/spaces, not too long
    // This can appear even when we're in lot details mode (signals new symbol)
    if (line.length > 0 && line.length <= 20 && /^[A-Z0-9 ]+$/.test(line)) {
      // Check if this could be a symbol (exclude known header text)
      if (!line.includes('STOCKS') && !line.includes('BONDS') && !line.includes('ETFS') &&
          !line.includes('Total') && !line.includes('HIDE') && !line.includes('Date')) {
        // This is likely a new symbol - exit previous symbol's lot details
        currentSymbol = line;
        expectingCompanyName = true;
        inLotDetails = false;
        continue;
      }
    }

    // Get company name (line after symbol)
    // Company name is typically longer than symbol or has different characteristics
    if (expectingCompanyName) {
      // Accept as company name if it's not a section header or "Hide lot details"
      if (!line.includes('STOCKS') && !line.includes('BONDS') && !line.includes('ETFS') &&
          line !== 'Hide lot details' && !line.includes('Date sold')) {
        currentCompanyName = line;
        expectingCompanyName = false;
        continue;
      }
    }

    // Skip summary line with totals (has multiple dollar amounts and numbers)
    // Pattern: " 60.0000 $25,967.06 $28,983.84 +$603.16 +$2,496.91 +$3,100.07"
    if (/^\d+\.\d+\s+\$[\d,]+\.\d+\s+\$[\d,]+\.\d+/.test(line)) {
      continue;
    }

    // Skip wash sale messages
    if (line.includes('wash sale') || line.includes('disallowed') || line.includes('More information')) {
      continue;
    }

    // Detect start of lot details
    if (line === 'Hide lot details') {
      inLotDetails = true;
      continue;
    }

    // Skip column header rows
    if (line.includes('Date sold') || line.includes('Dateacquired') || line.includes('Cost basismethod')) {
      continue;
    }

    // Skip "Wash sale icon" lines
    if (line.includes('Wash sale icon') || line.includes('Wash sale adjustments')) {
      continue;
    }

    // Parse lot detail lines
    // Format: "01/08/2025 08/15/2023 Sell First in, firstout (FIFO) 3.0000 $1,063.95 $1,351.64 — $287.69 $287.69"
    if (inLotDetails && currentSymbol) {
      // Check if this is a lot line (starts with date pattern MM/DD/YYYY)
      const datePattern = /^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.+)/;
      const match = line.match(datePattern);

      if (match) {
        const dateSold = match[1];
        const dateAcquired = match[2];
        const remainder = match[3];

        // Parse the remainder to extract event, method, quantity, amounts
        // Pattern: "Sell First in, firstout (FIFO) 3.0000 $1,063.95 $1,351.64 — $287.69 $287.69"

        // Extract event and method (everything up to the first decimal number)
        const eventMethodMatch = remainder.match(/^(.*?)(\d+\.\d+)/);
        if (eventMethodMatch) {
          const eventMethod = eventMethodMatch[1].trim();
          const quantity = eventMethodMatch[2];

          // Determine event type
          let event = 'Sell';
          let costBasisMethod = eventMethod;

          if (eventMethod.includes('Sell')) {
            event = 'Sell';
            costBasisMethod = eventMethod.replace('Sell', '').trim();
          } else if (eventMethod.includes('Redemption')) {
            event = 'Redemption';
            costBasisMethod = eventMethod.replace('Redemption', '').trim();
          }

          // Extract amounts after quantity
          const afterQuantity = remainder.substring(remainder.indexOf(quantity) + quantity.length).trim();
          const amounts = afterQuantity.split(/\s+/).filter(a => a.length > 0);

          // Amounts pattern: totalCost, proceeds, shortTerm, longTerm, total
          // "—" is used as placeholder for missing values
          let totalCost = '';
          let proceeds = '';
          let shortTermGainLoss = '';
          let longTermGainLoss = '';
          let totalGainLoss = '';

          if (amounts.length >= 5) {
            totalCost = amounts[0];
            proceeds = amounts[1];
            shortTermGainLoss = amounts[2] === '—' ? '' : amounts[2];
            longTermGainLoss = amounts[3] === '—' ? '' : amounts[3];
            totalGainLoss = amounts[4];
          } else if (amounts.length >= 3) {
            // Handle cases with fewer amounts
            totalCost = amounts[0];
            proceeds = amounts[1];

            // Find the "—" to determine which is missing
            const dashIndex = amounts.indexOf('—');
            if (dashIndex === 2) {
              // Short term is "—", so we have long term
              shortTermGainLoss = '';
              longTermGainLoss = amounts[3] || '';
              totalGainLoss = amounts[4] || amounts[3] || '';
            } else if (dashIndex === 3) {
              // Long term is "—", so we have short term
              shortTermGainLoss = amounts[2];
              longTermGainLoss = '';
              totalGainLoss = amounts[4] || amounts[2];
            } else {
              // No dash found, might be older format
              totalGainLoss = amounts[2];
            }
          }

          lots.push({
            accountNumber: currentAccount,
            symbol: currentSymbol,
            companyName: currentCompanyName,
            dateSold,
            dateAcquired,
            event,
            costBasisMethod,
            quantity,
            totalCost,
            proceeds,
            shortTermGainLoss,
            longTermGainLoss,
            totalGainLoss,
          });
        }
      } else if (line.includes('Total')) {
        // "Total" line at end of symbol's lots - exit lot details
        inLotDetails = false;
        currentSymbol = '';
        currentCompanyName = '';
      }
    }
  }

  return {
    lots,
    accountNumbers,
    totalLots: lots.length,
  };
}
