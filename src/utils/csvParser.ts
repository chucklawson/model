// ============================================
// FILE: src/utils/csvParser.ts
// CSV Parsing Utility
// ============================================

import type { ParsedCSVRow, ParsedCSVData } from '../types';

// Column name mappings (case-insensitive)
const COLUMN_MAPPINGS: { [key: string]: string } = {
  // Ticker column
  ticker: 'ticker',
  symbol: 'ticker',

  // Company name column
  companyname: 'companyName',
  company: 'companyName',
  name: 'companyName',

  // Base yield column
  baseyield: 'baseYield',
  yield: 'baseYield',

  // Shares column
  shares: 'shares',
  quantity: 'shares',
  qty: 'shares',

  // Cost per share column
  costpershare: 'costPerShare',
  cost: 'costPerShare',
  price: 'costPerShare',

  // Purchase date column
  purchasedate: 'purchaseDate',
  date: 'purchaseDate',

  // Portfolio column
  portfolios: 'portfolios',
  portfolio: 'portfolios',

  // Calculate P/L column
  calculatepl: 'calculateAccumulatedProfitLoss',
  calculateaccumulatedprofitloss: 'calculateAccumulatedProfitLoss',
  calculateprofitloss: 'calculateAccumulatedProfitLoss',

  // Dividend flag column
  isdividend: 'isDividend',
  dividend: 'isDividend',
  dividendreinvestment: 'isDividend',

  // Notes column
  notes: 'notes',
  note: 'notes',
  comments: 'notes',
};

/**
 * Parse a CSV file and return structured data
 */
export async function parseCSVFile(file: File): Promise<ParsedCSVData> {
  const text = await file.text();
  return parseCSVText(text);
}

/**
 * Parse CSV text and return structured data
 */
export function parseCSVText(csvText: string): ParsedCSVData {
  const lines = csvText.trim().split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const normalizedHeaders = normalizeHeaders(headers);

  // Validate required columns
  validateRequiredColumns(normalizedHeaders);

  // Parse data rows
  const rows: ParsedCSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const row = parseRow(values, normalizedHeaders, i, line);
      rows.push(row);
    } catch (_error) {
      // Include row with error for validation to catch
      rows.push({
        ticker: '',
        shares: 0,
        costPerShare: 0,
        purchaseDate: '',
        portfolios: [],
        rowIndex: i,
        originalRow: line,
      });
    }
  }

  return {
    rows,
    headers,
    totalRows: rows.length,
  };
}

/**
 * Parse a single CSV line, handling quoted fields
 */
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add last value
  values.push(currentValue.trim());

  return values;
}

/**
 * Normalize header names to standard field names
 */
function normalizeHeaders(headers: string[]): { [key: string]: number } {
  const normalized: { [key: string]: number } = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase().trim().replace(/\s+/g, '');
    const mappedName = COLUMN_MAPPINGS[header];

    if (mappedName) {
      normalized[mappedName] = i;
    }
  }

  return normalized;
}

/**
 * Validate that required columns are present
 */
function validateRequiredColumns(normalizedHeaders: { [key: string]: number }): void {
  const required = ['ticker', 'shares', 'costPerShare', 'purchaseDate', 'portfolios'];
  const missing: string[] = [];

  for (const field of required) {
    if (!(field in normalizedHeaders)) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing.join(', ')}. ` +
      `Please ensure your CSV has columns for: Ticker, Shares/Quantity, Cost/Price, Date, and Portfolio.`
    );
  }
}

/**
 * Parse a single data row
 */
function parseRow(
  values: string[],
  normalizedHeaders: { [key: string]: number },
  rowIndex: number,
  originalRow: string
): ParsedCSVRow {
  // Helper to get value by field name
  const getValue = (field: string): string => {
    const index = normalizedHeaders[field];
    return index !== undefined ? values[index] || '' : '';
  };

  // Parse required fields
  const ticker = getValue('ticker').toUpperCase().trim();
  const shares = parseFloat(getValue('shares'));
  const costPerShare = parseFloat(getValue('costPerShare'));
  const purchaseDate = parseDateField(getValue('purchaseDate'));
  const portfolios = parsePortfolioField(getValue('portfolios'));

  // Parse optional fields
  const companyName = getValue('companyName') || undefined;
  const baseYield = getValue('baseYield') ? parseFloat(getValue('baseYield')) : undefined;
  const calculateAccumulatedProfitLoss = parseBooleanField(getValue('calculateAccumulatedProfitLoss'));
  const isDividend = parseBooleanField(getValue('isDividend'));
  const notes = getValue('notes') || undefined;

  return {
    ticker,
    companyName,
    baseYield,
    shares,
    costPerShare,
    purchaseDate,
    portfolios,
    calculateAccumulatedProfitLoss,
    isDividend,
    notes,
    rowIndex,
    originalRow,
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

  // Return as-is if format not recognized (validation will catch this)
  return dateStr;
}

/**
 * Parse portfolio field - supports pipe-separated values
 */
export function parsePortfolioField(portfolioStr: string): string[] {
  if (!portfolioStr) return [];

  // Split by pipe and trim whitespace
  const portfolios = portfolioStr
    .split('|')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return portfolios;
}

/**
 * Parse boolean field - supports various formats
 */
function parseBooleanField(value: string): boolean | undefined {
  if (!value) return undefined;

  const lower = value.toLowerCase().trim();

  if (lower === 'true' || lower === 'yes' || lower === '1') return true;
  if (lower === 'false' || lower === 'no' || lower === '0') return false;

  return undefined;
}

/**
 * Validate file size and row count limits
 */
export function validateFileSize(file: File): void {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (file.size > MAX_SIZE) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the maximum limit of 5MB. ` +
      `Please reduce the file size or split it into multiple files.`
    );
  }
}

/**
 * Validate row count limit
 */
export function validateRowCount(data: ParsedCSVData): void {
  const MAX_ROWS = 1000;

  if (data.totalRows > MAX_ROWS) {
    throw new Error(
      `CSV contains ${data.totalRows} rows, which exceeds the maximum limit of ${MAX_ROWS}. ` +
      `Please split the file into smaller files.`
    );
  }
}
