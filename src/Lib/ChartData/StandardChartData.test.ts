import { describe, it, expect } from 'vitest';
import StandardCharData from './StandardChartData';

describe('StandardChartData', () => {
  describe('constructor', () => {
    it('should create StandardChartData with all properties', () => {
      const chartData = new StandardCharData(
        '2024-01-15',
        150.50,
        148.25,
        149.75,
        145.00,
        147.50,
        142.00,
        152.00,
        148.00
      );

      expect(chartData.dateOfClose).toBe('2024-01-15');
      expect(chartData.dailyClosingPrice).toBe(150.50);
      expect(chartData.simpleMovingAverage).toBe(148.25);
      expect(chartData.expMovingAverage).toBe(149.75);
      expect(chartData.twoHundredDayMovingAverage).toBe(145.00);
      expect(chartData.fiftyDayMovingAverage).toBe(147.50);
      expect(chartData.lowerBollingerValue).toBe(142.00);
      expect(chartData.upperBollingerValue).toBe(152.00);
      expect(chartData.mean).toBe(148.00);
    });

    it('should handle null values for optional properties', () => {
      const chartData = new StandardCharData(
        '2024-01-15',
        150.50,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );

      expect(chartData.simpleMovingAverage).toBeNull();
      expect(chartData.expMovingAverage).toBeNull();
      expect(chartData.mean).toBeNull();
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const chartData = new StandardCharData(
        '2024-01-15',
        150.50,
        148.25,
        149.75,
        145.00,
        147.50,
        142.00,
        152.00,
        148.00
      );
      const result = chartData.toString();

      expect(result).toBe('dateOfClose: 2024-01-15:, dailyClosingPrice: 150.5:, simpleMovingAverage: 148.25:, expMovingAverage: 149.75:, twoHundredDayMovingAverage: 145:, fiftyDayMovingAverage: 147.5');
    });

    it('should handle null values in toString', () => {
      const chartData = new StandardCharData(
        '2024-01-15',
        150.50,
        null,
        null,
        null,
        null,
        null,
        null,
        null
      );
      const result = chartData.toString();

      expect(result).toContain('simpleMovingAverage: null');
      expect(result).toContain('expMovingAverage: null');
    });
  });
});
