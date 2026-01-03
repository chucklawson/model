// ============================================
// FILE: src/hooks/useYTDData.ts
// Custom Hook for YTD Performance Data
// ============================================
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TickerLot } from '../types';
import type { YTDPortfolioPerformance } from '../types/ytd';
import { calculateYTDPerformance } from '../utils/ytdCalculations';
import logger from '../utils/logger';

interface UseYTDDataParams {
  lots: TickerLot[];
  selectedPortfolios: string[];
  currentPrices: { [ticker: string]: number };
  enabled: boolean;  // Only fetch when modal is open
}

interface UseYTDDataResult {
  ytdData: YTDPortfolioPerformance | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and calculating YTD performance data
 * Filters lots by portfolio and excludes dividend lots
 */
export function useYTDData({
  lots,
  selectedPortfolios,
  currentPrices,
  enabled
}: UseYTDDataParams): UseYTDDataResult {
  const [ytdData, setYtdData] = useState<YTDPortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Filter lots based on selected portfolios
  const filteredLots = useMemo(() => {
    // Empty array means "All" - show everything
    if (selectedPortfolios.length === 0) return lots;

    // Filter to lots that have at least one matching portfolio
    return lots.filter(lot =>
      lot.portfolios.some(p => selectedPortfolios.includes(p))
    );
  }, [lots, selectedPortfolios]);

  // Calculate YTD performance
  const fetchYTDData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    if (Object.keys(currentPrices).length === 0) {
      setError(new Error('No current price data available'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startOfYear = '2025-01-01';
      const performance = await calculateYTDPerformance(
        filteredLots,
        currentPrices,
        startOfYear
      );

      setYtdData(performance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to calculate YTD performance');
      logger.error({ error, lotCount: filteredLots.length }, 'Failed to calculate YTD performance');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filteredLots, currentPrices, enabled, refetchCounter]);

  // Manual refetch trigger
  const refetch = useCallback(() => {
    setRefetchCounter(prev => prev + 1);
  }, []);

  // Fetch data when enabled or dependencies change
  useEffect(() => {
    if (enabled) {
      fetchYTDData();
    }
  }, [enabled, fetchYTDData]);

  return {
    ytdData,
    loading,
    error,
    refetch
  };
}
