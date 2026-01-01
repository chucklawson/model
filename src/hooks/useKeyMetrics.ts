import { useState, useEffect } from 'react';
import type Quote_V3 from '../Lib/Quote_V3';
import type StatementAnalysisKeyMetricsData from '../Lib/StatementsData/StatementAnalysisKeyMetricsData';
import { callFmpApi } from '../utils/fmpApiClient';
import logger from '../utils/logger';

interface UseKeyMetricsParams {
  stockSymbol: string;
  period: string;
}

interface UseKeyMetricsResult {
  quote: Quote_V3 | undefined;
  keyMetrics: StatementAnalysisKeyMetricsData[];
  loading: boolean;
  error: Error | null;
}

export function useKeyMetrics({
  stockSymbol,
  period
}: UseKeyMetricsParams): UseKeyMetricsResult {
  const [quote, setQuote] = useState<Quote_V3 | undefined>();
  const [keyMetrics, setKeyMetrics] = useState<StatementAnalysisKeyMetricsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if required params are missing
    if (stockSymbol.length < 1) {
      return;
    }

    const fetchKeyMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await Promise.all([
          callFmpApi({ endpoint: `/api/v3/quote/${stockSymbol}` }),
          callFmpApi({
            endpoint: `/api/v3/key-metrics/${stockSymbol}`,
            queryParams: { period }
          })
        ]);

        // Validate we got data
        if (data[0][0]?.symbol !== undefined) {
          // Parse and set quote data
          const parsedQuote: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
          setQuote(parsedQuote[0]);

          // Parse and set key metrics data
          const parsedKeyMetrics: StatementAnalysisKeyMetricsData[] = JSON.parse(JSON.stringify(data[1]));
          setKeyMetrics(parsedKeyMetrics);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch key metrics');
        setError(error);
        logger.error({ error, ticker: stockSymbol, period, context: 'useKeyMetrics' }, 'Failed to fetch key metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchKeyMetrics();
  }, [stockSymbol, period]);

  return {
    quote,
    keyMetrics,
    loading,
    error
  };
}
