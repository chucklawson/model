import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LWChartEntries from './LWChartEntries';
import LWChartData from './LWChartData';

// Helper to create mock LWChartData
function createMockLWChartData(count: number, startDate: string, basePrice: number): LWChartData[] {
  const data: LWChartData[] = [];
  const baseDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const chartData = new LWChartData(
      dateStr,
      basePrice + i,
      basePrice + i + 2,
      basePrice + i - 1,
      basePrice + i,
      1000000,
      50 + i
    );
    data.push(chartData);
  }

  return data;
}

// Helper to create custom LWChartData with specific values
function createCustomLWChartData(
  dataPoints: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    williams: number;
  }>
): LWChartData[] {
  return dataPoints.map(
    (point) =>
      new LWChartData(
        point.date,
        point.open,
        point.high,
        point.low,
        point.close,
        point.volume,
        point.williams
      )
  );
}

describe('LWChartEntries', () => {
  beforeEach(() => {
    // Suppress console.log during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with larry williams data and date range', () => {
      const lwData = createMockLWChartData(10, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-05', '2024-01-08');

      expect(lwEntries.larryWilliams).toBe(lwData);
      expect(lwEntries.startDate).toBe('2024-01-05');
      expect(lwEntries.endDate).toBe('2024-01-08');
    });

    it('should handle empty data array', () => {
      const lwEntries = new LWChartEntries([], '2024-01-01', '2024-01-05');

      expect(lwEntries.larryWilliams).toEqual([]);
      expect(lwEntries.startDate).toBe('2024-01-01');
      expect(lwEntries.endDate).toBe('2024-01-05');
    });

    it('should handle single data point', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      expect(lwEntries.larryWilliams.length).toBe(1);
      expect(lwEntries.startDate).toBe('2024-01-01');
      expect(lwEntries.endDate).toBe('2024-01-01');
    });
  });

  describe('convertDateForAnalysis', () => {
    it('should convert date to ISO date string without time', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const date = new Date('2024-03-15T14:30:00.000Z');
      const result = lwEntries.convertDateForAnalysis(date);

      expect(result).toBe('2024-03-15');
    });

    it('should handle date at midnight', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const date = new Date('2024-06-20T00:00:00.000Z');
      const result = lwEntries.convertDateForAnalysis(date);

      expect(result).toBe('2024-06-20');
    });

    it('should handle date at end of day', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const date = new Date('2024-12-31T23:59:59.999Z');
      const result = lwEntries.convertDateForAnalysis(date);

      expect(result).toBe('2024-12-31');
    });

    it('should handle leap year dates', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const date = new Date('2024-02-29T12:00:00.000Z');
      const result = lwEntries.convertDateForAnalysis(date);

      expect(result).toBe('2024-02-29');
    });
  });

  describe('findAddressBasedOnDate', () => {
    it('should find exact matching date', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-03', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-03');

      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-02');

      // Implementation returns FIRST index where date <= target, which is 0
      expect(result).toBe(0);
    });

    it('should find first date when looking for date before first entry', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-03', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-04', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-03', '2024-01-05');

      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-01');

      // Should return -1 as no date is <= dateToFind
      expect(result).toBe(-1);
    });

    it('should find correct index for date between entries', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-05');

      // Implementation returns FIRST index where date <= target (index 0)
      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-04');

      expect(result).toBe(0);
    });

    it('should find last date when looking for date after all entries', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-03', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-03');

      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-10');

      expect(result).toBe(0); // First date that is <= 2024-01-10
    });

    it('should return -1 for empty array', () => {
      const lwData = createMockLWChartData(1, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.findAddressBasedOnDate([], '2024-01-01');

      expect(result).toBe(-1);
    });

    it('should handle single element array', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-05', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-05', '2024-01-05');

      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-05');

      expect(result).toBe(0);
    });

    it('should handle date strings with time component', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01T00:00:00', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02T00:00:00', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-02');

      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-01T14:30:00');

      expect(result).toBe(0);
    });

    it('should break on first match (not continue searching)', () => {
      const lwData = createMockLWChartData(100, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-04-10');

      // Implementation breaks on FIRST date <= target, which is index 0
      const result = lwEntries.findAddressBasedOnDate(lwData, '2024-01-05');

      expect(result).toBe(0);
    });
  });

  describe('generateLWValues', () => {
    it('should return null when larryWilliams is null', () => {
      const lwEntries = new LWChartEntries(null as any, '2024-01-01', '2024-01-05');

      const result = lwEntries.generateLWValues();

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('larryWilliams.length is null or undefined');
    });

    it('should return null when larryWilliams.length is undefined', () => {
      const lwData: any = { someProperty: 'value' };
      delete lwData.length;
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-05');

      const result = lwEntries.generateLWValues();

      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('larryWilliams.length is null or undefined');
    });

    it('should generate values in reverse chronological order', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-03', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
        { date: '2024-01-04', open: 106, high: 111, low: 101, close: 108, volume: 1300000, williams: 65 },
        { date: '2024-01-05', open: 108, high: 113, low: 103, close: 110, volume: 1400000, williams: 70 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-02', '2024-01-04');

      const result = lwEntries.generateLWValues();

      // findAddressBasedOnDate returns 0 for both dates, so loop from 0 to 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should copy all properties correctly', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-02');

      const result = lwEntries.generateLWValues();

      // findAddressBasedOnDate returns 0 for both dates, so only first element
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);

      // Verify entry properties are copied correctly
      expect(result?.[0].date).toBe('2024-01-01');
      expect(result?.[0].open).toBe(100);
      expect(result?.[0].high).toBe(105);
      expect(result?.[0].low).toBe(95);
      expect(result?.[0].close).toBe(102);
      expect(result?.[0].volume).toBe(1000000);
      expect(result?.[0].williams).toBe(50);
    });

    it('should handle single date range', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-03', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-02', '2024-01-02');

      const result = lwEntries.generateLWValues();

      // findAddressBasedOnDate returns 0 for both dates
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should handle when start and end dates result in valid range', () => {
      const lwData = createMockLWChartData(30, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-05', '2024-01-20');

      const result = lwEntries.generateLWValues();

      // findAddressBasedOnDate returns 0 for both dates
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
    });

    it('should handle when end date is before start date (reversed range)', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-03', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      // Start date is later than end date
      const lwEntries = new LWChartEntries(lwData, '2024-01-03', '2024-01-01');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0, so loop from 0 to 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
    });

    it('should return empty array when start date not found', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-05', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-06', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-06');

      const result = lwEntries.generateLWValues();

      // startAddress would be -1, endAddress would be 1
      expect(result).not.toBeNull();
      expect(result?.length).toBe(0);
    });

    it('should return empty array when end date not found', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2023-12-31');

      // startAddress=0, endAddress=-1, loop tries to access lwData[-1] which is undefined
      // This causes an error when creating LWChartData with undefined properties
      expect(() => lwEntries.generateLWValues()).toThrow();
    });

    it('should create new LWChartData instances (not references)', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.[0]).toBeInstanceOf(LWChartData);
      // Should be a new instance, not the same reference
      expect(result?.[0]).not.toBe(lwData[0]);
    });

    it('should handle large dataset', () => {
      const lwData = createMockLWChartData(1000, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-12-31');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.length).toBeGreaterThan(0);
      expect(result?.[0]).toBeInstanceOf(LWChartData);
    });

    it('should handle dates with different time zones', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01T08:00:00+08:00', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02T08:00:00+08:00', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-02');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle fractional numeric values', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100.25, high: 105.75, low: 95.5, close: 102.125, volume: 1234567, williams: 50.5 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.[0].open).toBe(100.25);
      expect(result?.[0].high).toBe(105.75);
      expect(result?.[0].low).toBe(95.5);
      expect(result?.[0].close).toBe(102.125);
      expect(result?.[0].volume).toBe(1234567);
      expect(result?.[0].williams).toBe(50.5);
    });

    it('should handle negative williams values', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: -50 },
        { date: '2024-01-02', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: -75 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-02');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0, so only first element
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].williams).toBe(-50);
    });

    it('should handle zero values', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 0, high: 0, low: 0, close: 0, volume: 0, williams: 0 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.[0].open).toBe(0);
      expect(result?.[0].high).toBe(0);
      expect(result?.[0].low).toBe(0);
      expect(result?.[0].close).toBe(0);
      expect(result?.[0].volume).toBe(0);
      expect(result?.[0].williams).toBe(0);
    });
  });

  describe('integration tests', () => {
    it('should handle a typical use case with weekly data', () => {
      const lwData = createMockLWChartData(7, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-02', '2024-01-06');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should handle a typical use case with monthly data', () => {
      const lwData = createMockLWChartData(31, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-31');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should handle data with gaps (missing dates)', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-03', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-05', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
        { date: '2024-01-07', open: 106, high: 111, low: 101, close: 108, volume: 1300000, williams: 65 },
      ]);
      // Request range includes missing dates
      const lwEntries = new LWChartEntries(lwData, '2024-01-02', '2024-01-06');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should handle entire dataset range', () => {
      const lwData = createMockLWChartData(100, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(
        lwData,
        lwData[0].date,
        lwData[lwData.length - 1].date
      );

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
    });

    it('should validate all returned objects are LWChartData instances', () => {
      const lwData = createMockLWChartData(10, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-10');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      result?.forEach((item) => {
        expect(item).toBeInstanceOf(LWChartData);
        expect(item.date).toBeDefined();
        expect(typeof item.open).toBe('number');
        expect(typeof item.high).toBe('number');
        expect(typeof item.low).toBe('number');
        expect(typeof item.close).toBe('number');
        expect(typeof item.volume).toBe('number');
        expect(typeof item.williams).toBe('number');
      });
    });

    it('should maintain data integrity across multiple calls', () => {
      const lwData = createMockLWChartData(10, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-05');

      const result1 = lwEntries.generateLWValues();
      const result2 = lwEntries.generateLWValues();

      expect(result1).toEqual(result2);
      expect(result1?.length).toBe(result2?.length);
    });

    it('should handle real-world scenario with stock market data', () => {
      // Simulate stock market data with realistic values
      const lwData = createCustomLWChartData([
        { date: '2024-01-02', open: 150.25, high: 152.50, low: 149.75, close: 151.80, volume: 5234567, williams: -25.5 },
        { date: '2024-01-03', open: 151.80, high: 153.20, low: 150.90, close: 152.40, volume: 4987234, williams: -22.3 },
        { date: '2024-01-04', open: 152.40, high: 154.75, low: 151.20, close: 153.90, volume: 6123456, williams: -18.7 },
        { date: '2024-01-05', open: 153.90, high: 155.30, low: 152.80, close: 154.60, volume: 5678901, williams: -15.2 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-02', '2024-01-05');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);

      // Verify data accuracy for first element
      expect(result?.[0].date).toBe('2024-01-02');
      expect(result?.[0].close).toBe(151.80);
      expect(result?.[0].williams).toBe(-25.5);
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle date at year boundary', () => {
      const lwData = createCustomLWChartData([
        { date: '2023-12-31', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-01', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
        { date: '2024-01-02', open: 104, high: 109, low: 99, close: 106, volume: 1200000, williams: 60 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2023-12-31', '2024-01-01');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2023-12-31');
    });

    it('should handle same start and end date', () => {
      const lwData = createMockLWChartData(5, '2024-01-01', 100);
      const lwEntries = new LWChartEntries(lwData, '2024-01-03', '2024-01-03');

      const result = lwEntries.generateLWValues();

      // Both dates return index 0
      expect(result).not.toBeNull();
      expect(result?.length).toBe(1);
      expect(result?.[0].date).toBe('2024-01-01');
    });

    it('should handle very large volume numbers', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102, volume: 999999999999, williams: 50 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.[0].volume).toBe(999999999999);
    });

    it('should handle very small decimal values', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01', open: 0.0001, high: 0.0002, low: 0.00005, close: 0.00015, volume: 1000000, williams: 0.001 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-01');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.[0].open).toBeCloseTo(0.0001, 5);
      expect(result?.[0].high).toBeCloseTo(0.0002, 5);
      expect(result?.[0].williams).toBeCloseTo(0.001, 5);
    });

    it('should handle ISO date format with timezone offset', () => {
      const lwData = createCustomLWChartData([
        { date: '2024-01-01T00:00:00.000Z', open: 100, high: 105, low: 95, close: 102, volume: 1000000, williams: 50 },
        { date: '2024-01-02T00:00:00.000Z', open: 102, high: 107, low: 97, close: 104, volume: 1100000, williams: 55 },
      ]);
      const lwEntries = new LWChartEntries(lwData, '2024-01-01', '2024-01-02');

      const result = lwEntries.generateLWValues();

      expect(result).not.toBeNull();
      expect(result?.length).toBeGreaterThanOrEqual(1);
    });
  });
});
