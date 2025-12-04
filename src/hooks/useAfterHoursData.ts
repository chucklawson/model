// ============================================
// FILE: src/hooks/useAfterHoursData.ts
// ============================================

import { useState, useEffect, useRef } from 'react';
import type AfterHoursQuote_V3 from '../Lib/AfterHoursQuote_V3';

interface UseAfterHoursDataParams {
  tickers: string[];
  enabled: boolean;
  pollingInterval?: number; // milliseconds (default: 30000 = 30s)
}

interface UseAfterHoursDataResult {
  data: Map<string, AfterHoursQuote_V3>;
  regularPrices: Map<string, number>;
  loading: boolean;
  error: Error | null;
  isAfterHours: boolean;
}

/**
 * Custom hook for fetching after-hours stock data with automatic polling
 * Only fetches data after 4 PM EST on weekdays
 */
export function useAfterHoursData({
  tickers,
  enabled,
  pollingInterval = 30000
}: UseAfterHoursDataParams): UseAfterHoursDataResult {
  const [data, setData] = useState<Map<string, AfterHoursQuote_V3>>(new Map());
  const [regularPrices, setRegularPrices] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAfterHours, setIsAfterHours] = useState(false);

  // Use ref to track if component is mounted (prevent state updates after unmount)
  const isMounted = useRef(true);

  /**
   * Check if current time is after market close (4 PM EST) on a weekday
   */
  const checkAfterHours = (): boolean => {
    const now = new Date();
    const estTime = new Date(now.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    const hour = estTime.getHours();
    const day = estTime.getDay(); // 0=Sunday, 6=Saturday

    const isWeekday = day >= 1 && day <= 5;
    const isAfterMarketClose = hour >= 16; // 4 PM or later

    return isWeekday && isAfterMarketClose;
  };

  /**
   * Fetch after-hours data for all tickers with throttled batching
   * Processes 5 tickers at a time with 200ms delay between batches
   */
  const fetchAfterHoursData = async () => {
    if (!enabled || tickers.length === 0) {
      return;
    }

    // Check if we're in after-hours time
    const afterHours = checkAfterHours();
    console.log('[AfterHours] Time check:', {
      isAfterHours: afterHours,
      currentTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }),
      tickerCount: tickers.length
    });

    if (isMounted.current) {
      setIsAfterHours(afterHours);
    }

    // Only fetch data if we're in after-hours period
    if (!afterHours) {
      console.log('[AfterHours] Not in after-hours period, skipping fetch');
      return;
    }

    if (isMounted.current) {
      setLoading(true);
      setError(null);
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    const newData = new Map<string, AfterHoursQuote_V3>();
    const newRegularPrices = new Map<string, number>();

    try {
      // Process tickers in batches of 10 with no delay (paid API tier)
      for (let i = 0; i < tickers.length; i += 10) {
        const batch = tickers.slice(i, i + 10);
        console.log(`[AfterHours] Fetching batch ${Math.floor(i / 10) + 1}:`, batch);

        // Create fetch promises for this batch - need both aftermarket and regular quote
        const promises = batch.map(async (ticker) => {
          const aftermarketUrl = `https://financialmodelingprep.com/stable/aftermarket-trade?symbol=${ticker}&apikey=${apiKey}`;
          const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`;

          console.log(`[AfterHours] Fetching ${ticker} aftermarket from:`, aftermarketUrl);

          try {
            // Fetch both aftermarket and regular quote in parallel
            const [aftermarketResponse, quoteResponse] = await Promise.all([
              fetch(aftermarketUrl),
              fetch(quoteUrl)
            ]);

            if (!aftermarketResponse.ok || !quoteResponse.ok) {
              throw new Error(`HTTP error`);
            }

            const aftermarketData = await aftermarketResponse.json();
            const quoteData = await quoteResponse.json();

            console.log(`[AfterHours] Aftermarket response for ${ticker}:`, aftermarketData);
            console.log(`[AfterHours] Quote response for ${ticker}:`, quoteData);

            return { ticker, aftermarketData, quoteData };
          } catch (err) {
            console.error(`[AfterHours] Error fetching ${ticker}:`, err);
            throw err;
          }
        });

        // Use Promise.allSettled to handle partial failures gracefully
        const results = await Promise.allSettled(promises);

        // Process successful results
        results.forEach((result, idx) => {
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

            console.log(`[AfterHours] Processing ${ticker}:`, {
              hasAftermarket: !!aftermarketTrade,
              hasQuote: !!quote,
              aftermarketPrice: aftermarketTrade?.price,
              regularPrice: quote?.price
            });

            // Always store regular price if we have it
            if (quote && quote.price) {
              newRegularPrices.set(ticker, quote.price);
            }

            // Calculate change if we have both aftermarket trade and regular quote
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
              console.log(`[AfterHours] Added ${ticker} to data map - AH: $${aftermarketTrade.price.toFixed(2)}, Change: $${change.toFixed(2)} (${changesPercentage.toFixed(2)}%)`);
            } else {
              console.log(`[AfterHours] No after-hours data for ${ticker} - missing ${!aftermarketTrade ? 'aftermarket' : ''} ${!quote ? 'quote' : ''}`);
            }
          } else {
            // Log individual ticker failures but don't break the entire fetch
            console.warn(`Failed to fetch after-hours data for ${batch[idx]}:`, result.reason);
          }
        });

        // No delay needed with paid API tier
      }

      // Update state with new data if component is still mounted
      if (isMounted.current) {
        console.log(`[AfterHours] Setting data map with ${newData.size} entries, regular prices: ${newRegularPrices.size}`);
        setData(newData);
        setRegularPrices(newRegularPrices);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch after-hours data');
      if (isMounted.current) {
        setError(error);
      }
      console.error('After-hours data fetch error:', error);
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
    loading,
    error,
    isAfterHours
  };
}
