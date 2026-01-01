// ============================================
// FILE: src/utils/dateRangeCalculations.ts
// Shared Date Range Performance Calculation Utilities
// ============================================

import { callFmpApi } from './fmpApiClient';
import type { TickerLot } from '../types';
import type {
  DateRangeTickerPerformance,
  DateRangePortfolioPerformance,
  HistoricalPrice
} from '../types/customRange';
import logger from './logger';

// Cache for start date prices (with TTL)
interface CachedPriceData {
  price: number;
  timestamp: number;
}
const startDatePriceCache = new Map<string, CachedPriceData>();

// Cache for historical price ranges (with TTL)
interface CachedHistoricalData {
  data: HistoricalPrice[];
  timestamp: number;
}
const historicalRangeCache = new Map<string, CachedHistoricalData>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Format date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Jan 15")
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Fetches historical price for a specific date with fallback logic
 * Handles market closed days (weekends, holidays) by trying previous business days
 */
export async function fetchHistoricalPriceForDate(
  ticker: string,
  targetDate: string
): Promise<number | null> {
  // Check cache first (with TTL)
  const cacheKey = `${ticker}:${targetDate}`;
  const cached = startDatePriceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price;
  }

  try {
    // Try to fetch data for the target date and a few days before
    const endDate = new Date(targetDate);
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 7); // Go back 7 days

    const formattedEndDate = formatDate(endDate);
    const formattedStartDate = formatDate(startDate);

    const response = await callFmpApi<{ historical: HistoricalPrice[] }>({
      endpoint: `/api/v3/historical-price-full/${ticker}`,
      queryParams: {
        from: formattedStartDate,
        to: formattedEndDate
      }
    });

    if (!response.historical || response.historical.length === 0) {
      logger.warn({ ticker, targetDate }, 'No historical data found for ticker on target date');
      return null;
    }

    // Find the closest date to our target (should be on or before target date)
    const sortedData = response.historical.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const price = sortedData[0].close;

    // Cache the result with timestamp
    startDatePriceCache.set(cacheKey, {
      price,
      timestamp: Date.now()
    });

    return price;
  } catch (error) {
    logger.error({ error, ticker, targetDate }, 'Failed to fetch historical price for date');
    return null;
  }
}

/**
 * Fetches daily price range for time-series charts
 */
export async function fetchHistoricalPriceRange(
  ticker: string,
  startDate: string,
  endDate: string
): Promise<HistoricalPrice[]> {
  const cacheKey = `${ticker}:${startDate}:${endDate}`;

  // Check cache with TTL
  const cached = historicalRangeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await callFmpApi<{ historical: HistoricalPrice[] }>({
      endpoint: `/api/v3/historical-price-full/${ticker}`,
      queryParams: {
        from: startDate,
        to: endDate
      }
    });

    const data = response.historical || [];

    // Sort by date ascending
    data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Cache with timestamp
    historicalRangeCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    logger.error({ error, ticker, startDate, endDate }, 'Failed to fetch historical price range');
    return [];
  }
}

/**
 * Calculate date range performance for a single ticker (aggregated from multiple lots)
 */
export async function calculateTickerDateRangePerformance(
  ticker: string,
  lots: TickerLot[],
  currentPrice: number,
  startDate: string,
  _endDate: string = formatDate(new Date())
): Promise<DateRangeTickerPerformance> {
  let totalShares = 0;
  let totalBaselineValue = 0;
  let hasWarning = false;
  let warningMessage = '';

  // Get start date price for this ticker
  const startDatePrice = await fetchHistoricalPriceForDate(ticker, startDate);

  // Calculate baseline for each lot
  for (const lot of lots) {
    totalShares += lot.shares;

    const purchaseDate = new Date(lot.purchaseDate);
    const rangeStart = new Date(startDate);

    if (purchaseDate < rangeStart) {
      // Lot purchased before range start - use start date price
      if (startDatePrice !== null) {
        totalBaselineValue += lot.shares * startDatePrice;
      } else {
        // Fallback: use purchase price
        totalBaselineValue += lot.shares * lot.costPerShare;
        hasWarning = true;
        warningMessage = `Start date price unavailable for ${ticker}, using purchase price`;
      }
    } else {
      // Lot purchased during the range - use purchase price
      totalBaselineValue += lot.shares * lot.costPerShare;
    }
  }

  const currentValue = totalShares * currentPrice;
  const rangeGainDollar = currentValue - totalBaselineValue;
  const rangeGainPercent = totalBaselineValue > 0
    ? (rangeGainDollar / totalBaselineValue) * 100
    : 0;

  return {
    ticker,
    companyName: ticker, // Could be enriched from API later
    totalShares,
    currentPrice,
    currentValue,
    baselineValue: totalBaselineValue,
    baselineDate: startDate,
    rangeGainDollar,
    rangeGainPercent,
    allocationPercent: 0, // Will be calculated at portfolio level
    hasWarning,
    warningMessage: hasWarning ? warningMessage : undefined
  };
}

/**
 * Calculate portfolio-wide date range performance
 */
