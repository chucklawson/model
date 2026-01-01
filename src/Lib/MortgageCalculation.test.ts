import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyPayment,
  calculatePMI,
  calculateDownPaymentAmount,
  calculateLTV,
  calculateMortgage,
  validateInputs,
  generateAmortizationSchedule
} from './MortgageCalculation';

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

    // Edge case tests for calculateMonthlyPayment
    it('should return 0 when principal is 0', () => {
      const payment = calculateMonthlyPayment(0, 6.5, 30);
      expect(payment).toBe(0);
    });

    it('should return 0 when principal is negative', () => {
      const payment = calculateMonthlyPayment(-100000, 6.5, 30);
      expect(payment).toBe(0);
    });

    it('should return 0 when loan term is 0', () => {
      const payment = calculateMonthlyPayment(200000, 6.5, 0);
      expect(payment).toBe(0);
    });

    it('should return 0 when loan term is negative', () => {
      const payment = calculateMonthlyPayment(200000, 6.5, -5);
      expect(payment).toBe(0);
    });
  });

  describe('calculatePMI', () => {
    // Happy path tests
    it('should calculate PMI correctly when down payment is less than 20%', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 10; // 10% down = 90% LTV
      const pmiRate = 0.85; // 0.85% annual

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.monthlyPMI).toBeCloseTo(141.67, 2); // (200000 * 0.0085) / 12
    });

    it('should return zero PMI when down payment is 20% or more', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 20; // 20% down = 80% LTV
      const pmiRate = 0.85;

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(false);
      expect(result.monthlyPMI).toBe(0);
    });

    it('should calculate PMI for minimal down payment (5%)', () => {
      // Arrange
      const loanAmount = 300000;
      const downPaymentPercent = 5; // 95% LTV
      const pmiRate = 0.85;

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.monthlyPMI).toBeCloseTo(212.5, 2); // (300000 * 0.0085) / 12
    });

    it('should calculate PMI for 15% down payment', () => {
      // Arrange
      const loanAmount = 250000;
      const downPaymentPercent = 15; // 85% LTV
      const pmiRate = 1.0; // 1% annual

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.monthlyPMI).toBeCloseTo(208.33, 2); // (250000 * 0.01) / 12
    });

    // Edge cases
    it('should not require PMI when down payment is exactly 20%', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 20;
      const pmiRate = 0.85;

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(false);
      expect(result.monthlyPMI).toBe(0);
    });

    it('should not require PMI when down payment is greater than 20%', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 25; // 75% LTV
      const pmiRate = 0.85;

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(false);
      expect(result.monthlyPMI).toBe(0);
    });

    it('should handle different PMI rates', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 10;
      const pmiRate1 = 0.5; // Lower rate
      const pmiRate2 = 1.5; // Higher rate

      // Act
      const result1 = calculatePMI(loanAmount, downPaymentPercent, pmiRate1);
      const result2 = calculatePMI(loanAmount, downPaymentPercent, pmiRate2);

      // Assert
      expect(result1.monthlyPMI).toBeLessThan(result2.monthlyPMI);
      expect(result1.monthlyPMI).toBeCloseTo(83.33, 2);
      expect(result2.monthlyPMI).toBeCloseTo(250, 2);
    });

    it('should calculate PMI for large loan amounts', () => {
      // Arrange
      const loanAmount = 1000000;
      const downPaymentPercent = 10;
      const pmiRate = 0.85;

      // Act
      const result = calculatePMI(loanAmount, downPaymentPercent, pmiRate);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.monthlyPMI).toBeCloseTo(708.33, 2);
    });
  });

  describe('calculateDownPaymentAmount', () => {
    // Happy path tests
    it('should calculate down payment and home price for 20% down', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 20;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(250000, 2); // 200000 / 0.8
      expect(result.downPaymentAmount).toBeCloseTo(50000, 2); // 250000 * 0.2
    });

    it('should calculate down payment and home price for 10% down', () => {
      // Arrange
      const loanAmount = 180000;
      const downPaymentPercent = 10;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(200000, 2); // 180000 / 0.9
      expect(result.downPaymentAmount).toBeCloseTo(20000, 2); // 200000 * 0.1
    });

    it('should calculate for minimal down payment (3.5%)', () => {
      // Arrange
      const loanAmount = 289500;
      const downPaymentPercent = 3.5; // FHA minimum

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(300000, 0);
      expect(result.downPaymentAmount).toBeCloseTo(10500, 0);
    });

    it('should calculate for 25% down payment', () => {
      // Arrange
      const loanAmount = 300000;
      const downPaymentPercent = 25;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(400000, 2);
      expect(result.downPaymentAmount).toBeCloseTo(100000, 2);
    });

    // Edge cases
    it('should handle 0% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 0;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(200000, 2);
      expect(result.downPaymentAmount).toBeCloseTo(0, 2);
    });

    it('should handle large down payment (50%)', () => {
      // Arrange
      const loanAmount = 250000;
      const downPaymentPercent = 50;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      expect(result.homePrice).toBeCloseTo(500000, 2);
      expect(result.downPaymentAmount).toBeCloseTo(250000, 2);
    });

    it('should verify math: loanAmount + downPayment = homePrice', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 20;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      const total = loanAmount + result.downPaymentAmount;
      expect(total).toBeCloseTo(result.homePrice, 2);
    });

    it('should handle decimal percentages', () => {
      // Arrange
      const loanAmount = 195000;
      const downPaymentPercent = 12.5;

      // Act
      const result = calculateDownPaymentAmount(loanAmount, downPaymentPercent);

      // Assert
      const expectedHomePrice = loanAmount / (1 - 0.125);
      expect(result.homePrice).toBeCloseTo(expectedHomePrice, 2);
      expect(result.downPaymentAmount).toBeCloseTo(expectedHomePrice * 0.125, 2);
    });
  });

  describe('calculateLTV', () => {
    // Happy path tests
    it('should calculate LTV for 20% down payment', () => {
      // Arrange
      const loanAmount = 200000; // Not actually used in the function
      const downPaymentPercent = 20;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(80); // 100 - 20 = 80% LTV
    });

    it('should calculate LTV for 10% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 10;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(90);
    });

    it('should calculate LTV for 5% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 5;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(95);
    });

    it('should calculate LTV for 25% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 25;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(75);
    });

    // Edge cases
    it('should calculate LTV for 0% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 0;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(100);
    });

    it('should calculate LTV for 50% down payment', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 50;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(50);
    });

    it('should handle decimal down payment percentages', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 12.5;

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(87.5);
    });

    it('should verify 80% LTV threshold for PMI', () => {
      // Arrange
      const loanAmount = 200000;
      const downPaymentPercent = 20; // PMI threshold

      // Act
      const result = calculateLTV(loanAmount, downPaymentPercent);

      // Assert
      expect(result).toBe(80); // Exactly at PMI removal threshold
    });
  });

  describe('calculateMortgage', () => {
    // Happy path tests
    it('should calculate complete mortgage results', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600, // $3600 annual
        homeInsurance: 1200, // $1200 annual
        hoaFees: 100, // $100 monthly
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.monthlyPrincipalAndInterest).toBeCloseTo(1264.14, 2);
      expect(result.monthlyPropertyTax).toBeCloseTo(300, 2); // 3600 / 12
      expect(result.monthlyInsurance).toBeCloseTo(100, 2); // 1200 / 12
      expect(result.monthlyPMI).toBe(0); // 20% down, no PMI
      expect(result.monthlyHOA).toBe(100);
      expect(result.totalMonthlyPayment).toBeCloseTo(1764.14, 2);
      expect(result.requiresPMI).toBe(false);
      expect(result.ltvRatio).toBe(80);
      expect(result.downPaymentAmount).toBeCloseTo(50000, 2);
    });

    it('should calculate mortgage with PMI when down payment < 20%', () => {
      // Arrange
      const inputs = {
        loanAmount: 190000,
        downPayment: 5, // 5% down = 95% LTV
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.monthlyPMI).toBeGreaterThan(0);
      expect(result.ltvRatio).toBe(95);
      expect(result.totalMonthlyPayment).toBeGreaterThan(result.monthlyPrincipalAndInterest);
    });

    it('should generate amortization schedule', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.amortizationSchedule).toHaveLength(360); // 30 years * 12 months
      expect(result.payoffMonth).toBe(360);
    });

    it('should calculate total interest paid correctly', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.totalPaid).toBeCloseTo(inputs.loanAmount + result.totalInterest, 2);
    });

    it('should handle 15-year mortgage', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 5.5,
        loanTermYears: 15,
        propertyTax: 4200,
        homeInsurance: 1500,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.amortizationSchedule).toHaveLength(180); // 15 years * 12 months
      expect(result.payoffMonth).toBe(180);
      expect(result.monthlyPropertyTax).toBeCloseTo(350, 2);
      expect(result.monthlyInsurance).toBeCloseTo(125, 2);
    });

    // Edge cases
    it('should handle mortgage with no property tax or insurance', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.monthlyPropertyTax).toBe(0);
      expect(result.monthlyInsurance).toBe(0);
      expect(result.totalMonthlyPayment).toBeCloseTo(result.monthlyPrincipalAndInterest, 2);
    });

    it('should calculate for FHA loan (3.5% down)', () => {
      // Arrange
      const inputs = {
        loanAmount: 289500,
        downPayment: 3.5,
        interestRate: 6.0,
        loanTermYears: 30,
        propertyTax: 4000,
        homeInsurance: 1400,
        hoaFees: 150,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.requiresPMI).toBe(true);
      expect(result.ltvRatio).toBe(96.5);
      expect(result.monthlyPMI).toBeGreaterThan(0);
    });

    it('should calculate for jumbo loan', () => {
      // Arrange
      const inputs = {
        loanAmount: 800000,
        downPayment: 25,
        interestRate: 7.0,
        loanTermYears: 30,
        propertyTax: 12000,
        homeInsurance: 3000,
        hoaFees: 300,
        pmiRate: 0.85
      };

      // Act
      const result = calculateMortgage(inputs);

      // Assert
      expect(result.requiresPMI).toBe(false); // 25% down, no PMI
      expect(result.ltvRatio).toBe(75);
      expect(result.downPaymentAmount).toBeCloseTo(266666.67, 0);
    });
  });

  describe('generateAmortizationSchedule with extra payments', () => {
    // One-time extra payment tests
    it('should apply one-time extra payment correctly', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'one-time' as const,
        amount: 10000,
        startMonth: 12 // One year in
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule[11].extraPrincipalPaid).toBe(10000); // Month 12 (0-indexed = 11)
      expect(schedule[10].extraPrincipalPaid).toBe(0); // Month before
      expect(schedule[12].extraPrincipalPaid).toBe(0); // Month after

      // Balance should be lower after extra payment
      expect(schedule[11].remainingBalance).toBeLessThan(schedule[10].remainingBalance - schedule[11].principalPaid);
    });

    it('should reduce total payments with one-time extra payment', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'one-time' as const,
        amount: 20000,
        startMonth: 1
      }];

      // Act
      const scheduleWithExtra = generateAmortizationSchedule(inputs, extraPayments);
      const scheduleWithout = generateAmortizationSchedule(inputs, []);

      // Assert
      expect(scheduleWithExtra.length).toBeLessThan(scheduleWithout.length);

      const totalInterestWithExtra = scheduleWithExtra.reduce((sum, p) => sum + p.interestPaid, 0);
      const totalInterestWithout = scheduleWithout.reduce((sum, p) => sum + p.interestPaid, 0);
      expect(totalInterestWithExtra).toBeLessThan(totalInterestWithout);
    });

    it('should handle multiple one-time extra payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [
        { id: '1', type: 'one-time' as const, amount: 5000, startMonth: 12 },
        { id: '2', type: 'one-time' as const, amount: 5000, startMonth: 24 },
        { id: '3', type: 'one-time' as const, amount: 5000, startMonth: 36 }
      ];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule[11].extraPrincipalPaid).toBe(5000); // Month 12
      expect(schedule[23].extraPrincipalPaid).toBe(5000); // Month 24
      expect(schedule[35].extraPrincipalPaid).toBe(5000); // Month 36
    });

    // Recurring monthly extra payment tests
    it('should apply recurring monthly extra payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 200,
        startMonth: 1
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      // Every month should have $200 extra payment
      expect(schedule[0].extraPrincipalPaid).toBe(200);
      expect(schedule[50].extraPrincipalPaid).toBe(200);
      expect(schedule[100].extraPrincipalPaid).toBe(200);
    });

    it('should apply recurring monthly payments with start and end dates', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 200,
        startMonth: 13, // Start in year 2
        endMonth: 24    // End after year 2
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule[11].extraPrincipalPaid).toBe(0); // Month 12 - before start
      expect(schedule[12].extraPrincipalPaid).toBe(200); // Month 13 - at start
      expect(schedule[23].extraPrincipalPaid).toBe(200); // Month 24 - at end
      expect(schedule[24].extraPrincipalPaid).toBe(0); // Month 25 - after end
    });

    it('should significantly reduce loan term with recurring monthly payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 300,
        startMonth: 1
      }];

      // Act
      const scheduleWithExtra = generateAmortizationSchedule(inputs, extraPayments);
      const scheduleWithout = generateAmortizationSchedule(inputs, []);

      // Assert
      expect(scheduleWithExtra.length).toBeLessThan(scheduleWithout.length * 0.8); // At least 20% reduction
    });

    // Recurring yearly extra payment tests
    it('should apply recurring yearly extra payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-yearly' as const,
        amount: 5000,
        startMonth: 12 // Start at end of year 1
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule[11].extraPrincipalPaid).toBe(5000); // Month 12 (end of year 1)
      expect(schedule[23].extraPrincipalPaid).toBe(5000); // Month 24 (end of year 2)
      expect(schedule[35].extraPrincipalPaid).toBe(5000); // Month 36 (end of year 3)

      // Non-anniversary months should have no extra payment
      expect(schedule[12].extraPrincipalPaid).toBe(0);
      expect(schedule[13].extraPrincipalPaid).toBe(0);
    });

    it('should apply recurring yearly payments with end date', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-yearly' as const,
        amount: 5000,
        startMonth: 12,
        endMonth: 36 // Only 3 years
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule[11].extraPrincipalPaid).toBe(5000); // Year 1
      expect(schedule[23].extraPrincipalPaid).toBe(5000); // Year 2
      expect(schedule[35].extraPrincipalPaid).toBe(5000); // Year 3
      expect(schedule[47].extraPrincipalPaid).toBe(0);    // Year 4 - after end
    });

    // Early payoff scenarios
    it('should handle payoff before loan term with large extra payment', () => {
      // Arrange
      const inputs = {
        loanAmount: 100000,
        interestRate: 5.0,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'one-time' as const,
        amount: 80000,
        startMonth: 60 // Pay off most of it after 5 years
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule.length).toBeLessThan(360); // Should pay off early
      expect(schedule[schedule.length - 1].remainingBalance).toBeCloseTo(0, 0);
    });

    it('should stop extra payments when loan is paid off', () => {
      // Arrange
      const inputs = {
        loanAmount: 50000,
        interestRate: 5.0,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 1000, // Very large payment
        startMonth: 1
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule.length).toBeLessThan(100); // Should pay off quickly

      // Last payment should not exceed remaining balance
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.remainingBalance).toBeCloseTo(0, 2);
    });

    it('should limit extra payment to remaining balance', () => {
      // Arrange
      const inputs = {
        loanAmount: 100000,
        interestRate: 5.0,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'one-time' as const,
        amount: 200000, // More than the loan
        startMonth: 1
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      expect(schedule).toHaveLength(1); // Should pay off in first month
      expect(schedule[0].extraPrincipalPaid).toBeLessThan(200000); // Capped at remaining balance
      expect(schedule[0].remainingBalance).toBeCloseTo(0, 2);
    });

    // Combined extra payment strategies
    it('should handle combination of different extra payment types', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [
        { id: '1', type: 'recurring-monthly' as const, amount: 100, startMonth: 1 },
        { id: '2', type: 'recurring-yearly' as const, amount: 2000, startMonth: 12 },
        { id: '3', type: 'one-time' as const, amount: 5000, startMonth: 6 }
      ];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      // Month 6 should have monthly + one-time
      expect(schedule[5].extraPrincipalPaid).toBe(5100); // 100 + 5000

      // Month 12 should have monthly + yearly
      expect(schedule[11].extraPrincipalPaid).toBe(2100); // 100 + 2000

      // Regular month should have only monthly
      expect(schedule[1].extraPrincipalPaid).toBe(100);
    });

    it('should calculate cumulative totals correctly with extra payments', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        interestRate: 6.5,
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 200,
        startMonth: 1
      }];

      // Act
      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Assert
      const lastPayment = schedule[schedule.length - 1];

      // Cumulative principal should include extra payments
      expect(lastPayment.cumulativePrincipal).toBeCloseTo(200000, 0);

      // Cumulative total should include regular + extra payments
      expect(lastPayment.cumulativeTotal).toBeGreaterThan(lastPayment.cumulativePrincipal);
    });

    it('should handle remaining balance defensive code (never goes negative)', () => {
      // This test ensures the defensive code at line 185 works correctly
      // Even with edge cases, remaining balance should never be negative
      const inputs = {
        loanAmount: 100000,
        interestRate: 0.01, // Very low rate to minimize interest
        loanTermYears: 30,
        downPayment: 20,
        propertyTax: 0,
        homeInsurance: 0,
        pmiRate: 0,
        hoaFees: 0,
      };
      const extraPayments = [{
        id: '1',
        type: 'recurring-monthly' as const,
        amount: 500, // Large extra payment relative to principal
        startMonth: 1
      }];

      const schedule = generateAmortizationSchedule(inputs, extraPayments);

      // Verify no payment has negative remaining balance
      schedule.forEach((payment) => {
        expect(payment.remainingBalance).toBeGreaterThanOrEqual(0);
      });

      // Last payment should have 0 balance
      expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
    });
  });

  describe('validateInputs', () => {
    // Happy path tests
    it('should validate correct inputs', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull(); // Valid inputs return null
    });

    // Error cases - loan amount
    it('should reject loan amount of 0', () => {
      // Arrange
      const inputs = {
        loanAmount: 0,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Loan amount must be greater than 0');
    });

    it('should reject negative loan amount', () => {
      // Arrange
      const inputs = {
        loanAmount: -100000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Loan amount must be greater than 0');
    });

    it('should reject loan amount over $10M', () => {
      // Arrange
      const inputs = {
        loanAmount: 10000001,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Loan amount too high (max $10M)');
    });

    // Error cases - down payment
    it('should reject negative down payment', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: -5,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Down payment must be between 0% and 99%');
    });

    it('should reject down payment of 100%', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 100,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Down payment must be between 0% and 99%');
    });

    // Error cases - interest rate
    it('should reject interest rate of 0', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 0,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Interest rate must be between 0% and 20%');
    });

    it('should reject interest rate over 20%', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 21,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Interest rate must be between 0% and 20%');
    });

    it('should reject negative interest rate', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: -1,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Interest rate must be between 0% and 20%');
    });

    // Error cases - loan term
    it('should reject loan term of 0 years', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 0,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Loan term must be between 1 and 50 years');
    });

    it('should reject loan term over 50 years', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 51,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Loan term must be between 1 and 50 years');
    });

    // Error cases - property tax
    it('should reject negative property tax', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: -1000,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Property tax cannot be negative');
    });

    // Error cases - home insurance
    it('should reject negative home insurance', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: -500,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('Home insurance cannot be negative');
    });

    // Error cases - HOA fees
    it('should reject negative HOA fees', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: -50,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBe('HOA fees cannot be negative');
    });

    // Edge cases - valid boundary values
    it('should accept loan amount at max ($10M)', () => {
      // Arrange
      const inputs = {
        loanAmount: 10000000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull();
    });

    it('should accept 0% down payment', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 0,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull();
    });

    it('should accept interest rate at max (20%)', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 20,
        loanTermYears: 30,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull();
    });

    it('should accept loan term at max (50 years)', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 50,
        propertyTax: 3600,
        homeInsurance: 1200,
        hoaFees: 100,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull();
    });

    it('should accept zero values for optional fields', () => {
      // Arrange
      const inputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Act
      const result = validateInputs(inputs);

      // Assert
      expect(result).toBeNull();
    });
  });
});
