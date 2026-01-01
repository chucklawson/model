import { describe, it, expect } from 'vitest';
import {
  calculateInterpolatedPE,
  calculateImpliedGrowth,
  generateAnnualProjections
} from './AnnualProjectionCalculator';
import type AnalystEstimate_V3 from './AnalystEstimate_V3';

describe('AnnualProjectionCalculator', () => {
  describe('calculateInterpolatedPE', () => {
    // Happy path tests
    it('should interpolate P/E ratio at midpoint correctly', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const currentYear = 5;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(15); // Midpoint between 10 and 20
    });

    it('should return current P/E at year 0', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const currentYear = 0;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(10);
    });

    it('should return target P/E at final year', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const currentYear = 10;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(20);
    });

    it('should interpolate correctly when target is lower than current', () => {
      // Arrange - P/E compression scenario
      const currentPE = 30;
      const targetPE = 15;
      const currentYear = 5;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(22.5); // Halfway from 30 to 15
    });

    it('should handle single year projection', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const currentYear = 1;
      const totalYears = 1;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(20); // Should be target P/E
    });

    // Edge cases
    it('should return target P/E when totalYears is 0', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const currentYear = 1;
      const totalYears = 0;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(20);
    });

    it('should handle same current and target P/E', () => {
      // Arrange
      const currentPE = 15;
      const targetPE = 15;
      const currentYear = 5;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(15);
    });

    it('should handle decimal P/E values', () => {
      // Arrange
      const currentPE = 12.5;
      const targetPE = 18.7;
      const currentYear = 3;
      const totalYears = 6;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBeCloseTo(15.6, 1); // Linear interpolation: 12.5 + (18.7-12.5) * (3/6)
    });

    it('should handle negative P/E values', () => {
      // Arrange - company with losses
      const currentPE = -5;
      const targetPE = 10;
      const currentYear = 5;
      const totalYears = 10;

      // Act
      const result = calculateInterpolatedPE(currentPE, targetPE, currentYear, totalYears);

      // Assert
      expect(result).toBe(2.5); // Halfway from -5 to 10
    });

    it('should calculate linear progression correctly', () => {
      // Arrange
      const currentPE = 10;
      const targetPE = 20;
      const totalYears = 4;

      // Act & Assert - test each year
      expect(calculateInterpolatedPE(currentPE, targetPE, 0, totalYears)).toBe(10);
      expect(calculateInterpolatedPE(currentPE, targetPE, 1, totalYears)).toBe(12.5);
      expect(calculateInterpolatedPE(currentPE, targetPE, 2, totalYears)).toBe(15);
      expect(calculateInterpolatedPE(currentPE, targetPE, 3, totalYears)).toBe(17.5);
      expect(calculateInterpolatedPE(currentPE, targetPE, 4, totalYears)).toBe(20);
    });
  });

  describe('calculateImpliedGrowth', () => {
    // Happy path tests
    it('should calculate CAGR correctly with valid estimates', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 2.2, epsHigh: 2.3, epsLow: 2.1, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 2.42, epsHigh: 2.5, epsLow: 2.3, numberAnalysts: 10 },
        { date: '2027-12-31', epsAvg: 2.662, epsHigh: 2.8, epsLow: 2.5, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert - 10% annual growth: (2.662/2.0)^(1/3) - 1 = 0.10
      expect(result).toBeCloseTo(10, 1);
    });

    it('should calculate growth for single year estimate', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 2.2, epsHigh: 2.3, epsLow: 2.1, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert - 10% growth for 1 year
      expect(result).toBeCloseTo(10, 1);
    });

    it('should calculate growth for multiple year estimates', () => {
      // Arrange
      const currentEPS = 1.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 1.2, epsHigh: 1.3, epsLow: 1.1, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 1.44, epsHigh: 1.5, epsLow: 1.4, numberAnalysts: 10 },
        { date: '2027-12-31', epsAvg: 1.728, epsHigh: 1.8, epsLow: 1.7, numberAnalysts: 10 },
        { date: '2028-12-31', epsAvg: 2.074, epsHigh: 2.1, epsLow: 2.0, numberAnalysts: 10 },
        { date: '2029-12-31', epsAvg: 2.488, epsHigh: 2.5, epsLow: 2.4, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert - ~20% annual growth over 5 years
      expect(result).toBeCloseTo(20, 0);
    });

    it('should handle declining EPS (negative growth)', () => {
      // Arrange
      const currentEPS = 5.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 4.5, epsHigh: 4.6, epsLow: 4.4, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 4.05, epsHigh: 4.2, epsLow: 4.0, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert - negative growth
      expect(result).toBeLessThan(0);
      expect(result).toBeCloseTo(-10, 0);
    });

    // Edge cases
    it('should return 0 when estimates array is empty', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when currentEPS is 0', () => {
      // Arrange
      const currentEPS = 0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 2.2, epsHigh: 2.3, epsLow: 2.1, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when currentEPS is negative', () => {
      // Arrange
      const currentEPS = -2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 2.2, epsHigh: 2.3, epsLow: 2.1, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when final epsAvg is undefined', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: undefined as any, epsHigh: 2.3, epsLow: 2.1, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when final epsAvg is 0', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 0, epsHigh: 0, epsLow: 0, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 when final epsAvg is negative', () => {
      // Arrange
      const currentEPS = 2.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: -1.5, epsHigh: -1.0, epsLow: -2.0, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle very high growth rates', () => {
      // Arrange
      const currentEPS = 1.0;
      const estimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 2.0, epsHigh: 2.1, epsLow: 1.9, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 4.0, epsHigh: 4.2, epsLow: 3.8, numberAnalysts: 10 },
        { date: '2027-12-31', epsAvg: 8.0, epsHigh: 8.5, epsLow: 7.5, numberAnalysts: 10 }
      ];

      // Act
      const result = calculateImpliedGrowth(currentEPS, estimates);

      // Assert - 100% annual growth (doubling each year)
      expect(result).toBeCloseTo(100, 0);
    });
  });

  describe('generateAnnualProjections', () => {
    const currentYear = new Date().getFullYear();

    // Happy path tests - manual growth rate
    it('should generate projections with manual growth rate', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 3;
      const growthRate = 0.10; // 10% annual growth
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(3);

      // Year 1
      expect(result[0].year).toBe(1);
      expect(result[0].calendarYear).toBe(currentYear + 1);
      expect(result[0].eps).toBeCloseTo(5.5, 2); // 5 * 1.10
      expect(result[0].peRatio).toBeCloseTo(21.67, 2); // Interpolated P/E
      expect(result[0].stockPrice).toBeCloseTo(119.17, 1); // 5.5 * 21.67

      // Year 2
      expect(result[1].year).toBe(2);
      expect(result[1].eps).toBeCloseTo(6.05, 2); // 5 * 1.10^2

      // Year 3
      expect(result[2].year).toBe(3);
      expect(result[2].eps).toBeCloseTo(6.655, 2); // 5 * 1.10^3
      expect(result[2].peRatio).toBe(25); // Target P/E at final year
    });

    it('should generate projections with analyst estimates', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 3;
      const growthRate = 0.10;
      const useAnalystEstimates = true;
      const analystData: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 5.5, epsHigh: 5.6, epsLow: 5.4, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 6.2, epsHigh: 6.3, epsLow: 6.1, numberAnalysts: 10 },
        { date: '2027-12-31', epsAvg: 7.0, epsHigh: 7.2, epsLow: 6.8, numberAnalysts: 10 }
      ];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].eps).toBe(5.5); // Uses analyst estimate
      expect(result[1].eps).toBe(6.2); // Uses analyst estimate
      expect(result[2].eps).toBe(7.0); // Uses analyst estimate
    });

    it('should fall back to manual growth when analyst data is insufficient', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 5; // Requesting 5 years
      const growthRate = 0.10;
      const useAnalystEstimates = true;
      const analystData: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 5.5, epsHigh: 5.6, epsLow: 5.4, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 6.2, epsHigh: 6.3, epsLow: 6.1, numberAnalysts: 10 }
        // Only 2 years of analyst data
      ];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(5);
      expect(result[0].eps).toBe(5.5); // Year 1: uses analyst estimate
      expect(result[1].eps).toBe(6.2); // Year 2: uses analyst estimate
      expect(result[2].eps).toBeCloseTo(6.655, 2); // Year 3: falls back to manual growth (5 * 1.10^3)
      expect(result[3].eps).toBeCloseTo(7.32, 2); // Year 4: manual growth (5 * 1.10^4)
      expect(result[4].eps).toBeCloseTo(8.053, 2); // Year 5: manual growth (5 * 1.10^5)
    });

    it('should calculate annual growth correctly', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 20; // Keep P/E constant for simple growth calc
      const years = 3;
      const growthRate = 0.10;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert - verify year-over-year growth calculation
      const year1Growth = ((result[0].stockPrice - currentPrice) / currentPrice) * 100;
      expect(result[0].annualGrowth).toBeCloseTo(year1Growth, 1);

      const year2Growth = ((result[1].stockPrice - result[0].stockPrice) / result[0].stockPrice) * 100;
      expect(result[1].annualGrowth).toBeCloseTo(year2Growth, 1);
    });

    it('should calculate cumulative return correctly', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 20;
      const years = 3;
      const growthRate = 0.10;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert - cumulative return from starting price
      const expectedCumulativeYear1 = ((result[0].stockPrice - currentPrice) / currentPrice) * 100;
      expect(result[0].cumulativeReturn).toBeCloseTo(expectedCumulativeYear1, 1);

      const expectedCumulativeYear3 = ((result[2].stockPrice - currentPrice) / currentPrice) * 100;
      expect(result[2].cumulativeReturn).toBeCloseTo(expectedCumulativeYear3, 1);
    });

    it('should interpolate P/E across all years', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 10;
      const targetPE = 20;
      const years = 5;
      const growthRate = 0.05;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert - P/E should increase linearly from 10 to 20
      expect(result[0].peRatio).toBeCloseTo(12, 1); // Year 1: 10 + (20-10)*(1/5)
      expect(result[1].peRatio).toBeCloseTo(14, 1); // Year 2: 10 + (20-10)*(2/5)
      expect(result[2].peRatio).toBeCloseTo(16, 1); // Year 3
      expect(result[3].peRatio).toBeCloseTo(18, 1); // Year 4
      expect(result[4].peRatio).toBeCloseTo(20, 1); // Year 5: target P/E
    });

    // Edge cases
    it('should handle zero years', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 0;
      const growthRate = 0.10;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle single year projection', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 1;
      const growthRate = 0.10;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].year).toBe(1);
      expect(result[0].peRatio).toBe(25); // Should be target P/E
      expect(result[0].eps).toBeCloseTo(5.5, 2);
    });

    it('should handle zero growth rate', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 3;
      const growthRate = 0; // No growth
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].eps).toBe(5); // No growth
      expect(result[1].eps).toBe(5);
      expect(result[2].eps).toBe(5);
    });

    it('should handle negative growth rate', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 15; // P/E compression
      const years = 2;
      const growthRate = -0.10; // -10% annual decline
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].eps).toBeCloseTo(4.5, 2); // 5 * 0.90
      expect(result[1].eps).toBeCloseTo(4.05, 2); // 5 * 0.90^2
    });

    it('should correctly set calendar years', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 3;
      const growthRate = 0.10;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result[0].calendarYear).toBe(currentYear + 1);
      expect(result[1].calendarYear).toBe(currentYear + 2);
      expect(result[2].calendarYear).toBe(currentYear + 3);
    });

    it('should handle P/E compression scenario', () => {
      // Arrange - stock price may decline even with EPS growth
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 30; // High starting P/E
      const targetPE = 15; // Compressing to lower P/E
      const years = 3;
      const growthRate = 0.10; // 10% EPS growth
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert - P/E should compress
      expect(result[0].peRatio).toBeGreaterThan(targetPE);
      expect(result[0].peRatio).toBeLessThan(currentPE);
      expect(result[2].peRatio).toBe(targetPE);
    });

    it('should handle very long projections', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 10;
      const growthRate = 0.08;
      const useAnalystEstimates = false;
      const analystData: AnalystEstimate_V3[] = [];

      // Act
      const result = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        useAnalystEstimates,
        analystData
      );

      // Assert
      expect(result).toHaveLength(10);
      expect(result[9].year).toBe(10);
      expect(result[9].calendarYear).toBe(currentYear + 10);
      expect(result[9].eps).toBeCloseTo(5 * Math.pow(1.08, 10), 2);
    });
  });
});
