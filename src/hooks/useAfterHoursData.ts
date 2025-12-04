// ============================================
// FILE: src/hooks/useAfterHoursData.ts
// ============================================

import { useState, useEffect, useRef } from 'react';
import type AfterHoursQuote_V3 from '../Lib/AfterHoursQuote_V3';
import { shouldShowAfterHoursPricing } from '../utils/marketHours';

interface UseAfterHoursDataParams {
  tickers: string[];
  enabled: boolean;
  pollingInterval?: number; // milliseconds (default: 30000 = 30s)
}

interface RegularQuote {
  price: number;
  change: number;
  changesPercentage: number;
}

interface UseAfterHoursDataResult {
  data: Map<string, AfterHoursQuote_V3>;
  regularPrices: Map<string, number>;
  regularQuotes: Map<string, RegularQuote>;
  loading: boolean;
  error: Error | null;
  isAfterHours: boolean;
}

/**
 * Custom hook for fetching after-hours stock data with automatic polling
 * Fetches during pre-market, after-hours, weekends, and holidays
 * Market hours: 9:30 AM - 4:00 PM ET on trading days
 */
export function useAfterHoursData({
  tickers,
  enabled,
  pollingInterval = 600000
}: UseAfterHoursDataParams): UseAfterHoursDataResult {
  const [data, setData] = useState<Map<string, AfterHoursQuote_V3>>(new Map());
  const [regularPrices, setRegularPrices] = useState<Map<string, number>>(new Map());
  const [regularQuotes, setRegularQuotes] = useState<Map<string, RegularQuote>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAfterHours, setIsAfterHours] = useState(false);

  // Use ref to track if component is mounted (prevent state updates after unmount)
  const isMounted = useRef(true);

  /**
   * Fetch after-hours data for all tickers with throttled batching
   * Processes 5 tickers at a time with 200ms delay between batches
   */
  const fetchAfterHoursData = async () => {
    if (!enabled || tickers.length === 0) {
      return;
    }

    // Check if we should show after-hours pricing
    const afterHours = shouldShowAfterHoursPricing();

    if (isMounted.current) {
      setIsAfterHours(afterHours);
      setLoading(true);
      setError(null);
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    const newData = new Map<string, AfterHoursQuote_V3>();
    const newRegularPrices = new Map<string, number>();
    const newRegularQuotes = new Map<string, RegularQuote>();

    try {
      // Process tickers in batches of 10 with no delay (paid API tier)
      for (let i = 0; i < tickers.length; i += 10) {
        const batch = tickers.slice(i, i + 10);

        // Create fetch promises for this batch
        const promises = batch.map(async (ticker) => {
          const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`;

          // Always fetch regular quote
          const quoteResponse = await fetch(quoteUrl);

          if (!quoteResponse.ok) {
            throw new Error(`HTTP error`);
          }

          const quoteData = await quoteResponse.json();

          // Only fetch aftermarket data if we're showing after-hours pricing
          let aftermarketData = null;
          if (afterHours) {
            const aftermarketUrl = `https://financialmodelingprep.com/stable/aftermarket-trade?symbol=${ticker}&apikey=${apiKey}`;
            const aftermarketResponse = await fetch(aftermarketUrl);

            if (aftermarketResponse.ok) {
              aftermarketData = await aftermarketResponse.json();
            }
          }

          return { ticker, aftermarketData, quoteData };
        });

        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled(promises);

        // Process successful results
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { ticker, aftermarketData, quoteData } = result.value;

            // Extract aftermarket trade (array with latest trade)
            const aftermarketTrade = Array.isArray(aftermarketData) && aftermarketData.length > 0
              ? aftermarketData[0]
              : null;

            // Extract regular quote (array with single quote)
            const quote = Array.isArray(quoteData) && quoteData.length > 0
              ? quoteData[0]
              : null;

            // Always store regular price and quote data if we have it
            if (quote && quote.price !== undefined) {
              newRegularPrices.set(ticker, quote.price);

              // Store full quote data with change information
              newRegularQuotes.set(ticker, {
                price: quote.price,
                change: quote.change || 0,
                changesPercentage: quote.changesPercentage || 0
              });
            }

            // Calculate after-hours change if we have both aftermarket trade and regular quote
            if (aftermarketTrade && quote && aftermarketTrade.price && quote.price) {
              const change = aftermarketTrade.price - quote.price;
              const changesPercentage = (change / quote.price) * 100;

              newData.set(ticker, {
                symbol: ticker,
                price: aftermarketTrade.price,
                change: change,
                changesPercentage: changesPercentage,
                timestamp: aftermarketTrade.timestamp || Date.now(),
                regularMarketPrice: quote.price
              });
            }
          }
        });

        // No delay needed with paid API tier
      }

      // Update state with new data if component is still mounted
      if (isMounted.current) {
        setData(newData);
        setRegularPrices(newRegularPrices);
        setRegularQuotes(newRegularQuotes);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch after-hours data');
      if (isMounted.current) {
        setError(error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Set up polling effect
  useEffect(() => {
    // Track mounted state
    isMounted.current = true;

    // Initial fetch
    fetchAfterHoursData();

    // Set up polling interval
    const intervalId = setInterval(fetchAfterHoursData, pollingInterval);

    // Cleanup function
    return () => {
      isMounted.current = false;
      clearInterval(intervalId);
    };
  }, [tickers.join(','), enabled, pollingInterval]); // Use tickers.join(',') to avoid array reference issues

  return {
    data,
    regularPrices,
    regularQuotes,
    loading,
    error,
    isAfterHours
  };
}
