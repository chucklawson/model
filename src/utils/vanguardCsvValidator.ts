// ============================================
// FILE: src/utils/vanguardCsvValidator.ts
// Vanguard CSV Validator
// ============================================

import type {
  ParsedVanguardCSV,
  VanguardHolding,
  VanguardTransaction,
  VanguardValidationResult,
  VanguardValidationError,
  VanguardValidationWarning,
} from '../types';

// ===== VALIDATION RULES =====

/**
 * Validate parsed Vanguard CSV data
 */
export function validateVanguardCSV(data: ParsedVanguardCSV): VanguardValidationResult {
  const errors: VanguardValidationError[] = [];
  const warnings: VanguardValidationWarning[] = [];

  // Validate holdings
  data.holdings.forEach((holding, index) => {
    validateHolding(holding, index + 1, errors, warnings);
  });

  // Validate transactions
  data.transactions.forEach((transaction, index) => {
    validateTransaction(transaction, index + 1, errors, warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single holding
 */
function validateHolding(
  holding: VanguardHolding,
  rowNumber: number,
  errors: VanguardValidationError[],
  warnings: VanguardValidationWarning[]
): void {
  // Account number required
  if (!holding.accountNumber || holding.accountNumber.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'accountNumber',
      message: 'Account number is required',
      value: holding.accountNumber,
    });
  }

  // Symbol required
  if (!holding.symbol || holding.symbol.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'symbol',
      message: 'Symbol is required',
      value: holding.symbol,
    });
  }

  // Validate symbol format (basic check)
  if (holding.symbol && !isValidSymbol(holding.symbol)) {
    warnings.push({
      row: rowNumber,
      field: 'symbol',
      message: 'Symbol format may be invalid',
      value: holding.symbol,
    });
  }

  // Shares must be positive
  if (holding.shares <= 0) {
    errors.push({
      row: rowNumber,
      field: 'shares',
      message: 'Shares must be greater than 0',
      value: holding.shares,
    });
  }

  // Share price should be positive
  if (holding.sharePrice <= 0) {
    errors.push({
      row: rowNumber,
      field: 'sharePrice',
      message: 'Share price must be greater than 0',
      value: holding.sharePrice,
    });
  }

  // Total value should be positive
  if (holding.totalValue <= 0) {
    warnings.push({
      row: rowNumber,
      field: 'totalValue',
      message: 'Total value should be greater than 0',
      value: holding.totalValue,
    });
  }

  // Validate total value calculation
  const expectedTotal = holding.shares * holding.sharePrice;
  const difference = Math.abs(expectedTotal - holding.totalValue);
  const tolerance = 0.02; // 2 cents tolerance

  if (difference > tolerance) {
    warnings.push({
      row: rowNumber,
      field: 'totalValue',
      message: `Total value (${holding.totalValue}) doesn't match shares × price (${expectedTotal.toFixed(2)})`,
      value: holding.totalValue,
    });
  }
}

/**
 * Validate a single transaction
 */
function validateTransaction(
  transaction: VanguardTransaction,
  rowNumber: number,
  errors: VanguardValidationError[],
  warnings: VanguardValidationWarning[]
): void {
  // Account number required
  if (!transaction.accountNumber || transaction.accountNumber.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'accountNumber',
      message: 'Account number is required',
      value: transaction.accountNumber,
    });
  }

  // Trade date required
  if (!transaction.tradeDate || transaction.tradeDate.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'tradeDate',
      message: 'Trade date is required',
      value: transaction.tradeDate,
    });
  } else if (!isValidDate(transaction.tradeDate)) {
    errors.push({
      row: rowNumber,
      field: 'tradeDate',
      message: 'Trade date is not in valid format (YYYY-MM-DD)',
      value: transaction.tradeDate,
    });
  } else if (isFutureDate(transaction.tradeDate)) {
    errors.push({
      row: rowNumber,
      field: 'tradeDate',
      message: 'Trade date cannot be in the future',
      value: transaction.tradeDate,
    });
  }

  // Settlement date validation (if provided)
  if (transaction.settlementDate) {
    if (!isValidDate(transaction.settlementDate)) {
      errors.push({
        row: rowNumber,
        field: 'settlementDate',
        message: 'Settlement date is not in valid format (YYYY-MM-DD)',
        value: transaction.settlementDate,
      });
    }

    // Settlement should be >= trade date
    if (transaction.tradeDate && transaction.settlementDate < transaction.tradeDate) {
      errors.push({
        row: rowNumber,
        field: 'settlementDate',
        message: 'Settlement date cannot be before trade date',
        value: transaction.settlementDate,
      });
    }
  }

  // Transaction type required
  if (!transaction.transactionType || transaction.transactionType.trim() === '') {
    errors.push({
      row: rowNumber,
      field: 'transactionType',
      message: 'Transaction type is required',
      value: transaction.transactionType,
    });
  } else if (!isValidTransactionType(transaction.transactionType)) {
    warnings.push({
      row: rowNumber,
      field: 'transactionType',
      message: `Unknown transaction type: ${transaction.transactionType}`,
      value: transaction.transactionType,
    });
  }

  // Symbol required (except for cash-only transactions)
  if (!transaction.symbol || transaction.symbol.trim() === '') {
    if (!isCashTransaction(transaction.transactionType)) {
      errors.push({
        row: rowNumber,
        field: 'symbol',
        message: 'Symbol is required for security transactions',
        value: transaction.symbol,
      });
    }
  }

  // Validate transaction-specific rules
  if (transaction.transactionType === 'Buy') {
    validateBuyTransaction(transaction, rowNumber, errors, warnings);
  } else if (transaction.transactionType === 'Sell') {
    validateSellTransaction(transaction, rowNumber, errors, warnings);
  } else if (transaction.transactionType === 'Dividend' || transaction.transactionType === 'Reinvestment') {
    validateDividendTransaction(transaction, rowNumber, errors, warnings);
  }

  // Commissions and fees should be >= 0
  if (transaction.commissionsAndFees < 0) {
    errors.push({
      row: rowNumber,
      field: 'commissionsAndFees',
      message: 'Commissions and fees cannot be negative',
      value: transaction.commissionsAndFees,
    });
  }
}

