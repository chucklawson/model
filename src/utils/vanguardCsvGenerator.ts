import type { VanguardPdfTransaction } from './vanguardPdfTypes';

/**
 * Data cleaning utilities for converting PDF data to CSV format
 */
class DataCleaner {
  /**
   * Clean currency string: "$1,785.9900" → "1785.99"
   */
  static cleanCurrency(value: string): string {
    if (!value || value === '—' || value.trim() === '') {
      return '0';
    }

    if (value.toLowerCase() === 'free') {
      return '0';
    }

    // Remove $, commas, convert to float
    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      return '0';
    }

    return num.toFixed(2);
  }

  /**
   * Clean numeric string for shares: "3.0000" → "3.00000"
   */
  static cleanShares(value: string): string {
    if (!value || value === '—' || value.trim() === '') {
      return '0.00000';
    }

    const num = parseFloat(value);

    if (isNaN(num)) {
      return '0.00000';
    }

    return num.toFixed(5);
  }

  /**
   * Format date: "11/25/2025" → "2025-11-25"
   */
  static formatDate(dateStr: string): string {
    const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (!match) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    const [_, month, day, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  /**
   * Clean symbol: "—" → "CASH", else keep as-is
   */
  static cleanSymbol(symbol: string): string {
    if (!symbol || symbol === '—' || symbol.trim() === '') {
      return 'CASH';
    }
    return symbol.trim();
  }

  /**
   * Clean share price (return empty string if missing, not 0)
   */
  static cleanPrice(value: string): string {
    if (!value || value === '—' || value.trim() === '' || value.toLowerCase() === 'free') {
      return '';
    }

    const cleaned = value.replace(/[$,]/g, '');
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      return '';
    }

    return num.toFixed(4);
  }
}

/**
 * Calculate Principal Amount based on transaction type
 *
 * @param transactionType - Type of transaction
 * @param netAmount - Net amount (from Amount column in PDF)
 * @param commissions - Commissions and fees
 * @returns Principal Amount
 */
function calculatePrincipalAmount(
  transactionType: string,
  netAmount: number,
  commissions: number
): number {
  const lowerType = transactionType.toLowerCase();

  if (lowerType.includes('buy')) {
    // For buys, principal is net minus fees (both negative)
    return netAmount - commissions;
  } else if (lowerType.includes('sell')) {
    // For sells, principal is net plus fees (both positive)
    return netAmount + commissions;
  } else {
    // For other types (dividend, etc.), principal equals net
    return netAmount;
  }
}

/**
 * Escape CSV field if it contains commas, quotes, or newlines
 */
function escapeCsvField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Generate VanguardCSV format from parsed PDF transactions
 *
 * @param accountNumber - Vanguard account number
 * @param transactions - Array of parsed PDF transactions
 * @returns CSV string in VanguardCSV format
 */
export function generateVanguardCSV(
  accountNumber: string,
  transactions: VanguardPdfTransaction[]
): string {
  // CSV Header for transactions section
  const header = 'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,';

  const rows: string[] = [header];

  for (const txn of transactions) {
    try {
      // Clean and format each field
      const tradeDate = DataCleaner.formatDate(txn.tradeDate);
      const settlementDate = DataCleaner.formatDate(txn.settlementDate);
      const symbol = DataCleaner.cleanSymbol(txn.symbol);
      const shares = DataCleaner.cleanShares(txn.shares);
      const sharePrice = DataCleaner.cleanPrice(txn.price);
      const commissionsStr = DataCleaner.cleanCurrency(txn.commission);
      const netAmountStr = DataCleaner.cleanCurrency(txn.amount);

      // Convert to numbers for calculation
      const commissions = parseFloat(commissionsStr);
      const netAmount = parseFloat(netAmountStr);

      // Calculate principal amount
      const principalAmount = calculatePrincipalAmount(
        txn.transactionType,
        netAmount,
        commissions
      );

      // Build CSV row
      const row = [
        accountNumber,                                  // Account Number
        tradeDate,                                      // Trade Date
        settlementDate,                                 // Settlement Date
        escapeCsvField(txn.transactionType),           // Transaction Type
        '',                                             // Transaction Description (not in PDF)
        escapeCsvField(txn.investmentName),            // Investment Name
        symbol,                                         // Symbol
        shares,                                         // Shares
        sharePrice,                                     // Share Price
        principalAmount.toFixed(2),                     // Principal Amount
        commissionsStr,                                 // Commissions and Fees
        netAmountStr,                                   // Net Amount
        '0.0',                                          // Accrued Interest (not in PDF)
        txn.accountType,                                // Account Type
        '',                                             // Trailing comma to match format
      ];

      rows.push(row.join(','));
    } catch (error) {
      console.warn(`Warning: Skipping transaction due to error: ${error}`);
      console.warn(`Transaction: ${JSON.stringify(txn)}`);
    }
  }

  return rows.join('\n');
}
