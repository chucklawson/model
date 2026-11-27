import { useState, useEffect } from 'react';
import type HistoricalPriceFull_V3 from '../Lib/HistoricalPriceFull_V3';
import { callFmpApi } from '../utils/fmpApiClient';
import { computeAllTimeHighLowDates } from '../utils/allTimeHighLow';
import type { AllTimeIndicator } from '../utils/allTimeHighLow';
import logger from '../utils/logger';

interface UseAllTimeHighLowResult {
  athLoData: AllTimeIndicator[];
  loading: boolean;
}

export function useAllTimeHighLow(
  stockSymbol: string,
  enabled: boolean
): UseAllTimeHighLowResult {
  const [athLoData, setAthLoData] = useState<AllTimeIndicator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || stockSymbol.length < 1) {
      setAthLoData([]);
      return;
    }

    const fetchAllHistory = async () => {
      setLoading(true);
      try {
        const data = await callFmpApi<{ historical: HistoricalPriceFull_V3[] }>({
          endpoint: `/api/v3/historical-price-full/${stockSymbol}`,
        });
        setAthLoData(computeAllTimeHighLowDates(data.historical ?? []));
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch all-time history');
        logger.error({ error, ticker: stockSymbol, context: 'useAllTimeHighLow' }, 'Failed to fetch all-time high/low data');
        setAthLoData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [stockSymbol, enabled]);

  return { athLoData, loading };
}
