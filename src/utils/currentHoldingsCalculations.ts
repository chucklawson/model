// ============================================
// FILE: src/utils/currentHoldingsCalculations.ts
// CurrentHoldings Calculation Utility
// ============================================

import type { TickerLot, Ticker } from '../types';
import type { TickersToEvaluate } from '../Lib/TickersToEvaluate/TickersToEvaluate';

/**
 * Calculate current holdings from ticker lots, filtered by portfolio membership
 *
 * @param lots - All ticker lots from the database
 * @param tickers - All ticker metadata from the database
 * @param portfoliosToInclude - Portfolio names to filter by
 * @returns Array of tickers with aggregated holdings data, sorted alphabetically
 */
export function calculateCurrentHoldings(
  lots: TickerLot[],
  tickers: Ticker[],
  portfoliosToInclude: string[]
): TickersToEvaluate[] {
  // Step 1: Filter lots to only those in specified portfolios
  const matchingLots = lots.filter(lot =>
    lot.portfolios.some(p => portfoliosToInclude.includes(p))
  );

  // Step 2: Group lots by ticker symbol
  const groupedByTicker = matchingLots.reduce((acc, lot) => {
    const symbol = lot.ticker.toUpperCase();
    if (!acc[symbol]) {
      acc[symbol] = [];
    }
    acc[symbol].push(lot);
    return acc;
  }, {} as Record<string, TickerLot[]>);

  // Step 3: Calculate aggregated data for each ticker
  const holdings: TickersToEvaluate[] = Object.entries(groupedByTicker).map(([symbol, tickerLots]) => {
    // Calculate total shares (rounded to 2 decimal places)
    const totalShares = tickerLots.reduce((sum, lot) => sum + lot.shares, 0);
    const unitsOnHand = Number(totalShares.toFixed(2));

    // Calculate weighted average cost basis
    const totalCost = tickerLots.reduce((sum, lot) => sum + lot.totalCost, 0);
    const avgCostBasis = unitsOnHand > 0 ? totalCost / unitsOnHand : 0;

    // Determine if any lot has calculateAccumulatedProfitLoss enabled
    const calculateAccumulatedProfitLoss = tickerLots.some(
      lot => lot.calculateAccumulatedProfitLoss === true
    );

    // Get baseYield from Ticker model
    const tickerData = tickers.find(t => t.symbol.toUpperCase() === symbol);
    const baseYield = tickerData?.baseYield?.toString() ?? '';

    return {
      ticker: symbol,
      costBasis: avgCostBasis.toFixed(2),
      unitsOnHand,
      calculateAccumulatedProfitLoss,
      baseYield,
    };
  });

  // Step 4: Sort with priority tickers first (DIA, VOO, QQQ), then alphabetically
  const priorityTickers = ['DIA', 'VOO', 'QQQ'];

  // Separate priority tickers from the rest
  const priorityHoldings = priorityTickers
    .map(symbol => holdings.find(h => h.ticker === symbol))
    .filter((h): h is TickersToEvaluate => h !== undefined);

  // Get remaining tickers sorted alphabetically
  const otherHoldings = holdings
    .filter(h => !priorityTickers.includes(h.ticker))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  // Return priority tickers first, then alphabetically sorted others
  return [...priorityHoldings, ...otherHoldings];
}
