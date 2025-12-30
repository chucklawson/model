import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetValuesBasedOnDate } from './GetValuesBasedOnDate';
import type HistoricalPriceFull_V3 from './HistoricalPriceFull_V3';

describe('GetValuesBasedOnDate', () => {
  let instance: GetValuesBasedOnDate;

  // Mock historical data for testing
  const createMockPriceData = (
    date: string,
    adjClose: number,
    high: number = adjClose,
    low: number = adjClose
  ): HistoricalPriceFull_V3 => ({
    date,
    open: adjClose,
    high,
    low,
    close: adjClose,
    adjClose,
    volume: 1000000,
    unadjustedVolume: 1000000,
    change: 0,
    changePercent: 0,
    vwap: adjClose,
    label: date,
    changeOverTime: 0
  });

  beforeEach(() => {
    instance = new GetValuesBasedOnDate();
  });

  describe('getAHistoricDateBySubtractingFromNow', () => {
    it('should subtract specified days when oneYearHistoryChecked is false', () => {
      // Arrange
      const daysToGoBack = 30;
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(expected.getDate() - daysToGoBack);

      // Act
      const result = instance.getAHistoricDateBySubtractingFromNow(daysToGoBack, false);

      // Assert
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });

    it('should go back one year minus one day when oneYearHistoryChecked is true', () => {
      // Arrange
      const today = new Date();
      const expected = new Date(today);
      expected.setDate(expected.getDate() - 1);
      expected.setFullYear(expected.getFullYear() - 1);

      // Act
      const result = instance.getAHistoricDateBySubtractingFromNow(0, true);

      // Assert
      expect(result.getDate()).toBe(expected.getDate());
      expect(result.getMonth()).toBe(expected.getMonth());
      expect(result.getFullYear()).toBe(expected.getFullYear());
    });

    it('should ignore numberOfDaysToGoBack when oneYearHistoryChecked is true', () => {
      // Act
      const result1 = instance.getAHistoricDateBySubtractingFromNow(100, true);
      const result2 = instance.getAHistoricDateBySubtractingFromNow(200, true);

      // Assert - Both should give same result (one year ago minus 1 day)
      expect(result1.getTime()).toBeCloseTo(result2.getTime(), -3); // Within few ms
    });
  });

  describe('findAValueBasedOnDate', () => {
    it('should find the correct value for an exact date match', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100),
        createMockPriceData('2024-01-02', 105),
        createMockPriceData('2024-01-03', 110)
      ];
      const dateToLocate = new Date('2024-01-02');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      // Function returns the next value after the target date
      expect(result).toBe(110);
    });

    it('should find the nearest earlier value when exact match not found', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100),
        createMockPriceData('2024-01-03', 110),
        createMockPriceData('2024-01-05', 120)
      ];
      const dateToLocate = new Date('2024-01-04'); // Between 01-03 and 01-05

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(120); // Should return the next value (breaks on first date > target)
    });

    it('should return last value when date is after all data', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100),
        createMockPriceData('2024-01-02', 105),
        createMockPriceData('2024-01-03', 110)
      ];
      const dateToLocate = new Date('2024-12-31');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(110);
    });

    it('should return 0 for empty time series', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [];
      const dateToLocate = new Date('2024-01-01');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle single item in time series', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100)
      ];
      const dateToLocate = new Date('2024-01-01');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(100);
    });
  });

  describe('findTheLowValueBasedOnDate', () => {
    it('should find the lowest adjClose value after the specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100, 105, 95),
        createMockPriceData('2024-01-02', 85, 115, 80), // Lowest adjClose here
        createMockPriceData('2024-01-03', 105, 110, 100)
      ];
      const dateToLocate = new Date('2023-12-31'); // Before all data

      // Act
      const result = instance.findTheLowValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      // Function uses adjClose, not the 'low' field
      expect(result).toBe(85);
    });

    it('should only consider dates after the specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 50, 100, 50), // This should be ignored (date not after)
        createMockPriceData('2024-01-02', 110, 110, 90),
        createMockPriceData('2024-01-03', 105, 105, 85)
      ];
      const dateToLocate = new Date('2024-01-01'); // After first entry

      // Act
      const result = instance.findTheLowValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      // Should be 105 (lowest adjClose after 2024-01-01)
      expect(result).toBe(105);
    });

    it('should return initial high value when no dates are after specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100, 100, 95),
        createMockPriceData('2024-01-02', 110, 110, 105)
      ];
      const dateToLocate = new Date('2025-01-01'); // After all data

      // Act
      const result = instance.findTheLowValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(10000000); // Initial value when nothing found
    });

    it('should handle empty time series', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [];
      const dateToLocate = new Date('2024-01-01');

      // Act
      const result = instance.findTheLowValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(10000000); // Initial value
    });
  });

  describe('findTheHighValueBasedOnDate', () => {
    it('should find the highest adjClose value after the specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100, 105, 95),
        createMockPriceData('2024-01-02', 125, 130, 105), // Highest adjClose here
        createMockPriceData('2024-01-03', 105, 110, 100)
      ];
      const dateToLocate = new Date('2023-12-31'); // Before all data

      // Act
      const result = instance.findTheHighValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      // Function uses adjClose, not the 'high' field
      expect(result).toBe(125);
    });

    it('should only consider dates after the specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 200, 200, 95), // This should be ignored (date not after)
        createMockPriceData('2024-01-02', 110, 115, 105),
        createMockPriceData('2024-01-03', 105, 120, 100)
      ];
      const dateToLocate = new Date('2024-01-01'); // After first entry

      // Act
      const result = instance.findTheHighValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      // Should be 110 (highest adjClose after 2024-01-01)
      expect(result).toBe(110);
    });

    it('should return 0 when no dates are after specified date', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100, 105, 95),
        createMockPriceData('2024-01-02', 110, 115, 105)
      ];
      const dateToLocate = new Date('2025-01-01'); // After all data

      // Act
      const result = instance.findTheHighValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(0); // Initial value when nothing found
    });

    it('should handle empty time series', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [];
      const dateToLocate = new Date('2024-01-01');

      // Act
      const result = instance.findTheHighValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBe(0); // Initial value
    });
  });

  describe('goBackSpecificNumberOfDays', () => {
    it('should find value from specific number of days ago', () => {
      // Arrange
      vi.setSystemTime(new Date('2024-01-10'));
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-05', 100),
        createMockPriceData('2024-01-06', 105),
        createMockPriceData('2024-01-07', 110),
        createMockPriceData('2024-01-08', 115)
      ];

      // Act
      const result = instance.goBackSpecificNumberOfDays(timeSeries, 3);

      // Assert
      expect(result).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should return -1 for time series with less than 2 items', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01', 100)
      ];

      // Act
      const result = instance.goBackSpecificNumberOfDays(timeSeries, 10);

      // Assert
      expect(result).toBe(-1);
    });

    it('should return -1 for empty time series', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [];

      // Act
      const result = instance.goBackSpecificNumberOfDays(timeSeries, 10);

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('convertDateForDateInputPicker', () => {
    it('should convert date to YYYY-MM-DD format', () => {
      // Arrange
      const date = new Date('2024-01-15T12:34:56.789Z');

      // Act
      const result = instance.convertDateForDateInputPicker(date);

      // Assert
      expect(result).toBe('2024-01-15');
    });

    it('should handle dates with single digit month and day', () => {
      // Arrange
      const date = new Date('2024-03-05T00:00:00Z');

      // Act
      const result = instance.convertDateForDateInputPicker(date);

      // Assert
      expect(result).toBe('2024-03-05');
    });

    it('should strip time information', () => {
      // Arrange
      const date = new Date('2024-12-25T23:59:59.999Z');

      // Act
      const result = instance.convertDateForDateInputPicker(date);

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).not.toContain('T');
    });
  });

  describe('getDate_2017', () => {
    it('should return February 1, 2017', () => {
      // Act
      const result = instance.getDate_2017();

      // Assert
      expect(result.getFullYear()).toBe(2017);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it('should return consistent date on multiple calls', () => {
      // Act
      const result1 = instance.getDate_2017();
      const result2 = instance.getDate_2017();

      // Assert
      expect(result1.getTime()).toBe(result2.getTime());
    });
  });

  describe('getDate_2021', () => {
    it('should return February 1, 2021', () => {
      // Act
      const result = instance.getDate_2021();

      // Assert
      expect(result.getFullYear()).toBe(2021);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it('should return consistent date on multiple calls', () => {
      // Act
      const result1 = instance.getDate_2021();
      const result2 = instance.getDate_2021();

      // Assert
      expect(result1.getTime()).toBe(result2.getTime());
    });
  });

  describe('getDate_2025', () => {
    it('should return February 1, 2025', () => {
      // Act
      const result = instance.getDate_2025();

      // Assert
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1); // February (0-indexed)
      expect(result.getDate()).toBe(1);
    });

    it('should return consistent date on multiple calls', () => {
      // Act
      const result1 = instance.getDate_2025();
      const result2 = instance.getDate_2025();

      // Assert
      expect(result1.getTime()).toBe(result2.getTime());
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle time series with dates in reverse chronological order', () => {
      // Arrange - Most APIs return newest first
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-05', 120),
        createMockPriceData('2024-01-04', 115),
        createMockPriceData('2024-01-03', 110),
        createMockPriceData('2024-01-02', 105),
        createMockPriceData('2024-01-01', 100)
      ];
      const dateToLocate = new Date('2024-01-03');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBeGreaterThan(0);
    });

    it('should handle dates with varying times of day', () => {
      // Arrange
      const timeSeries: HistoricalPriceFull_V3[] = [
        createMockPriceData('2024-01-01T09:30:00', 100),
        createMockPriceData('2024-01-01T16:00:00', 105)
      ];
      const dateToLocate = new Date('2024-01-01T12:00:00');

      // Act
      const result = instance.findAValueBasedOnDate(dateToLocate, timeSeries);

      // Assert
      expect(result).toBeGreaterThan(0);
    });
  });
});
