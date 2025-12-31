import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StochasticChartEntries from './StochasticChartEntries';
import StochasticChartData from './StochasticChartData';
import type HistoricalPriceFull_V3 from '../HistoricalPriceFull_V3';

// Helper to create mock historical data
function createMockHistoricalData(count: number, startDate: string, basePrice: number): HistoricalPriceFull_V3[] {
  const data: HistoricalPriceFull_V3[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      open: basePrice + i,
      high: basePrice + i + 2,
      low: basePrice + i - 1,
      close: basePrice + i,
      adjClose: basePrice + i,
      volume: 1000000,
      unadjustedVolume: 1000000,
      change: 0,
      changePercent: 0,
      vwap: basePrice + i,
      label: dateStr,
      changeOverTime: 0,
    });
  }

  return data;
}

// Helper to create custom historical data with specific high/low values
function createCustomHistoricalData(dataPoints: Array<{ date: string; high: number; low: number; close: number }>): HistoricalPriceFull_V3[] {
  return dataPoints.map((point) => ({
    date: point.date,
    open: point.close,
    high: point.high,
    low: point.low,
    close: point.close,
    adjClose: point.close,
    volume: 1000000,
    unadjustedVolume: 1000000,
    change: 0,
    changePercent: 0,
    vwap: point.close,
    label: point.date,
    changeOverTime: 0,
  }));
}

