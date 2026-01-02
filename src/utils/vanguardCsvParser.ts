// ============================================
// FILE: src/utils/vanguardCsvParser.ts
// Vanguard CSV Parser - Handles Two-Section Format
// ============================================

import type {
  VanguardTransaction,
  VanguardHolding,
  ParsedVanguardCSV,
  SectionBoundaries,
} from '../types';
import { parseCSVLine } from './csvParser';

// ===== COLUMN MAPPINGS =====

const HOLDINGS_COLUMNS = {
  'accountnumber': 'accountNumber',
  'investmentname': 'investmentName',
  'symbol': 'symbol',
  'shares': 'shares',
  'shareprice': 'sharePrice',
  'totalvalue': 'totalValue',
};

const TRANSACTION_COLUMNS = {
  'accountnumber': 'accountNumber',
  'tradedate': 'tradeDate',
  'settlementdate': 'settlementDate',
  'transactiontype': 'transactionType',
  'transactiondescription': 'transactionDescription',
  'investmentname': 'investmentName',
  'symbol': 'symbol',
  'shares': 'shares',
  'shareprice': 'sharePrice',
  'principalamount': 'principalAmount',
  'commissionsandfees': 'commissionsAndFees',
  'netamount': 'netAmount',
  'accruedinterest': 'accruedInterest',
  'accounttype': 'accountType',
};

// ===== MAIN PARSING FUNCTIONS =====

/**
 * Parse Vanguard CSV file (both File object and text)
 */
export async function parseVanguardCSVFile(file: File): Promise<ParsedVanguardCSV> {
  const text = await file.text();
  return parseVanguardCSV(text);
}

/**
 * Parse Vanguard CSV text
 * Handles two-section format: holdings snapshot + transaction history
 */
export function parseVanguardCSV(csvText: string): ParsedVanguardCSV {
  const lines = csvText.trim().split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Detect section boundaries
  const boundaries = detectSectionBoundary(lines);

  // Parse holdings section
  const holdings = parseHoldingsSection(
    lines.slice(boundaries.holdingsStart, boundaries.holdingsEnd + 1)
  );

  // Parse transactions section
  const transactions = parseTransactionsSection(
    lines.slice(boundaries.transactionsStart, boundaries.transactionsEnd + 1)
  );

  return {
    holdings,
    transactions,
    parseDate: new Date().toISOString(),
  };
}

/**
 * Detect where holdings section ends and transactions section begins
 */
export function detectSectionBoundary(lines: string[]): SectionBoundaries {
  let holdingsStart = -1;
  let holdingsEnd = -1;
  let transactionsStart = -1;
  const transactionsEnd = lines.length - 1;

  // Look for transactions header first (more specific)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Transactions header pattern (check for transaction-specific fields)
    if (line.includes('account number') &&
        line.includes('trade date') &&
        line.includes('settlement date') &&
        line.includes('transaction type')) {
      transactionsStart = i;
      break;
    }
  }

  // Look for holdings header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();

    // Holdings header pattern (must NOT be the transactions header)
    if (line.includes('account number') &&
        line.includes('investment name') &&
        line.includes('symbol') &&
        line.includes('shares') &&
        line.includes('share price') &&
        !line.includes('trade date')) { // Exclude transaction headers
      holdingsStart = i;

      // Holdings end is just before transactions start (or end of file)
      if (transactionsStart >= 0) {
        // Find last non-empty line before transactions
        for (let j = transactionsStart - 1; j > holdingsStart; j--) {
          if (lines[j].trim().length > 0 && !isBlankRow(lines[j])) {
            holdingsEnd = j;
            break;
          }
        }
      } else {
        // No transactions section, holdings go to end
        holdingsEnd = lines.length - 1;
      }
      break;
    }
  }

  // If we didn't find holdings but found transactions (transactions only)
  if (holdingsStart === -1 && transactionsStart >= 0) {
    return {
      holdingsStart: 0,
      holdingsEnd: -1, // No holdings
      transactionsStart,
      transactionsEnd,
    };
  }

  // If we found holdings but no transactions (holdings only)
  if (holdingsStart >= 0 && transactionsStart === -1) {
    return {
      holdingsStart,
      holdingsEnd: lines.length - 1,
      transactionsStart: lines.length,
      transactionsEnd: lines.length, // Past the end (no transactions)
    };
  }

  // If we found neither section, throw error
  if (holdingsStart === -1 && transactionsStart === -1) {
    throw new Error('Could not detect Vanguard CSV format. File must contain either holdings or transactions sections.');
  }

  return {
    holdingsStart,
    holdingsEnd,
    transactionsStart,
    transactionsEnd,
  };
}

/**
 * Check if a row is blank (only commas and whitespace)
 */
function isBlankRow(line: string): boolean {
  const cleaned = line.replace(/,/g, '').trim();
  return cleaned.length === 0;
}

/**
 * Parse holdings section
 */
