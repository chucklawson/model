import { describe, it, expect } from 'vitest';
import {
  calculateInvestmentGrowth,
  calculateDrawDownInvestment,
  calculateBreakevenRate
} from './InvestmentCalculation';
import {
  calculateMortgage,
  generateAmortizationSchedule
} from './MortgageCalculation';
import {
  generateAnnualProjections,
  calculateImpliedGrowth
} from './AnnualProjectionCalculator';
import type AnalystEstimate_V3 from './AnalystEstimate_V3';

/**
 * Integration tests verify that multiple modules work together correctly
 * to solve real-world scenarios
 */
describe('Integration Tests', () => {
  describe('Mortgage vs Investment Comparison', () => {
    it('should compare paying off mortgage vs investing the difference', () => {
      // Scenario: Should I pay off my mortgage early or invest the extra money?

      // Arrange - 30-year mortgage
      const mortgageInputs = {
        loanAmount: 300000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      // Calculate standard 30-year mortgage
      const mortgage30 = calculateMortgage(mortgageInputs);

      // Calculate 15-year mortgage (accelerated payoff)
      const mortgage15 = calculateMortgage({
        ...mortgageInputs,
        loanTermYears: 15
      });

      // Investment scenario: invest the difference
      const monthlyDifference = mortgage15.monthlyPrincipalAndInterest - mortgage30.monthlyPrincipalAndInterest;
      const investmentResult = calculateInvestmentGrowth({
        initialInvestment: 0,
        monthlyContribution: monthlyDifference,
        annualReturnRate: 7, // 7% average stock market return
        investmentTermYears: 30
      });

      // Act & Assert
      // The person with 15-year mortgage pays less total interest
      expect(mortgage15.totalInterest).toBeLessThan(mortgage30.totalInterest);

      // But the person investing the difference could have a portfolio value
      expect(investmentResult.finalValue).toBeGreaterThan(0);

      // Verify the trade-off is calculable
      const interestSaved = mortgage30.totalInterest - mortgage15.totalInterest;
      expect(interestSaved).toBeGreaterThan(0);
    });

    it('should calculate breakeven rate for lump sum mortgage payoff vs investing', () => {
      // Scenario: I have $50,000. Should I pay down mortgage or invest it?

      // Arrange
      const lumpSum = 50000;
      const mortgageInputs = {
        loanAmount: 300000,
        downPayment: 20,
        interestRate: 6.0,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      const baseResult = calculateMortgage(mortgageInputs);
      const monthlyPayment = baseResult.monthlyPrincipalAndInterest;

      // Calculate what happens if we pay down the mortgage
      const scheduleWithPaydown = generateAmortizationSchedule(mortgageInputs, [{
        id: '1',
        type: 'one-time',
        amount: lumpSum,
        startMonth: 1
      }]);

      const scheduleWithout = generateAmortizationSchedule(mortgageInputs, []);

      // Calculate breakeven investment rate
      const totalMortgageCost = baseResult.totalPaid;
      const breakevenRate = calculateBreakevenRate(
        lumpSum,
        monthlyPayment,
        totalMortgageCost,
        mortgageInputs.loanTermYears
      );

      // Act & Assert
      // Paying down mortgage saves interest
      const totalInterestWithPaydown = scheduleWithPaydown.reduce((sum, p) => sum + p.interestPaid, 0);
      const totalInterestWithout = scheduleWithout.reduce((sum, p) => sum + p.interestPaid, 0);
      expect(totalInterestWithPaydown).toBeLessThan(totalInterestWithout);

      // Breakeven rate should be reasonable (between 0 and 30%)
      expect(breakevenRate).toBeGreaterThan(0);
      expect(breakevenRate).toBeLessThanOrEqual(30);
    });
  });

  describe('Stock Projection with Analyst Estimates', () => {
    it('should generate projections using analyst EPS estimates with P/E expansion', () => {
      // Scenario: Stock trading at 20x P/E, analysts expect EPS growth, P/E could expand to 25x

      // Arrange
      const currentPrice = 100;
      const currentEPS = 5; // $5 EPS
      const currentPE = 20; // 20x P/E
      const targetPE = 25; // Expecting P/E expansion

      const analystEstimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 5.5, epsHigh: 5.7, epsLow: 5.3, numberAnalysts: 15 },
        { date: '2026-12-31', epsAvg: 6.2, epsHigh: 6.5, epsLow: 6.0, numberAnalysts: 15 },
        { date: '2027-12-31', epsAvg: 7.0, epsHigh: 7.3, epsLow: 6.8, numberAnalysts: 12 },
        { date: '2028-12-31', epsAvg: 7.9, epsHigh: 8.2, epsLow: 7.6, numberAnalysts: 10 },
        { date: '2029-12-31', epsAvg: 8.9, epsHigh: 9.3, epsLow: 8.6, numberAnalysts: 8 }
      ];

      // Calculate implied growth rate
      const impliedGrowth = calculateImpliedGrowth(currentEPS, analystEstimates);

      // Generate projections
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        5,
        0.12, // Fallback growth rate (won't be used)
        true, // Use analyst estimates
        analystEstimates
      );

      // Act & Assert
      // Should have 5 years of projections
      expect(projections).toHaveLength(5);

      // Should use analyst EPS estimates
      expect(projections[0].eps).toBe(5.5);
      expect(projections[4].eps).toBe(8.9);

      // Implied growth should be reasonable (10-15% range)
      expect(impliedGrowth).toBeGreaterThan(10);
      expect(impliedGrowth).toBeLessThan(20);

      // P/E should expand from 20 to 25
      expect(projections[0].peRatio).toBeGreaterThan(currentPE);
      expect(projections[4].peRatio).toBe(targetPE);

      // Stock price should benefit from both EPS growth and P/E expansion
      expect(projections[4].stockPrice).toBeGreaterThan(currentPrice * 1.5);
    });

    it('should fallback to manual growth when analyst estimates run out', () => {
      // Scenario: Analyst estimates only cover 2 years, but projecting 5 years

      // Arrange
      const currentPrice = 50;
      const currentEPS = 3;
      const currentPE = 16.67;
      const targetPE = 18;

      const analystEstimates: AnalystEstimate_V3[] = [
        { date: '2025-12-31', epsAvg: 3.3, epsHigh: 3.4, epsLow: 3.2, numberAnalysts: 10 },
        { date: '2026-12-31', epsAvg: 3.6, epsHigh: 3.8, epsLow: 3.5, numberAnalysts: 8 }
        // Only 2 years of estimates
      ];

      const manualGrowthRate = 0.08; // 8% fallback

      // Act
      const projections = generateAnnualProjections(
        currentPrice,
        currentEPS,
        currentPE,
        targetPE,
        5,
        manualGrowthRate,
        true,
        analystEstimates
      );

      // Assert
      expect(projections).toHaveLength(5);

      // Years 1-2 should use analyst estimates
      expect(projections[0].eps).toBe(3.3);
      expect(projections[1].eps).toBe(3.6);

      // Years 3-5 should use manual growth from currentEPS
      // Year 3 = currentEPS * 1.08^3
      expect(projections[2].eps).toBeCloseTo(3 * Math.pow(1.08, 3), 2);
      expect(projections[4].eps).toBeCloseTo(3 * Math.pow(1.08, 5), 2);
    });
  });

  describe('Retirement Drawdown Planning', () => {
    it('should model retirement portfolio drawdown to cover mortgage payments', () => {
      // Scenario: Retiree has $500k portfolio, $1,500/month mortgage for 15 years
      // Will portfolio last through mortgage payoff?

      // Arrange
      const portfolioValue = 500000;
      const monthlyMortgage = 1500;
      const mortgageYears = 15;
      const portfolioReturn = 3; // 3% annual return (conservative, withdrawals will deplete it)

      // Calculate mortgage details
      const mortgageInputs = {
        loanAmount: 200000,
        downPayment: 20,
        interestRate: 4.0,
        loanTermYears: 15,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      const mortgageResult = calculateMortgage(mortgageInputs);

      // Model portfolio drawdown
      const drawdownResult = calculateDrawDownInvestment({
        initialInvestment: portfolioValue,
        monthlyWithdrawal: mortgageResult.monthlyPrincipalAndInterest,
        annualReturnRate: portfolioReturn,
        investmentTermYears: mortgageYears
      });

      // Act & Assert
      // Portfolio should still have money left after 15 years
      expect(drawdownResult.finalValue).toBeGreaterThan(0);

      // Total interest earned should offset some of the withdrawals
      expect(drawdownResult.totalInterestEarned).toBeGreaterThan(0);

      // Verify drawdown schedule
      expect(drawdownResult.monthlyGrowthSchedule).toHaveLength(mortgageYears * 12);

      // Portfolio value should decrease over time
      const firstMonth = drawdownResult.monthlyGrowthSchedule[0];
      const lastMonth = drawdownResult.monthlyGrowthSchedule[drawdownResult.monthlyGrowthSchedule.length - 1];
      expect(lastMonth.totalValue).toBeLessThan(firstMonth.totalValue);
    });

    it('should identify when portfolio runs out during drawdown', () => {
      // Scenario: Portfolio too small for planned withdrawals

      // Arrange
      const portfolioValue = 100000; // Too small
      const monthlyWithdrawal = 2000; // Too high
      const years = 10;
      const returnRate = 4;

      // Act
      const result = calculateDrawDownInvestment({
        initialInvestment: portfolioValue,
        monthlyWithdrawal: monthlyWithdrawal,
        annualReturnRate: returnRate,
        investmentTermYears: years
      });

      // Assert
      // Portfolio should run out before 10 years
      expect(result.finalValue).toBe(0);

      // Should have 120 months of data (filled with zeros after depletion)
      expect(result.monthlyGrowthSchedule).toHaveLength(years * 12);

      // Find when it ran out
      const depletionMonth = result.monthlyGrowthSchedule.findIndex(m => m.totalValue === 0);
      expect(depletionMonth).toBeGreaterThan(-1);
      expect(depletionMonth).toBeLessThan(years * 12);
    });
  });

  describe('Complex Extra Payment Strategies', () => {
    it('should model biweekly payment strategy using recurring monthly payments', () => {
      // Scenario: Pay half mortgage every 2 weeks = 13 full payments per year

      // Arrange
      const mortgageInputs = {
        loanAmount: 250000,
        downPayment: 20,
        interestRate: 6.0,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      const baseResult = calculateMortgage(mortgageInputs);
      const monthlyPayment = baseResult.monthlyPrincipalAndInterest;

      // Biweekly = one extra full payment per year
      const extraMonthlyAmount = monthlyPayment / 12;

      const biweeklySchedule = generateAmortizationSchedule(mortgageInputs, [{
        id: '1',
        type: 'recurring-monthly',
        amount: extraMonthlyAmount,
        startMonth: 1
      }]);

      const standardSchedule = generateAmortizationSchedule(mortgageInputs, []);

      // Act & Assert
      // Biweekly should pay off faster
      expect(biweeklySchedule.length).toBeLessThan(standardSchedule.length);

      // Should save significant interest
      const biweeklyInterest = biweeklySchedule.reduce((sum, p) => sum + p.interestPaid, 0);
      const standardInterest = standardSchedule.reduce((sum, p) => sum + p.interestPaid, 0);
      expect(biweeklyInterest).toBeLessThan(standardInterest * 0.85); // At least 15% savings
    });

    it('should model tax refund extra payment strategy', () => {
      // Scenario: Put annual tax refund toward mortgage principal

      // Arrange
      const mortgageInputs = {
        loanAmount: 300000,
        downPayment: 20,
        interestRate: 6.5,
        loanTermYears: 30,
        propertyTax: 0,
        homeInsurance: 0,
        hoaFees: 0,
        pmiRate: 0.85
      };

      const annualTaxRefund = 3000;

      const withRefund = generateAmortizationSchedule(mortgageInputs, [{
        id: '1',
        type: 'recurring-yearly',
        amount: annualTaxRefund,
        startMonth: 4 // April
      }]);

      const without = generateAmortizationSchedule(mortgageInputs, []);

      // Act & Assert
      // Should reduce loan term by several years
      const yearsSaved = (without.length - withRefund.length) / 12;
      expect(yearsSaved).toBeGreaterThan(3);

      // Verify refund is applied each April
      expect(withRefund[3].extraPrincipalPaid).toBe(annualTaxRefund); // Month 4
      expect(withRefund[15].extraPrincipalPaid).toBe(annualTaxRefund); // Month 16 (next April)
    });
  });

  describe('Investment Growth with Changing Contributions', () => {
    it('should model salary increases affecting investment contributions', () => {
      // Scenario: Start investing $500/month, increase 3% annually

      // Arrange
      const initialMonthly = 500;
      const years = 20;
      const returnRate = 8;

      // Model as separate periods with increasing contributions
      const period1Result = calculateInvestmentGrowth({
        initialInvestment: 0,
        monthlyContribution: initialMonthly,
        annualReturnRate: returnRate,
        investmentTermYears: 10
      });

      const period2Result = calculateInvestmentGrowth({
        initialInvestment: period1Result.finalValue,
        monthlyContribution: initialMonthly * Math.pow(1.03, 10), // 3% annual increase
        annualReturnRate: returnRate,
        investmentTermYears: 10
      });

      // Act & Assert
      // Second period should grow faster due to higher contributions + compounding
      expect(period2Result.finalValue).toBeGreaterThan(period1Result.finalValue * 2);

      // Total contributions should reflect the increases
      const totalContributions = period1Result.totalContributions + period2Result.totalContributions;
      expect(totalContributions).toBeGreaterThan(initialMonthly * 12 * 20); // More than flat rate
    });
  });

  describe('Mathematical Property Verification', () => {
    it('should verify total mortgage payments equal principal plus interest', () => {
      // Mathematical property: sum of all payments = loan amount + total interest

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
      const schedule = generateAmortizationSchedule(inputs);
      const result = calculateMortgage(inputs);

      // Assert - verify mathematical invariant
      const sumOfPrincipal = schedule.reduce((sum, p) => sum + p.principalPaid, 0);
      const sumOfInterest = schedule.reduce((sum, p) => sum + p.interestPaid, 0);

      expect(sumOfPrincipal).toBeCloseTo(inputs.loanAmount, 0);
      expect(sumOfInterest).toBeCloseTo(result.totalInterest, 0);
      expect(sumOfPrincipal + sumOfInterest).toBeCloseTo(result.totalPaid, 0);
    });

    it('should verify investment compound interest formula', () => {
      // Mathematical property: FV = PV * (1 + r)^n

      // Arrange
      const principal = 10000;
      const rate = 7;
      const years = 10;

      // Act
      const result = calculateInvestmentGrowth({
        initialInvestment: principal,
        monthlyContribution: 0,
        annualReturnRate: rate,
        investmentTermYears: years
      });

      // Assert - verify against compound interest formula (monthly compounding)
      const monthlyRate = rate / 100 / 12;
      const months = years * 12;
      const expectedFV = principal * Math.pow(1 + monthlyRate, months);
      expect(result.finalValue).toBeCloseTo(expectedFV, 0); // Within $1
    });

    it('should verify cumulative totals always increase', () => {
      // Mathematical property: cumulative values should be monotonically increasing

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
      const schedule = generateAmortizationSchedule(inputs);

      // Assert
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].cumulativePrincipal).toBeGreaterThanOrEqual(schedule[i - 1].cumulativePrincipal);
        expect(schedule[i].cumulativeInterest).toBeGreaterThanOrEqual(schedule[i - 1].cumulativeInterest);
        expect(schedule[i].cumulativeTotal).toBeGreaterThanOrEqual(schedule[i - 1].cumulativeTotal);
      }
    });
  });
});
