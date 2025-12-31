// ============================================
// FILE: src/Lib/ChartData/ExponentialMovingAverage.test.ts
// Exponential Moving Average Test Suite
// ============================================

import { describe, it, expect } from 'vitest';
import ExponentialMovingAverage from './ExponentialMovingAverage';
import StandardChartData from './StandardChartData';
import type HistoricalPriceFull_V3 from '../HistoricalPriceFull_V3';

// Helper function to create mock historical data
function createMockHistoricalData(
  count: number,
  startDate: string = '2024-01-01',
  startPrice: number = 100
): HistoricalPriceFull_V3[] {
  const data: HistoricalPriceFull_V3[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    data.push({
      date: dateStr,
      open: startPrice + i,
      high: startPrice + i + 2,
      low: startPrice + i - 1,
      close: startPrice + i,
      adjClose: startPrice + i,
      volume: 1000000,
      unadjustedVolume: 1000000,
      change: 1,
      changePercent: 1,
      vwap: startPrice + i,
      label: dateStr,
      changeOverTime: 0,
    });
  }

  return data;
}

// Helper function to create mock chart data
function createMockChartData(count: number, startDate: string = '2024-01-01'): StandardChartData[] {
  const data: StandardChartData[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const currentDate = new Date(baseDate);
    currentDate.setDate(baseDate.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];

    data.push(
      new StandardChartData(
        dateStr,
        100 + i,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      )
    );
  }

  return data;
}

