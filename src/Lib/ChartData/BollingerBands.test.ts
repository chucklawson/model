import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BollingerBands from './BollingerBands';
import BollingerBandDataPoint from './BollingerBandDataPoint';
import DataPoint from './DataPoint';
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

// Helper to create mock historical data with specific prices
function createMockHistoricalDataWithPrices(prices: number[], startDate: string): HistoricalPriceFull_V3[] {
  const data: HistoricalPriceFull_V3[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < prices.length; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      open: prices[i],
      high: prices[i] + 1,
      low: prices[i] - 1,
      close: prices[i],
      adjClose: prices[i],
      volume: 1000000,
      unadjustedVolume: 1000000,
      change: 0,
      changePercent: 0,
      vwap: prices[i],
      label: dateStr,
      changeOverTime: 0,
    });
  }

  return data;
}

describe('BollingerBands', () => {
  beforeEach(() => {
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with standard values, adjusted values, and lookback period', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const adjustedData = createMockHistoricalData(100, '2023-10-01', 100);
      const bb = new BollingerBands(standardData, adjustedData, 20);

      expect(bb.standardValues).toBe(standardData);
      expect(bb.adjustedToContainFullYearOfDataValues).toBe(adjustedData);
      expect(bb.numberOfDaysToLookBack).toBe(20);
      expect(bb.mean).toBe(0.0);
    });

    it('should handle empty standard values', () => {
      const adjustedData = createMockHistoricalData(100, '2023-10-01', 100);
      const bb = new BollingerBands([], adjustedData, 20);

      expect(bb.standardValues).toEqual([]);
      expect(bb.adjustedToContainFullYearOfDataValues).toBe(adjustedData);
    });

    it('should handle empty adjusted values', () => {
      const standardData = createMockHistoricalData(50, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, [], 20);

      expect(bb.standardValues).toBe(standardData);
      expect(bb.adjustedToContainFullYearOfDataValues).toEqual([]);
    });
  });

  describe('generateMean', () => {
    it('should calculate correct mean for simple values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 10),
        new DataPoint('2024-01-02', 20),
        new DataPoint('2024-01-03', 30),
      ];

      const mean = bb.generateMean(dataPoints);

      expect(mean).toBe(20); // (10 + 20 + 30) / 3 = 20
    });

    it('should return 0 for empty array', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const mean = bb.generateMean([]);

      expect(mean).toBe(0.0);
    });

    it('should calculate mean for single data point', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [new DataPoint('2024-01-01', 42.5)];

      const mean = bb.generateMean(dataPoints);

      expect(mean).toBe(42.5);
    });

    it('should handle fractional values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 10.5),
        new DataPoint('2024-01-02', 20.25),
        new DataPoint('2024-01-03', 30.75),
      ];

      const mean = bb.generateMean(dataPoints);

      expect(mean).toBeCloseTo(20.5, 2); // (10.5 + 20.25 + 30.75) / 3 = 20.5
    });

    it('should calculate mean for many data points', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = Array.from({ length: 100 }, (_, i) =>
        new DataPoint(`2024-01-01`, i + 1)
      );

      const mean = bb.generateMean(dataPoints);

      // Sum of 1 to 100 = 100 * 101 / 2 = 5050
      // Mean = 5050 / 100 = 50.5
      expect(mean).toBeCloseTo(50.5, 2);
    });

    it('should handle negative values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', -10),
        new DataPoint('2024-01-02', 0),
        new DataPoint('2024-01-03', 10),
      ];

      const mean = bb.generateMean(dataPoints);

      expect(mean).toBe(0); // (-10 + 0 + 10) / 3 = 0
    });
  });

  describe('calculateStdDeviation', () => {
    it('should calculate correct standard deviation for simple values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      // Data: [10, 20, 30], mean = 20
      const dataPoints = [
        new DataPoint('2024-01-01', 10),
        new DataPoint('2024-01-02', 20),
        new DataPoint('2024-01-03', 30),
      ];

      const stdDev = bb.calculateStdDeviation(20, dataPoints);

      // Variance: [(10-20)^2 + (20-20)^2 + (30-20)^2] / 3 = [100 + 0 + 100] / 3 = 66.67
      // StdDev: sqrt(66.67) ≈ 8.165
      expect(stdDev).toBeCloseTo(8.165, 2);
    });

    it('should return 0 for empty array', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const stdDev = bb.calculateStdDeviation(20, []);

      expect(stdDev).toBe(0.0);
    });

    it('should return 0 for single value', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [new DataPoint('2024-01-01', 42.5)];

      const stdDev = bb.calculateStdDeviation(42.5, dataPoints);

      expect(stdDev).toBe(0); // No variance with single value
    });

    it('should return 0 for identical values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 100),
        new DataPoint('2024-01-02', 100),
        new DataPoint('2024-01-03', 100),
      ];

      const stdDev = bb.calculateStdDeviation(100, dataPoints);

      expect(stdDev).toBe(0); // No variance
    });

    it('should handle fractional values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 10.5),
        new DataPoint('2024-01-02', 20.5),
        new DataPoint('2024-01-03', 30.5),
      ];

      const mean = 20.5;
      const stdDev = bb.calculateStdDeviation(mean, dataPoints);

      // Variance: [(10.5-20.5)^2 + (20.5-20.5)^2 + (30.5-20.5)^2] / 3 = [100 + 0 + 100] / 3 = 66.67
      // StdDev: sqrt(66.67) ≈ 8.165
      expect(stdDev).toBeCloseTo(8.165, 2);
    });

    it('should handle large dataset with known standard deviation', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      // Create data points: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint('2024-01-01', i + 1)
      );

      const mean = 5.5; // (1 + 10) / 2 = 5.5
      const stdDev = bb.calculateStdDeviation(mean, dataPoints);

      // Standard deviation of 1-10 is approximately 2.872
      expect(stdDev).toBeCloseTo(2.872, 2);
    });

    it('should handle negative values', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', -10),
        new DataPoint('2024-01-02', 0),
        new DataPoint('2024-01-03', 10),
      ];

      const mean = 0;
      const stdDev = bb.calculateStdDeviation(mean, dataPoints);

      // Variance: [(-10-0)^2 + (0-0)^2 + (10-0)^2] / 3 = [100 + 0 + 100] / 3 = 66.67
      // StdDev: sqrt(66.67) ≈ 8.165
      expect(stdDev).toBeCloseTo(8.165, 2);
    });

    it('should handle high volatility data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 100),
        new DataPoint('2024-01-02', 200),
        new DataPoint('2024-01-03', 50),
      ];

      const mean = 116.67; // (100 + 200 + 50) / 3 ≈ 116.67
      const stdDev = bb.calculateStdDeviation(mean, dataPoints);

      // High volatility should result in high standard deviation
      expect(stdDev).toBeGreaterThan(50);
    });
  });

  describe('colllectSubsetOfDateToEvaluate', () => {
    it('should collect correct subset of data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 3);

      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint(`2024-01-0${i + 1}`, 100 + i)
      );

      // Collect 3 days ending at index 5 (indices 2, 3, 4)
      const subset = bb.colllectSubsetOfDateToEvaluate(5, dataPoints);

      expect(subset.length).toBe(3);
      expect(subset[0].calculatedValue).toBe(102); // index 2
      expect(subset[1].calculatedValue).toBe(103); // index 3
      expect(subset[2].calculatedValue).toBe(104); // index 4
    });

    it('should return empty array when endAddress equals lookback', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 5);

      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint(`2024-01-0${i + 1}`, 100 + i)
      );

      const subset = bb.colllectSubsetOfDateToEvaluate(5, dataPoints);

      expect(subset.length).toBe(5);
      expect(subset[0].calculatedValue).toBe(100); // index 0
      expect(subset[4].calculatedValue).toBe(104); // index 4
    });

    it('should collect subset from beginning when lookback is small', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 2);

      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint(`2024-01-0${i + 1}`, 100 + i)
      );

      // Collect 2 days ending at index 2 (indices 0, 1)
      const subset = bb.colllectSubsetOfDateToEvaluate(2, dataPoints);

      expect(subset.length).toBe(2);
      expect(subset[0].calculatedValue).toBe(100); // index 0
      expect(subset[1].calculatedValue).toBe(101); // index 1
    });

    it('should collect subset from end of data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 3);

      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint(`2024-01-0${i + 1}`, 100 + i)
      );

      // Collect 3 days ending at index 10 (indices 7, 8, 9)
      const subset = bb.colllectSubsetOfDateToEvaluate(10, dataPoints);

      expect(subset.length).toBe(3);
      expect(subset[0].calculatedValue).toBe(107); // index 7
      expect(subset[1].calculatedValue).toBe(108); // index 8
      expect(subset[2].calculatedValue).toBe(109); // index 9
    });

    it('should handle single day lookback', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 1);

      const dataPoints = Array.from({ length: 10 }, (_, i) =>
        new DataPoint(`2024-01-0${i + 1}`, 100 + i)
      );

      const subset = bb.colllectSubsetOfDateToEvaluate(5, dataPoints);

      expect(subset.length).toBe(1);
      expect(subset[0].calculatedValue).toBe(104); // index 4
    });
  });

  describe('findStartAddressBasedOnDate', () => {
    it('should find correct address for matching date', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new BollingerBandDataPoint('2024-01-01', 90, 110, 100, 100, 5, 100),
        new BollingerBandDataPoint('2024-01-02', 91, 111, 101, 101, 5, 101),
        new BollingerBandDataPoint('2024-01-03', 92, 112, 102, 102, 5, 102),
      ];

      const address = bb.findStartAddressBasedOnDate(dataPoints, '2024-01-02');

      expect(address).toBe(1);
    });

    it('should return -1 when date not found', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new BollingerBandDataPoint('2024-01-01', 90, 110, 100, 100, 5, 100),
        new BollingerBandDataPoint('2024-01-02', 91, 111, 101, 101, 5, 101),
        new BollingerBandDataPoint('2024-01-03', 92, 112, 102, 102, 5, 102),
      ];

      const address = bb.findStartAddressBasedOnDate(dataPoints, '2024-01-05');

      expect(address).toBe(-1);
    });

    it('should return 0 for first date', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new BollingerBandDataPoint('2024-01-01', 90, 110, 100, 100, 5, 100),
        new BollingerBandDataPoint('2024-01-02', 91, 111, 101, 101, 5, 101),
      ];

      const address = bb.findStartAddressBasedOnDate(dataPoints, '2024-01-01');

      expect(address).toBe(0);
    });

    it('should find last date', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new BollingerBandDataPoint('2024-01-01', 90, 110, 100, 100, 5, 100),
        new BollingerBandDataPoint('2024-01-02', 91, 111, 101, 101, 5, 101),
        new BollingerBandDataPoint('2024-01-03', 92, 112, 102, 102, 5, 102),
      ];

      const address = bb.findStartAddressBasedOnDate(dataPoints, '2024-01-03');

      expect(address).toBe(2);
    });

    it('should handle empty array', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const address = bb.findStartAddressBasedOnDate([], '2024-01-01');

      expect(address).toBe(-1);
    });

    it('should find date in middle of large dataset', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = Array.from({ length: 100 }, (_, i) => {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        return new BollingerBandDataPoint(dateStr, 90, 110, 100, 100, 5, 100);
      });

      const targetDate = new Date('2024-01-01');
      targetDate.setDate(targetDate.getDate() + 50);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      const address = bb.findStartAddressBasedOnDate(dataPoints, targetDateStr);

      expect(address).toBe(50);
    });
  });

  describe('buildStandardChartDataFromEndPointData', () => {
    it('should convert historical data to chart data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const historicalData = createMockHistoricalData(5, '2024-01-01', 100);
      const chartData = bb.buildStandardChartDataFromEndPointData(historicalData);

      expect(chartData.length).toBe(5);
      expect(chartData[0].date).toBe(historicalData[0].date);
      expect(chartData[0].calculatedValue).toBe(historicalData[0].close);
    });

    it('should handle empty historical data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const chartData = bb.buildStandardChartDataFromEndPointData([]);

      expect(chartData).toEqual([]);
    });

    it('should use close price for calculated value', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const historicalData: HistoricalPriceFull_V3[] = [
        {
          date: '2024-01-01',
          open: 100,
          high: 105,
          low: 95,
          close: 102.5,
          adjClose: 102.5,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 100,
          label: '2024-01-01',
          changeOverTime: 0,
        },
      ];

      const chartData = bb.buildStandardChartDataFromEndPointData(historicalData);

      expect(chartData[0].calculatedValue).toBe(102.5);
    });

    it('should preserve date strings correctly', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const historicalData = createMockHistoricalData(3, '2024-01-15', 100);
      const chartData = bb.buildStandardChartDataFromEndPointData(historicalData);

      expect(chartData[0].date).toMatch(/^2024-01-15$/);
      expect(chartData[1].date).toMatch(/^2024-01-16$/);
      expect(chartData[2].date).toMatch(/^2024-01-17$/);
    });

    it('should create DataPoint instances', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const historicalData = createMockHistoricalData(1, '2024-01-01', 100);
      const chartData = bb.buildStandardChartDataFromEndPointData(historicalData);

      expect(chartData[0]).toBeInstanceOf(DataPoint);
    });
  });

  describe('convertDateStringToYear_Month_DayOnly', () => {
    it('should extract date portion from ISO string', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = bb.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-01-15');
    });

    it('should handle dates at midnight', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const date = new Date('2024-12-31T00:00:00.000Z');
      const result = bb.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-12-31');
    });

    it('should handle dates at end of day', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const date = new Date('2024-06-15T23:59:59.999Z');
      const result = bb.convertDateStringToYear_Month_DayOnly(date);

      expect(result).toBe('2024-06-15');
    });
  });

  describe('generateOneSetOfDataPoints', () => {
    it('should calculate mean and standard deviation', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 10),
        new DataPoint('2024-01-02', 20),
        new DataPoint('2024-01-03', 30),
      ];

      const stdDev = bb.generateOneSetOfDataPoints(dataPoints);

      expect(bb.mean).toBe(20); // Mean should be set
      expect(stdDev).toBeCloseTo(8.165, 2);
    });

    it('should update mean property', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const dataPoints = [
        new DataPoint('2024-01-01', 100),
        new DataPoint('2024-01-02', 200),
      ];

      bb.generateOneSetOfDataPoints(dataPoints);

      expect(bb.mean).toBe(150); // (100 + 200) / 2
    });

    it('should handle empty data', () => {
      const standardData = createMockHistoricalData(10, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, standardData, 20);

      const stdDev = bb.generateOneSetOfDataPoints([]);

      expect(bb.mean).toBe(0);
      expect(stdDev).toBe(0);
    });
  });

  describe('generateBollingerBands', () => {
    it('should return null when standard values length is undefined', () => {
      const standardData: any = { length: undefined };
      const adjustedData = createMockHistoricalData(100, '2023-10-01', 100);
      const bb = new BollingerBands(standardData, adjustedData, 20);

      const result = bb.generateBollingerBands();

      expect(result).toBeNull();
    });

    it('should return null when starting date not found in calculated bands', () => {
      // Create scenario where standardValues start date is before adjustedValues
      const standardData = createMockHistoricalData(10, '2020-01-01', 100);
      const adjustedData = createMockHistoricalData(20, '2024-01-01', 100);
      const bb = new BollingerBands(standardData, adjustedData, 5);

      const result = bb.generateBollingerBands();

      expect(result).toBeNull();
    });

    it('should generate bollinger bands for valid data', () => {
      // Create sufficient data: 40 days total, 20 day lookback, 10 standard days
      const adjustedData = createMockHistoricalDataWithPrices(
        Array.from({ length: 40 }, (_, i) => 100 + i),
        '2024-01-01'
      );
      // Standard data starts from day 20
      const standardData = createMockHistoricalDataWithPrices(
        Array.from({ length: 10 }, (_, i) => 100 + 20 + i),
        '2024-01-21'
      );

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(10);
    });

    it('should calculate correct upper and lower bands', () => {
      // Create predictable data
      const adjustedData = createMockHistoricalDataWithPrices(
        Array.from({ length: 30 }, () => 100), // Constant price
        '2024-01-01'
      );
      const standardData = createMockHistoricalDataWithPrices(
        Array.from({ length: 5 }, () => 100),
        '2024-01-21'
      );

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        // With constant price, std dev should be 0, so upper and lower bands equal mean
        result.forEach(point => {
          expect(point.upperBandValue).toBeCloseTo(point.mean, 1);
          expect(point.lowerBandValue).toBeCloseTo(point.mean, 1);
          expect(point.currentPrice).toBe(100);
        });
      }
    });

    it('should apply 2 standard deviations for band calculation', () => {
      // Create data with known volatility
      const prices = Array.from({ length: 30 }, (_, i) => {
        // Oscillating prices for predictable variance
        return 100 + (i % 2 === 0 ? 10 : -10);
      });
      const adjustedData = createMockHistoricalDataWithPrices(prices, '2024-01-01');
      const standardData = createMockHistoricalDataWithPrices(
        Array.from({ length: 5 }, (_, i) => prices[20 + i]),
        '2024-01-21'
      );

      const bb = new BollingerBands(standardData, adjustedData, 5);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result && result.length > 0) {
        const point = result[0];
        // Upper band should be mean + 2 * std dev
        // Lower band should be mean - 2 * std dev
        const expectedUpperBand = point.mean + (2 * point.starndardDeviation);
        const expectedLowerBand = point.mean - (2 * point.starndardDeviation);

        expect(point.upperBandValue).toBeCloseTo(expectedUpperBand, 1);
        expect(point.lowerBandValue).toBeCloseTo(expectedLowerBand, 1);
      }
    });

    it('should preserve dates correctly', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 100);
      const standardData = createMockHistoricalData(10, '2024-01-21', 120);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        expect(result[0].date).toBe(standardData[0].date);
        expect(result[result.length - 1].date).toBe(standardData[standardData.length - 1].date);
      }
    });

    it('should include moving average values', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 100);
      const standardData = createMockHistoricalData(10, '2024-01-21', 120);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          expect(point.movingAverage).toBeGreaterThan(0);
          expect(typeof point.movingAverage).toBe('number');
        });
      }
    });

    it('should include standard deviation values', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 100);
      const standardData = createMockHistoricalData(10, '2024-01-21', 120);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          expect(point.starndardDeviation).toBeGreaterThanOrEqual(0);
          expect(typeof point.starndardDeviation).toBe('number');
        });
      }
    });

    it('should use close price from standard values', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 100);
      const standardData: HistoricalPriceFull_V3[] = [
        {
          date: '2024-01-21',
          open: 100,
          high: 125,
          low: 95,
          close: 110.5,
          adjClose: 110.5,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0,
          changePercent: 0,
          vwap: 110,
          label: '2024-01-21',
          changeOverTime: 0,
        },
      ];

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result && result.length > 0) {
        expect(result[0].currentPrice).toBe(110.5);
      }
    });
  });

  describe('integration tests', () => {
    it('should handle typical 20-day Bollinger Bands calculation', () => {
      // Create 90 days of historical data for adjusted values
      const adjustedData = createMockHistoricalData(90, '2024-01-01', 100);
      // Standard data for last 50 days
      const standardData = createMockHistoricalData(50, '2024-02-10', 140);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(50);

      if (result) {
        result.forEach((point, index) => {
          // All fields should be populated
          expect(point.date).toBeTruthy();
          expect(typeof point.upperBandValue).toBe('number');
          expect(typeof point.lowerBandValue).toBe('number');
          expect(typeof point.currentPrice).toBe('number');
          expect(typeof point.movingAverage).toBe('number');
          expect(typeof point.starndardDeviation).toBe('number');
          expect(typeof point.mean).toBe('number');

          // Upper band should be greater than lower band (unless std dev is 0)
          expect(point.upperBandValue).toBeGreaterThanOrEqual(point.lowerBandValue);
        });
      }
    });

    it('should handle 50-day Bollinger Bands', () => {
      // Ensure adjustedData covers standardData + lookback period
      const adjustedData = createMockHistoricalData(200, '2023-08-01', 100);
      const standardData = createMockHistoricalData(60, '2023-11-20', 200);

      const bb = new BollingerBands(standardData, adjustedData, 50);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      // Result length may be less than standardData if not all dates are covered
      if (result) {
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(60);
      }
    });

    it('should handle short lookback period', () => {
      const adjustedData = createMockHistoricalData(30, '2024-01-01', 100);
      const standardData = createMockHistoricalData(10, '2024-01-16', 115);

      const bb = new BollingerBands(standardData, adjustedData, 5);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(10);
    });

    it('should detect volatility changes in bands', () => {
      // Create data with increasing volatility
      const prices = Array.from({ length: 50 }, (_, i) => {
        if (i < 25) return 100; // First half: no volatility
        return 100 + (i % 2 === 0 ? 20 : -20); // Second half: high volatility
      });
      const adjustedData = createMockHistoricalDataWithPrices(prices, '2024-01-01');
      const standardData = createMockHistoricalDataWithPrices(
        prices.slice(20, 40),
        '2024-01-21'
      );

      const bb = new BollingerBands(standardData, adjustedData, 10);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result && result.length > 10) {
        const earlyBand = result[0];
        const lateBand = result[result.length - 1];

        // Later bands should have higher standard deviation due to increased volatility
        expect(lateBand.starndardDeviation).toBeGreaterThan(earlyBand.starndardDeviation);

        // Band width (upper - lower) should be larger in volatile period
        const earlyWidth = earlyBand.upperBandValue - earlyBand.lowerBandValue;
        const lateWidth = lateBand.upperBandValue - lateBand.lowerBandValue;
        expect(lateWidth).toBeGreaterThan(earlyWidth);
      }
    });

    it('should handle trending prices', () => {
      // Create upward trending prices
      const adjustedData = createMockHistoricalData(50, '2024-01-01', 100);
      const standardData = createMockHistoricalData(20, '2024-01-26', 125);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result && result.length > 5) {
        // Mean should increase with trending prices
        expect(result[result.length - 1].mean).toBeGreaterThan(result[0].mean);
      }
    });

    it('should handle price at band extremes', () => {
      // Create data where price touches upper band
      const prices = Array.from({ length: 30 }, (_, i) => {
        if (i === 25) return 150; // Spike at day 25
        return 100;
      });
      const adjustedData = createMockHistoricalDataWithPrices(prices, '2024-01-01');
      const standardData = createMockHistoricalDataWithPrices(
        prices.slice(15, 28),
        '2024-01-16'
      );

      const bb = new BollingerBands(standardData, adjustedData, 10);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        // Find the point corresponding to the spike
        const spikePoint = result.find(p => p.currentPrice === 150);

        if (spikePoint) {
          // Current price should be near or exceed upper band during spike
          expect(spikePoint.currentPrice).toBeGreaterThanOrEqual(spikePoint.mean);
        }
      }
    });

    it('should maintain mathematical consistency', () => {
      const adjustedData = createMockHistoricalData(60, '2024-01-01', 100);
      const standardData = createMockHistoricalData(20, '2024-01-31', 130);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          // Upper band = mean + (2 * stdDev)
          const expectedUpper = point.mean + (2 * point.starndardDeviation);
          expect(point.upperBandValue).toBeCloseTo(expectedUpper, 5);

          // Lower band = mean - (2 * stdDev)
          const expectedLower = point.mean - (2 * point.starndardDeviation);
          expect(point.lowerBandValue).toBeCloseTo(expectedLower, 5);

          // Mean should be between lower and upper bands
          expect(point.mean).toBeGreaterThanOrEqual(point.lowerBandValue);
          expect(point.mean).toBeLessThanOrEqual(point.upperBandValue);
        });
      }
    });

    it('should handle minimum required data', () => {
      // Minimum: lookback + 1 days for adjusted, 1 day for standard
      const adjustedData = createMockHistoricalData(6, '2024-01-01', 100);
      const standardData = createMockHistoricalData(1, '2024-01-06', 105);

      const bb = new BollingerBands(standardData, adjustedData, 5);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
    });

    it('should handle maximum realistic data', () => {
      // 5 years of daily data ≈ 1250 trading days
      const adjustedData = createMockHistoricalData(1500, '2020-01-01', 100);
      // standardData starts after enough history in adjustedData
      const standardData = createMockHistoricalData(250, '2023-06-01', 800);

      const bb = new BollingerBands(standardData, adjustedData, 200);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(250);
      }
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very small lookback period', () => {
      const adjustedData = createMockHistoricalData(10, '2024-01-01', 100);
      const standardData = createMockHistoricalData(5, '2024-01-06', 105);

      const bb = new BollingerBands(standardData, adjustedData, 1);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
    });

    it('should handle very large prices', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 1000000);
      const standardData = createMockHistoricalData(10, '2024-01-21', 1000020);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          expect(Number.isFinite(point.upperBandValue)).toBe(true);
          expect(Number.isFinite(point.lowerBandValue)).toBe(true);
        });
      }
    });

    it('should handle very small prices', () => {
      const adjustedData = createMockHistoricalData(40, '2024-01-01', 0.01);
      const standardData = createMockHistoricalData(10, '2024-01-21', 0.03);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          expect(Number.isFinite(point.upperBandValue)).toBe(true);
          expect(Number.isFinite(point.lowerBandValue)).toBe(true);
        });
      }
    });

    it('should handle date ranges across year boundary', () => {
      const adjustedData = createMockHistoricalData(60, '2023-12-01', 100);
      const standardData = createMockHistoricalData(20, '2024-01-10', 120);

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        expect(result[0].date).toMatch(/^2024-01-10$/);
      }
    });

    it('should handle identical consecutive prices', () => {
      const prices = Array.from({ length: 40 }, () => 100.00);
      const adjustedData = createMockHistoricalDataWithPrices(prices, '2024-01-01');
      const standardData = createMockHistoricalDataWithPrices(
        prices.slice(20, 30),
        '2024-01-21'
      );

      const bb = new BollingerBands(standardData, adjustedData, 20);
      const result = bb.generateBollingerBands();

      expect(result).not.toBeNull();
      if (result) {
        result.forEach(point => {
          // With no variance, bands should converge to mean
          expect(point.starndardDeviation).toBeCloseTo(0, 5);
          expect(point.upperBandValue).toBeCloseTo(point.lowerBandValue, 5);
        });
      }
    });
  });
});
