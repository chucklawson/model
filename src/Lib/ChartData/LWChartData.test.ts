import { describe, it, expect } from 'vitest';
import LWChartData from './LWChartData';

describe('LWChartData', () => {
  describe('constructor', () => {
    it('should create LWChartData with all properties', () => {
      const chartData = new LWChartData(
        '2024-01-15T10:30:00',
        150.00,
        152.50,
        149.00,
        151.25,
        1000000,
        -15.5
      );

      expect(chartData.date).toBe('2024-01-15');
      expect(chartData.open).toBe(150.00);
      expect(chartData.high).toBe(152.50);
      expect(chartData.low).toBe(149.00);
      expect(chartData.close).toBe(151.25);
      expect(chartData.volume).toBe(1000000);
      expect(chartData.williams).toBe(-15.5);
    });

    it('should truncate date to YYYY-MM-DD format', () => {
      const chartData = new LWChartData(
        '2024-01-15T10:30:00.000Z',
        150.00,
        152.50,
        149.00,
        151.25,
        1000000,
        -20.0
      );

      expect(chartData.date).toBe('2024-01-15');
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const chartData = new LWChartData(
        '2024-01-15',
        150.00,
        152.50,
        149.00,
        151.25,
        1000000,
        -15.5
      );
      const result = chartData.toString();

      expect(result).toBe('date: 2024-01-15, open: 150, high: 152.5, low: 149, close: 151.25, volume: 1000000, williams: -15.5');
    });

    it('should handle zero values', () => {
      const chartData = new LWChartData(
        '2024-01-15',
        0,
        0,
        0,
        0,
        0,
        0
      );
      const result = chartData.toString();

      expect(result).toContain('open: 0');
      expect(result).toContain('volume: 0');
    });
  });
});
