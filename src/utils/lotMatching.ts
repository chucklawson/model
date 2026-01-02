// ============================================
// FILE: src/utils/lotMatching.ts
// Lot Matching Engine - FIFO, LIFO, SpecID
// ============================================

import type {
  VanguardTransaction,
  MatchingMethod,
  LotMatchingResult,
} from '../types';

// ===== TYPES =====

interface BuyLot {
  transaction: VanguardTransaction;
  remainingShares: number;
  originalShares: number;
}

// ===== MAIN MATCHING FUNCTION =====

/**
 * Match buy and sell transactions to calculate realized gains/losses
 *
 * @param transactions - All transactions (must include both buys and sells)
 * @param method - Matching method: FIFO, LIFO, or SpecID
 * @returns Array of lot matching results
 */
export function matchTransactions(
  transactions: VanguardTransaction[],
  method: MatchingMethod = 'FIFO'
): LotMatchingResult[] {
  const results: LotMatchingResult[] = [];

  // Group transactions by symbol
  const bySymbol = groupTransactionsBySymbol(transactions);

  // Process each symbol independently
  for (const [symbol, txns] of Object.entries(bySymbol)) {
    // Skip cash-only transactions
    if (symbol === 'CASH') continue;

    // Separate buys and sells
    const buys = extractBuyTransactions(txns);
    const sells = extractSellTransactions(txns);

    // Match sells to buys
    const symbolResults = matchSymbolTransactions(buys, sells, method);
    results.push(...symbolResults);
  }

  return results;
}

/**
 * Match transactions for a single symbol
 */
function matchSymbolTransactions(
  buyTransactions: VanguardTransaction[],
  sellTransactions: VanguardTransaction[],
  method: MatchingMethod
): LotMatchingResult[] {
  const results: LotMatchingResult[] = [];

  // Create buy lots with tracking
  const buyLots: BuyLot[] = buyTransactions.map(txn => ({
    transaction: txn,
    remainingShares: txn.shares,
    originalShares: txn.shares,
  }));

  // Sort buy lots based on matching method
  const sortedBuyLots = sortBuysForMethod(buyLots, method);

  // Process each sell transaction
  for (const sellTxn of sellTransactions) {
    const sellShares = Math.abs(sellTxn.shares); // Convert negative to positive
    let remainingSellShares = sellShares;

    // Match this sell to available buy lots
    for (const buyLot of sortedBuyLots) {
      if (remainingSellShares <= 0) break;
      if (buyLot.remainingShares <= 0) continue;

      // Calculate matched shares for this pairing
      const matchedShares = Math.min(remainingSellShares, buyLot.remainingShares);

      // Calculate realized gain/loss
      const result = calculateMatchResult(
        buyLot.transaction,
        sellTxn,
        matchedShares,
        buyLot.originalShares,
        buyLot.remainingShares - matchedShares // Pass current remaining after this match
      );

      results.push(result);

      // Update remaining shares
      buyLot.remainingShares -= matchedShares;
      remainingSellShares -= matchedShares;
    }

    // If there are remaining sell shares, it means we're selling short or have insufficient buys
    if (remainingSellShares > 0) {
      console.warn(
        `Warning: Sell transaction has ${remainingSellShares} unmatched shares. ` +
        `Symbol: ${sellTxn.symbol}, Date: ${sellTxn.tradeDate}. ` +
        `This may indicate a short sale or missing buy transactions.`
      );
    }
  }

  return results;
}

/**
 * Calculate the result of matching a buy to a sell
 */
function calculateMatchResult(
  buyTxn: VanguardTransaction,
  sellTxn: VanguardTransaction,
  matchedShares: number,
  totalBuyShares: number,
  remainingBuySharesAfterMatch: number
): LotMatchingResult {
  // Calculate cost basis (proportional to matched shares)
  const buyPrice = buyTxn.sharePrice || 0;
  const buyFees = buyTxn.commissionsAndFees || 0;
  const proportionalBuyFees = (buyFees * matchedShares) / totalBuyShares;
  const costBasis = (matchedShares * buyPrice) + proportionalBuyFees;

  // Calculate proceeds (proportional to matched shares)
  const sellPrice = sellTxn.sharePrice || 0;
  const sellShares = Math.abs(sellTxn.shares);
  const sellFees = sellTxn.commissionsAndFees || 0;
  const proportionalSellFees = (sellFees * matchedShares) / sellShares;
  const proceeds = (matchedShares * sellPrice) - proportionalSellFees;

  // Calculate realized gain/loss
  const realizedGainLoss = proceeds - costBasis;

  // Calculate holding period
  const holdingPeriodDays = calculateDaysBetween(buyTxn.tradeDate, sellTxn.tradeDate);
  const isLongTerm = holdingPeriodDays > 365;

  // Calculate remaining sell shares (for this specific sell transaction)
  const remainingSellShares = Math.abs(sellTxn.shares) - matchedShares;

  return {
    buyTransaction: buyTxn,
    sellTransaction: sellTxn,
    matchedShares,
    remainingBuyShares: remainingBuySharesAfterMatch,
    remainingSellShares,
    realizedGainLoss,
    holdingPeriodDays,
    isLongTerm,
  };
}

// ===== HELPER FUNCTIONS =====

/**
 * Group transactions by symbol
 */
function groupTransactionsBySymbol(
  transactions: VanguardTransaction[]
): Record<string, VanguardTransaction[]> {
  const grouped: Record<string, VanguardTransaction[]> = {};

  for (const txn of transactions) {
    const symbol = txn.symbol || 'UNKNOWN';
    if (!grouped[symbol]) {
      grouped[symbol] = [];
    }
    grouped[symbol].push(txn);
  }

  return grouped;
}

