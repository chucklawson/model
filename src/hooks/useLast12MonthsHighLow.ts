import { useState, useEffect } from 'react';
import type HistoricalPriceFull_V3 from '../Lib/HistoricalPriceFull_V3';
import { callFmpApi } from '../utils/fmpApiClient';
import { computeRolling52WeekHighLowDates } from '../utils/allTimeHighLow';
import type { AllTimeIndicator } from '../utils/allTimeHighLow';
import logger from '../utils/logger';

interface UseLast12MonthsHighLowResult {
  last12MoData: AllTimeIndicator[];
  loading: boolean;
}

export function useLast12MonthsHighLow(
  stockSymbol: string,
  enabled: boolean,
  startDate: string,
  endDate: string
): UseLast12MonthsHighLowResult {
  const [last12MoData, setLast12MoData] = useState<AllTimeIndicator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || stockSymbol.length < 1 || !startDate || !endDate) {
      setLast12MoData([]);
      return;
    }

    // Fetch from startDate-1year so every day in the view has a full 365-day lookback
    const fetchFrom = (() => {
      const d = new Date(startDate);
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split('T')[0];
    })();

    const fetch12MonthHistory = async () => {
      setLoading(true);
      try {
        const data = await callFmpApi<{ historical: HistoricalPriceFull_V3[] }>({
          endpoint: `/api/v3/historical-price-full/${stockSymbol}`,
          queryParams: { from: fetchFrom, to: endDate },
        });
        setLast12MoData(
          computeRolling52WeekHighLowDates(data.historical ?? [], startDate, endDate)
        );
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch 12-month history');
        logger.error({ error, ticker: stockSymbol, context: 'useLast12MonthsHighLow' }, 'Failed to fetch last 12 months high/low data');
        setLast12MoData([]);
      } finally {
        setLoading(false);
      }
    };

    fetch12MonthHistory();
  }, [stockSymbol, enabled, startDate, endDate]);

  return { last12MoData, loading };
}
