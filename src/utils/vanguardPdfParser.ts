import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import type { VanguardPdfTransaction, VanguardPdfData } from './vanguardPdfTypes';

/**
 * Parse account number from PDF header
 * Format: "Charles Thomas Lawson — Brokerage Account — 68411173*"
 */
function parseAccountNumber(text: string): string {
  const accountMatch = text.match(/Brokerage Account\s*—\s*(\d+)\*/);
  if (accountMatch) {
    return accountMatch[1];
  }
  throw new Error('Could not find account number in PDF header');
}

/**
 * Check if a line starts a new transaction (begins with two dates)
 */
function isTransactionStart(line: string): boolean {
  const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}\/\d{1,2}\/\d{4}/;
  return datePattern.test(line.trim());
}

/**
 * Parse a complete transaction text (may span multiple lines)
 */
function parseTransaction(text: string): VanguardPdfTransaction | null {
  // Join all parts into one string, normalizing whitespace
  let normalized = text.trim().replace(/\s+/g, ' ');

  // Fix wrapped numbers: if a single digit follows a dollar amount, concatenate them
  // e.g., "$595.330 0" becomes "$595.3300"
  normalized = normalized.replace(/(\$\d+\.\d+)\s+(\d)(\s|$)/g, '$1$2$3');

  // Fix split account type: "MARGI N" -> "MARGIN"
  normalized = normalized.replace(/MARGI\s+N\b/g, 'MARGIN');

  // Pattern to match two dates at the start
  const datePattern = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+)$/;
  const dateMatch = normalized.match(datePattern);

  if (!dateMatch) {
    return null;
  }

  const settlementDate = dateMatch[1];
  const tradeDate = dateMatch[2];
  const remainder = dateMatch[3];

  // Split remainder by single spaces and reconstruct fields
  const tokens = remainder.split(/\s+/);

  let symbol = '';
  let investmentName = '';
  let transactionType = '';
  let accountType = '';
  let shares = '';
  let price = '';
  let commission = '';
  let amount = '';

  let i = 0;

  // Symbol (short uppercase or —)
  if (i < tokens.length && (tokens[i] === '—' || /^[A-Z]{1,10}$/i.test(tokens[i]))) {
    symbol = tokens[i++];
  }

  // Investment name - accumulate until we hit a transaction type keyword
  const transactionTypeKeywords = ['Buy', 'Sell', 'Dividend', 'Reinvestment', 'Interest',
    'Funds', 'Withdrawal', 'Transfer', 'Sweep', 'Corp', 'Withholding', 'Fee'];

  const nameTokens: string[] = [];
  while (i < tokens.length) {
    // Check if this token starts a transaction type
    if (transactionTypeKeywords.some(keyword => tokens[i] === keyword)) {
      break;
    }
    // Also stop if we hit account type
    if (tokens[i] === 'CASH' || tokens[i] === 'MARGIN') {
      // Only stop if this looks like it's the account type field (followed by numeric or —)
      if (i + 1 < tokens.length && (tokens[i + 1] === '—' || /^-?\d/.test(tokens[i + 1]) || tokens[i + 1].startsWith('$'))) {
        break;
      }
    }
    nameTokens.push(tokens[i++]);
  }

  investmentName = nameTokens.join(' ');

  // Transaction type (might be multi-word)
  if (i < tokens.length) {
    transactionType = tokens[i++];
    if (transactionType === 'Funds' && i < tokens.length && tokens[i] === 'Received') {
      transactionType += ' ' + tokens[i++];
    } else if (transactionType === 'Transfer' && i < tokens.length && tokens[i].startsWith('(')) {
      transactionType += ' ' + tokens[i++];
    } else if (transactionType === 'Sweep' && i < tokens.length && (tokens[i] === 'in' || tokens[i] === 'out')) {
      transactionType += ' ' + tokens[i++];
    } else if (transactionType === 'Corp' && i < tokens.length) {
      transactionType += ' ' + tokens[i++]; // Add "Action"
      // Handle parenthetical descriptions like "(Cash in Lieu)" or "(Spinoff)"
      if (i < tokens.length && tokens[i].startsWith('(')) {
        // Accumulate tokens until we find one ending with ')'
        while (i < tokens.length) {
          const token = tokens[i++];
          transactionType += ' ' + token;
          if (token.endsWith(')')) {
            break;
          }
        }
      }
    }
  }

  // Account type
  if (i < tokens.length && (tokens[i] === 'CASH' || tokens[i] === 'MARGIN')) {
    accountType = tokens[i++];
  }

  // Shares (numeric or —)
  if (i < tokens.length && (tokens[i] === '—' || /^-?\d+\.?\d*$/.test(tokens[i]))) {
    shares = tokens[i++];
  }

  // Price (starts with $ or is numeric or —)
  if (i < tokens.length) {
    const token = tokens[i];
    if (token === '—' || token.startsWith('$') || /^\d+\.?\d*$/.test(token)) {
      price = tokens[i++];
    }
  }

  // Commission (Free or $ or numeric or —)
  if (i < tokens.length) {
    const token = tokens[i];
    if (token === '—' || token === 'Free' || token.startsWith('$') || /^\d+\.?\d*$/.test(token)) {
      commission = tokens[i++];
    }
  }

  // Amount (rest of tokens, starts with - or $)
  if (i < tokens.length) {
    amount = tokens.slice(i).join(' ');
  }

  if (!transactionType) {
    return null;
  }

  return {
    settlementDate,
    tradeDate,
    symbol: symbol || '—',
    investmentName: investmentName || '',
    transactionType,
    accountType: accountType || 'CASH',
    shares: shares || '—',
    price: price || '—',
    commission: commission || '—',
    amount: amount || '—',
  };
}

