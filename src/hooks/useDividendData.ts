import { useState, useEffect } from 'react';
import type Quote_V3 from '../Lib/Quote_V3';
import type HistoricalDividendData from '../Lib/DividendData/HistoricalDividendData';

interface UseDividendDataParams {
  stockSymbol: string;
}

interface UseDividendDataResult {
  quote: Quote_V3 | undefined;
  dividendData: HistoricalDividendData[];
  loading: boolean;
  error: Error | null;
}

export function useDividendData({
  stockSymbol
}: UseDividendDataParams): UseDividendDataResult {
  const [quote, setQuote] = useState<Quote_V3 | undefined>();
  const [dividendData, setDividendData] = useState<HistoricalDividendData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if required params are missing
    if (stockSymbol.length < 1) {
      return;
    }

    const apiKey = import.meta.env.VITE_FMP_API_KEY;

    // Build API URLs
    const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${stockSymbol}?apikey=${apiKey}`;
    const dividendUrl = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${stockSymbol}?apikey=${apiKey}`;

    const fetchDividendData = async () => {
      setLoading(true);
      setError(null);

      try {
        const responses = await Promise.all([
          fetch(quoteUrl),
          fetch(dividendUrl)
        ]);

        const data = await Promise.all(
          responses.map(response => response.json())
        );

        // Validate we got data
        if (data[0][0]?.symbol !== undefined) {
          // Parse and set quote data
          const parsedQuote: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
          setQuote(parsedQuote[0]);

          // Parse and set dividend data
          const parsedDividendData: HistoricalDividendData[] = JSON.parse(JSON.stringify(data[1].historical));
          setDividendData(parsedDividendData);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch dividend data');
        setError(error);
        console.error('Dividend data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDividendData();
  }, [stockSymbol]);

  return {
    quote,
    dividendData,
    loading,
    error
  };
}
