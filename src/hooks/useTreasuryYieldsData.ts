import { useState, useEffect } from 'react';
import type { TreasuryYieldData, UseTreasuryYieldsDataParams, UseTreasuryYieldsDataResult } from '../types/treasury';
import { callFmpApi } from '../utils/fmpApiClient';
import logger from '../utils/logger';

export function useTreasuryYieldsData({
  startDate,
  endDate,
  enabled
}: UseTreasuryYieldsDataParams): UseTreasuryYieldsDataResult {
  const [data, setData] = useState<TreasuryYieldData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Skip if not enabled or invalid dates
    if (!enabled || !startDate || !endDate) {
      return;
    }

    const fetchTreasuryYields = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await callFmpApi({
          endpoint: '/stable/treasury-rates',
          queryParams: { from: startDate, to: endDate }
        });

        // API returns data in reverse chronological order, reverse it for chart
        const yieldData = (data as TreasuryYieldData[]).reverse();
        setData(yieldData);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch treasury yields');
        setError(error);
        logger.error({ error, startDate, endDate, context: 'useTreasuryYieldsData' }, 'Failed to fetch treasury yields');
      } finally {
        setLoading(false);
      }
    };

    fetchTreasuryYields();
  }, [startDate, endDate, enabled]);

  return {
    data,
    loading,
    error
  };
}