export function parseHoldingsSection(lines: string[]): VanguardHolding[] {
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const normalizedHeaders = normalizeHeaders(headers, HOLDINGS_COLUMNS);

  const holdings: VanguardHolding[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isBlankRow(line)) continue;

    try {
      const values = parseCSVLine(line);

      // Skip if not enough values
      if (values.filter(v => v.trim()).length < 3) continue;

      const holding = parseHoldingRow(values, normalizedHeaders);
      holdings.push(holding);
    } catch (error) {
      // Log error but continue parsing
      console.warn(`Error parsing holding row ${i}:`, error);
    }
  }

  return holdings;
}

/**
 * Parse transactions section
 */
export function parseTransactionsSection(lines: string[]): VanguardTransaction[] {
  if (lines.length === 0) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const normalizedHeaders = normalizeHeaders(headers, TRANSACTION_COLUMNS);

  const transactions: VanguardTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || isBlankRow(line)) continue;

    try {
      const values = parseCSVLine(line);

      // Skip if not enough values
      if (values.filter(v => v.trim()).length < 5) continue;

      const transaction = parseTransactionRow(values, normalizedHeaders);
      transactions.push(transaction);
    } catch (error) {
      // Log error but continue parsing
      console.warn(`Error parsing transaction row ${i}:`, error);
    }
  }

  return transactions;
}

// ===== HELPER FUNCTIONS =====

/**
 * Normalize header names to standard field names
 */
function normalizeHeaders(
  headers: string[],
  columnMapping: Record<string, string>
): Record<string, number> {
  const normalized: Record<string, number> = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim().replace(/\s+/g, '');
    const mappedName = columnMapping[header];

    if (mappedName) {
      normalized[mappedName] = i;
    }
  }

  return normalized;
}

/**
 * Get value from row by field name
 */
function getValue(
  values: string[],
  normalizedHeaders: Record<string, number>,
  field: string
): string {
  const index = normalizedHeaders[field];
  return index !== undefined ? (values[index] || '').trim() : '';
}

/**
 * Parse a single holding row
 */
function parseHoldingRow(
  values: string[],
  normalizedHeaders: Record<string, number>
): VanguardHolding {
  return {
    accountNumber: getValue(values, normalizedHeaders, 'accountNumber'),
    investmentName: getValue(values, normalizedHeaders, 'investmentName'),
    symbol: getValue(values, normalizedHeaders, 'symbol'),
    shares: parseFloat(getValue(values, normalizedHeaders, 'shares')) || 0,
    sharePrice: parseFloat(getValue(values, normalizedHeaders, 'sharePrice')) || 0,
    totalValue: parseFloat(getValue(values, normalizedHeaders, 'totalValue')) || 0,
  };
}

/**
 * Parse a single transaction row
 */
function parseTransactionRow(
  values: string[],
  normalizedHeaders: Record<string, number>
): VanguardTransaction {
  const symbolValue = getValue(values, normalizedHeaders, 'symbol');

  // Helper to parse numeric fields (returns undefined for empty, preserves 0)
  const parseNumeric = (field: string): number | undefined => {
    const value = getValue(values, normalizedHeaders, field);
    if (!value) return undefined;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  };

  return {
    accountNumber: getValue(values, normalizedHeaders, 'accountNumber'),
    tradeDate: parseDateField(getValue(values, normalizedHeaders, 'tradeDate')),
    settlementDate: parseDateField(getValue(values, normalizedHeaders, 'settlementDate')) || undefined,
    transactionType: getValue(values, normalizedHeaders, 'transactionType'),
    transactionDescription: getValue(values, normalizedHeaders, 'transactionDescription') || undefined,
    investmentName: getValue(values, normalizedHeaders, 'investmentName') || undefined,
    symbol: symbolValue || 'CASH', // Default to CASH for cash transactions
    shares: parseNumeric('shares') ?? 0,
    sharePrice: parseNumeric('sharePrice'),
    principalAmount: parseNumeric('principalAmount'),
    commissionsAndFees: parseNumeric('commissionsAndFees') ?? 0,
    netAmount: parseNumeric('netAmount'),
    accruedInterest: parseNumeric('accruedInterest') ?? 0, // Default to 0 instead of undefined
    accountType: getValue(values, normalizedHeaders, 'accountType') || undefined,
  };
}

/**
 * Parse date field - supports multiple formats
 */
function parseDateField(dateStr: string): string {
  if (!dateStr) return '';

  dateStr = dateStr.trim();

  // Check if already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try parsing M/D/YYYY or MM/DD/YYYY format
  const mdyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdyMatch) {
    const month = mdyMatch[1].padStart(2, '0');
    const day = mdyMatch[2].padStart(2, '0');
    const year = mdyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try parsing YYYY/MM/DD format
  const ymdMatch = dateStr.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Return as-is if format not recognized
  return dateStr;
}

/**
 * Validate file size
 */
export function validateVanguardFileSize(file: File): void {
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  if (file.size > MAX_SIZE) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum limit of 10MB. ` +
      `Please reduce the file size or split it into multiple files.`
    );
  }
}
