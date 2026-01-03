// ============================================
// FILE: src/hooks/useCustomRangeData.ts
// Custom Hook for Custom Date Range Performance Data
// ============================================
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TickerLot } from '../types';
import type { DateRangePortfolioPerformance } from '../types/customRange';
import { calculateDateRangePerformance } from '../utils/dateRangeCalculations';
import logger from '../utils/logger';

interface UseCustomRangeDataParams {
  lots: TickerLot[];
  selectedPortfolios: string[];
  currentPrices: { [ticker: string]: number };
  startDate: string;
  endDate: string;
  enabled: boolean;
}

interface UseCustomRangeDataResult {
  customRangeData: DateRangePortfolioPerformance | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and calculating custom date range performance data
 * Filters lots by portfolio and validates date ranges
 */
export function useCustomRangeData({
  lots,
  selectedPortfolios,
  currentPrices,
  startDate,
  endDate,
  enabled
}: UseCustomRangeDataParams): UseCustomRangeDataResult {
  const [customRangeData, setCustomRangeData] = useState<DateRangePortfolioPerformance | null>(null);
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

  // Validate date range
  const isValidDateRange = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today
    return start <= end && end <= today;
  }, [startDate, endDate]);

  // Calculate custom range performance
  const fetchCustomRangeData = useCallback(async () => {
    if (!enabled || !isValidDateRange) {
      return;
    }

    if (Object.keys(currentPrices).length === 0) {
      setError(new Error('No current price data available'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const performance = await calculateDateRangePerformance(
        filteredLots,
        currentPrices,
        startDate,
        endDate
      );

      setCustomRangeData(performance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to calculate custom range performance');
      logger.error({ error, startDate, endDate, lotCount: filteredLots.length }, 'Failed to calculate custom range performance');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [filteredLots, currentPrices, startDate, endDate, enabled, isValidDateRange, refetchCounter]);

  // Manual refetch trigger
  const refetch = useCallback(() => {
    setRefetchCounter(prev => prev + 1);
  }, []);

  // Fetch data when enabled or dependencies change
  useEffect(() => {
    if (enabled && isValidDateRange) {
      fetchCustomRangeData();
    }
  }, [enabled, isValidDateRange, fetchCustomRangeData]);

  return {
    customRangeData,
    loading,
    error,
    refetch
  };
}