/**
 * Extract buy transactions (including reinvestments)
 */
function extractBuyTransactions(transactions: VanguardTransaction[]): VanguardTransaction[] {
  return transactions.filter(txn => {
    // Buy transactions have positive shares
    if (txn.shares > 0) {
      // Include Buy and Reinvestment types
      return txn.transactionType === 'Buy' || txn.transactionType === 'Reinvestment';
    }
    return false;
  }).sort((a, b) => a.tradeDate.localeCompare(b.tradeDate)); // Sort chronologically
}

/**
 * Extract sell transactions
 */
function extractSellTransactions(transactions: VanguardTransaction[]): VanguardTransaction[] {
  return transactions.filter(txn => {
    // Sell transactions have negative shares
    return txn.shares < 0 && txn.transactionType === 'Sell';
  }).sort((a, b) => a.tradeDate.localeCompare(b.tradeDate)); // Sort chronologically
}

/**
 * Sort buy lots based on matching method
 */
function sortBuysForMethod(buyLots: BuyLot[], method: MatchingMethod): BuyLot[] {
  const sorted = [...buyLots]; // Create a copy

  switch (method) {
    case 'FIFO':
      // First In, First Out - oldest first
      return sorted.sort((a, b) =>
        a.transaction.tradeDate.localeCompare(b.transaction.tradeDate)
      );

    case 'LIFO':
      // Last In, First Out - newest first
      return sorted.sort((a, b) =>
        b.transaction.tradeDate.localeCompare(a.transaction.tradeDate)
      );

    case 'SpecID':
      // Specific Identification - user will specify which lots to use
      // For now, default to FIFO (UI will allow manual selection later)
      console.warn('SpecID matching not fully implemented yet. Using FIFO as fallback.');
      return sorted.sort((a, b) =>
        a.transaction.tradeDate.localeCompare(b.transaction.tradeDate)
      );

    default:
      throw new Error(`Unknown matching method: ${method}`);
  }
}

/**
 * Calculate days between two dates
 */
function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

// ===== SUMMARY FUNCTIONS =====

/**
 * Get matching summary statistics
 */
export function getMatchingSummary(results: LotMatchingResult[]): {
  totalMatches: number;
  totalShares: number;
  totalGainLoss: number;
  shortTermGainLoss: number;
  longTermGainLoss: number;
  shortTermCount: number;
  longTermCount: number;
} {
  let totalShares = 0;
  let totalGainLoss = 0;
  let shortTermGainLoss = 0;
  let longTermGainLoss = 0;
  let shortTermCount = 0;
  let longTermCount = 0;

  for (const result of results) {
    totalShares += result.matchedShares;
    totalGainLoss += result.realizedGainLoss;

    if (result.isLongTerm) {
      longTermGainLoss += result.realizedGainLoss;
      longTermCount++;
    } else {
      shortTermGainLoss += result.realizedGainLoss;
      shortTermCount++;
    }
  }

  return {
    totalMatches: results.length,
    totalShares,
    totalGainLoss,
    shortTermGainLoss,
    longTermGainLoss,
    shortTermCount,
    longTermCount,
  };
}

/**
 * Group matching results by symbol
 */
export function groupResultsBySymbol(
  results: LotMatchingResult[]
): Record<string, LotMatchingResult[]> {
  const grouped: Record<string, LotMatchingResult[]> = {};

  for (const result of results) {
    const symbol = result.buyTransaction.symbol || 'UNKNOWN';
    if (!grouped[symbol]) {
      grouped[symbol] = [];
    }
    grouped[symbol].push(result);
  }

  return grouped;
}

/**
 * Group matching results by tax year (based on sell date)
 */
export function groupResultsByTaxYear(
  results: LotMatchingResult[]
): Record<number, LotMatchingResult[]> {
  const grouped: Record<number, LotMatchingResult[]> = {};

  for (const result of results) {
    const sellDate = new Date(result.sellTransaction.tradeDate);
    const taxYear = sellDate.getFullYear();

    if (!grouped[taxYear]) {
      grouped[taxYear] = [];
    }
    grouped[taxYear].push(result);
  }

  return grouped;
}

/**
 * Filter results for a specific tax year
 */
export function filterByTaxYear(
  results: LotMatchingResult[],
  taxYear: number
): LotMatchingResult[] {
  return results.filter(result => {
    const sellDate = new Date(result.sellTransaction.tradeDate);
    return sellDate.getFullYear() === taxYear;
  });
}

/**
 * Get unmatched buy lots (positions still held)
 */
export function getUnmatchedBuys(
  transactions: VanguardTransaction[],
  matchResults: LotMatchingResult[]
): VanguardTransaction[] {
  // Create a map of how many shares from each buy have been matched
  const matchedSharesByBuy = new Map<string, number>();

  for (const result of matchResults) {
    const buyKey = `${result.buyTransaction.accountNumber}-${result.buyTransaction.tradeDate}-${result.buyTransaction.symbol}`;
    const currentMatched = matchedSharesByBuy.get(buyKey) || 0;
    matchedSharesByBuy.set(buyKey, currentMatched + result.matchedShares);
  }

  // Find buy transactions with remaining shares
  const unmatched: VanguardTransaction[] = [];

  const buys = extractBuyTransactions(transactions);
  for (const buy of buys) {
    const buyKey = `${buy.accountNumber}-${buy.tradeDate}-${buy.symbol}`;
    const matchedShares = matchedSharesByBuy.get(buyKey) || 0;
    const remainingShares = buy.shares - matchedShares;

    if (remainingShares > 0) {
      unmatched.push({
        ...buy,
        shares: remainingShares, // Update shares to show only unmatched portion
      });
    }
  }

  return unmatched;
}
