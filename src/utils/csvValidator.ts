// ============================================
// FILE: src/utils/csvValidator.ts
// CSV Validation Utility
// ============================================

import type {
  ParsedCSVRow,
  ParsedCSVData,
  ValidationResult,
  FieldError,
  Ticker,
  TickerLot,
  Portfolio,
} from '../types';

/**
 * Validate all CSV data
 */
export function validateCSVData(
  data: ParsedCSVData,
  existingLots: TickerLot[],
  existingPortfolios: Portfolio[]
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const portfolioNames = new Set(existingPortfolios.map(p => p.name.toLowerCase()));

  for (const row of data.rows) {
    const errors = validateRow(row, portfolioNames);

    let status: 'valid' | 'duplicate' | 'invalid';
    let isDuplicate = false;
    let duplicateReason: string | undefined;

    if (errors.length > 0) {
      status = 'invalid';
    } else {
      // Check for duplicates
      const duplicate = isDuplicateLot(row, existingLots);
      if (duplicate) {
        status = 'duplicate';
        isDuplicate = true;
        duplicateReason = `Identical lot already exists (same ticker, shares, cost, and date)`;
      } else {
        status = 'valid';
      }
    }

    results.push({
      row,
      status,
      errors,
      isDuplicate,
      duplicateReason,
    });
  }

  return results;
}

/**
 * Validate a single row
 */
export function validateRow(
  row: ParsedCSVRow,
  existingPortfolioNames: Set<string>
): FieldError[] {
  const errors: FieldError[] = [];

  // Validate ticker
  if (!row.ticker || row.ticker.trim() === '') {
    errors.push({
      field: 'ticker',
      message: 'Ticker symbol is required',
    });
  } else if (!/^[A-Z]{1,10}$/.test(row.ticker)) {
    errors.push({
      field: 'ticker',
      message: 'Ticker must be 1-10 uppercase letters',
    });
  }

  // Validate shares
  if (isNaN(row.shares) || row.shares <= 0) {
    errors.push({
      field: 'shares',
      message: 'Shares must be a positive number',
    });
  }

  // Validate cost per share
  if (isNaN(row.costPerShare) || row.costPerShare <= 0) {
    errors.push({
      field: 'costPerShare',
      message: 'Cost per share must be a positive number',
    });
  }

  // Validate purchase date
  const dateError = validateDateField(row.purchaseDate);
  if (dateError) {
    errors.push({
      field: 'purchaseDate',
      message: dateError,
    });
  }

  // Validate portfolios
  if (!row.portfolios || row.portfolios.length === 0) {
    errors.push({
      field: 'portfolios',
      message: 'At least one portfolio is required',
    });
  } else {
    // Check for non-existent portfolios (warning, not error)
    const missingPortfolios = row.portfolios.filter(
      p => !existingPortfolioNames.has(p.toLowerCase())
    );
    if (missingPortfolios.length > 0) {
      // This is just a warning - portfolios will be auto-created
      // We don't add it as an error
    }
  }

  // Validate base yield (if provided)
  if (row.baseYield !== undefined) {
    if (isNaN(row.baseYield) || row.baseYield < 0) {
      errors.push({
        field: 'baseYield',
        message: 'Base yield must be 0 or a positive number',
      });
    }
  }

  return errors;
}

/**
 * Validate date field
 */
function validateDateField(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') {
    return 'Purchase date is required';
  }

  // Check if date is in YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 'Date must be in YYYY-MM-DD format (e.g., 2024-01-15)';
  }

  // Parse and validate date
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return 'Invalid date';
  }

  // Check if date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date > today) {
    return 'Purchase date cannot be in the future';
  }

  // Check for reasonable date (not before 1900)
  if (year < 1900) {
    return 'Purchase date seems too far in the past';
  }

  return null;
}

/**
 * Check if a lot is a duplicate of an existing lot
 */
export function isDuplicateLot(row: ParsedCSVRow, existingLots: TickerLot[]): boolean {
  return existingLots.some(lot => {
    // Match on: ticker, shares, costPerShare, purchaseDate
    const tickerMatch = lot.ticker.toLowerCase() === row.ticker.toLowerCase();
    const sharesMatch = Math.abs(lot.shares - row.shares) < 0.000001; // Float comparison
    const costMatch = Math.abs(lot.costPerShare - row.costPerShare) < 0.01; // Within 1 cent
    const dateMatch = lot.purchaseDate === row.purchaseDate;

    return tickerMatch && sharesMatch && costMatch && dateMatch;
  });
}

/**
 * Get summary statistics from validation results
 */
export function getValidationSummary(results: ValidationResult[]): {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  missingPortfolios: Set<string>;
} {
  const missingPortfolios = new Set<string>();

  const valid = results.filter(r => r.status === 'valid').length;
  const duplicates = results.filter(r => r.status === 'duplicate').length;
  const invalid = results.filter(r => r.status === 'invalid').length;

  return {
    total: results.length,
    valid,
    duplicates,
    invalid,
    missingPortfolios,
  };
}

/**
 * Get all unique portfolios mentioned in CSV that don't exist
 */
export function getMissingPortfolios(
  data: ParsedCSVData,
  existingPortfolios: Portfolio[]
): string[] {
  const existingNames = new Set(existingPortfolios.map(p => p.name.toLowerCase()));
  const allPortfolios = new Set<string>();

  for (const row of data.rows) {
    for (const portfolio of row.portfolios) {
      if (!existingNames.has(portfolio.toLowerCase()) && portfolio.trim()) {
        allPortfolios.add(portfolio);
      }
    }
  }

  return Array.from(allPortfolios).sort();
}

/**
 * Get all unique tickers mentioned in CSV
 */
export function getUniqueTickers(data: ParsedCSVData): string[] {
  const tickers = new Set<string>();

  for (const row of data.rows) {
    if (row.ticker && row.ticker.trim()) {
      tickers.add(row.ticker.toUpperCase());
    }
  }

  return Array.from(tickers).sort();
}

/**
 * Check if a ticker already exists
 */
export function tickerExists(ticker: string, existingTickers: Ticker[]): boolean {
  return existingTickers.some(t => t.symbol.toLowerCase() === ticker.toLowerCase());
}