/**
 * Validate buy transaction
 */
function validateBuyTransaction(
  transaction: VanguardTransaction,
  rowNumber: number,
  errors: VanguardValidationError[],
  warnings: VanguardValidationWarning[]
): void {
  // Shares should be positive for buys
  if (transaction.shares <= 0) {
    errors.push({
      row: rowNumber,
      field: 'shares',
      message: 'Shares must be positive for buy transactions',
      value: transaction.shares,
    });
  }

  // Share price should be present and positive
  if (!transaction.sharePrice || transaction.sharePrice <= 0) {
    errors.push({
      row: rowNumber,
      field: 'sharePrice',
      message: 'Share price must be positive for buy transactions',
      value: transaction.sharePrice,
    });
  }
}

/**
 * Validate sell transaction
 */
function validateSellTransaction(
  transaction: VanguardTransaction,
  rowNumber: number,
  errors: VanguardValidationError[],
  warnings: VanguardValidationWarning[]
): void {
  // Shares should be negative for sells
  if (transaction.shares >= 0) {
    errors.push({
      row: rowNumber,
      field: 'shares',
      message: 'Shares must be negative for sell transactions',
      value: transaction.shares,
    });
  }

  // Share price should be present and positive
  if (!transaction.sharePrice || transaction.sharePrice <= 0) {
    errors.push({
      row: rowNumber,
      field: 'sharePrice',
      message: 'Share price must be positive for sell transactions',
      value: transaction.sharePrice,
    });
  }
}

/**
 * Validate dividend transaction
 */
function validateDividendTransaction(
  transaction: VanguardTransaction,
  rowNumber: number,
  errors: VanguardValidationError[],
  warnings: VanguardValidationWarning[]
): void {
  // Net amount should be present for dividends
  if (transaction.netAmount === undefined || transaction.netAmount === 0) {
    warnings.push({
      row: rowNumber,
      field: 'netAmount',
      message: 'Dividend should have a non-zero net amount',
      value: transaction.netAmount,
    });
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Check if symbol is valid (basic validation)
 */
function isValidSymbol(symbol: string): boolean {
  if (!symbol) return false;

  // Allow: letters, numbers, hyphens, periods, spaces
  // Special case: "null" for bonds with CUSIP
  if (symbol.toLowerCase() === 'null') return true;
  if (symbol.toUpperCase() === 'CASH') return true;

  // 1-10 characters, alphanumeric with some special chars
  return /^[A-Z0-9\.\-\s]{1,10}$/i.test(symbol);
}

/**
 * Check if date is valid YYYY-MM-DD format
 */
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;

  // Check format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  // Check if parseable as valid date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Check if date is in the future
 */
function isFutureDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Compare only dates, not times

  return date > now;
}

/**
 * Check if transaction type is valid
 */
function isValidTransactionType(type: string): boolean {
  const validTypes = [
    'Buy',
    'Sell',
    'Dividend',
    'Reinvestment',
    'Interest',
    'Corp Action (Redemption)',
    'Funds Received',
    'Withdrawal',
    'Transfer (incoming)',
    'Transfer (Outgoing)',
    'Sweep in',
    'Sweep out',
  ];

  return validTypes.includes(type);
}

/**
 * Check if transaction is cash-only (no symbol required)
 */
function isCashTransaction(type: string): boolean {
  const cashTypes = [
    'Funds Received',
    'Withdrawal',
    'Transfer (incoming)',
    'Transfer (Outgoing)',
  ];

  return cashTypes.includes(type);
}

/**
 * Get validation summary
 */
export function getValidationSummary(result: VanguardValidationResult): string {
  if (result.isValid) {
    return 'Validation passed with no errors.';
  }

  const errorCount = result.errors.length;
  const warningCount = result.warnings.length;

  const parts: string[] = [];

  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
  }

  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  }

  return `Validation failed: ${parts.join(', ')}.`;
}