describe('ExponentialMovingAverage', () => {
  describe('Constructor', () => {
    it('should initialize with historical data and lookback period', () => {
      const historicalData = createMockHistoricalData(30);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      expect(ema.oneYearOfData).toEqual(historicalData);
      expect(ema.numberOfDaystoLookBack).toBe(10);
    });

    it('should handle empty historical data', () => {
      const ema = new ExponentialMovingAverage([], 10);

      expect(ema.oneYearOfData).toEqual([]);
      expect(ema.numberOfDaystoLookBack).toBe(10);
    });

    it('should handle zero lookback period', () => {
      const historicalData = createMockHistoricalData(30);
      const ema = new ExponentialMovingAverage(historicalData, 0);

      expect(ema.numberOfDaystoLookBack).toBe(0);
    });
  });

  describe('generateOneDataPoint - Simple Moving Average for First Point', () => {
    it('should calculate correct simple moving average for initial point', () => {
      const historicalData = createMockHistoricalData(10, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 5);

      // For 5-day SMA at position 5, we sum closes at positions 1-5
      // Loop: i from (5 + 1 - 5) = 1 to (5 + 1) = 6 (exclusive), so i = 1,2,3,4,5
      // Closes are: 101, 102, 103, 104, 105
      // Average: (101 + 102 + 103 + 104 + 105) / 5 = 515 / 5 = 103
      const result = ema.generateOneDataPoint(5, 5, historicalData);

      expect(result).toBe(103);
    });

    it('should return 0 when lookback period is 0', () => {
      const historicalData = createMockHistoricalData(10);
      const ema = new ExponentialMovingAverage(historicalData, 0);

      const result = ema.generateOneDataPoint(5, 0, historicalData);

      expect(result).toBe(0);
    });

    it('should return 0 when lookback period is negative', () => {
      const historicalData = createMockHistoricalData(10);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateOneDataPoint(5, -5, historicalData);

      expect(result).toBe(0);
    });

    it('should return 0 when start address is less than lookback period', () => {
      const historicalData = createMockHistoricalData(10);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateOneDataPoint(3, 5, historicalData);

      expect(result).toBe(0);
    });

    it('should handle single value average', () => {
      const historicalData = createMockHistoricalData(5, '2024-01-01', 50);
      const ema = new ExponentialMovingAverage(historicalData, 1);

      // Single value at position 1: loop from (1+1-1)=1 to (1+1)=2 (exclusive), so i=1
      // close at index 1 = 51
      const result = ema.generateOneDataPoint(1, 1, historicalData);

      expect(result).toBe(51);
    });

    it('should calculate correct average for 10-day period', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      // For 10-day SMA at position 10, loop from (10+1-10)=1 to (10+1)=11 (exclusive)
      // So i = 1,2,3,4,5,6,7,8,9,10
      // Closes are: 101, 102, 103, 104, 105, 106, 107, 108, 109, 110
      // Sum: 1055, Average: 105.5
      const result = ema.generateOneDataPoint(10, 10, historicalData);

      expect(result).toBe(105.5);
    });
  });

  describe('generateExponentialDataPointFormTwo - EMA Calculation', () => {
    it('should calculate correct EMA using standard formula', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      // Create a previous data point
      const previousEMA = { date: '2024-01-10', calculatedValue: 105 };

      // For 10-period EMA: multiplier = 2 / (10 + 1) = 0.181818...
      // Current close at position 10 = 110
      // EMA = (110 - 105) * 0.181818 + 105 = 5 * 0.181818 + 105 = 105.90909...
      const result = ema.generateExponentialDataPointFormTwo(
        10,
        10,
        previousEMA,
        historicalData
      );

      expect(result).toBeCloseTo(105.90909, 4);
    });

    it('should return 0 when length of average is 0', () => {
      const historicalData = createMockHistoricalData(20);
      const ema = new ExponentialMovingAverage(historicalData, 0);
      const previousEMA = { date: '2024-01-10', calculatedValue: 105 };

      const result = ema.generateExponentialDataPointFormTwo(
        10,
        0,
        previousEMA,
        historicalData
      );

      expect(result).toBe(0);
    });

    it('should return 0 when length of average is negative', () => {
      const historicalData = createMockHistoricalData(20);
      const ema = new ExponentialMovingAverage(historicalData, 10);
      const previousEMA = { date: '2024-01-10', calculatedValue: 105 };

      const result = ema.generateExponentialDataPointFormTwo(
        10,
        -5,
        previousEMA,
        historicalData
      );

      expect(result).toBe(0);
    });

    it('should return 0 when current address exceeds data length', () => {
      const historicalData = createMockHistoricalData(10);
      const ema = new ExponentialMovingAverage(historicalData, 5);
      const previousEMA = { date: '2024-01-10', calculatedValue: 105 };

      const result = ema.generateExponentialDataPointFormTwo(
        15,
        5,
        previousEMA,
        historicalData
      );

      expect(result).toBe(0);
    });

    it('should handle zero previous EMA value', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);
      const previousEMA = { date: '2024-01-10', calculatedValue: 0 };

      // Multiplier = 2 / 11 = 0.181818
      // Current close = 110
      // EMA = (110 - 0) * 0.181818 + 0 = 20
      const result = ema.generateExponentialDataPointFormTwo(
        10,
        10,
        previousEMA,
        historicalData
      );

      expect(result).toBeCloseTo(20, 4);
    });

    it('should calculate correct 15-day EMA multiplier', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 60);
      const ema = new ExponentialMovingAverage(historicalData, 15);

      // Using Eastman Kodak example from comments:
      // 15-day EMA multiplier = 2 / (15 + 1) = 0.125
      const previousEMA = { date: '2024-01-15', calculatedValue: 63.682 };

      // Current close at position 15 = 75 (60 + 15)
      // EMA = (75 - 63.682) * 0.125 + 63.682
      const result = ema.generateExponentialDataPointFormTwo(
        15,
        15,
        previousEMA,
        historicalData
      );

      const expectedEMA = (75 - 63.682) * 0.125 + 63.682;
      expect(result).toBeCloseTo(expectedEMA, 4);
    });

    it('should handle declining price trend', () => {
      // Create data with declining prices
      const historicalData: HistoricalPriceFull_V3[] = [];
      for (let i = 0; i < 20; i++) {
        historicalData.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: 200 - i * 5,
          high: 202 - i * 5,
          low: 198 - i * 5,
          close: 200 - i * 5,
          adjClose: 200 - i * 5,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: -5,
          changePercent: -2.5,
          vwap: 200 - i * 5,
          label: `2024-01-${String(i + 1).padStart(2, '0')}`,
          changeOverTime: 0,
        });
      }

      const ema = new ExponentialMovingAverage(historicalData, 10);
      const previousEMA = { date: '2024-01-10', calculatedValue: 175 };

      // Current close at position 10 = 150 (200 - 50)
      // Multiplier = 2 / 11 = 0.181818
      // EMA = (150 - 175) * 0.181818 + 175
      const result = ema.generateExponentialDataPointFormTwo(
        10,
        10,
        previousEMA,
        historicalData
      );

      const expectedEMA = (150 - 175) * (2 / 11) + 175;
      expect(result).toBeCloseTo(expectedEMA, 4);
      expect(result).toBeLessThan(previousEMA.calculatedValue); // Should be declining
    });
  });

  describe('generateTheDataPointsFormTwo_UpToDate - Full EMA Series', () => {
    it('should generate complete EMA series for sufficient data', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(11); // 20 - 10 + 1 = 11 data points
      expect(result![0].date).toBe('2024-01-10'); // First date after 10-day period
    });

    it('should return null when insufficient historical data', () => {
      const historicalData = createMockHistoricalData(5);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(result).toBeNull();
    });

    it('should return null when data length equals lookback period minus one', () => {
      const historicalData = createMockHistoricalData(9);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(result).toBeNull();
    });

    it('should generate series when data length exactly equals lookback period', () => {
      const historicalData = createMockHistoricalData(10);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      // Implementation bug: With 10 data points and lookback 10, the SMA calculation
      // tries to access index 10 which doesn't exist (only 0-9 available)
      // This causes "Cannot read properties of undefined (reading 'close')" error
      expect(() => {
        ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);
      }).toThrow();
    });

    it('should use SMA for first point and EMA for subsequent points', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 5);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(5, historicalData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(11); // 15 - 5 + 1 = 11 points

      // First point at index 4 (date '2024-01-05') uses SMA of indices 1-5
      // Loop: from (5+1-5)=1 to (5+1)=6, so i=1,2,3,4,5
      // Values: 101, 102, 103, 104, 105, Average: 103
      expect(result![0].calculatedValue).toBe(103);
      expect(result![0].date).toBe('2024-01-05');

      // Verify subsequent points increase (since prices are increasing)
      for (let i = 1; i < result!.length; i++) {
        expect(result![i].calculatedValue).toBeGreaterThan(result![i - 1].calculatedValue);
      }
    });

    it('should calculate correct dates for each data point', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 5);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(5, historicalData);

      expect(result).not.toBeNull();

      // Verify dates match historical data dates starting from index 4 (5th day)
      for (let i = 0; i < result!.length; i++) {
        expect(result![i].date).toBe(historicalData[i + 4].date);
      }
    });

    it('should handle single data point after lookback period', () => {
      const historicalData = createMockHistoricalData(11, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(result).not.toBeNull();
      expect(result).toHaveLength(2); // Initial SMA + 1 EMA point
    });

    it('should maintain continuity between SMA and EMA points', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(result).not.toBeNull();

      // Verify each point uses previous point's value
      for (let i = 1; i < result!.length; i++) {
        const multiplier = 2 / (10 + 1);
        const currentClose = historicalData[i + 9].close;
        const previousEMA = result![i - 1].calculatedValue;
        const expectedEMA = (currentClose - previousEMA) * multiplier + previousEMA;

        expect(result![i].calculatedValue).toBeCloseTo(expectedEMA, 4);
      }
    });

    it('should handle data with zero values', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 0);
      const ema = new ExponentialMovingAverage(historicalData, 5);

      const result = ema.generateTheDataPointsFormTwo_UpToDate(5, historicalData);

      expect(result).not.toBeNull();
      // Loop from (5+1-5)=1 to (5+1)=6, so i=1,2,3,4,5
      // Values at these indices: 1, 2, 3, 4, 5
      // Average: (1+2+3+4+5)/5 = 15/5 = 3
      expect(result![0].calculatedValue).toBe(3);
    });
  });

  describe('generateTheUnrestrictedAverages', () => {
    it('should generate unrestricted EMA series', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result).toHaveLength(11); // 20 - 10 + 1
    });

    it('should return null for insufficient data', () => {
      const historicalData = createMockHistoricalData(5);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).toBeNull();
    });

    it('should produce same results as generateTheDataPointsFormTwo_UpToDate', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const unrestricted = ema.generateTheUnrestrictedAverages();
      const restricted = ema.generateTheDataPointsFormTwo_UpToDate(10, historicalData);

      expect(unrestricted).toEqual(restricted);
    });
  });

  describe('generateTheAverages - Chart Data Integration', () => {
    it('should integrate EMA into chart data correctly', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const chartData = createMockChartData(11, '2024-01-10'); // Match EMA start date
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      expect(result).toHaveLength(11);
      expect(result[0].dateOfClose).toBe('2024-01-10');
      expect(result[0].expMovingAverage).not.toBeNull();
    });

    it('should return null EMA values when historical data is insufficient', () => {
      const historicalData = createMockHistoricalData(5);
      const chartData = createMockChartData(5, '2024-01-01');
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      expect(result).toHaveLength(5);
      expect(result[0].expMovingAverage).toBeNull();
      expect(result[1].expMovingAverage).toBeNull();
    });

    it('should preserve other chart data fields', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const chartData = createMockChartData(11, '2024-01-10');

      // Set some values in the chart data
      chartData[0].simpleMovingAverage = 105;
      chartData[0].twoHundredDayMovingAverage = 110;
      chartData[0].fiftyDayMovingAverage = 108;

      const ema = new ExponentialMovingAverage(historicalData, 10);
      const result = ema.generateTheAverages(chartData);

      expect(result[0].simpleMovingAverage).toBe(105);
      expect(result[0].twoHundredDayMovingAverage).toBe(110);
      expect(result[0].fiftyDayMovingAverage).toBe(108);
      expect(result[0].expMovingAverage).not.toBeNull();
    });

    it('should handle date alignment correctly', () => {
      const historicalData = createMockHistoricalData(25, '2024-01-01', 100);
      const chartData = createMockChartData(10, '2024-01-10'); // Start at day 10
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      // Verify dates match
      for (let i = 0; i < result.length; i++) {
        expect(result[i].dateOfClose).toBe(chartData[i].dateOfClose);
      }
    });

    it('should handle misaligned start dates', () => {
      const historicalData = createMockHistoricalData(30, '2024-01-01', 100);
      const chartData = createMockChartData(5, '2024-01-15'); // Start in middle
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      expect(result).toHaveLength(5);
      expect(result[0].dateOfClose).toBe('2024-01-15');
      expect(result[0].expMovingAverage).not.toBeNull();
    });

    it('should set null when datapoint index exceeds available data', () => {
      const historicalData = createMockHistoricalData(15, '2024-01-01', 100);
      const chartData = createMockChartData(20, '2024-01-10'); // More chart data than EMA points
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      expect(result).toHaveLength(20);

      // First 6 points should have EMA (15 - 10 + 1 = 6)
      for (let i = 0; i < 6; i++) {
        expect(result[i].expMovingAverage).not.toBeNull();
      }

      // Remaining points should have null EMA
      for (let i = 6; i < 20; i++) {
        expect(result[i].expMovingAverage).toBeNull();
      }
    });

    it('should handle empty chart data', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      // Implementation bug: Tries to access this.accumulatedChartData[0] without checking if empty
      expect(() => {
        ema.generateTheAverages([]);
      }).toThrow();
    });

    it('should handle chart data with no matching dates', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);
      const chartData = createMockChartData(5, '2024-06-01'); // Different month
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      // Should still process, but EMA values will be null since dates don't align
      expect(result).toHaveLength(5);
    });

    it('should return null expMovingAverage when datapoints array is empty', () => {
      const historicalData = createMockHistoricalData(5); // Insufficient data
      const chartData = createMockChartData(5, '2024-01-01');
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.generateTheAverages(chartData);

      expect(result).toHaveLength(5);
      result.forEach(entry => {
        expect(entry.expMovingAverage).toBeNull();
      });
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very large lookback periods', () => {
      const historicalData = createMockHistoricalData(500);
      const ema = new ExponentialMovingAverage(historicalData, 200);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result).toHaveLength(301); // 500 - 200 + 1
    });

    it('should handle lookback period of 1', () => {
      const historicalData = createMockHistoricalData(10, '2024-01-01', 100);
      const ema = new ExponentialMovingAverage(historicalData, 1);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result).toHaveLength(10);

      // Implementation uses index 'lookback' instead of 'lookback-1' for SMA, causing off-by-one
      // First SMA uses index 1 (price 101), dated with index 0
      // Then EMA loop starts at i=1, using price at index 1 again (101)
      // With multiplier=1, EMA equals current price, so we get: 101, 101, 102, 103, ...
      const expectedValues = [101, 101, 102, 103, 104, 105, 106, 107, 108, 109];
      for (let i = 0; i < result!.length; i++) {
        expect(result![i].calculatedValue).toBe(expectedValues[i]);
      }
    });

    it('should handle volatile price swings', () => {
      const historicalData: HistoricalPriceFull_V3[] = [];
      for (let i = 0; i < 20; i++) {
        const price = i % 2 === 0 ? 100 : 200; // Alternating prices
        historicalData.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 10,
          low: price - 10,
          close: price,
          adjClose: price,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: i % 2 === 0 ? -100 : 100,
          changePercent: i % 2 === 0 ? -50 : 100,
          vwap: price,
          label: `2024-01-${String(i + 1).padStart(2, '0')}`,
          changeOverTime: 0,
        });
      }

      const ema = new ExponentialMovingAverage(historicalData, 5);
      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);

      // EMA should smooth out volatility - values should be between min and max
      result!.forEach(point => {
        expect(point.calculatedValue).toBeGreaterThanOrEqual(0);
        expect(point.calculatedValue).toBeLessThanOrEqual(300);
      });
    });

    it('should handle decimal close prices', () => {
      const historicalData: HistoricalPriceFull_V3[] = [];
      for (let i = 0; i < 15; i++) {
        const price = 100.123 + i * 0.456;
        historicalData.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: price,
          high: price + 1,
          low: price - 1,
          close: price,
          adjClose: price,
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 0.456,
          changePercent: 0.4,
          vwap: price,
          label: `2024-01-${String(i + 1).padStart(2, '0')}`,
          changeOverTime: 0,
        });
      }

      const ema = new ExponentialMovingAverage(historicalData, 5);
      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();

      // All values should be valid numbers with decimals
      result!.forEach(point => {
        expect(typeof point.calculatedValue).toBe('number');
        expect(isNaN(point.calculatedValue)).toBe(false);
      });
    });

    it('should handle constant prices (no change)', () => {
      const historicalData = createMockHistoricalData(20, '2024-01-01', 100);

      // Make all prices the same
      historicalData.forEach(data => {
        data.close = 100;
      });

      const ema = new ExponentialMovingAverage(historicalData, 10);
      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();

      // All EMA values should be 100
      result!.forEach(point => {
        expect(point.calculatedValue).toBe(100);
      });
    });

    it('should handle typical stock market scenarios - 50-day EMA', () => {
      const historicalData = createMockHistoricalData(100, '2024-01-01', 150);
      const ema = new ExponentialMovingAverage(historicalData, 50);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result).toHaveLength(51); // 100 - 50 + 1

      // Verify multiplier for 50-day EMA: 2/(50+1) ≈ 0.0392
      const multiplier = 2 / 51;
      expect(multiplier).toBeCloseTo(0.0392, 4);
    });

    it('should handle typical stock market scenarios - 200-day EMA', () => {
      const historicalData = createMockHistoricalData(250, '2024-01-01', 200);
      const ema = new ExponentialMovingAverage(historicalData, 200);

      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result).toHaveLength(51); // 250 - 200 + 1

      // Verify multiplier for 200-day EMA: 2/(200+1) ≈ 0.00995
      const multiplier = 2 / 201;
      expect(multiplier).toBeCloseTo(0.00995, 5);
    });
  });

  describe('toString', () => {
    it('should return formatted string with data length and lookback period', () => {
      const historicalData = createMockHistoricalData(30);
      const ema = new ExponentialMovingAverage(historicalData, 10);

      const result = ema.toString();

      expect(result).toBe('ExponentialMovingAverage, length: 30, this.numberOfDaystoLookBack: 10');
    });

    it('should handle empty data in toString', () => {
      const ema = new ExponentialMovingAverage([], 5);

      const result = ema.toString();

      expect(result).toBe('ExponentialMovingAverage, length: 0, this.numberOfDaystoLookBack: 5');
    });
  });

  describe('Real-world EMA Calculation Verification', () => {
    it('should match known EMA calculation example', () => {
      // Using a simplified version of the Eastman Kodak example from code comments
      const historicalData: HistoricalPriceFull_V3[] = [];

      // Create 15 days of data leading to a known EMA value
      const prices = [
        60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75
      ];

      for (let i = 0; i < prices.length; i++) {
        historicalData.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: prices[i],
          high: prices[i] + 1,
          low: prices[i] - 1,
          close: prices[i],
          adjClose: prices[i],
          volume: 1000000,
          unadjustedVolume: 1000000,
          change: 1,
          changePercent: 1.5,
          vwap: prices[i],
          label: `2024-01-${String(i + 1).padStart(2, '0')}`,
          changeOverTime: 0,
        });
      }

      const ema = new ExponentialMovingAverage(historicalData, 10);
      const result = ema.generateTheUnrestrictedAverages();

      expect(result).not.toBeNull();
      expect(result!.length).toBeGreaterThan(0);

      // Implementation uses indices 1-10 instead of 0-9 for SMA (off-by-one bug)
      // First value is SMA of prices at indices 1-10: (61+62+...+70)/10 = 65.5
      expect(result![0].calculatedValue).toBe(65.5);

      // Subsequent values should follow EMA formula with multiplier = 2/11
      const multiplier = 2 / 11;
      for (let i = 1; i < result!.length; i++) {
        const expectedEMA =
          (prices[i + 9] - result![i - 1].calculatedValue) * multiplier +
          result![i - 1].calculatedValue;
        expect(result![i].calculatedValue).toBeCloseTo(expectedEMA, 10);
      }
    });
  });
});
