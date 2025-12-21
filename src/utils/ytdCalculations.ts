// ============================================
// FILE: src/utils/ytdCalculations.ts
// Year-to-Date Performance Calculation Utilities
// ============================================

import { callFmpApi } from './fmpApiClient';
import type { TickerLot } from '../types';
import type { YTDTickerPerformance, YTDPortfolioPerformance, HistoricalPrice } from '../types/ytd';

// Cache for Jan 1 prices (won't change during session)
const jan1PriceCache = new Map<string, number>();

// Cache for historical price ranges (with TTL)
interface CachedHistoricalData {
  data: HistoricalPrice[];
  timestamp: number;
}
const historicalRangeCache = new Map<string, CachedHistoricalData>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetches historical price for a specific date with fallback logic
 * Handles market closed days (weekends, holidays) by trying previous business days
 */
export async function fetchHistoricalPriceForDate(
  ticker: string,
  targetDate: string
): Promise<number | null> {
  // Check cache first
  const cacheKey = `${ticker}:${targetDate}`;
  if (jan1PriceCache.has(cacheKey)) {
    return jan1PriceCache.get(cacheKey)!;
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
      console.warn(`No historical data found for ${ticker} around ${targetDate}`);
      return null;
    }

    // Find the closest date to our target (should be on or before target date)
    const sortedData = response.historical.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const price = sortedData[0].close;

    // Cache the result
    jan1PriceCache.set(cacheKey, price);

    return price;
  } catch (error) {
    console.error(`Error fetching historical price for ${ticker} on ${targetDate}:`, error);
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
    console.error(`Error fetching historical price range for ${ticker}:`, error);
    return [];
  }
}

/**
 * Calculate YTD performance for a single ticker (aggregated from multiple lots)
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
  const jan1Price = await fetchHistoricalPriceForDate(ticker, startOfYear);

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
 */
export async function calculateYTDPerformance(
  lots: TickerLot[],
  currentPrices: { [ticker: string]: number },
  startOfYear: string = '2025-01-01'
): Promise<YTDPortfolioPerformance> {
  // Filter out dividend lots
  const nonDividendLots = lots.filter(lot => !lot.isDividend);

  if (nonDividendLots.length === 0) {
    return {
      totalCurrentValue: 0,
      totalBaselineValue: 0,
      totalYTDGainDollar: 0,
      totalYTDGainPercent: 0,
      tickers: [],
      dailyPortfolioValues: [],
      startDate: startOfYear,
      endDate: formatDate(new Date())
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

  // Calculate YTD performance for each ticker
  const tickerPerformances: YTDTickerPerformance[] = [];
  for (const [ticker, tickerLots] of lotsByTicker.entries()) {
    const currentPrice = currentPrices[ticker];
    if (!currentPrice) {
      console.warn(`No current price available for ${ticker}`);
      continue;
    }

    const performance = await calculateTickerYTD(
      ticker,
      tickerLots,
      currentPrice,
      startOfYear
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
  const totalYTDGainDollar = totalCurrentValue - totalBaselineValue;
  const totalYTDGainPercent = totalBaselineValue > 0
    ? (totalYTDGainDollar / totalBaselineValue) * 100
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
    startOfYear,
    formatDate(new Date())
  );

  return {
    totalCurrentValue,
    totalBaselineValue,
    totalYTDGainDollar,
    totalYTDGainPercent,
    tickers: tickerPerformances,
    dailyPortfolioValues,
    startDate: startOfYear,
    endDate: formatDate(new Date())
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

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
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