describe('StochasticChartEntries', () => {
  beforeEach(() => {
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with standard values, full year data, and lookback periods', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      expect(stochastic.standardValues).toBe(standardData);
      expect(stochastic.fullYearOfDataValues).toBe(fullYearData);
      expect(stochastic.slowInidcatorDaysToLookBack).toBe(3);
      expect(stochastic.fastInidcatorDaysToLookBack).toBe(14);
    });

    it('should handle empty data arrays', () => {
      const stochastic = new StochasticChartEntries([], [], 3, 14);

      expect(stochastic.standardValues).toEqual([]);
      expect(stochastic.fullYearOfDataValues).toEqual([]);
    });
  });

  describe('calculateStochistic', () => {
    it('should calculate correct stochastic value for basic case', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // Formula: ((close - low) / (high - low)) * 100
      // Example: close = 50, low = 40, high = 60
      // Result: ((50 - 40) / (60 - 40)) * 100 = 50
      const result = stochastic.calculateStochistic(40, 60, 50);

      expect(result).toBeCloseTo(50, 2);
    });

    it('should return 100 when close equals high', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // close = high = 60, low = 40
      const result = stochastic.calculateStochistic(40, 60, 60);

      expect(result).toBeCloseTo(100, 2);
    });

    it('should return 0 when close equals low', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // close = low = 40, high = 60
      const result = stochastic.calculateStochistic(40, 60, 40);

      expect(result).toBeCloseTo(0, 2);
    });

    it('should return 0 when high equals low (avoid division by zero)', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // high = low = 50, close = 50
      const result = stochastic.calculateStochistic(50, 50, 50);

      expect(result).toBe(0);
    });

    it('should calculate correct value for fractional prices', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // close = 102.5, low = 100.25, high = 105.75
      const result = stochastic.calculateStochistic(100.25, 105.75, 102.5);

      // Expected: ((102.5 - 100.25) / (105.75 - 100.25)) * 100 = 40.909...
      expect(result).toBeCloseTo(40.909, 2);
    });
  });

  describe('obtainLowTradingPrice', () => {
    it('should find the lowest price in data range', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 95, close: 100 },
        { date: '2024-01-02', high: 115, low: 90, close: 105 },
        { date: '2024-01-03', high: 120, low: 92, close: 110 },
      ]);

      const result = stochastic.obtainLowTradingPrice(testData);

      expect(result).toBe(90);
    });

    it('should handle single data point', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 95, close: 100 },
      ]);

      const result = stochastic.obtainLowTradingPrice(testData);

      expect(result).toBe(95);
    });

    it('should handle all same low prices', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 90, close: 100 },
        { date: '2024-01-02', high: 115, low: 90, close: 105 },
        { date: '2024-01-03', high: 120, low: 90, close: 110 },
      ]);

      const result = stochastic.obtainLowTradingPrice(testData);

      expect(result).toBe(90);
    });
  });

  describe('obtainHignTradingPrice', () => {
    it('should find the highest price in data range', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 95, close: 100 },
        { date: '2024-01-02', high: 125, low: 90, close: 105 },
        { date: '2024-01-03', high: 120, low: 92, close: 110 },
      ]);

      const result = stochastic.obtainHignTradingPrice(testData);

      expect(result).toBe(125);
    });

    it('should handle single data point', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 95, close: 100 },
      ]);

      const result = stochastic.obtainHignTradingPrice(testData);

      expect(result).toBe(110);
    });

    it('should handle all same high prices', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = createCustomHistoricalData([
        { date: '2024-01-01', high: 120, low: 90, close: 100 },
        { date: '2024-01-02', high: 120, low: 95, close: 105 },
        { date: '2024-01-03', high: 120, low: 92, close: 110 },
      ]);

      const result = stochastic.obtainHignTradingPrice(testData);

      expect(result).toBe(120);
    });
  });

  describe('colllectSubsetOfDateToEvaluate', () => {
    it('should collect correct subset of data', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(10, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // Collect 3 days ending at index 5 (indices 3, 4, 5)
      const result = stochastic.colllectSubsetOfDateToEvaluate(5, 3, fullYearData);

      expect(result.length).toBe(3);
      expect(result[0].date).toBe(fullYearData[2].date);
      expect(result[1].date).toBe(fullYearData[3].date);
      expect(result[2].date).toBe(fullYearData[4].date);
    });

    it('should handle subset at start of data', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(10, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // Collect 2 days ending at index 2 (indices 0, 1)
      const result = stochastic.colllectSubsetOfDateToEvaluate(2, 2, fullYearData);

      expect(result.length).toBe(2);
      expect(result[0].date).toBe(fullYearData[0].date);
      expect(result[1].date).toBe(fullYearData[1].date);
    });

    it('should handle subset at end of data', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(10, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      // Collect 3 days ending at index 10 (indices 7, 8, 9)
      const result = stochastic.colllectSubsetOfDateToEvaluate(10, 3, fullYearData);

      expect(result.length).toBe(3);
      expect(result[0].date).toBe(fullYearData[7].date);
      expect(result[1].date).toBe(fullYearData[8].date);
      expect(result[2].date).toBe(fullYearData[9].date);
    });
  });

  describe('findStartAddressBasedOnDate', () => {
    it('should find correct index for existing date', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
        { stochasticValue: 60, dateOfClose: '2024-01-02' },
        { stochasticValue: 70, dateOfClose: '2024-01-03' },
      ];

      const result = stochastic.findStartAddressBasedOnDate(testData, '2024-01-02');

      expect(result).toBe(1);
    });

    it('should return -1 for non-existent date', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
        { stochasticValue: 60, dateOfClose: '2024-01-02' },
        { stochasticValue: 70, dateOfClose: '2024-01-03' },
      ];

      const result = stochastic.findStartAddressBasedOnDate(testData, '2024-01-15');

      expect(result).toBe(-1);
    });

    it('should find first occurrence when date appears multiple times', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
        { stochasticValue: 60, dateOfClose: '2024-01-02' },
        { stochasticValue: 70, dateOfClose: '2024-01-02' },
      ];

      const result = stochastic.findStartAddressBasedOnDate(testData, '2024-01-02');

      expect(result).toBe(1);
    });

    it('should handle empty array', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.findStartAddressBasedOnDate([], '2024-01-01');

      expect(result).toBe(-1);
    });
  });

  describe('generateOneDataPoint', () => {
    it('should calculate correct simple moving average', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
        { close: 30, dateOfClose: '2024-01-03' },
        { close: 40, dateOfClose: '2024-01-04' },
      ];

      // At index 3, lookback 3: average of indices 1, 2, 3 = (20 + 30 + 40) / 3 = 30
      const result = stochastic.generateOneDataPoint(3, 3, testData);

      expect(result).toBeCloseTo(30, 2);
    });

    it('should return 0 for zero lookback period', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
      ];

      const result = stochastic.generateOneDataPoint(1, 0, testData);

      expect(result).toBe(0);
    });

    it('should return 0 for negative lookback period', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
      ];

      const result = stochastic.generateOneDataPoint(1, -5, testData);

      expect(result).toBe(0);
    });

    it('should return 0 when startAddress is less than lookback', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
      ];

      const result = stochastic.generateOneDataPoint(1, 5, testData);

      expect(result).toBe(0);
    });

    it('should handle fractional values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10.5, dateOfClose: '2024-01-01' },
        { close: 20.25, dateOfClose: '2024-01-02' },
        { close: 30.75, dateOfClose: '2024-01-03' },
        { close: 40.5, dateOfClose: '2024-01-04' },
      ];

      // At index 3, lookback 3: average of indices 1, 2, 3 = (20.25 + 30.75 + 40.5) / 3 = 30.5
      const result = stochastic.generateOneDataPoint(3, 3, testData);

      expect(result).toBeCloseTo(30.5, 2);
    });
  });

  describe('generateTheDataPointsSimpleMovingAverage', () => {
    it('should return undefined when insufficient data', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
      ];

      const result = stochastic.generateTheDataPointsSimpleMovingAverage(5, testData);

      expect(result).toBeUndefined();
    });

    it('should generate correct number of data points', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
        { close: 30, dateOfClose: '2024-01-03' },
        { close: 40, dateOfClose: '2024-01-04' },
        { close: 50, dateOfClose: '2024-01-05' },
      ];

      // With 5 data points and lookback 3, should get 2 points (indices 3 and 4)
      const result = stochastic.generateTheDataPointsSimpleMovingAverage(3, testData);

      expect(result).toBeDefined();
      expect(result?.length).toBe(2);
    });

    it('should calculate correct SMA values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
        { close: 30, dateOfClose: '2024-01-03' },
        { close: 40, dateOfClose: '2024-01-04' },
        { close: 50, dateOfClose: '2024-01-05' },
      ];

      const result = stochastic.generateTheDataPointsSimpleMovingAverage(3, testData);

      // First point at index 3: (20 + 30 + 40) / 3 = 30
      expect(result?.[0].stochasticValue).toBeCloseTo(30, 2);
      expect(result?.[0].dateOfClose).toBe('2024-01-04');

      // Second point at index 4: (30 + 40 + 50) / 3 = 40
      expect(result?.[1].stochasticValue).toBeCloseTo(40, 2);
      expect(result?.[1].dateOfClose).toBe('2024-01-05');
    });

    it('should handle exact match of data length and lookback', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const testData = [
        { close: 10, dateOfClose: '2024-01-01' },
        { close: 20, dateOfClose: '2024-01-02' },
        { close: 30, dateOfClose: '2024-01-03' },
      ];

      const result = stochastic.generateTheDataPointsSimpleMovingAverage(3, testData);

      // With 3 data points and lookback 3, loop starts at index 3 which is out of bounds
      expect(result).toEqual([]);
    });
  });

  describe('generateSlowStochasticValues', () => {
    it('should return undefined when fast stochastic values is undefined', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateSlowStochasticValues(undefined, 3);

      expect(result).toBeUndefined();
    });

    it('should generate slow stochastic from fast stochastic values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 10, dateOfClose: '2024-01-01' },
        { stochasticValue: 20, dateOfClose: '2024-01-02' },
        { stochasticValue: 30, dateOfClose: '2024-01-03' },
        { stochasticValue: 40, dateOfClose: '2024-01-04' },
        { stochasticValue: 50, dateOfClose: '2024-01-05' },
      ];

      const result = stochastic.generateSlowStochasticValues(fastStochastic, 3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(2);
      // First slow value: (20 + 30 + 40) / 3 = 30
      expect(result?.[0].stochasticValue).toBeCloseTo(30, 2);
      // Second slow value: (30 + 40 + 50) / 3 = 40
      expect(result?.[1].stochasticValue).toBeCloseTo(40, 2);
    });

    it('should preserve dates from fast stochastic values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 10, dateOfClose: '2024-01-01' },
        { stochasticValue: 20, dateOfClose: '2024-01-02' },
        { stochasticValue: 30, dateOfClose: '2024-01-03' },
        { stochasticValue: 40, dateOfClose: '2024-01-04' },
      ];

      const result = stochastic.generateSlowStochasticValues(fastStochastic, 3);

      expect(result?.[0].dateOfClose).toBe('2024-01-04');
    });
  });

  describe('generateFastStochasticValues', () => {
    it('should return undefined when standard values length is undefined', () => {
      // Create an object that looks like an array but has undefined length
      const standardData: any = {
        length: undefined
      };
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateFastStochasticValues(14);

      expect(result).toBeUndefined();
    });

    it('should generate correct number of fast stochastic values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateFastStochasticValues(14);

      // With 100 days and 14-day lookback, should get 87 values (100 - 14 + 1)
      expect(result).toBeDefined();
      expect(result?.length).toBe(87);
    });

    it('should calculate correct %K values (fast stochastic)', () => {
      const standardData = createMockHistoricalData(20, '2024-01-06', 100);

      // Create specific data to test stochastic calculation
      const fullYearData = createCustomHistoricalData([
        { date: '2024-01-01', high: 110, low: 90, close: 95 },
        { date: '2024-01-02', high: 115, low: 85, close: 100 },
        { date: '2024-01-03', high: 120, low: 95, close: 105 },
        { date: '2024-01-04', high: 125, low: 100, close: 110 },
        { date: '2024-01-05', high: 130, low: 105, close: 115 },
      ]);

      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 3);

      const result = stochastic.generateFastStochasticValues(3);

      expect(result).toBeDefined();
      expect(result?.length).toBe(3);

      // First %K (indices 0, 1, 2): low=85, high=120, close=105
      // %K = ((105 - 85) / (120 - 85)) * 100 = 57.14
      expect(result?.[0].stochasticValue).toBeCloseTo(57.14, 1);
      expect(result?.[0].dateOfClose).toBe('2024-01-03');

      // Second %K (indices 1, 2, 3): low=85, high=125, close=110
      // %K = ((110 - 85) / (125 - 85)) * 100 = 62.5
      expect(result?.[1].stochasticValue).toBeCloseTo(62.5, 1);
      expect(result?.[1].dateOfClose).toBe('2024-01-04');
    });

    it('should handle edge case where all prices are the same', () => {
      const standardData = createMockHistoricalData(20, '2024-01-06', 100);

      const fullYearData = createCustomHistoricalData([
        { date: '2024-01-01', high: 100, low: 100, close: 100 },
        { date: '2024-01-02', high: 100, low: 100, close: 100 },
        { date: '2024-01-03', high: 100, low: 100, close: 100 },
        { date: '2024-01-04', high: 100, low: 100, close: 100 },
      ]);

      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 3);

      const result = stochastic.generateFastStochasticValues(3);

      expect(result).toBeDefined();
      // All values should be 0 due to division by zero protection
      result?.forEach((entry) => {
        expect(entry.stochasticValue).toBe(0);
      });
    });
  });

  describe('loadChartData', () => {
    it('should return undefined when fast stochastic values is undefined', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const slowStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
      ];

      const result = stochastic.loadChartData(undefined, slowStochastic);

      expect(result).toBeUndefined();
    });

    it('should return undefined when slow stochastic values is undefined', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
      ];

      const result = stochastic.loadChartData(fastStochastic, undefined);

      expect(result).toBeUndefined();
    });

    it('should return undefined when starting date is not found in fast stochastic', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-02-01' },
      ];

      const slowStochastic = [
        { stochasticValue: 60, dateOfClose: '2024-01-01' },
      ];

      const result = stochastic.loadChartData(fastStochastic, slowStochastic);

      expect(result).toBeUndefined();
    });

    it('should return undefined when starting date is not found in slow stochastic', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
      ];

      const slowStochastic = [
        { stochasticValue: 60, dateOfClose: '2024-02-01' },
      ];

      const result = stochastic.loadChartData(fastStochastic, slowStochastic);

      expect(result).toBeUndefined();
    });

    it('should combine fast and slow stochastic values correctly', () => {
      const standardData = createMockHistoricalData(3, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
        { stochasticValue: 60, dateOfClose: '2024-01-02' },
        { stochasticValue: 70, dateOfClose: '2024-01-03' },
      ];

      const slowStochastic = [
        { stochasticValue: 45, dateOfClose: '2024-01-01' },
        { stochasticValue: 55, dateOfClose: '2024-01-02' },
        { stochasticValue: 65, dateOfClose: '2024-01-03' },
      ];

      const result = stochastic.loadChartData(fastStochastic, slowStochastic);

      expect(result).toBeDefined();
      expect(result?.length).toBe(3);

      expect(result?.[0].dateOfClose).toBe('2024-01-01');
      expect(result?.[0].fastSstochasticValue).toBe(50);
      expect(result?.[0].slowStochasticValue).toBe(45);

      expect(result?.[1].dateOfClose).toBe('2024-01-02');
      expect(result?.[1].fastSstochasticValue).toBe(60);
      expect(result?.[1].slowStochasticValue).toBe(55);

      expect(result?.[2].dateOfClose).toBe('2024-01-03');
      expect(result?.[2].fastSstochasticValue).toBe(70);
      expect(result?.[2].slowStochasticValue).toBe(65);
    });

    it('should align data from different starting points', () => {
      const standardData = createMockHistoricalData(2, '2024-01-02', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const fastStochastic = [
        { stochasticValue: 50, dateOfClose: '2024-01-01' },
        { stochasticValue: 60, dateOfClose: '2024-01-02' },
        { stochasticValue: 70, dateOfClose: '2024-01-03' },
      ];

      const slowStochastic = [
        { stochasticValue: 45, dateOfClose: '2024-01-01' },
        { stochasticValue: 55, dateOfClose: '2024-01-02' },
        { stochasticValue: 65, dateOfClose: '2024-01-03' },
      ];

      const result = stochastic.loadChartData(fastStochastic, slowStochastic);

      expect(result).toBeDefined();
      // Should start from 2024-01-02 (standardData[0].date)
      expect(result?.length).toBe(2);
      expect(result?.[0].dateOfClose).toBe('2024-01-02');
      expect(result?.[1].dateOfClose).toBe('2024-01-03');
    });
  });

  describe('generateStochasticValues (integration)', () => {
    it('should generate complete stochastic chart data', () => {
      // Create sufficient data for stochastic calculation
      const standardData = createMockHistoricalData(30, '2024-01-20', 100);
      const fullYearData = createMockHistoricalData(50, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);

      if (result && result.length > 0) {
        expect(result[0]).toBeInstanceOf(StochasticChartData);
        expect(result[0].dateOfClose).toBeDefined();
        expect(typeof result[0].fastSstochasticValue).toBe('number');
        expect(typeof result[0].slowStochasticValue).toBe('number');
      }
    });

    it('should handle real-world stochastic scenario (14,3)', () => {
      // Standard stochastic settings: %K = 14 days, %D = 3-day SMA of %K
      const standardData = createMockHistoricalData(50, '2024-02-01', 100);
      const fullYearData = createMockHistoricalData(100, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();

      if (result) {
        // Should have data points
        expect(result.length).toBeGreaterThan(0);

        // All values should be valid numbers
        result.forEach((entry) => {
          expect(entry.fastSstochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.fastSstochasticValue).toBeLessThanOrEqual(100);
          expect(entry.slowStochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.slowStochasticValue).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should handle insufficient data gracefully', () => {
      // Not enough data for calculation
      const standardData = createMockHistoricalData(5, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(10, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);

      const result = stochastic.generateStochasticValues();

      // Should return undefined or empty due to insufficient data
      expect(result === undefined || result.length === 0).toBe(true);
    });

    it('should calculate stochastic with trending prices', () => {
      const standardData = createMockHistoricalData(30, '2024-02-01', 100);

      // Create trending data
      const fullYearData: HistoricalPriceFull_V3[] = [];
      const baseDate = new Date('2024-01-01');
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const price = 100 + i * 2; // Upward trend

        fullYearData.push({
          date: dateStr,
          open: price,
          high: price + 3,
          low: price - 2,
          close: price + 1,
          adjClose: price + 1,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 2,
          changePercent: 2,
          vwap: price,
          label: dateStr,
          changeOverTime: i * 0.02,
        });
      }

      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);
      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();

      if (result && result.length > 0) {
        // In an uptrend, stochastic values should tend to be high
        const avgFast = result.reduce((sum, entry) => sum + entry.fastSstochasticValue, 0) / result.length;
        expect(avgFast).toBeGreaterThan(30); // Should be relatively high in uptrend
      }
    });

    it('should calculate stochastic with volatile prices', () => {
      const standardData = createMockHistoricalData(30, '2024-02-01', 100);

      // Create volatile data
      const fullYearData: HistoricalPriceFull_V3[] = [];
      const baseDate = new Date('2024-01-01');
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const price = 100 + (i % 2 === 0 ? 10 : -10); // Oscillating prices

        fullYearData.push({
          date: dateStr,
          open: price,
          high: price + 5,
          low: price - 5,
          close: price,
          adjClose: price,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: price,
          label: dateStr,
          changeOverTime: 0,
        });
      }

      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);
      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();

      if (result && result.length > 0) {
        // Should have valid stochastic values
        result.forEach((entry) => {
          expect(entry.fastSstochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.fastSstochasticValue).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty standardValues', () => {
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries([], fullYearData, 3, 14);

      // The function will try to access standardValues[0].date which will fail with empty array
      // This is expected behavior - the function doesn't validate empty input
      expect(() => {
        stochastic.generateStochasticValues();
      }).toThrow();
    });

    it('should handle empty fullYearOfDataValues', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, [], 3, 14);

      const result = stochastic.generateStochasticValues();

      expect(result === undefined || result.length === 0).toBe(true);
    });

    it('should handle very small lookback periods', () => {
      const standardData = createMockHistoricalData(20, '2024-01-11', 100);
      const fullYearData = createMockHistoricalData(30, '2024-01-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 1, 2);

      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('should handle very large lookback periods', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const fullYearData = createMockHistoricalData(100, '2023-10-01', 100);
      const stochastic = new StochasticChartEntries(standardData, fullYearData, 20, 50);

      const result = stochastic.generateStochasticValues();

      // May or may not have data depending on data size
      if (result) {
        result.forEach((entry) => {
          expect(entry.fastSstochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.fastSstochasticValue).toBeLessThanOrEqual(100);
        });
      }
    });

    it('should handle stochastic with extreme price values', () => {
      const standardData = createMockHistoricalData(30, '2024-02-01', 10000);

      const fullYearData: HistoricalPriceFull_V3[] = [];
      const baseDate = new Date('2024-01-01');
      for (let i = 0; i < 60; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        fullYearData.push({
          date: dateStr,
          open: 10000 + i,
          high: 15000 + i,
          low: 5000 + i,
          close: 10000 + i,
          adjClose: 10000 + i,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 10000 + i,
          label: dateStr,
          changeOverTime: 0,
        });
      }

      const stochastic = new StochasticChartEntries(standardData, fullYearData, 3, 14);
      const result = stochastic.generateStochasticValues();

      expect(result).toBeDefined();

      if (result && result.length > 0) {
        // Stochastic should still be in 0-100 range regardless of price magnitude
        result.forEach((entry) => {
          expect(entry.fastSstochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.fastSstochasticValue).toBeLessThanOrEqual(100);
          expect(entry.slowStochasticValue).toBeGreaterThanOrEqual(0);
          expect(entry.slowStochasticValue).toBeLessThanOrEqual(100);
        });
      }
    });
  });
});
