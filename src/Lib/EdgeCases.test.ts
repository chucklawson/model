import { describe, it, expect } from 'vitest';
import {
  calculateInvestmentGrowth,
  calculateDrawDownInvestment,
  validateInvestmentInputs
} from './InvestmentCalculation';
import {
  calculateMortgage,
  calculateMonthlyPayment,
  validateInputs as validateMortgageInputs
} from './MortgageCalculation';
import {
  generateAnnualProjections,
  calculateInterpolatedPE,
  calculateImpliedGrowth
} from './AnnualProjectionCalculator';

/**
 * Edge case tests verify behavior with extreme, unusual, or boundary inputs
 * to ensure robustness and prevent crashes
 */
describe('Edge Cases', () => {
  describe('Very Large Numbers', () => {
    it('should handle very large loan amounts without overflow', () => {
      // Arrange
      const inputs = {
        loanAmount: 9000000, // $9M loan (near 10M limit)
        downPayment: 20,
        interestRate: 7.0,
        loanTermYears: 30,
        propertyTax: 100000,
        homeInsurance: 10000,
        hoaFees: 1000,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.monthlyPrincipalAndInterest).toBeGreaterThan(0);
      expect(result.monthlyPrincipalAndInterest).toBeLessThan(Number.MAX_SAFE_INTEGER);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(isFinite(result.totalInterest)).toBe(true);
    });

    it('should handle very large investment amounts', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000000, // $10M
        monthlyContribution: 50000,
        annualReturnRate: 8,
        investmentTermYears: 30
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(inputs.initialInvestment);
      expect(isFinite(result.finalValue)).toBe(true);
      expect(result.finalValue).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it('should handle extreme P/E ratios', () => {
      // Arrange - some growth stocks have 100+ P/E
      const currentPrice = 1000;
      const currentEPS = 5;
      const currentPE = 200; // Extreme P/E
      const targetPE = 250;
      const years = 5;
      const growthRate = 0.30; // 30% growth

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        false,
        []
      );

      // Assert
      expect(projections).toHaveLength(5);
      expect(projections[4].stockPrice).toBeGreaterThan(0);
      expect(isFinite(projections[4].stockPrice)).toBe(true);
    });
  });

  describe('Very Small Numbers', () => {
    it('should handle very small loan amounts', () => {
      // Arrange
      const inputs = {
        loanAmount: 1000, // $1k loan
        downPayment: 20,
        interestRate: 5.0,
        loanTermYears: 5,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.monthlyPrincipalAndInterest).toBeGreaterThan(0);
      expect(result.monthlyPrincipalAndInterest).toBeCloseTo(18.87, 2);
    });

    it('should handle very small monthly contributions', () => {
      // Arrange
      const inputs = {
        initialInvestment: 0,
        monthlyContribution: 1, // $1 per month
        annualReturnRate: 7,
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(0);
      expect(result.finalValue).toBeCloseTo(174, 0); // Small but calculable
    });

    it('should handle very small EPS values', () => {
      // Arrange - penny stock
      const currentPrice = 0.50;
      const currentEPS = 0.02;
      const currentPE = 25;
      const targetPE = 30;
      const years = 3;
      const growthRate = 0.20;

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        false,
        []
      );

      // Assert
      expect(projections).toHaveLength(3);
      expect(projections[0].eps).toBeCloseTo(0.024, 3);
      expect(projections[0].stockPrice).toBeGreaterThan(0);
    });

    it('should handle near-zero interest rates', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 0.01, // 0.01% (near zero)
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.monthlyPrincipalAndInterest).toBeGreaterThan(0);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalInterest).toBeLessThan(inputs.loanAmount * 0.01); // Very little interest
    });
  });

  describe('Floating Point Precision', () => {
    it('should handle repeating decimals correctly', () => {
      // Arrange
      const inputs = {
        loanAmount: 333333.33,
        downPayment: 33.33,
        interestRate: 6.66,
        loanTermYears: 30,
        propertyTax: 3333.33,
        homeInsurance: 1111.11,
        hoaFees: 222.22,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(isFinite(result.monthlyPrincipalAndInterest)).toBe(true);
      expect(isFinite(result.totalInterest)).toBe(true);
      expect(isFinite(result.totalPaid)).toBe(true);
    });

    it('should handle investment calculations with repeating decimals', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000.33,
        monthlyContribution: 333.33,
        annualReturnRate: 7.77,
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(isFinite(result.finalValue)).toBe(true);
      expect(isFinite(result.totalInterestEarned)).toBe(true);
      expect(result.finalValue).toBeGreaterThan(0);
    });

    it('should maintain precision in P/E interpolation with many years', () => {
      // Arrange
      const currentPE = 15.15;
      const targetPE = 25.25;
      const totalYears = 100;

      // Act
      const results = [];
      for (let year = 0; year <= totalYears; year++) {
        results.push(calculateInterpolatedPE(currentPE, targetPE, year, totalYears));
      }

      // Assert
      expect(results[0]).toBeCloseTo(currentPE, 10);
      expect(results[totalYears]).toBeCloseTo(targetPE, 10);
      expect(results[50]).toBeCloseTo(20.2, 1); // Midpoint
    });
  });

  describe('Extreme Timeframes', () => {
    it('should handle very short loan terms', () => {
      // Arrange
      const inputs = {
        loanAmount: 100000,
        downPayment: 20,
        interestRate: 6.0,
        loanTermYears: 1, // 1 year loan
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.amortizationSchedule).toHaveLength(12);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalInterest).toBeLessThan(inputs.loanAmount * 0.1); // Less than 10% interest
    });

    it('should handle maximum 50-year loan term', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 5.0,
        loanTermYears: 50, // Maximum allowed
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.amortizationSchedule).toHaveLength(600); // 50 * 12
      expect(result.totalInterest).toBeGreaterThan(inputs.loanAmount); // Long term = lots of interest
    });

    it('should handle 1-year investment', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 7,
        investmentTermYears: 1
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.monthlyGrowthSchedule).toHaveLength(12);
      expect(result.finalValue).toBeGreaterThan(inputs.initialInvestment);
    });

    it('should handle very long projections (50 years)', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 18; // P/E compression
      const years = 50;
      const growthRate = 0.06;

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        false,
        []
      );

      // Assert
      expect(projections).toHaveLength(50);
      expect(projections[49].eps).toBeGreaterThan(currentEPS);
      expect(isFinite(projections[49].stockPrice)).toBe(true);
    });
  });

  describe('Extreme Rates', () => {
    it('should handle very high interest rates (20%)', () => {
      // Arrange
      const loanAmount = 100000;
      const annualRate = 20; // Maximum allowed
      const years = 30;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeGreaterThan(1000);
      expect(payment).toBeLessThan(2000);
      expect(isFinite(payment)).toBe(true);
    });

    it('should handle very low interest rates', () => {
      // Arrange
      const loanAmount = 100000;
      const annualRate = 0.1; // 0.1%
      const years = 30;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeGreaterThan(277); // Close to principal/months
      expect(payment).toBeLessThan(283);
    });

    it('should handle very high growth rates', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: 0,
        annualReturnRate: 50, // 50% annual return (extreme)
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(inputs.initialInvestment * 10);
      expect(isFinite(result.finalValue)).toBe(true);
    });

    it('should handle negative growth rates', () => {
      // Arrange
      const inputs = {
        initialInvestment: 100000,
        monthlyContribution: 0,
        annualReturnRate: -5, // Losing 5% per year
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeLessThan(inputs.initialInvestment);
      expect(result.finalValue).toBeGreaterThan(0);
      expect(result.totalInterestEarned).toBeLessThan(0); // Negative interest
    });
  });

  describe('Boundary Validation', () => {
    it('should accept loan amount at exactly $10M', () => {
      // Arrange
      const inputs = {
        loanAmount: 10000000, // Exactly at limit
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const validationError = validateMortgageInputs(inputs);

      // Assert
      expect(validationError).toBeNull();
    });

    it('should reject loan amount just over $10M', () => {
      // Arrange
      const inputs = {
        loanAmount: 10000001, // Just over limit
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const validationError = validateMortgageInputs(inputs);

      // Assert
      expect(validationError).toBe('Loan amount too high (max $10M)');
    });

    it('should accept interest rate at exactly 20%', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 20, // Exactly at limit
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const validationError = validateMortgageInputs(inputs);

      // Assert
      expect(validationError).toBeNull();
    });

    it('should accept investment term at exactly 50 years', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 7,
        investmentTermYears: 50
      };

      // Act
      const validation = validateInvestmentInputs(inputs);

      // Assert
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject investment term over 50 years', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: 500,
        annualReturnRate: 7,
        investmentTermYears: 51
      };

      // Act
      const validation = validateInvestmentInputs(inputs);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Investment term cannot exceed 50 years');
    });
  });

  describe('Zero Values', () => {
    it('should handle zero monthly payment calculation', () => {
      // Arrange - zero interest and zero term should return 0
      const loanAmount = 200000;
      const annualRate = 0;
      const years = 30;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeCloseTo(200000 / 360, 2); // Just principal divided by months
    });

    it('should handle zero initial investment', () => {
      // Arrange
      const inputs = {
        initialInvestment: 0,
        monthlyContribution: 500,
        annualReturnRate: 7,
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(0);
      expect(result.totalContributions).toBe(500 * 12 * 10);
    });

    it('should handle zero monthly contribution', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: 0,
        annualReturnRate: 7,
        investmentTermYears: 10
      };

      // Act
      const result = calculateInvestmentGrowth(inputs);

      // Assert
      expect(result.finalValue).toBeGreaterThan(inputs.initialInvestment);
      expect(result.totalContributions).toBe(inputs.initialInvestment);
    });

    it('should handle zero year projection', () => {
      // Arrange
      const currentPrice = 100;
      const currentEPS = 5;
      const currentPE = 20;
      const targetPE = 25;
      const years = 0;
      const growthRate = 0.10;

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        false,
        []
      );

      // Assert
      expect(projections).toHaveLength(0);
    });
  });

  describe('Negative Values', () => {
    it('should handle negative EPS (company losing money)', () => {
      // Arrange
      const currentPrice = 50;
      const currentEPS = -2; // Losing $2 per share
      const currentPE = -25; // Negative P/E
      const targetPE = 20; // Expecting turnaround
      const years = 5;
      const growthRate = 0.30; // High growth to profitability

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        years,
        growthRate,
        false,
        []
      );

      // Assert
      expect(projections).toHaveLength(5);
      // With positive growth on negative EPS, it becomes more negative
      // This is mathematically correct: -2 * 1.30^5 = -7.43
      expect(projections[4].eps).toBeLessThan(currentEPS); // More negative
      expect(isFinite(projections[4].stockPrice)).toBe(true);
    });

    it('should prevent negative loan amounts', () => {
      // Arrange
      const inputs = {
        loanAmount: -100000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const validationError = validateMortgageInputs(inputs);

      // Assert
      expect(validationError).toBe('Loan amount must be greater than 0');
    });

    it('should prevent negative investment contributions', () => {
      // Arrange
      const inputs = {
        initialInvestment: 10000,
        monthlyContribution: -500, // Can't have negative contribution
        annualReturnRate: 7,
        investmentTermYears: 10
      };

      // Act
      const validation = validateInvestmentInputs(inputs);

      // Assert
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Monthly contribution cannot be negative');
    });
  });
});
