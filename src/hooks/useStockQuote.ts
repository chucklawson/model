import { useState, useEffect } from 'react';
import type Quote_V3 from '../Lib/Quote_V3';
import type HistoricalPriceFull_V3 from '../Lib/HistoricalPriceFull_V3';
import type AnalysisKeyMetricsItem_V3 from '../Lib/AnalysisKeyMetricsItem_V3';

interface UseStockQuoteParams {
  stockSymbol: string;
  latestStartDate: string;
  latestEndDate: string;
  adjustedStartDate: string;
}

interface UseStockQuoteResult {
  quote: Quote_V3 | undefined;
  timeSeries: HistoricalPriceFull_V3[];
  adjustedTimeSeries: HistoricalPriceFull_V3[];
  keyMetrics: AnalysisKeyMetricsItem_V3[];
  loading: boolean;
  error: Error | null;
}

export function useStockQuote({
  stockSymbol,
  latestStartDate,
  latestEndDate,
  adjustedStartDate
}: UseStockQuoteParams): UseStockQuoteResult {
  const [quote, setQuote] = useState<Quote_V3 | undefined>();
  const [timeSeries, setTimeSeries] = useState<HistoricalPriceFull_V3[]>([]);
  const [adjustedTimeSeries, setAdjustedTimeSeries] = useState<HistoricalPriceFull_V3[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<AnalysisKeyMetricsItem_V3[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if required params are missing
    if (stockSymbol.length < 1 || latestStartDate.length === 0) {
      return;
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;

    // Build API URLs
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbol}?apikey=${apiKey}`;
    const timeSeriesUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockSymbol}?from=${latestStartDate}&to=${latestEndDate}&apikey=${apiKey}`;
    const adjustedTimeSeriesUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/${stockSymbol}?from=${adjustedStartDate}&to=${latestEndDate}&apikey=${apiKey}`;
    const keyMetricsUrl = `https://financialmodelingprep.com/api/v3/key-metrics/${stockSymbol}?period=quarter&apikey=${apiKey}`;

    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const responses = await Promise.all([
          fetch(quoteUrl),
          fetch(timeSeriesUrl),
          fetch(adjustedTimeSeriesUrl),
          fetch(keyMetricsUrl)
        ]);

        const data = await Promise.all(
          responses.map(response => response.json())
        );

        // Validate we got data
        if (data[0][0]?.symbol !== undefined) {
          // Parse and set quote data
          const parsedQuote: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
          setQuote(parsedQuote[0]);

          // Parse and set time series
          const parsedTimeSeries: HistoricalPriceFull_V3[] = JSON.parse(JSON.stringify(data[1].historical));
          setTimeSeries(parsedTimeSeries);

          // Parse and set adjusted time series
          const parsedAdjustedTimeSeries: HistoricalPriceFull_V3[] = JSON.parse(JSON.stringify(data[2].historical));
          setAdjustedTimeSeries(parsedAdjustedTimeSeries);

          // Parse and set key metrics
          const parsedKeyMetrics: AnalysisKeyMetricsItem_V3[] = JSON.parse(JSON.stringify(data[3]));
          setKeyMetrics(parsedKeyMetrics);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch stock data');
        setError(error);
        console.error('Stock quote fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [stockSymbol, latestStartDate, latestEndDate, adjustedStartDate]);

  return {
    quote,
    timeSeries,
    adjustedTimeSeries,
    keyMetrics,
    loading,
    error
  };
}
