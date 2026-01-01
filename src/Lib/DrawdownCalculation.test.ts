import { describe, it, expect } from 'vitest';
import {
  calculateMonthlyInterest,
  generateDrawdownSchedule,
  calculateDrawdown,
  validateInputs,
  calculateDepletionScenarios,
  type DrawdownInputs,
  type VariableDrawdown
} from './DrawdownCalculation';

describe('DrawdownCalculation', () => {
  // ============================================================================
  // 1. HAPPY PATH TESTS (10-15 cases)
  // ============================================================================

  describe('calculateMonthlyInterest', () => {
    it('should calculate interest correctly for typical balance', () => {
      const balance = 100000;
      const annualRate = 6.0;
      const monthlyInterest = calculateMonthlyInterest(balance, annualRate);

      // Expected: 100000 * (6 / 100 / 12) = 500
      expect(monthlyInterest).toBeCloseTo(500, 2);
    });

    it('should calculate interest for different rates', () => {
      const balance = 500000;

      expect(calculateMonthlyInterest(balance, 5.0)).toBeCloseTo(2083.33, 2);
      expect(calculateMonthlyInterest(balance, 7.0)).toBeCloseTo(2916.67, 2);
      expect(calculateMonthlyInterest(balance, 10.0)).toBeCloseTo(4166.67, 2);
    });

    it('should return zero interest for zero balance', () => {
      expect(calculateMonthlyInterest(0, 6.0)).toBe(0);
    });

    it('should return zero interest for zero rate', () => {
      expect(calculateMonthlyInterest(100000, 0)).toBe(0);
    });
  });

  describe('calculateDrawdown - Happy Path', () => {
    it('should calculate simple 10-year drawdown scenario', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 4500,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(120); // 10 years * 12
      expect(results.totalInterestEarned).toBeGreaterThan(0);
      expect(results.totalDrawdowns).toBeGreaterThan(0);
      expect(results.finalBalance).toBeGreaterThanOrEqual(0);
    });

    it('should calculate 20-year scenario with moderate withdrawals', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 800000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 4000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2045 },
        durationYears: 20
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(240); // 20 years * 12
      expect(results.finalBalance).toBeGreaterThan(0); // Should be sustainable
    });

    it('should calculate 30-year retirement scenario', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 1000000,
        annualInterestRate: 6.5,
        fixedMonthlyDrawdown: 4500,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2055 },
        durationYears: 30
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(360); // 30 years * 12
      expect(results.monthlyInterestRate).toBeCloseTo(6.5 / 12, 2);
      expect(results.finalBalance).toBeGreaterThan(0);
    });

    it('should verify schedule length matches duration', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 6, year: 2026 },
        endDate: { month: 5, year: 2031 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(60); // 5 years * 12
    });

    it('should verify final balance accuracy for sustainable scenario', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 1000000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2045 },
        durationYears: 20
      };

      const results = calculateDrawdown(inputs);

      // With $1M at 6% earning $5k/month but only withdrawing $3k/month,
      // balance should grow
      expect(results.finalBalance).toBeGreaterThan(inputs.beginningBalance);
    });
  });

  // ============================================================================
  // 2. EDGE CASES (15-20 cases)
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle zero interest rate (balance only decreases)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      expect(results.totalInterestEarned).toBe(0);
      expect(results.totalDrawdowns).toBeCloseTo(60000, 0); // 60 months * $1000
      expect(results.finalBalance).toBeCloseTo(40000, 0); // $100k - $60k
    });

    it('should handle very high interest rate (balance grows)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 12.0,
        fixedMonthlyDrawdown: 500,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      // At 12% APR, earning $1000/month but only withdrawing $500
      expect(results.finalBalance).toBeGreaterThan(inputs.beginningBalance);
    });

    it('should handle drawdown approximately equal to interest earned (stable balance)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 1000000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 5000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2040 },
        durationYears: 15
      };

      const results = calculateDrawdown(inputs);

      // Balance should be relatively stable (within 10% of original)
      expect(results.finalBalance).toBeGreaterThan(900000);
      expect(results.finalBalance).toBeLessThan(1100000);
    });

    it('should handle single month duration', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 10000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 500,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 1, year: 2026 },
        durationYears: 1
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(1);
    });

    it('should handle maximum duration (50 years)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 2000000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 6000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2075 },
        durationYears: 50
      };

      const results = calculateDrawdown(inputs);

      expect(results.schedule).toHaveLength(600); // 50 years * 12
    });

    it('should handle very large balance ($10M+)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 10000000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 30000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2045 },
        durationYears: 20
      };

      const results = calculateDrawdown(inputs);

      expect(results.finalBalance).toBeGreaterThan(0);
      expect(results.totalInterestEarned).toBeGreaterThan(1000000);
    });

    it('should handle very small balance ($1000)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 1000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 50,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2028 },
        durationYears: 3
      };

      const results = calculateDrawdown(inputs);

      expect(results.totalInterestEarned).toBeGreaterThan(0);
      expect(results.totalDrawdowns).toBeGreaterThan(0);
    });

    it('should handle near-zero withdrawals', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 10,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      // Balance should grow significantly with minimal withdrawals
      expect(results.finalBalance).toBeGreaterThan(inputs.beginningBalance);
    });

    it('should handle floating-point precision for interest calculations', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 333333.33,
        annualInterestRate: 4.75,
        fixedMonthlyDrawdown: 1234.56,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      // Should not have any NaN or Infinity values
      expect(results.finalBalance).not.toBeNaN();
      expect(results.totalInterestEarned).not.toBeNaN();
      expect(results.totalDrawdowns).not.toBeNaN();
    });

    it('should handle very high withdrawal rate (quick depletion)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 50000,
        annualInterestRate: 3.0,
        fixedMonthlyDrawdown: 2000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      // Should deplete before end date
      expect(results.depletionMonth).not.toBeNull();
      expect(results.depletionMonth!).toBeLessThan(61);
    });
  });

  // ============================================================================
  // 3. VALIDATION TESTS (15-20 cases)
  // ============================================================================

  describe('validateInputs', () => {
    it('should accept valid inputs', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toBeNull();
    });

    it('should reject negative beginning balance', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: -100,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Beginning balance must be greater than $0');
    });

    it('should reject zero beginning balance', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 0,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Beginning balance must be greater than $0');
    });

    it('should reject balance over $100M', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 150000000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Beginning balance must be less than $100,000,000');
    });

    it('should reject negative interest rate', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: -1.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Interest rate cannot be negative');
    });

    it('should accept zero interest rate', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toBeNull();
    });

    it('should reject interest rate over 20%', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 25.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Interest rate must be 20% or less');
    });

    it('should accept 20% interest rate (boundary)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 20.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toBeNull();
    });

    it('should reject negative drawdown', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: -500,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Monthly drawdown cannot be negative');
    });

    it('should accept zero drawdown', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 0,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toBeNull();
    });

    it('should reject drawdown >= beginning balance', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 600000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2035 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('Monthly drawdown must be less than beginning balance');
    });

    it('should reject duration less than 1 year', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 6, year: 2026 },
        durationYears: 0.5
      };

      expect(validateInputs(inputs)).toContain('Duration must be at least 1 year');
    });

    it('should reject duration over 50 years', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2080 },
        durationYears: 55
      };

      expect(validateInputs(inputs)).toContain('Duration must be 50 years or less');
    });

    it('should accept 50-year duration (boundary)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2075 },
        durationYears: 50
      };

      expect(validateInputs(inputs)).toBeNull();
    });

    it('should reject end date before start date', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 12, year: 2030 },
        endDate: { month: 1, year: 2030 },
        durationYears: 10
      };

      expect(validateInputs(inputs)).toContain('End date must be after start date');
    });

    it('should reject end date equal to start date', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 1, year: 2026 },
        durationYears: 0
      };

      // This would fail both duration and date validations
      const error = validateInputs(inputs);
      expect(error).not.toBeNull();
    });
  });

  // ============================================================================
  // 4. SCHEDULE GENERATION TESTS (10-15 cases)
  // ============================================================================

  describe('generateDrawdownSchedule', () => {
    it('should generate correct number of monthly entries', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const schedule = generateDrawdownSchedule(inputs);

      // 5 years = 60 months
      expect(schedule).toHaveLength(60);
    });

    it('should have decreasing balance over time for normal case', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 3.0,
        fixedMonthlyDrawdown: 4000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const schedule = generateDrawdownSchedule(inputs);

      // Balance should decrease when withdrawals exceed interest
      expect(schedule[30].endingBalance).toBeLessThan(schedule[0].beginningBalance);
      expect(schedule[59].endingBalance).toBeLessThan(schedule[30].endingBalance);
    });

    it('should calculate cumulative interest correctly', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const schedule = generateDrawdownSchedule(inputs);

      // Cumulative interest should increase each month
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].cumulativeInterest).toBeGreaterThanOrEqual(
          schedule[i - 1].cumulativeInterest
        );
      }
    });

    it('should calculate cumulative drawdowns correctly', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const schedule = generateDrawdownSchedule(inputs);

      // Cumulative drawdowns should increase each month (before depletion)
      for (let i = 1; i < schedule.length && !schedule[i].isDepleted; i++) {
        expect(schedule[i].cumulativeDrawdowns).toBeGreaterThan(
          schedule[i - 1].cumulativeDrawdowns
        );
      }
    });

    it('should calculate interest before withdrawals each month', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 1, year: 2026 },
        durationYears: 1
      };

      const schedule = generateDrawdownSchedule(inputs);

      // First month: 100000 * 0.06 / 12 = 500 interest
      expect(schedule[0].interestEarned).toBeCloseTo(500, 2);
      // Ending balance = 100000 + 500 - 1000 = 99500
      expect(schedule[0].endingBalance).toBeCloseTo(99500, 2);
    });

    it('should verify final entry totals match calculation results', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 3000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const schedule = generateDrawdownSchedule(inputs);
      const results = calculateDrawdown(inputs);

      const lastEntry = schedule[schedule.length - 1];

      expect(lastEntry.cumulativeInterest).toBeCloseTo(results.totalInterestEarned, 2);
      expect(lastEntry.cumulativeDrawdowns).toBeCloseTo(results.totalDrawdowns, 2);
      expect(lastEntry.endingBalance).toBeCloseTo(results.finalBalance, 2);
    });

    it('should handle month/year rollovers correctly', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 11, year: 2026 },
        endDate: { month: 2, year: 2028 },
        durationYears: 2
      };

      const schedule = generateDrawdownSchedule(inputs);

      // Check year rollover
      const novEntry = schedule[0]; // Nov 2026
      const decEntry = schedule[1]; // Dec 2026
      const janEntry = schedule[2]; // Jan 2027

      expect(novEntry.monthOfYear).toBe(11);
      expect(novEntry.year).toBe(2026);
      expect(decEntry.monthOfYear).toBe(12);
      expect(decEntry.year).toBe(2026);
      expect(janEntry.monthOfYear).toBe(1);
      expect(janEntry.year).toBe(2027);
    });
  });

  // ============================================================================
  // 5. DEPLETION DETECTION TESTS (10-15 cases)
  // ============================================================================

  describe('Depletion Detection', () => {
    it('should detect when balance reaches zero', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 10000,
        annualInterestRate: 1.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2030 },
        durationYears: 5
      };

      const results = calculateDrawdown(inputs);

      expect(results.depletionMonth).not.toBeNull();
      expect(results.depletionMonth!).toBeGreaterThan(0);
    });

    it('should mark subsequent months as depleted after balance reaches zero', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 5000,
        annualInterestRate: 0.5,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const schedule = generateDrawdownSchedule(inputs);

      // Find first depleted month
      const firstDepletedIndex = schedule.findIndex(e => e.isDepleted);
      expect(firstDepletedIndex).toBeGreaterThan(-1);

      // All subsequent months should also be depleted
      for (let i = firstDepletedIndex + 1; i < schedule.length; i++) {
        expect(schedule[i].isDepleted).toBe(true);
        expect(schedule[i].endingBalance).toBe(0);
        expect(schedule[i].interestEarned).toBe(0);
        expect(schedule[i].totalDrawdown).toBe(0);
      }
    });

    it('should calculate correct depletion month', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 12000,
        annualInterestRate: 0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2028 },
        durationYears: 3
      };

      const results = calculateDrawdown(inputs);

      // With no interest, should deplete in 12 months
      expect(results.depletionMonth).toBe(12); // Month 12
    });

    it('should handle sustainable scenario (never depletes)', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 1000000,
        annualInterestRate: 8.0,
        fixedMonthlyDrawdown: 4000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2045 },
        durationYears: 20
      };

      const results = calculateDrawdown(inputs);

      // Earning ~$6667/month but only withdrawing $4000
      expect(results.depletionMonth).toBeNull();
      expect(results.yearsUntilDepletion).toBeNull();
      expect(results.finalBalance).toBeGreaterThan(inputs.beginningBalance);
    });

    it('should cap withdrawal at remaining balance', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 5000,
        annualInterestRate: 1.0,
        fixedMonthlyDrawdown: 6000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 6, year: 2026 },
        durationYears: 1
      };

      const schedule = generateDrawdownSchedule(inputs);

      // First month should withdraw all available balance
      expect(schedule[0].totalDrawdown).toBeLessThanOrEqual(
        schedule[0].beginningBalance + schedule[0].interestEarned
      );
      expect(schedule[0].endingBalance).toBeCloseTo(0, 2);
      expect(schedule[0].isDepleted).toBe(true);
    });

    it('should calculate years until depletion correctly', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 120000,
        annualInterestRate: 0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2050 },
        durationYears: 25
      };

      const results = calculateDrawdown(inputs);

      // Should deplete in 120 months = 10 years
      expect(results.yearsUntilDepletion).toBeCloseTo(10, 1);
    });
  });

  // ============================================================================
  // 6. VARIABLE DRAWDOWNS TESTS (10-15 cases)
  // ============================================================================

  describe('Variable Drawdowns', () => {
    it('should apply one-time variable drawdown correctly', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'one-time',
          amount: 5000,
          startMonth: 6
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Month 6 should have $1000 fixed + $5000 variable = $6000 total
      expect(schedule[5].variableDrawdown).toBeCloseTo(5000, 2);
      expect(schedule[5].totalDrawdown).toBeCloseTo(6000, 2);

      // Other months should have no variable drawdown
      expect(schedule[0].variableDrawdown).toBe(0);
      expect(schedule[7].variableDrawdown).toBe(0);
    });

    it('should apply recurring monthly variable drawdowns', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'recurring-monthly',
          amount: 500,
          startMonth: 3,
          endMonth: 8
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Months 3-8 should have $500 variable drawdown
      for (let i = 2; i <= 7; i++) {
        expect(schedule[i].variableDrawdown).toBeCloseTo(500, 2);
        expect(schedule[i].totalDrawdown).toBeCloseTo(1500, 2);
      }

      // Months 1-2 and 9-13 should have no variable drawdown
      expect(schedule[0].variableDrawdown).toBe(0);
      expect(schedule[1].variableDrawdown).toBe(0);
      expect(schedule[8].variableDrawdown).toBe(0);
    });

    it('should apply recurring yearly variable drawdowns', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 500000,
        annualInterestRate: 6.0,
        fixedMonthlyDrawdown: 2000,
        startDate: { month: 6, year: 2026 },
        endDate: { month: 12, year: 2029 },
        durationYears: 4
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'recurring-yearly',
          amount: 10000,
          startMonth: 12 // Every December starting from month 12
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Find entries where monthOfYear === 6 (June, same as start month in year)
      // Actually, startMonth 12 means month 12 in the sequence
      // Month 12 would be June 2027 (12 months from June 2026)
      // Let's check month 12
      expect(schedule[11].variableDrawdown).toBeCloseTo(10000, 2);

      // And month 24 (June 2028)
      if (schedule.length > 23) {
        expect(schedule[23].variableDrawdown).toBeCloseTo(10000, 2);
      }
    });

    it('should combine fixed and multiple variable drawdowns', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 200000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 2000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2027 },
        durationYears: 2
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'recurring-monthly',
          amount: 500,
          startMonth: 1,
          endMonth: 12
        },
        {
          id: '2',
          type: 'one-time',
          amount: 5000,
          startMonth: 6
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Month 6 should have $2000 fixed + $500 recurring + $5000 one-time = $7500
      expect(schedule[5].totalDrawdown).toBeCloseTo(7500, 2);

      // Month 3 should have $2000 fixed + $500 recurring = $2500
      expect(schedule[2].totalDrawdown).toBeCloseTo(2500, 2);
    });

    it('should handle multiple variable drawdowns in same month', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'one-time',
          amount: 2000,
          startMonth: 5
        },
        {
          id: '2',
          type: 'one-time',
          amount: 3000,
          startMonth: 5
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Month 5 should have $1000 fixed + $2000 + $3000 = $6000
      expect(schedule[4].variableDrawdown).toBeCloseTo(5000, 2);
      expect(schedule[4].totalDrawdown).toBeCloseTo(6000, 2);
    });

    it('should handle variable drawdown with start and end dates', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 100000,
        annualInterestRate: 5.0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'recurring-monthly',
          amount: 300,
          startMonth: 3,
          endMonth: 9
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // Should only apply to months 3-9
      expect(schedule[1].variableDrawdown).toBe(0); // Month 2
      expect(schedule[2].variableDrawdown).toBeCloseTo(300, 2); // Month 3
      expect(schedule[8].variableDrawdown).toBeCloseTo(300, 2); // Month 9
      expect(schedule[9].variableDrawdown).toBe(0); // Month 10
    });

    it('should cap variable drawdown at remaining balance', () => {
      const inputs: DrawdownInputs = {
        beginningBalance: 5000,
        annualInterestRate: 0,
        fixedMonthlyDrawdown: 1000,
        startDate: { month: 1, year: 2026 },
        endDate: { month: 12, year: 2026 },
        durationYears: 1
      };

      const variableDrawdowns: VariableDrawdown[] = [
        {
          id: '1',
          type: 'one-time',
          amount: 10000,
          startMonth: 1
        }
      ];

      const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

      // First month: can't withdraw more than $5000 total
      expect(schedule[0].totalDrawdown).toBeLessThanOrEqual(5000);
      expect(schedule[0].endingBalance).toBeCloseTo(0, 2);
    });
  });

  // ============================================================================
  // 7. SCENARIO COMPARISON TESTS (5-10 cases)
  // ============================================================================

  describe('calculateDepletionScenarios', () => {
    it('should calculate multiple depletion scenarios', () => {
      const scenarios = calculateDepletionScenarios(
        500000,
        6.0,
        20,
        [3000, 4000, 5000, 6000]
      );

      expect(scenarios).toHaveLength(4);
      expect(scenarios[0].drawdownRate).toBe(3000);
      expect(scenarios[1].drawdownRate).toBe(4000);
      expect(scenarios[2].drawdownRate).toBe(5000);
      expect(scenarios[3].drawdownRate).toBe(6000);
    });

    it('should verify different drawdown rates produce different outcomes', () => {
      const scenarios = calculateDepletionScenarios(
        500000,
        5.0,
        20,
        [2000, 4000, 6000]
      );

      // Lower drawdown should last longer or have higher final balance
      // At 5%, $500k earns ~$2083/month, so:
      // $2000/month should be sustainable (balance grows)
      // $4000/month should deplete eventually
      // $6000/month should deplete faster

      // Lower withdrawal rate should result in better outcome
      if (scenarios[0].depletionMonth === null && scenarios[1].depletionMonth === null) {
        // Both sustainable, compare final balances
        expect(scenarios[0].finalBalance).toBeGreaterThan(scenarios[1].finalBalance);
      } else if (scenarios[0].depletionMonth !== null && scenarios[1].depletionMonth !== null) {
        // Both deplete, lower rate should last longer
        expect(scenarios[0].depletionMonth).toBeGreaterThan(scenarios[1].depletionMonth);
      } else {
        // One sustainable, one not - lower rate should be sustainable
        expect(scenarios[0].depletionMonth).toBeNull();
        expect(scenarios[1].depletionMonth).not.toBeNull();
      }

      // Compare scenarios 1 and 2
      if (scenarios[1].depletionMonth !== null && scenarios[2].depletionMonth !== null) {
        // Both deplete, lower rate (scenario 1) should last longer
        expect(scenarios[1].depletionMonth).toBeGreaterThan(scenarios[2].depletionMonth);
      } else if (scenarios[1].depletionMonth === null) {
        // Scenario 1 sustainable, scenario 2 should also be or deplete later
        expect(scenarios[1].finalBalance).toBeGreaterThanOrEqual(scenarios[2].finalBalance);
      }
    });

    it('should identify sustainable vs unsustainable rates', () => {
      const scenarios = calculateDepletionScenarios(
        1000000,
        6.0,
        30,
        [3000, 5000, 7000]
      );

      // $1M at 6% earns ~$5000/month
      // $3000/month should be sustainable (no depletion)
      expect(scenarios[0].depletionMonth).toBeNull();
      expect(scenarios[0].finalBalance).toBeGreaterThan(1000000);

      // $7000/month should deplete
      expect(scenarios[2].depletionMonth).not.toBeNull();
    });

    it('should handle edge case where withdrawal rate equals interest rate', () => {
      const balance = 1000000;
      const rate = 6.0;
      const monthlyInterest = balance * (rate / 100 / 12); // ~$5000

      const scenarios = calculateDepletionScenarios(
        balance,
        rate,
        30,
        [monthlyInterest]
      );

      // Balance should be relatively stable (within 10%)
      expect(scenarios[0].finalBalance).toBeGreaterThan(900000);
      expect(scenarios[0].finalBalance).toBeLessThan(1100000);
    });

    it('should generate proper scenario names', () => {
      const scenarios = calculateDepletionScenarios(
        500000,
        6.0,
        20,
        [3000, 4500, 6000]
      );

      expect(scenarios[0].scenarioName).toBe('$3.0k/month');
      expect(scenarios[1].scenarioName).toBe('$4.5k/month');
      expect(scenarios[2].scenarioName).toBe('$6.0k/month');
    });
  });
});