/**
 * Parse Vanguard PDF and extract transactions
 *
 * @param pdfPath - Path to the PDF file
 * @returns Parsed account number and transactions
 */
export async function parseVanguardPdf(pdfPath: string): Promise<VanguardPdfData> {
  // Read PDF file
  const dataBuffer = fs.readFileSync(pdfPath);

  // Parse PDF using new pdf-parse v2.x API
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const text = result.text;

  // Clean up parser
  await parser.destroy();

  // Extract account number
  const accountNumber = parseAccountNumber(text);

  // Split text into lines
  const lines = text.split('\n');

  const transactions: VanguardPdfTransaction[] = [];

  // Accumulate lines that belong to the same transaction
  let currentTransactionLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines, headers, page markers, and disclosure text
    if (!trimmed ||
        trimmed.includes('Settlement') ||
        trimmed.includes('Custom report') ||
        trimmed.includes('Page ') ||
        trimmed.includes('--') ||
        trimmed.includes('continued') ||
        trimmed.includes('DISCLOSURES') ||
        trimmed.includes('This report only') ||
        trimmed.includes('Brokerage Account') ||
        trimmed.includes('Charles Thomas Lawson') ||
        trimmed === 'date' ||
        trimmed === 'type' ||
        trimmed === 'Accoun' ||
        trimmed === 't type' ||
        trimmed === 'Quantity Price Commissio' ||
        trimmed === 'n & fees**' ||
        trimmed === 'Amount' ||
        trimmed.startsWith('Trade date Symbol Name')) {
      // If we have accumulated transaction lines, this marker means we should parse it
      if (currentTransactionLines.length > 0 &&
          (trimmed.includes('This report only') ||
           trimmed.includes('Brokerage Account') ||
           trimmed === 'date')) {
        const transactionText = currentTransactionLines.join(' ');
        const transaction = parseTransaction(transactionText);
        if (transaction) {
          transactions.push(transaction);
        }
        currentTransactionLines = [];
      }
      continue;
    }

    // If this line starts a new transaction, parse the accumulated lines
    if (isTransactionStart(trimmed)) {
      if (currentTransactionLines.length > 0) {
        const transactionText = currentTransactionLines.join(' ');
        const transaction = parseTransaction(transactionText);
        if (transaction) {
          transactions.push(transaction);
        }
      }
      // Start new transaction accumulation
      currentTransactionLines = [trimmed];
    } else {
      // Accumulate this line into current transaction
      if (currentTransactionLines.length > 0) {
        currentTransactionLines.push(trimmed);
      }
    }
  }

  // Don't forget the last transaction
  if (currentTransactionLines.length > 0) {
    const transactionText = currentTransactionLines.join(' ');
    const transaction = parseTransaction(transactionText);
    if (transaction) {
      transactions.push(transaction);
    }
  }

  return {
    accountNumber,
    transactions,
  };
}
