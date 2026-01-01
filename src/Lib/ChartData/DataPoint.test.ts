import { describe, it, expect } from 'vitest';
import DataPoint from './DataPoint';

describe('DataPoint', () => {
  describe('constructor', () => {
    it('should create DataPoint with date and value', () => {
      const dataPoint = new DataPoint('2024-01-15', 150.50);

      expect(dataPoint.date).toBe('2024-01-15');
      expect(dataPoint.calculatedValue).toBe(150.50);
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const dataPoint = new DataPoint('2024-01-15', 150.50);
      const result = dataPoint.toString();

      expect(result).toBe('DataPoint date: 2024-01-15:, calculatedValue: 150.5');
    });

    it('should handle negative values', () => {
      const dataPoint = new DataPoint('2024-01-15', -25.75);
      const result = dataPoint.toString();

      expect(result).toContain('-25.75');
    });

    it('should handle zero value', () => {
      const dataPoint = new DataPoint('2024-01-15', 0);
      const result = dataPoint.toString();

      expect(result).toContain('calculatedValue: 0');
    });
  });
});
