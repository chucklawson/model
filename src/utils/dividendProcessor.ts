// ============================================
// FILE: src/utils/dividendProcessor.ts
// Dividend Transaction Processor
// ============================================

import type { VanguardTransaction } from '../types';

// ===== TYPES =====

export interface ProcessedDividend {
  symbol: string;
  payDate: string;
  exDividendDate?: string;
  dividendPerShare?: number;
  totalDividend: number;
  shares: number;
  isReinvested: boolean;
  reinvestmentTransactionId?: string;
  reinvestmentTransaction?: VanguardTransaction;
  isQualified?: boolean;
  taxYear: number;
  accountNumber: string;
  originalTransaction: VanguardTransaction;
}

export interface DividendSummary {
  totalDividends: number;
  reinvestedDividends: number;
  cashDividends: number;
  dividendCount: number;
  reinvestmentCount: number;
  bySymbol: Record<string, {
    totalDividends: number;
    count: number;
  }>;
  byTaxYear: Record<number, {
    totalDividends: number;
    count: number;
  }>;
}

// ===== MAIN PROCESSING FUNCTION =====

/**
 * Process dividend and reinvestment transactions
 *
 * @param transactions - All transactions including dividends and reinvestments
 * @returns Array of processed dividend information
 */
export function processDividends(
  transactions: VanguardTransaction[]
): ProcessedDividend[] {
  const processed: ProcessedDividend[] = [];

  // Filter dividend transactions
  const dividendTxns = transactions.filter(t =>
    t.transactionType === 'Dividend' || t.transactionType === 'Interest'
  );

  // Filter reinvestment transactions
  const reinvestmentTxns = transactions.filter(t =>
    t.transactionType === 'Reinvestment'
  );

  // Process each dividend
  for (const divTxn of dividendTxns) {
    // Try to find corresponding reinvestment
    const reinvestment = findCorrespondingReinvestment(divTxn, reinvestmentTxns);

    const dividend = processSingleDividend(divTxn, reinvestment);
    processed.push(dividend);
  }

  return processed;
}

/**
 * Process a single dividend transaction
 */
function processSingleDividend(
  divTxn: VanguardTransaction,
  reinvestmentTxn?: VanguardTransaction
): ProcessedDividend {
  const totalDividend = Math.abs(divTxn.netAmount || divTxn.principalAmount || 0);
  const shares = divTxn.shares || 0;

  // Calculate dividend per share if we have shares info
  // Note: For dividends, shares is often 0 in Vanguard CSV
  const dividendPerShare = shares > 0 ? totalDividend / shares : undefined;

  const taxYear = new Date(divTxn.tradeDate).getFullYear();

  return {
    symbol: divTxn.symbol,
    payDate: divTxn.tradeDate,
    exDividendDate: divTxn.settlementDate,
    dividendPerShare,
    totalDividend,
    shares,
    isReinvested: !!reinvestmentTxn,
    reinvestmentTransactionId: reinvestmentTxn ? generateTransactionId(reinvestmentTxn) : undefined,
    reinvestmentTransaction: reinvestmentTxn,
    isQualified: undefined, // Would need additional data to determine this
    taxYear,
    accountNumber: divTxn.accountNumber,
    originalTransaction: divTxn,
  };
}

/**
 * Find corresponding reinvestment for a dividend
 */
function findCorrespondingReinvestment(
  dividendTxn: VanguardTransaction,
  reinvestmentTxns: VanguardTransaction[]
): VanguardTransaction | undefined {
  // Look for reinvestment on the same date, same symbol, same account
  // and with amount matching the dividend amount
  const divAmount = Math.abs(dividendTxn.netAmount || dividendTxn.principalAmount || 0);

  return reinvestmentTxns.find(r => {
    if (r.symbol !== dividendTxn.symbol) return false;
    if (r.accountNumber !== dividendTxn.accountNumber) return false;
    if (r.tradeDate !== dividendTxn.tradeDate) return false;

    // Check if reinvestment amount matches dividend amount (within tolerance)
    const reinvestAmount = Math.abs(r.netAmount || r.principalAmount || 0);
    const diff = Math.abs(reinvestAmount - divAmount);
    const tolerance = 0.02; // 2 cents tolerance

    return diff <= tolerance;
  });
}

/**
 * Generate a unique transaction ID for linking purposes
 */
function generateTransactionId(txn: VanguardTransaction): string {
  return `${txn.accountNumber}-${txn.tradeDate}-${txn.symbol}-${txn.transactionType}-${txn.shares}`;
}

// ===== SUMMARY FUNCTIONS =====

/**
 * Get summary statistics for dividends
 */
