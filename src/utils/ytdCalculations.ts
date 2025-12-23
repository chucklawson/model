// ============================================
// FILE: src/utils/ytdCalculations.ts
// Year-to-Date Performance Calculation Utilities
// ============================================

import type { TickerLot } from '../types';
import type { YTDTickerPerformance, YTDPortfolioPerformance } from '../types/ytd';
import {
  calculateDateRangePerformance,
  formatDate,
  formatDateShort as formatDateShortShared,
  fetchHistoricalPriceForDate as fetchHistoricalPriceForDateShared,
  fetchHistoricalPriceRange as fetchHistoricalPriceRangeShared
} from './dateRangeCalculations';

// Re-export shared utilities
export { formatDateShortShared as formatDateShort };
export { fetchHistoricalPriceForDateShared as fetchHistoricalPriceForDate };
export { fetchHistoricalPriceRangeShared as fetchHistoricalPriceRange };

/**
 * Calculate YTD performance for a single ticker (aggregated from multiple lots)
 * @deprecated Use calculateDateRangePerformance from dateRangeCalculations.ts instead
 */
export async function calculateTickerYTD(
  ticker: string,
  lots: TickerLot[],
  currentPrice: number,
  startOfYear: string = '2025-01-01'
): Promise<YTDTickerPerformance> {
  let totalShares = 0;
  let totalBaselineValue = 0;
  let hasWarning = false;
  let warningMessage = '';

  // Get Jan 1 price for this ticker
  const jan1Price = await fetchHistoricalPriceForDateShared(ticker, startOfYear);

  // Calculate baseline for each lot
  for (const lot of lots) {
    totalShares += lot.shares;

    const purchaseDate = new Date(lot.purchaseDate);
    const yearStart = new Date(startOfYear);

    if (purchaseDate < yearStart) {
      // Lot purchased before Jan 1 - use Jan 1 price
      if (jan1Price !== null) {
        totalBaselineValue += lot.shares * jan1Price;
      } else {
        // Fallback: use purchase price
        totalBaselineValue += lot.shares * lot.costPerShare;
        hasWarning = true;
        warningMessage = `Jan 1 price unavailable for ${ticker}, using purchase price`;
      }
    } else {
      // Lot purchased during the year - use purchase price
      totalBaselineValue += lot.shares * lot.costPerShare;
    }
  }

  const currentValue = totalShares * currentPrice;
  const ytdGainDollar = currentValue - totalBaselineValue;
  const ytdGainPercent = totalBaselineValue > 0
    ? (ytdGainDollar / totalBaselineValue) * 100
    : 0;

  return {
    ticker,
    companyName: ticker, // Could be enriched from API later
    totalShares,
    currentPrice,
    currentValue,
    baselineValue: totalBaselineValue,
    baselineDate: startOfYear,
    ytdGainDollar,
    ytdGainPercent,
    allocationPercent: 0, // Will be calculated at portfolio level
    hasWarning,
    warningMessage: hasWarning ? warningMessage : undefined
  };
}

/**
 * Calculate portfolio-wide YTD performance
 * Uses shared date range calculation logic
 */
export async function calculateYTDPerformance(
  lots: TickerLot[],
  currentPrices: { [ticker: string]: number },
  startOfYear: string = '2025-01-01'
): Promise<YTDPortfolioPerformance> {
  // Call the shared date range calculation function
  const rangeData = await calculateDateRangePerformance(
    lots,
    currentPrices,
    startOfYear,
    formatDate(new Date())
  );

  // Transform DateRangePortfolioPerformance to YTDPortfolioPerformance
  // The structure is identical except for naming (rangeGain vs ytdGain)
  const ytdData: YTDPortfolioPerformance = {
    totalCurrentValue: rangeData.totalCurrentValue,
    totalBaselineValue: rangeData.totalBaselineValue,
    totalCostBasis: rangeData.totalCostBasis,
    totalYTDGainDollar: rangeData.totalRangeGainDollar,
    totalYTDGainPercent: rangeData.totalRangeGainPercent,
    totalAllTimeGainDollar: rangeData.totalAllTimeGainDollar,
    totalAllTimeGainPercent: rangeData.totalAllTimeGainPercent,
    tickers: rangeData.tickers.map(ticker => ({
      ticker: ticker.ticker,
      companyName: ticker.companyName,
      totalShares: ticker.totalShares,
      currentPrice: ticker.currentPrice,
      currentValue: ticker.currentValue,
      baselineValue: ticker.baselineValue,
      baselineDate: ticker.baselineDate,
      ytdGainDollar: ticker.rangeGainDollar,
      ytdGainPercent: ticker.rangeGainPercent,
      historicalValues: ticker.historicalValues,
      allocationPercent: ticker.allocationPercent,
      hasWarning: ticker.hasWarning,
      warningMessage: ticker.warningMessage
    })),
    dailyPortfolioValues: rangeData.dailyPortfolioValues,
    startDate: rangeData.startDate,
    endDate: rangeData.endDate
  };

  return ytdData;
}
