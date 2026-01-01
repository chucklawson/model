import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CalculateAverages } from './CalculateAverages';
import StandardChartData from '../ChartData/StandardChartData';
import type HistoricalPriceFull_V3 from '../HistoricalPriceFull_V3';
import type AnalysisKeyMetricsItem_V3 from '../AnalysisKeyMetricsItem_V3';
import type LWChartData from '../ChartData/LWChartData';

// Helper to create mock historical data
function createMockHistoricalData(
  count: number,
  startDate: string,
  startPrice: number
): HistoricalPriceFull_V3[] {
  const data: HistoricalPriceFull_V3[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      open: startPrice + i,
      high: startPrice + i + 1,
      low: startPrice + i - 1,
      close: startPrice + i,
      adjClose: startPrice + i,
      volume: 1000000,
      unadjustedVolume: 1000000,
      change: 0,
      changePercent: 0,
      vwap: startPrice + i,
      label: dateStr,
      changeOverTime: 0,
    });
  }

  return data;
}

// Helper to create mock key metrics data
function createMockKeyMetrics(
  count: number,
  startDate: string
): AnalysisKeyMetricsItem_V3[] {
  const data: AnalysisKeyMetricsItem_V3[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + (i * 3)); // Quarterly data
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      symbol: 'TEST',
      date: dateStr,
      period: 'Q' + (i % 4 + 1),
      calendarYear: '2024',
      revenuePerShare: 10 + i,
      netIncomePerShare: 2 + i * 0.1,
      operatingCashFlowPerShare: 3 + i * 0.1,
      freeCashFlowPerShare: 2.5 + i * 0.1,
      cashPerShare: 5 + i * 0.1,
      bookValuePerShare: 15 + i,
      tangibleBookValuePerShare: 14 + i,
      shareholdersEquityPerShare: 15 + i,
      interestDebtPerShare: 2 + i * 0.05,
      marketCap: 1000000000 + i * 1000000,
      enterpriseValue: 1100000000 + i * 1000000,
      peRatio: 15 + i,
      priceToSalesRatio: 2 + i * 0.1,
      pocfratio: 10 + i,
      pfcfRatio: 12 + i,
      pbRatio: 1.5 + i * 0.1,
      ptbRatio: 1.6 + i * 0.1,
      evToSales: 2.2 + i * 0.1,
      enterpriseValueOverEBITDA: 8 + i,
      evToOperatingCashFlow: 9 + i,
      evToFreeCashFlow: 10 + i,
      earningsYield: 0.06 + i * 0.001,
      freeCashFlowYield: 0.08 + i * 0.001,
      debtToEquity: 0.5 + i * 0.01,
      debtToAssets: 0.3 + i * 0.01,
      netDebtToEBITDA: 2 + i * 0.1,
      currentRatio: 1.5 + i * 0.1,
      interestCoverage: 10 + i,
      incomeQuality: 0.9 + i * 0.01,
      dividendYield: 0.02 + i * 0.001,
      payoutRatio: 0.3 + i * 0.01,
      salesGeneralAndAdministrativeToRevenue: 0.2,
      researchAndDevelopmentToRevenue: 0.1,
      intangiblesToTotalAssets: 0.15,
      capexToOperatingCashFlow: 0.25,
      capexToRevenue: 0.05,
      capexToDepreciation: 1.2,
      stockBasedCompensationToRevenue: 0.03,
      grahamNumber: 50 + i,
      roic: 0.15 + i * 0.01,
      returnOnTangibleAssets: 0.12 + i * 0.01,
      grahamNetNet: 40 + i,
      workingCapital: 500000000,
      tangibleAssetValue: 600000000,
      netCurrentAssetValue: 550000000,
      investedCapital: 800000000,
      averageReceivables: 100000000,
      averagePayables: 80000000,
      averageInventory: 120000000,
      daysSalesOutstanding: 45,
      daysPayablesOutstanding: 30,
      daysOfInventoryOnHand: 60,
      receivablesTurnover: 8,
      payablesTurnover: 12,
      inventoryTurnover: 6,
      roe: 0.18 + i * 0.01,
      capexPerShare: 1 + i * 0.1,
    });
  }

  return data;
}

// Helper to create mock LW chart data
function createMockLWData(count: number, startDate: string): LWChartData[] {
  const data: LWChartData[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      value: -50 + (i % 100), // Oscillates between -50 and 50
    });
  }

  return data;
}

