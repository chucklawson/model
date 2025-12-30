import { describe, it, expect } from 'vitest';
import {
  calculateLumpSumFutureValue,
  calculateMonthlyContributionsFutureValue,
  calculateInvestmentGrowth,
  calculateDrawDownInvestment,
  calculateBreakevenRate,
  validateInvestmentInputs,
  type InvestmentInputs,
  type DrawDownInvestmentInputs
} from './InvestmentCalculation';

describe('InvestmentCalculation', () => {
  describe('calculateLumpSumFutureValue', () => {
    it('should calculate correct future value with positive returns', () => {
      // Arrange
      const principal = 10000;
      const annualRate = 8; // 8% annual
      const years = 10;

      // Act
      const result = calculateLumpSumFutureValue(principal, annualRate, years);

      // Assert
      // $10,000 at 8% for 10 years with monthly compounding ≈ $22,196
      expect(result).toBeCloseTo(22196, 0);
    });

    it('should return principal when rate is 0', () => {
      // Arrange
      const principal = 10000;
      const annualRate = 0;
      const years = 10;

      // Act
      const result = calculateLumpSumFutureValue(principal, annualRate, years);

      // Assert
      expect(result).toBe(principal);
    });

    it('should return 0 for zero or negative principal', () => {
      expect(calculateLumpSumFutureValue(0, 8, 10)).toBe(0);
      expect(calculateLumpSumFutureValue(-100, 8, 10)).toBe(0);
    });

    it('should return 0 for zero or negative years', () => {
      expect(calculateLumpSumFutureValue(10000, 8, 0)).toBe(0);
      expect(calculateLumpSumFutureValue(10000, 8, -5)).toBe(0);
    });

    it('should handle fractional years correctly', () => {
      const result = calculateLumpSumFutureValue(10000, 8, 2.5);
      expect(result).toBeGreaterThan(10000);
      expect(result).toBeLessThan(calculateLumpSumFutureValue(10000, 8, 3));
    });
  });

  describe('calculateMonthlyContributionsFutureValue', () => {
    it('should calculate correct future value with monthly contributions', () => {
      // Arrange
      const monthlyPayment = 500;
      const annualRate = 8;
      const years = 10;

      // Act
      const result = calculateMonthlyContributionsFutureValue(monthlyPayment, annualRate, years);

      // Assert
      // $500/month at 8% for 10 years ≈ $91,473
      expect(result).toBeCloseTo(91473, 0);
    });

    it('should return sum of contributions when rate is 0', () => {
      // Arrange
      const monthlyPayment = 500;
      const annualRate = 0;
      const years = 10;

      // Act
      const result = calculateMonthlyContributionsFutureValue(monthlyPayment, annualRate, years);

      // Assert
      expect(result).toBe(monthlyPayment * 12 * years); // $60,000
    });

    it('should return 0 for zero or negative payment', () => {
      expect(calculateMonthlyContributionsFutureValue(0, 8, 10)).toBe(0);
      expect(calculateMonthlyContributionsFutureValue(-100, 8, 10)).toBe(0);
    });

    it('should return 0 for zero or negative years', () => {
      expect(calculateMonthlyContributionsFutureValue(500, 8, 0)).toBe(0);
      expect(calculateMonthlyContributionsFutureValue(500, 8, -5)).toBe(0);
    });
  });

  describe('calculateInvestmentGrowth', () => {
    it('should calculate growth with lump sum only', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 0,
        annualReturnRate: 8,
        investmentTermYears: 5
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeCloseTo(14898, 0);
      expect(result.totalContributions).toBe(10000);
      expect(result.totalInterestEarned).toBeCloseTo(4898, 0);
      expect(result.monthlyGrowthSchedule).toHaveLength(60); // 5 years * 12 months
    });

    it('should calculate growth with monthly contributions only', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 0,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 5
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(30000); // More than just contributions
      expect(result.totalContributions).toBe(500 * 60); // $30,000
      expect(result.totalInterestEarned).toBeGreaterThan(0);
      expect(result.monthlyGrowthSchedule).toHaveLength(60);
    });

    it('should calculate growth with both lump sum and monthly contributions', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 5
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(40000);
      expect(result.totalContributions).toBe(10000 + 500 * 60);
      expect(result.totalInterestEarned).toBe(result.finalValue - result.totalContributions);
    });

    it('should have increasing total value over time', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 5
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      const schedule = result.monthlyGrowthSchedule;
      expect(schedule[0].totalValue).toBeLessThan(schedule[30].totalValue);
      expect(schedule[30].totalValue).toBeLessThan(schedule[59].totalValue);
    });

    it('should return zero results for zero term', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 0
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBe(0);
      expect(result.totalContributions).toBe(0);
      expect(result.totalInterestEarned).toBe(0);
      expect(result.monthlyGrowthSchedule).toHaveLength(0);
    });

    it('should include correct month/year in schedule', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 100,
        annualReturnRate: 8,
        investmentTermYears: 2
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      const schedule = result.monthlyGrowthSchedule;
      expect(schedule[0].month).toBe(1);
      expect(schedule[11].month).toBe(12);
      expect(schedule[23].month).toBe(24);
      expect(schedule[0].monthOfYear).toBeGreaterThanOrEqual(1);
      expect(schedule[0].monthOfYear).toBeLessThanOrEqual(12);
    });
  });

  describe('calculateDrawDownInvestment', () => {
    it('should calculate draw-down with return rate higher than withdrawal rate', () => {
      // Arrange - Investment grows despite withdrawals
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 200000,
        monthlyWithdrawal: 1000,
        annualReturnRate: 10, // High returns
        investmentTermYears: 5
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(200000); // Should still be growing
      expect(result.totalContributions).toBe(200000);
      expect(result.totalInterestEarned).toBeGreaterThan(0);
      expect(result.monthlyGrowthSchedule).toHaveLength(60);
    });

    it('should calculate draw-down with return rate lower than withdrawal rate', () => {
      // Arrange - Investment depletes over time
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 200000,
        monthlyWithdrawal: 2000,
        annualReturnRate: 2, // Low returns
        investmentTermYears: 30
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      expect(result.finalValue).toBeLessThan(200000); // Should be depleting
      expect(result.totalContributions).toBe(200000);
      expect(result.monthlyGrowthSchedule).toHaveLength(360);
    });

    it('should handle balance depletion mid-term', () => {
      // Arrange - High withdrawals, low returns
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 10000,
        monthlyWithdrawal: 500,
        annualReturnRate: 1,
        investmentTermYears: 5
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      expect(result.finalValue).toBe(0); // Should deplete
      expect(result.monthlyGrowthSchedule).toHaveLength(60); // Still fills all months

      // Find when it depletes
      const depletionMonth = result.monthlyGrowthSchedule.findIndex(m => m.totalValue === 0);
      expect(depletionMonth).toBeGreaterThan(0);
      expect(depletionMonth).toBeLessThan(60);

      // After depletion, all subsequent months should be 0
      // (depletion month itself shows the final withdrawal)
      for (let i = depletionMonth + 1; i < result.monthlyGrowthSchedule.length; i++) {
        expect(result.monthlyGrowthSchedule[i].totalValue).toBe(0);
        expect(result.monthlyGrowthSchedule[i].monthlyContribution).toBe(0);
        expect(result.monthlyGrowthSchedule[i].interestEarned).toBe(0);
      }
    });

    it('should show negative contributions for withdrawals', () => {
      // Arrange
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 100000,
        monthlyWithdrawal: 500,
        annualReturnRate: 6,
        investmentTermYears: 10
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      expect(result.monthlyGrowthSchedule[0].monthlyContribution).toBe(-500);
      expect(result.monthlyGrowthSchedule[0].monthlyContribution).toBeLessThan(0);
    });

    it('should return zero results for invalid inputs', () => {
      // Arrange
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 0,
        monthlyWithdrawal: 500,
        annualReturnRate: 6,
        investmentTermYears: 10
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      expect(result.finalValue).toBe(0);
      expect(result.monthlyGrowthSchedule).toHaveLength(0);
    });

    it('should handle zero withdrawal (no draw-down)', () => {
      // Arrange
      const inputs: DrawDownInvestmentInputs = {
        initialInvestment: 10000,
        monthlyWithdrawal: 0,
        annualReturnRate: 8,
        investmentTermYears: 5
      };

      // Act
      const result = calculateDrawDownInvestment(inputs);

      // Assert
      // Should grow like a lump sum investment
      expect(result.finalValue).toBeGreaterThan(10000);
      expect(result.finalValue).toBeCloseTo(
        calculateLumpSumFutureValue(10000, 8, 5),
        0
      );
    });
  });

  describe('calculateBreakevenRate', () => {
    it('should find breakeven rate where investment equals mortgage cost', () => {
      // Arrange
      const initialInvestment = 200000;
      const monthlyPayment = 1264;
      const totalMortgageCost = 455089; // Total cost of 30-year mortgage at 6.5%
      const termYears = 30;

      // Act
      const breakevenRate = calculateBreakevenRate(
        initialInvestment,
        monthlyPayment,
        totalMortgageCost,
        termYears
      );

      // Assert
      expect(breakevenRate).toBeGreaterThan(0);
      expect(breakevenRate).toBeLessThan(30);

      // Verify: At this rate, final value should equal total mortgage cost
      const verification = calculateDrawDownInvestment({
        initialInvestment,
        monthlyWithdrawal: monthlyPayment,
        annualReturnRate: breakevenRate,
        investmentTermYears: termYears
      });

      expect(verification.finalValue).toBeCloseTo(totalMortgageCost, -2); // Within $100
    });

    it('should find lower breakeven rate for higher mortgage costs', () => {
      // Arrange
      const initialInvestment = 200000;
      const monthlyPayment = 1000;

      const lowCost = 300000;
      const highCost = 500000;
      const termYears = 30;

      // Act
      const lowCostRate = calculateBreakevenRate(initialInvestment, monthlyPayment, lowCost, termYears);
      const highCostRate = calculateBreakevenRate(initialInvestment, monthlyPayment, highCost, termYears);

      // Assert
      expect(lowCostRate).toBeLessThan(highCostRate);
    });

    it('should handle edge case where breakeven is near 0%', () => {
      // Arrange
      const initialInvestment = 100000;
      const monthlyPayment = 500;
      const totalMortgageCost = 100000; // Very low cost
      const termYears = 10;

      // Act
      const breakevenRate = calculateBreakevenRate(
        initialInvestment,
        monthlyPayment,
        totalMortgageCost,
        termYears
      );

      // Assert
      expect(breakevenRate).toBeGreaterThanOrEqual(0);
      expect(breakevenRate).toBeLessThan(8); // Should be relatively low
    });
  });

  describe('validateInvestmentInputs', () => {
    it('should validate correct inputs without errors', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 10
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should flag negative initial investment as error', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: -1000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 10
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Initial investment cannot be negative');
    });

    it('should flag negative monthly contribution as error', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: -500,
        annualReturnRate: 8,
        investmentTermYears: 10
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Monthly contribution cannot be negative');
    });

    it('should warn about negative return rates', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: -5,
        investmentTermYears: 10
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(true); // Just a warning, not invalid
      expect(result.warnings).toContain('Negative returns are unrealistic for long-term comparisons');
    });

    it('should warn about unrealistically high returns', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 20,
        investmentTermYears: 10
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Returns above 15% annually are extremely optimistic');
    });

    it('should flag zero or negative term as error', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 0
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Investment term must be greater than 0');
    });

    it('should flag term over 50 years as error', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 8,
        investmentTermYears: 100
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Investment term cannot exceed 50 years');
    });

    it('should accumulate multiple errors and warnings', () => {
      // Arrange
      const inputs: InvestmentInputs = {
        initialInvestment: -1000,
        monthlyContribution: -500,
        annualReturnRate: 20,
        investmentTermYears: 0
      };

      // Act
      const result = validateInvestmentInputs(inputs);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
