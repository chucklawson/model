import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StandardMovingAverage from './StandardMovingAverage';
import StandardChartData from './StandardChartData';
import type HistoricalPriceFull_V3 from '../HistoricalPriceFull_V3';

// Helper to create mock historical data
function createMockHistoricalData(count: number, startDate: string, startPrice: number): HistoricalPriceFull_V3[] {
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

describe('StandardMovingAverage', () => {
  beforeEach(() => {
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with historical data and lookback period', () => {
      const historicalData = createMockHistoricalData(100, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 20);

      expect(sma.oneYearOfData).toBe(historicalData);
      expect(sma.numberOfDaystoLookBack).toBe(20);
      expect(sma.accumulatedChartData).toEqual([]);
    });

    it('should handle empty historical data', () => {
      const sma = new StandardMovingAverage([], 20);

      expect(sma.oneYearOfData).toEqual([]);
      expect(sma.numberOfDaystoLookBack).toBe(20);
    });
  });

  describe('generateOneDataPoint', () => {
    it('should calculate correct SMA for a simple case', () => {
      // Create data: [100, 101, 102, 103, 104]
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 3);

      // SMA at index 3 (looking back 3 days from index 3: indices 1, 2, 3 = values 101, 102, 103)
      const result = sma.generateOneDataPoint(3, 3, historicalData);

      // Expected: (101 + 102 + 103) / 3 = 102
      expect(result).toBeCloseTo(102, 2);
    });

    it('should calculate correct SMA for 5-day average', () => {
      // Create data: [100, 101, 102, 103, 104, 105]
      const historicalData = createMockHistoricalData(6, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      // SMA at index 5 (looking back 5 days from index 5: indices 1, 2, 3, 4, 5 = values 101, 102, 103, 104, 105)
      const result = sma.generateOneDataPoint(5, 5, historicalData);

      // Expected: (101 + 102 + 103 + 104 + 105) / 5 = 103
      expect(result).toBeCloseTo(103, 2);
    });

    it('should return 0 for zero lookback period', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 0);

      const result = sma.generateOneDataPoint(2, 0, historicalData);

      expect(result).toBe(0);
    });

    it('should return 0 for negative lookback period', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, -5);

      const result = sma.generateOneDataPoint(2, -5, historicalData);

      expect(result).toBe(0);
    });

    it('should return 0 when startAddress is less than lookback', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      // Try to calculate at index 2 with 5-day lookback (not enough data)
      const result = sma.generateOneDataPoint(2, 5, historicalData);

      expect(result).toBe(0);
    });

    it('should handle fractional prices', () => {
      const historicalData: HistoricalPriceFull_V3[] = [
        {
          date: '2024-01-01',
          close: 100.50,
          open: 100,
          high: 101,
          low: 100,
          adjClose: 100.50,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 100.50,
          label: '2024-01-01',
          changeOverTime: 0,
        },
        {
          date: '2024-01-02',
          close: 101.25,
          open: 101,
          high: 102,
          low: 101,
          adjClose: 101.25,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 101.25,
          label: '2024-01-02',
          changeOverTime: 0,
        },
        {
          date: '2024-01-03',
          close: 102.75,
          open: 102,
          high: 103,
          low: 102,
          adjClose: 102.75,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 102.75,
          label: '2024-01-03',
          changeOverTime: 0,
        },
        {
          date: '2024-01-04',
          close: 103.00,
          open: 103,
          high: 104,
          low: 103,
          adjClose: 103.00,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 103.00,
          label: '2024-01-04',
          changeOverTime: 0,
        },
      ];

      const sma = new StandardMovingAverage(historicalData, 3);
      // At index 3, looking back 3: indices 1, 2, 3 = 101.25, 102.75, 103.00
      const result = sma.generateOneDataPoint(3, 3, historicalData);

      // Expected: (101.25 + 102.75 + 103.00) / 3 = 102.33
      expect(result).toBeCloseTo(102.33, 2);
    });
  });

  describe('generateTheDataPointsSimpleMovingAverage', () => {
    it('should return null when insufficient data', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 10);

      const result = sma.generateTheDataPointsSimpleMovingAverage(10, historicalData);

      expect(result).toBeNull();
    });

    it('should generate correct number of data points', () => {
      const historicalData = createMockHistoricalData(10, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const result = sma.generateTheDataPointsSimpleMovingAverage(5, historicalData);

      // With 10 days of data and 5-day lookback, we get 5 data points (indices 5-9)
      expect(result).not.toBeNull();
      expect(result?.length).toBe(5);
    });

    it('should generate data points with correct dates', () => {
      const historicalData = createMockHistoricalData(10, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const result = sma.generateTheDataPointsSimpleMovingAverage(5, historicalData);

      // First data point should be at index 5
      expect(result?.[0].date).toMatch(/^2024-01-\d{2}$/);
      // Last data point should be at index 9
      expect(result?.[result.length - 1].date).toMatch(/^2024-01-\d{2}$/);
      expect(result?.length).toBe(5);
    });

    it('should calculate correct SMA values', () => {
      // Create simple data: [10, 20, 30, 40, 50]
      const historicalData: HistoricalPriceFull_V3[] = [10, 20, 30, 40, 50].map((price, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        close: price,
        open: price,
        high: price + 1,
        low: price - 1,
        adjClose: price,
        volume: 1000000,
        unadjustedVolume: 1000000,
        change: 0,
        changePercent: 0,
        vwap: price,
        label: `2024-01-${String(i + 1).padStart(2, '0')}`,
        changeOverTime: 0,
      }));

      const sma = new StandardMovingAverage(historicalData, 3);
      const result = sma.generateTheDataPointsSimpleMovingAverage(3, historicalData);

      // First SMA at index 3 uses indices 1, 2, 3: (20 + 30 + 40) / 3 = 30
      expect(result?.[0].calculatedValue).toBeCloseTo(30, 2);
      // Second SMA at index 4 uses indices 2, 3, 4: (30 + 40 + 50) / 3 = 40
      expect(result?.[1].calculatedValue).toBeCloseTo(40, 2);
    });

    it('should handle single data point after lookback', () => {
      const historicalData = createMockHistoricalData(6, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const result = sma.generateTheDataPointsSimpleMovingAverage(5, historicalData);

      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
    });

    it('should handle exact match of data and lookback', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const result = sma.generateTheDataPointsSimpleMovingAverage(5, historicalData);

      // With 5 days of data and 5-day lookback, the loop starts at index 5
      // which is out of bounds, so we get an empty array
      expect(result).toEqual([]);
    });
  });

  describe('generateTheAverages', () => {
    it('should return null SMA values when insufficient data', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 10);

      const chartData = [
        new StandardChartData('2024-01-01', 100, null, null, null, null, null, null, null),
        new StandardChartData('2024-01-02', 101, null, null, null, null, null, null, null),
      ];

      const result = sma.generateTheAverages(chartData);

      expect(result).toHaveLength(2);
      expect(result[0].simpleMovingAverage).toBeNull();
      expect(result[1].simpleMovingAverage).toBeNull();
    });

    it('should align SMA values with chart data dates', () => {
      // Create 20 days of historical data starting from 2024-01-01
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      // Create chart data for last 10 days (2024-01-11 to 2024-01-20)
      const chartData = [];
      for (let i = 10; i < 20; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        chartData.push(
          new StandardChartData(dateStr, 100 + i, null, null, null, null, null, null, null)
        );
      }

      const result = sma.generateTheAverages(chartData);

      expect(result).toHaveLength(10);
      // Each result should have a non-null SMA value
      result.forEach((data) => {
        expect(data.simpleMovingAverage).not.toBeNull();
      });
    });

    it('should preserve original chart data properties', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const chartData = [
        new StandardChartData('2024-01-06', 105, null, null, null, null, null, null, null),
      ];

      const result = sma.generateTheAverages(chartData);

      expect(result[0].dateOfClose).toBe('2024-01-06');
      expect(result[0].dailyClosingPrice).toBe(105);
    });

    it('should handle partial chart data coverage', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      // Chart data for first 5 days only
      const chartData = [];
      for (let i = 0; i < 5; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        chartData.push(
          new StandardChartData(dateStr, 100 + i, null, null, null, null, null, null, null)
        );
      }

      const result = sma.generateTheAverages(chartData);

      expect(result).toHaveLength(5);
    });

    it('should handle chart data starting mid-range', () => {
      const historicalData = createMockHistoricalData(30, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      // Chart data starting from day 10
      const chartData = [];
      for (let i = 10; i < 15; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        chartData.push(
          new StandardChartData(dateStr, 100 + i, null, null, null, null, null, null, null)
        );
      }

      const result = sma.generateTheAverages(chartData);

      expect(result).toHaveLength(5);
      expect(result[0].dateOfClose).toBe('2024-01-11');
    });
  });

  describe('generateTheUnrestrictedAverages', () => {
    it('should generate all possible SMA data points', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 5);

      const result = sma.generateTheUnrestrictedAverages();

      // With 20 days and 5-day lookback, we get 15 data points (indices 5-19)
      expect(result).not.toBeNull();
      expect(result?.length).toBe(15);
    });

    it('should return null when insufficient data', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 10);

      const result = sma.generateTheUnrestrictedAverages();

      expect(result).toBeNull();
    });

    it('should calculate correct values for simple case', () => {
      const historicalData: HistoricalPriceFull_V3[] = [10, 20, 30, 40, 50, 60].map((price, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        close: price,
        open: price,
        high: price + 1,
        low: price - 1,
        adjClose: price,
        volume: 1000000,
        unadjustedVolume: 1000000,
        change: 0,
        changePercent: 0,
        vwap: price,
        label: `2024-01-${String(i + 1).padStart(2, '0')}`,
        changeOverTime: 0,
      }));

      const sma = new StandardMovingAverage(historicalData, 3);
      const result = sma.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      // First SMA at index 3 uses indices 1, 2, 3: (20 + 30 + 40) / 3 = 30
      expect(result?.[0].calculatedValue).toBeCloseTo(30, 2);
      // Second SMA at index 4 uses indices 2, 3, 4: (30 + 40 + 50) / 3 = 40
      expect(result?.[1].calculatedValue).toBeCloseTo(40, 2);
      // Third SMA at index 5 uses indices 3, 4, 5: (40 + 50 + 60) / 3 = 50
      expect(result?.[2].calculatedValue).toBeCloseTo(50, 2);
    });
  });

  describe('toString', () => {
    it('should return correct string representation', () => {
      const historicalData = createMockHistoricalData(100, '2024-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 20);

      const result = sma.toString();

      expect(result).toContain('StandardMovingAverage');
      expect(result).toContain('100');
      expect(result).toContain('20');
    });

    it('should handle empty data', () => {
      const sma = new StandardMovingAverage([], 20);

      const result = sma.toString();

      expect(result).toContain('length: 0');
      expect(result).toContain('20');
    });
  });

  describe('integration tests', () => {
    it('should handle real-world scenario with 50-day SMA', () => {
      // Create 200 days of historical data
      const historicalData = createMockHistoricalData(200, '2023-06-01', 150);
      const sma = new StandardMovingAverage(historicalData, 50);

      // Generate unrestricted averages
      const result = sma.generateTheUnrestrictedAverages();

      // Should generate 150 data points (200 - 50)
      expect(result).not.toBeNull();
      expect(result?.length).toBe(150);
    });

    it('should handle 200-day SMA', () => {
      const historicalData = createMockHistoricalData(300, '2023-01-01', 100);
      const sma = new StandardMovingAverage(historicalData, 200);

      const result = sma.generateTheUnrestrictedAverages();

      // Should generate 100 data points (300 - 200)
      expect(result).not.toBeNull();
      expect(result?.length).toBe(100);
    });

    it('should correctly calculate moving window', () => {
      // Create data where we can easily verify the calculation
      const historicalData: HistoricalPriceFull_V3[] = Array.from({ length: 10 }, (_, i) => {
        const day = i + 1;
        return {
          date: `2024-01-${String(day).padStart(2, '0')}`,
          close: day * 10, // 10, 20, 30, ..., 100
          open: day * 10,
          high: day * 10 + 1,
          low: day * 10 - 1,
          adjClose: day * 10,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: day * 10,
          label: `2024-01-${String(day).padStart(2, '0')}`,
          changeOverTime: 0,
        };
      });

      const sma = new StandardMovingAverage(historicalData, 3);
      const result = sma.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();

      // First SMA at index 3 uses indices 1, 2, 3: (20 + 30 + 40) / 3 = 30
      expect(result?.[0].calculatedValue).toBeCloseTo(30, 2);

      // Second SMA at index 4 uses indices 2, 3, 4: (30 + 40 + 50) / 3 = 40
      expect(result?.[1].calculatedValue).toBeCloseTo(40, 2);

      // Last SMA at index 9 uses indices 7, 8, 9: (80 + 90 + 100) / 3 = 90
      expect(result?.[result.length - 1].calculatedValue).toBeCloseTo(90, 2);
    });
  });
});