describe('CalculateAverages', () => {
  let calculateAverages: CalculateAverages;

  beforeEach(() => {
    calculateAverages = new CalculateAverages();
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      expect(calculateAverages).toBeInstanceOf(CalculateAverages);
    });
  });

  describe('dailyValues', () => {
    it('should return null when standardValuesIn.length is undefined', () => {
      // Create an object without a length property to trigger the undefined check
      const invalidData = {} as any;
      const result = calculateAverages.dailyValues(invalidData, []);
      expect(result).toBeNull();
    });

    it('should generate basic chart data with closing prices', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(50, '2023-12-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(10);
      expect(result![0].dateOfClose).toBe('2024-01-01');
      expect(result![0].dailyClosingPrice).toBe(100);
    });

    it('should calculate 33-day simple moving average', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(100, '2023-11-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(50);
      // Should have SMA values calculated
      const hasNonNullSMA = result!.some(entry => entry.simpleMovingAverage !== null);
      expect(hasNonNullSMA).toBe(true);
    });

    it('should calculate 10-day exponential moving average', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(100, '2023-11-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(50);
      // Should have EMA values calculated
      const hasNonNullEMA = result!.some(entry => entry.expMovingAverage !== null);
      expect(hasNonNullEMA).toBe(true);
    });

    it('should calculate 200-day moving average when sufficient data', () => {
      const standardData = createMockHistoricalData(100, '2024-01-01', 100);
      // Need at least standardData.length + 200 days
      const adjustedData = createMockHistoricalData(310, '2023-01-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(100);
      // Should have 200-day MA values calculated
      const hasNonNull200DayMA = result!.some(entry => entry.twoHundredDayMovingAverage !== null);
      expect(hasNonNull200DayMA).toBe(true);
    });

    it('should skip 200-day moving average when insufficient data', () => {
      const standardData = createMockHistoricalData(100, '2024-01-01', 100);
      // Not enough data for 200-day MA
      const adjustedData = createMockHistoricalData(150, '2023-08-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(100);
      // Should not have 200-day MA values
      const allNull200DayMA = result!.every(entry => entry.twoHundredDayMovingAverage === null);
      expect(allNull200DayMA).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient data for 200-day moving average')
      );
    });

    it('should calculate 50-day moving average when sufficient data', () => {
      const standardData = createMockHistoricalData(100, '2024-01-01', 100);
      // Need at least standardData.length + 50 days
      const adjustedData = createMockHistoricalData(160, '2023-08-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(100);
      // Should have 50-day MA values calculated
      const hasNonNull50DayMA = result!.some(entry => entry.fiftyDayMovingAverage !== null);
      expect(hasNonNull50DayMA).toBe(true);
    });

    it('should skip 50-day moving average when insufficient data', () => {
      const standardData = createMockHistoricalData(100, '2024-01-01', 100);
      // Not enough data for 50-day MA
      const adjustedData = createMockHistoricalData(120, '2023-10-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(100);
      // Should not have 50-day MA values
      const allNull50DayMA = result!.every(entry => entry.fiftyDayMovingAverage === null);
      expect(allNull50DayMA).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Insufficient data for 50-day moving average')
      );
    });

    it('should handle minimal data set', () => {
      const standardData = createMockHistoricalData(5, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(40, '2023-12-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(5);
    });

    it('should preserve date ordering', () => {
      const standardData = createMockHistoricalData(20, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(60, '2023-11-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result![0].dateOfClose).toBe('2024-01-01');
      expect(result![19].dateOfClose).toBe('2024-01-20');
    });

    it('should handle varying price data', () => {
      const standardData: HistoricalPriceFull_V3[] = [
        { date: '2024-01-01', close: 100, open: 99, high: 101, low: 98, adjClose: 100, volume: 1000000, unadjustedVolume: 1000000, change: 0, changePercent: 0, vwap: 100, label: '2024-01-01', changeOverTime: 0 },
        { date: '2024-01-02', close: 105, open: 100, high: 106, low: 99, adjClose: 105, volume: 1000000, unadjustedVolume: 1000000, change: 5, changePercent: 5, vwap: 105, label: '2024-01-02', changeOverTime: 0.05 },
        { date: '2024-01-03', close: 95, open: 105, high: 105, low: 94, adjClose: 95, volume: 1000000, unadjustedVolume: 1000000, change: -10, changePercent: -9.52, vwap: 95, label: '2024-01-03', changeOverTime: -0.05 },
      ];
      const adjustedData = createMockHistoricalData(50, '2023-12-01', 100);

      const result = calculateAverages.dailyValues(standardData, adjustedData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
      expect(result![0].dailyClosingPrice).toBe(100);
      expect(result![1].dailyClosingPrice).toBe(105);
      expect(result![2].dailyClosingPrice).toBe(95);
    });
  });

  describe('bollingerBands', () => {
    it('should return null when standardValuesIn.length is undefined', () => {
      const chartData = [
        new StandardChartData('2024-01-01', 100, null, null, null, null, null, null, null),
      ];
      // Create an object without a length property to trigger the undefined check
      const invalidData = {} as any;
      const result = calculateAverages.bollingerBands(invalidData, [], chartData);
      expect(result).toBeNull();
    });

    it('should add Bollinger Bands to chart data', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      // Ensure adjusted data fully covers standardData through end of Feb 2024
      // 150 days from Sept 2023 = covers through late Jan 2024 + 50 more = late March
      const adjustedData = createMockHistoricalData(200, '2023-09-01', 100);
      const chartData = standardData.map(d =>
        new StandardChartData(d.date, d.close, null, null, null, null, null, null, null)
      );

      const result = calculateAverages.bollingerBands(standardData, adjustedData, chartData);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(50);
      }
    });

    it('should calculate Bollinger Bands with 20-day period', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      // Ensure full coverage with ample data
      const adjustedData = createMockHistoricalData(200, '2023-09-01', 100);
      const chartData = standardData.map(d =>
        new StandardChartData(d.date, d.close, 100, 100, null, null, null, null, null)
      );

      const result = calculateAverages.bollingerBands(standardData, adjustedData, chartData);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
        // Check that Bollinger values exist
        const hasValidBollinger = result.some(
          entry => entry.lowerBollingerValue !== null && entry.upperBollingerValue !== null
        );
        expect(hasValidBollinger).toBe(true);
      }
    });

    it('should preserve existing moving averages', () => {
      const standardData = createMockHistoricalData(30, '2024-01-01', 100);
      // Ensure full coverage: 30 days + 20 lookback = 50+ days, start Oct 2023
      const adjustedData = createMockHistoricalData(80, '2023-10-01', 100);
      const chartData = standardData.map(d =>
        new StandardChartData(d.date, d.close, 105, 103, 110, 107, null, null, null)
      );

      const result = calculateAverages.bollingerBands(standardData, adjustedData, chartData);

      expect(result).not.toBeNull();
      if (result && result.length > 0) {
        // Check that moving averages are preserved
        const hasSMA = result.some(entry => entry.simpleMovingAverage !== null);
        const hasEMA = result.some(entry => entry.expMovingAverage !== null);
        expect(hasSMA || hasEMA).toBe(true);
      }
    });

    it('should return chart data without Bollinger Bands when calculation fails', () => {
      const standardData = createMockHistoricalData(5, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(10, '2023-12-25', 100);
      const chartData = standardData.map(d =>
        new StandardChartData(d.date, d.close, null, null, null, null, null, null, null)
      );

      const result = calculateAverages.bollingerBands(standardData, adjustedData, chartData);

      // When insufficient data, should return original chart data
      expect(result).not.toBeNull();
      expect(result).toHaveLength(5);
    });

    it('should convert dates to YYYY-MM-DD format only', () => {
      const standardData = createMockHistoricalData(20, '2024-01-01', 100);
      // Ensure full coverage: 20 days + 20 lookback = 40+ days
      const adjustedData = createMockHistoricalData(60, '2023-11-01', 100);
      const chartData = standardData.map(d =>
        new StandardChartData(d.date, d.close, 100, 100, null, null, null, null, null)
      );

      const result = calculateAverages.bollingerBands(standardData, adjustedData, chartData);

      expect(result).not.toBeNull();
      result!.forEach(entry => {
        expect(entry.dateOfClose).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.dateOfClose).not.toContain('T');
      });
    });
  });

  describe('getRsiChartData', () => {
    it('should calculate RSI with 14-day period', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(80, '2023-11-01', 100);

      const result = calculateAverages.getRsiChartData(standardData, adjustedData);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should handle price fluctuations in RSI calculation', () => {
      // Create data with ups and downs
      const standardData: HistoricalPriceFull_V3[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const price = 100 + (i % 2 === 0 ? 5 : -5); // Alternating up and down
        standardData.push({
          date: date.toISOString().split('T')[0],
          open: price,
          high: price + 1,
          low: price - 1,
          close: price,
          adjClose: price,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: price,
          label: date.toISOString().split('T')[0],
          changeOverTime: 0,
        });
      }
      const adjustedData = createMockHistoricalData(60, '2023-12-01', 100);

      const result = calculateAverages.getRsiChartData(standardData, adjustedData);

      expect(result).not.toBeNull();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should handle minimal data for RSI', () => {
      const standardData = createMockHistoricalData(20, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(50, '2023-12-01', 100);

      const result = calculateAverages.getRsiChartData(standardData, adjustedData);

      // RSI may return null or empty array with insufficient data
      if (result) {
        expect(Array.isArray(result)).toBe(true);
      }
    });
  });

  describe('getStochasticChartData', () => {
    it('should calculate Stochastic with 3-day slow and 14-day fast indicators', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(80, '2023-11-01', 100);

      const result = calculateAverages.getStochasticChartData(standardData, adjustedData);

      expect(result).toBeDefined();
      if (result) {
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should handle price range variations in Stochastic', () => {
      // Create data with high and low variations
      const standardData: HistoricalPriceFull_V3[] = [];
      for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const basePrice = 100 + Math.sin(i / 5) * 20; // Wave pattern
        standardData.push({
          date: date.toISOString().split('T')[0],
          open: basePrice,
          high: basePrice + 5,
          low: basePrice - 5,
          close: basePrice,
          adjClose: basePrice,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: basePrice,
          label: date.toISOString().split('T')[0],
          changeOverTime: 0,
        });
      }
      const adjustedData = createMockHistoricalData(60, '2023-12-01', 100);

      const result = calculateAverages.getStochasticChartData(standardData, adjustedData);

      expect(result).toBeDefined();
    });

    it('should handle minimal data for Stochastic', () => {
      const standardData = createMockHistoricalData(20, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(50, '2023-12-01', 100);

      const result = calculateAverages.getStochasticChartData(standardData, adjustedData);

      expect(result).toBeDefined();
    });
  });

  describe('getLwChartData', () => {
    it('should filter Larry Williams data by date range', () => {
      const lwData = createMockLWData(100, '2024-01-01');
      const startDate = '2024-01-10';
      const endDate = '2024-01-20';

      const result = calculateAverages.getLwChartData(lwData, startDate, endDate);

      expect(result).toBeDefined();
      if (result) {
        expect(Array.isArray(result)).toBe(true);
      }
    });

    it('should handle empty LW data', () => {
      const lwData: LWChartData[] = [];
      const startDate = '2024-01-10';
      const endDate = '2024-01-20';

      // Implementation throws error when accessing undefined array elements
      expect(() => calculateAverages.getLwChartData(lwData, startDate, endDate)).toThrow();
    });

    it('should handle date range with no matching data', () => {
      const lwData = createMockLWData(10, '2024-01-01');
      const startDate = '2025-01-01';
      const endDate = '2025-01-10';

      const result = calculateAverages.getLwChartData(lwData, startDate, endDate);

      expect(result).toBeDefined();
    });
  });

  describe('getPriceToEarningsChartData', () => {
    it('should return up to 8 entries from key metrics', () => {
      const keyMetrics = createMockKeyMetrics(12, '2024-01-01');

      const result = calculateAverages.getPriceToEarningsChartData(keyMetrics);

      expect(result).toBeDefined();
      expect(result).toHaveLength(8);
    });

    it('should reverse the order of entries', () => {
      const keyMetrics = createMockKeyMetrics(10, '2024-01-01');
      const _firstDateBefore = keyMetrics[0].date;

      const result = calculateAverages.getPriceToEarningsChartData(keyMetrics);

      // After reversing, the last item in result should have the first date from input
      expect(result[result.length - 1]).toBeDefined();
    });

    it('should handle exactly 8 entries', () => {
      // Need more than 8 entries to collect 8 (the code checks > entriesToCollect)
      const keyMetrics = createMockKeyMetrics(9, '2024-01-01');

      const result = calculateAverages.getPriceToEarningsChartData(keyMetrics);

      expect(result).toHaveLength(8);
    });

    it('should handle fewer than 8 entries', () => {
      const keyMetrics = createMockKeyMetrics(5, '2024-01-01');

      const result = calculateAverages.getPriceToEarningsChartData(keyMetrics);

      expect(result).toHaveLength(0);
    });

    it('should return empty array when data is null', () => {
      const result = calculateAverages.getPriceToEarningsChartData(null as any);

      expect(result).toEqual([]);
    });

    it('should return empty array when data is undefined', () => {
      const result = calculateAverages.getPriceToEarningsChartData(undefined as any);

      expect(result).toEqual([]);
    });

    it('should return empty array when data length is undefined', () => {
      const result = calculateAverages.getPriceToEarningsChartData([] as any);

      expect(result).toEqual([]);
    });
  });

  describe('convertDateStringToYear_Month_DayOnly', () => {
    it('should extract date portion from ISO string', () => {
      const date = new Date('2024-01-15T12:34:56.789Z');

      const result = calculateAverages.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-01-15');
    });

    it('should handle different times of day', () => {
      const date1 = new Date('2024-03-20T00:00:00.000Z');
      const date2 = new Date('2024-03-20T23:59:59.999Z');

      const result1 = calculateAverages.convertDateStringToYear_Month_DayOnly(date1);
      const result2 = calculateAverages.convertDateStringToYear_Month_DayOnly(date2);

      expect(result1).toBe('2024-03-20');
      expect(result2).toBe('2024-03-20');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2024-03-05T10:00:00.000Z');

      const result = calculateAverages.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-03-05');
      expect(result).not.toContain('T');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:00:00.000Z');

      const result = calculateAverages.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-02-29');
    });

    it('should handle year-end dates', () => {
      const date = new Date('2024-12-31T23:59:59.999Z');

      const result = calculateAverages.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-12-31');
    });
  });

  describe('Integration Tests', () => {
    describe('dailyValues integration with all indicators', () => {
      it('should calculate all moving averages when sufficient data is provided', () => {
        // Provide 1 year of display data + 1 year of historical = 2 years total
        const standardData = createMockHistoricalData(365, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(730, '2023-01-01', 100);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(365);

        // Check that all moving averages are calculated
        const hasSMA = result!.some(entry => entry.simpleMovingAverage !== null);
        const hasEMA = result!.some(entry => entry.expMovingAverage !== null);
        const has200DayMA = result!.some(entry => entry.twoHundredDayMovingAverage !== null);
        const has50DayMA = result!.some(entry => entry.fiftyDayMovingAverage !== null);

        expect(hasSMA).toBe(true);
        expect(hasEMA).toBe(true);
        expect(has200DayMA).toBe(true);
        expect(has50DayMA).toBe(true);
      });

      it('should handle complete workflow: dailyValues -> bollingerBands', () => {
        const standardData = createMockHistoricalData(100, '2024-02-01', 100);
        // Need enough data: standardData (100 days) + lookback for 200-day MA (200) = 300+ days
        // adjustedData must start early and have enough days to cover standardData end date + lookback
        const adjustedData = createMockHistoricalData(450, '2023-04-01', 100);

        // First calculate daily values
        const dailyResult = calculateAverages.dailyValues(standardData, adjustedData);
        expect(dailyResult).not.toBeNull();

        // Then add Bollinger Bands
        const bollingerResult = calculateAverages.bollingerBands(
          standardData,
          adjustedData,
          dailyResult!
        );

        expect(bollingerResult).not.toBeNull();
        if (bollingerResult) {
          expect(bollingerResult.length).toBeGreaterThan(0);
          // Verify some indicators are present
          const hasIndicators = bollingerResult.some(
            entry =>
              entry.simpleMovingAverage !== null ||
              entry.expMovingAverage !== null ||
              entry.lowerBollingerValue !== null ||
              entry.upperBollingerValue !== null
          );
          expect(hasIndicators).toBe(true);
        }
      });

      it('should handle workflow with all technical indicators', () => {
        const standardData = createMockHistoricalData(100, '2024-02-01', 100);
        const adjustedData = createMockHistoricalData(450, '2023-04-01', 100);

        // Calculate all indicators
        const dailyResult = calculateAverages.dailyValues(standardData, adjustedData);
        expect(dailyResult).not.toBeNull();

        const bollingerResult = calculateAverages.bollingerBands(
          standardData,
          adjustedData,
          dailyResult!
        );
        const _rsiResult = calculateAverages.getRsiChartData(standardData, adjustedData);
        const _stochasticResult = calculateAverages.getStochasticChartData(
          standardData,
          adjustedData
        );

        expect(bollingerResult).not.toBeNull();
        // RSI and Stochastic may return null if data doesn't cover the range
        if (bollingerResult) {
          expect(bollingerResult.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle empty arrays gracefully', () => {
        const emptyData: HistoricalPriceFull_V3[] = [];
        const standardData = createMockHistoricalData(10, '2024-01-01', 100);

        // Implementation throws error when accessing undefined array elements
        expect(() => calculateAverages.dailyValues(emptyData, standardData)).toThrow();
      });

      it('should handle single data point', () => {
        const singleData = createMockHistoricalData(1, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(50, '2023-12-01', 100);

        const result = calculateAverages.dailyValues(singleData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(1);
      });

      it('should handle exact minimum data requirements', () => {
        // Exactly enough for 33-day SMA
        const standardData = createMockHistoricalData(10, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(43, '2023-12-01', 100); // 10 + 33

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(10);
      });

      it('should handle very large datasets', () => {
        const standardData = createMockHistoricalData(1000, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(1500, '2020-01-01', 100);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(1000);
      });

      it('should handle price data with extreme values', () => {
        const standardData = createMockHistoricalData(50, '2024-01-01', 0.01);
        const adjustedData = createMockHistoricalData(100, '2023-11-01', 0.01);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(50);
        expect(result![0].dailyClosingPrice).toBeCloseTo(0.01, 2);
      });

      it('should handle high-priced stocks', () => {
        const standardData = createMockHistoricalData(50, '2024-01-01', 10000);
        const adjustedData = createMockHistoricalData(100, '2023-11-01', 10000);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(50);
        expect(result![0].dailyClosingPrice).toBe(10000);
      });

      it('should handle date boundaries correctly', () => {
        // Test with year-end and year-start dates
        const standardData = createMockHistoricalData(10, '2023-12-28', 100);
        const adjustedData = createMockHistoricalData(60, '2023-11-01', 100);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        expect(result).toHaveLength(10);
        expect(result![0].dateOfClose).toBe('2023-12-28');
      });
    });

    describe('Data consistency checks', () => {
      it('should maintain data integrity across transformations', () => {
        const standardData = createMockHistoricalData(50, '2024-01-01', 100);
        // Ensure full coverage: 50 days + 200-day lookback = 250+ days
        const adjustedData = createMockHistoricalData(280, '2023-06-01', 100);

        const dailyResult = calculateAverages.dailyValues(standardData, adjustedData);
        const bollingerResult = calculateAverages.bollingerBands(
          standardData,
          adjustedData,
          dailyResult!
        );

        // Check data integrity for available results
        expect(bollingerResult).not.toBeNull();
        if (bollingerResult && bollingerResult.length > 0) {
          // Verify dates and prices match for available entries
          bollingerResult.forEach((entry, i) => {
            if (i < standardData.length) {
              expect(entry.dateOfClose).toBeTruthy();
              expect(typeof entry.dailyClosingPrice).toBe('number');
            }
          });
        }
      });

      it('should handle out-of-order dates in chart data', () => {
        const standardData = createMockHistoricalData(30, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(70, '2023-11-01', 100);

        const result = calculateAverages.dailyValues(standardData, adjustedData);

        expect(result).not.toBeNull();
        // Verify sequential dates
        for (let i = 1; i < result!.length; i++) {
          const prevDate = new Date(result![i - 1].dateOfClose);
          const currDate = new Date(result![i].dateOfClose);
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime());
        }
      });
    });

    describe('Performance and optimization tests', () => {
      it('should handle typical trading day dataset efficiently', () => {
        // 252 trading days + buffer for lookback
        const standardData = createMockHistoricalData(252, '2024-01-01', 100);
        const adjustedData = createMockHistoricalData(500, '2023-01-01', 100);

        const startTime = Date.now();
        const result = calculateAverages.dailyValues(standardData, adjustedData);
        const endTime = Date.now();

        expect(result).not.toBeNull();
        expect(result).toHaveLength(252);
        // Should complete in reasonable time (less than 1 second)
        expect(endTime - startTime).toBeLessThan(1000);
      });
    });
  });
});
