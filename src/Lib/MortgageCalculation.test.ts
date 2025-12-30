import { describe, it, expect } from 'vitest';
import { calculateMonthlyPayment, generateAmortizationSchedule } from './MortgageCalculation';

describe('MortgageCalculation', () => {
  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment for a 30-year mortgage', () => {
      // Arrange
      const loanAmount = 200000;
      const annualRate = 6.5;
      const years = 30;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeCloseTo(1264.14, 2); // Expected payment rounded to 2 decimals
    });

    it('should calculate correct monthly payment for a 15-year mortgage', () => {
      // Arrange
      const loanAmount = 200000;
      const annualRate = 6.5;
      const years = 15;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeCloseTo(1742.21, 2);
    });

    it('should return principal amount when interest rate is 0', () => {
      // Arrange
      const loanAmount = 200000;
      const annualRate = 0;
      const years = 30;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      const expectedPayment = loanAmount / (years * 12);
      expect(payment).toBeCloseTo(expectedPayment, 2);
    });

    it('should handle small loan amounts correctly', () => {
      // Arrange
      const loanAmount = 10000;
      const annualRate = 5.0;
      const years = 5;

      // Act
      const payment = calculateMonthlyPayment(loanAmount, annualRate, years);

      // Assert
      expect(payment).toBeGreaterThan(0);
      expect(payment).toBeLessThan(loanAmount); // Monthly payment should be less than total
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct number of payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20, // 20% down
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };

      // Act
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      expect(schedule).toHaveLength(360); // 30 years * 12 months
    });

    it('should have decreasing balance over time', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20, // 20% down
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };

      // Act
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      expect(schedule[0].remainingBalance).toBeGreaterThan(schedule[180].remainingBalance);
      expect(schedule[180].remainingBalance).toBeGreaterThan(schedule[359].remainingBalance);
      expect(schedule[359].remainingBalance).toBeCloseTo(0, 0); // Last payment should pay off loan
    });

    it('should have increasing principal and decreasing interest over time', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20, // 20% down
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };

      // Act
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      // Early payment: more interest than principal
      expect(schedule[0].interestPaid).toBeGreaterThan(schedule[0].principalPaid);

      // Late payment: more principal than interest
      expect(schedule[359].principalPaid).toBeGreaterThan(schedule[359].interestPaid);
    });

    it('should calculate cumulative totals correctly', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20, // 20% down
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };

      // Act
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      const lastPayment = schedule[359];
      expect(lastPayment.cumulativePrincipal).toBeCloseTo(200000, 0);
      expect(lastPayment.cumulativeTotal).toBeCloseTo(
        lastPayment.cumulativePrincipal + lastPayment.cumulativeInterest,
        2
      );
    });

    it('should include PMI when LTV > 80%', () => {
      // Arrange
      const inputs = {
        loanAmount: 190000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 5, // 5% down = 95% LTV (requires PMI)
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0.85, // 0.85% annual PMI rate
        hoaFees: 0,
      };

      // Act
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      expect(schedule[0].isPMIActive).toBe(true);
      expect(schedule[0].pmiPaid).toBeGreaterThan(0);
    });
  });
});