export async function calculateDateRangePerformance(
  lots: TickerLot[],
  currentPrices: { [ticker: string]: number },
  startDate: string,
  endDate: string = formatDate(new Date())
): Promise<DateRangePortfolioPerformance> {
  // Filter out dividend lots
  const nonDividendLots = lots.filter(lot => !lot.isDividend);

  if (nonDividendLots.length === 0) {
    return {
      totalCurrentValue: 0,
      totalBaselineValue: 0,
      totalCostBasis: 0,
      totalRangeGainDollar: 0,
      totalRangeGainPercent: 0,
      totalAllTimeGainDollar: 0,
      totalAllTimeGainPercent: 0,
      tickers: [],
      dailyPortfolioValues: [],
      startDate,
      endDate
    };
  }

  // Group lots by ticker
  const lotsByTicker = new Map<string, TickerLot[]>();
  for (const lot of nonDividendLots) {
    if (!lotsByTicker.has(lot.ticker)) {
      lotsByTicker.set(lot.ticker, []);
    }
    lotsByTicker.get(lot.ticker)!.push(lot);
  }

  // Calculate date range performance for each ticker
  const tickerPerformances: DateRangeTickerPerformance[] = [];
  for (const [ticker, tickerLots] of lotsByTicker.entries()) {
    const currentPrice = currentPrices[ticker];
    if (!currentPrice) {
      logger.warn({ ticker, lotCount: tickerLots.length }, 'No current price available for ticker');
      continue;
    }

    const performance = await calculateTickerDateRangePerformance(
      ticker,
      tickerLots,
      currentPrice,
      startDate,
      endDate
    );
    tickerPerformances.push(performance);
  }

  // Calculate portfolio totals
  const totalCurrentValue = tickerPerformances.reduce(
    (sum, t) => sum + t.currentValue,
    0
  );
  const totalBaselineValue = tickerPerformances.reduce(
    (sum, t) => sum + t.baselineValue,
    0
  );
  const totalRangeGainDollar = totalCurrentValue - totalBaselineValue;
  const totalRangeGainPercent = totalBaselineValue > 0
    ? (totalRangeGainDollar / totalBaselineValue) * 100
    : 0;

  // Calculate total cost basis (what was originally paid for all shares)
  const totalCostBasis = nonDividendLots.reduce(
    (sum, lot) => sum + (lot.shares * lot.costPerShare),
    0
  );
  const totalAllTimeGainDollar = totalCurrentValue - totalCostBasis;
  const totalAllTimeGainPercent = totalCostBasis > 0
    ? (totalAllTimeGainDollar / totalCostBasis) * 100
    : 0;

  // Calculate allocation percentages
  for (const ticker of tickerPerformances) {
    ticker.allocationPercent = totalCurrentValue > 0
      ? (ticker.currentValue / totalCurrentValue) * 100
      : 0;
  }

  // Fetch historical daily values for time-series charts
  const dailyPortfolioValues = await calculateDailyPortfolioValues(
    lotsByTicker,
    currentPrices,
    startDate,
    endDate
  );

  return {
    totalCurrentValue,
    totalBaselineValue,
    totalCostBasis,
    totalRangeGainDollar,
    totalRangeGainPercent,
    totalAllTimeGainDollar,
    totalAllTimeGainPercent,
    tickers: tickerPerformances,
    dailyPortfolioValues,
    startDate,
    endDate
  };
}

/**
 * Calculate daily portfolio values for time-series charts
 */
async function calculateDailyPortfolioValues(
  lotsByTicker: Map<string, TickerLot[]>,
  _currentPrices: { [ticker: string]: number },
  startDate: string,
  endDate: string
): Promise<{
  date: string;
  totalValue: number;
  tickerBreakdown: { [ticker: string]: number };
}[]> {
  const tickers = Array.from(lotsByTicker.keys());

  // Fetch historical data for all tickers
  const historicalDataByTicker = new Map<string, HistoricalPrice[]>();
  for (const ticker of tickers) {
    const data = await fetchHistoricalPriceRange(ticker, startDate, endDate);
    historicalDataByTicker.set(ticker, data);
  }

  // Build a set of all unique dates
  const allDates = new Set<string>();
  for (const data of historicalDataByTicker.values()) {
    for (const point of data) {
      allDates.add(point.date);
    }
  }

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate portfolio value for each date
  const dailyValues: {
    date: string;
    totalValue: number;
    tickerBreakdown: { [ticker: string]: number };
  }[] = [];

  for (const date of sortedDates) {
    let totalValue = 0;
    const tickerBreakdown: { [ticker: string]: number } = {};

    for (const [ticker, lots] of lotsByTicker.entries()) {
      const historicalData = historicalDataByTicker.get(ticker) || [];
      const priceData = historicalData.find(d => d.date === date);

      if (!priceData) {
        // No data for this ticker on this date, skip
        continue;
      }

      // Calculate value for this ticker on this date
      // Only include lots that were owned on this date
      let tickerValue = 0;
      for (const lot of lots) {
        const purchaseDate = new Date(lot.purchaseDate);
        const currentDate = new Date(date);

        if (purchaseDate <= currentDate) {
          tickerValue += lot.shares * priceData.close;
        }
      }

      totalValue += tickerValue;
      if (tickerValue > 0) {
        tickerBreakdown[ticker] = tickerValue;
      }
    }

    if (totalValue > 0) {
      dailyValues.push({
        date,
        totalValue,
        tickerBreakdown
      });
    }
  }

  return dailyValues;
}