export function getDividendSummary(dividends: ProcessedDividend[]): DividendSummary {
  let totalDividends = 0;
  let reinvestedDividends = 0;
  let cashDividends = 0;
  let dividendCount = 0;
  let reinvestmentCount = 0;

  const bySymbol: Record<string, { totalDividends: number; count: number }> = {};
  const byTaxYear: Record<number, { totalDividends: number; count: number }> = {};

  for (const div of dividends) {
    totalDividends += div.totalDividend;
    dividendCount++;

    if (div.isReinvested) {
      reinvestedDividends += div.totalDividend;
      reinvestmentCount++;
    } else {
      cashDividends += div.totalDividend;
    }

    // By symbol
    if (!bySymbol[div.symbol]) {
      bySymbol[div.symbol] = { totalDividends: 0, count: 0 };
    }
    bySymbol[div.symbol].totalDividends += div.totalDividend;
    bySymbol[div.symbol].count++;

    // By tax year
    if (!byTaxYear[div.taxYear]) {
      byTaxYear[div.taxYear] = { totalDividends: 0, count: 0 };
    }
    byTaxYear[div.taxYear].totalDividends += div.totalDividend;
    byTaxYear[div.taxYear].count++;
  }

  return {
    totalDividends,
    reinvestedDividends,
    cashDividends,
    dividendCount,
    reinvestmentCount,
    bySymbol,
    byTaxYear,
  };
}

/**
 * Group dividends by symbol
 */
export function groupDividendsBySymbol(
  dividends: ProcessedDividend[]
): Record<string, ProcessedDividend[]> {
  const grouped: Record<string, ProcessedDividend[]> = {};

  for (const div of dividends) {
    if (!grouped[div.symbol]) {
      grouped[div.symbol] = [];
    }
    grouped[div.symbol].push(div);
  }

  return grouped;
}

/**
 * Group dividends by tax year
 */
export function groupDividendsByTaxYear(
  dividends: ProcessedDividend[]
): Record<number, ProcessedDividend[]> {
  const grouped: Record<number, ProcessedDividend[]> = {};

  for (const div of dividends) {
    if (!grouped[div.taxYear]) {
      grouped[div.taxYear] = [];
    }
    grouped[div.taxYear].push(div);
  }

  return grouped;
}

/**
 * Filter dividends by tax year
 */
export function filterDividendsByTaxYear(
  dividends: ProcessedDividend[],
  taxYear: number
): ProcessedDividend[] {
  return dividends.filter(div => div.taxYear === taxYear);
}

/**
 * Get total dividend income for tax year
 */
export function getTotalDividendIncome(
  dividends: ProcessedDividend[],
  taxYear: number
): number {
  return dividends
    .filter(div => div.taxYear === taxYear)
    .reduce((sum, div) => sum + div.totalDividend, 0);
}

/**
 * Separate qualified and non-qualified dividends
 * Note: This is a placeholder - actual qualification requires additional data
 */
export function separateQualifiedDividends(
  dividends: ProcessedDividend[]
): {
  qualified: ProcessedDividend[];
  nonQualified: ProcessedDividend[];
  unknown: ProcessedDividend[];
} {
  const qualified: ProcessedDividend[] = [];
  const nonQualified: ProcessedDividend[] = [];
  const unknown: ProcessedDividend[] = [];

  for (const div of dividends) {
    if (div.isQualified === true) {
      qualified.push(div);
    } else if (div.isQualified === false) {
      nonQualified.push(div);
    } else {
      unknown.push(div);
    }
  }

  return { qualified, nonQualified, unknown };
}

/**
 * Get dividends that were reinvested
 */
export function getReinvestedDividends(dividends: ProcessedDividend[]): ProcessedDividend[] {
  return dividends.filter(div => div.isReinvested);
}

/**
 * Get dividends that were paid in cash
 */
export function getCashDividends(dividends: ProcessedDividend[]): ProcessedDividend[] {
  return dividends.filter(div => !div.isReinvested);
}

/**
 * Calculate average dividend per share for a symbol
 */
export function getAverageDividendPerShare(
  dividends: ProcessedDividend[],
  symbol: string
): number | undefined {
  const symbolDividends = dividends.filter(div =>
    div.symbol === symbol && div.dividendPerShare !== undefined
  );

  if (symbolDividends.length === 0) return undefined;

  const total = symbolDividends.reduce((sum, div) => sum + (div.dividendPerShare || 0), 0);
  return total / symbolDividends.length;
}

/**
 * Get dividend growth rate (year over year)
 */
export function getDividendGrowthRate(
  dividends: ProcessedDividend[],
  symbol: string,
  fromYear: number,
  toYear: number
): number | undefined {
  const fromYearDividends = dividends.filter(div =>
    div.symbol === symbol && div.taxYear === fromYear
  );

  const toYearDividends = dividends.filter(div =>
    div.symbol === symbol && div.taxYear === toYear
  );

  if (fromYearDividends.length === 0 || toYearDividends.length === 0) {
    return undefined;
  }

  const fromTotal = fromYearDividends.reduce((sum, div) => sum + div.totalDividend, 0);
  const toTotal = toYearDividends.reduce((sum, div) => sum + div.totalDividend, 0);

  if (fromTotal === 0) return undefined;

  return ((toTotal - fromTotal) / fromTotal) * 100; // Return as percentage
}
