// ============================================
// FILE: src/Lib/AmortizationSchedule.test.ts
// Amortization Schedule Test Suite
// ============================================

import { describe, it, expect } from 'vitest';
import {
  formatMonthLabel,
  getPaymentByMonth,
  getPaymentsByYear,
  getTotalForYear,
  getPMIRemovalMonth,
  getMilestonePayments,
  sampleScheduleForChart,
} from './AmortizationSchedule';
import type { MonthlyPayment } from './MortgageCalculation';

describe('AmortizationSchedule', () => {
  describe('formatMonthLabel', () => {
    it('should format January correctly', () => {
      const payment: MonthlyPayment = {
        month: 1,
        monthOfYear: 1,
        year: 2024,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000,
        isPMIActive: true,
      };

      expect(formatMonthLabel(payment)).toBe('Jan 2024');
    });

    it('should format December correctly', () => {
      const payment: MonthlyPayment = {
        month: 12,
        monthOfYear: 12,
        year: 2024,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 190000,
        isPMIActive: true,
      };

      expect(formatMonthLabel(payment)).toBe('Dec 2024');
    });

    it('should format all months correctly', () => {
      const expectedMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      expectedMonths.forEach((month, index) => {
        const payment: MonthlyPayment = {
          month: index + 1,
          monthOfYear: index + 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        };

        expect(formatMonthLabel(payment)).toBe(`${month} 2024`);
      });
    });

    it('should handle different years', () => {
      const payment: MonthlyPayment = {
        month: 1,
        monthOfYear: 1,
        year: 2025,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000,
        isPMIActive: true,
      };

      expect(formatMonthLabel(payment)).toBe('Jan 2025');
    });
  });

  describe('getPaymentByMonth', () => {
    const schedule: MonthlyPayment[] = [
      {
        month: 1,
        monthOfYear: 1,
        year: 2024,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000,
        isPMIActive: true,
      },
      {
        month: 2,
        monthOfYear: 2,
        year: 2024,
        principalPaid: 101,
        interestPaid: 199,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 199899,
        isPMIActive: true,
      },
      {
        month: 3,
        monthOfYear: 3,
        year: 2024,
        principalPaid: 102,
        interestPaid: 198,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 199797,
        isPMIActive: true,
      },
    ];

    it('should find payment by month number', () => {
      const payment = getPaymentByMonth(schedule, 2);

      expect(payment).toBeDefined();
      expect(payment?.month).toBe(2);
      expect(payment?.principalPaid).toBe(101);
    });

    it('should return undefined for non-existent month', () => {
      const payment = getPaymentByMonth(schedule, 100);

      expect(payment).toBeUndefined();
    });

    it('should find first month', () => {
      const payment = getPaymentByMonth(schedule, 1);

      expect(payment).toBeDefined();
      expect(payment?.month).toBe(1);
    });

    it('should find last month', () => {
      const payment = getPaymentByMonth(schedule, 3);

      expect(payment).toBeDefined();
      expect(payment?.month).toBe(3);
    });

    it('should handle empty schedule', () => {
      const payment = getPaymentByMonth([], 1);

      expect(payment).toBeUndefined();
    });
  });

  describe('getPaymentsByYear', () => {
    const schedule: MonthlyPayment[] = [
      {
        month: 1,
        monthOfYear: 1,
        year: 2024,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000,
        isPMIActive: true,
      },
      {
        month: 2,
        monthOfYear: 2,
        year: 2024,
        principalPaid: 101,
        interestPaid: 199,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 199899,
        isPMIActive: true,
      },
      {
        month: 13,
        monthOfYear: 1,
        year: 2025,
        principalPaid: 110,
        interestPaid: 190,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 198000,
        isPMIActive: true,
      },
    ];

    it('should get all payments for a specific year', () => {
      const payments = getPaymentsByYear(schedule, 2024);

      expect(payments).toHaveLength(2);
      expect(payments.every(p => p.year === 2024)).toBe(true);
    });

    it('should get payments for different year', () => {
      const payments = getPaymentsByYear(schedule, 2025);

      expect(payments).toHaveLength(1);
      expect(payments[0].year).toBe(2025);
    });

    it('should return empty array for non-existent year', () => {
      const payments = getPaymentsByYear(schedule, 2030);

      expect(payments).toEqual([]);
    });

    it('should handle empty schedule', () => {
      const payments = getPaymentsByYear([], 2024);

      expect(payments).toEqual([]);
    });
  });

  describe('getTotalForYear', () => {
    const schedule: MonthlyPayment[] = [
      {
        month: 1,
        monthOfYear: 1,
        year: 2024,
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 10,
        pmiPaid: 50,
        totalPaid: 360,
        remainingBalance: 200000,
        isPMIActive: true,
      },
      {
        month: 2,
        monthOfYear: 2,
        year: 2024,
        principalPaid: 101,
        interestPaid: 199,
        extraPrincipalPaid: 20,
        pmiPaid: 50,
        totalPaid: 370,
        remainingBalance: 199879,
        isPMIActive: true,
      },
      {
        month: 3,
        monthOfYear: 3,
        year: 2024,
        principalPaid: 102,
        interestPaid: 198,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 199777,
        isPMIActive: true,
      },
    ];

    it('should calculate total payments for year', () => {
      const totals = getTotalForYear(schedule, 2024);

      expect(totals.totalPrincipal).toBe(333); // 100 + 101 + 102 + 10 + 20
      expect(totals.totalInterest).toBe(597); // 200 + 199 + 198
      expect(totals.totalPMI).toBe(150); // 50 + 50 + 50
      expect(totals.totalPaid).toBe(1080); // 360 + 370 + 350
    });

    it('should return zeros for non-existent year', () => {
      const totals = getTotalForYear(schedule, 2025);

      expect(totals.totalPrincipal).toBe(0);
      expect(totals.totalInterest).toBe(0);
      expect(totals.totalPMI).toBe(0);
      expect(totals.totalPaid).toBe(0);
    });

    it('should handle year with no extra principal', () => {
      const scheduleNoExtra: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
      ];

      const totals = getTotalForYear(scheduleNoExtra, 2024);

      expect(totals.totalPrincipal).toBe(100);
    });

    it('should handle year with no PMI', () => {
      const scheduleNoPMI: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 200000,
          isPMIActive: false,
        },
      ];

      const totals = getTotalForYear(scheduleNoPMI, 2024);

      expect(totals.totalPMI).toBe(0);
    });
  });

  describe('getPMIRemovalMonth', () => {
    it('should find month when PMI is removed', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 2,
          monthOfYear: 2,
          year: 2024,
          principalPaid: 101,
          interestPaid: 199,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 180000,
          isPMIActive: true,
        },
        {
          month: 3,
          monthOfYear: 3,
          year: 2024,
          principalPaid: 102,
          interestPaid: 198,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 160000,
          isPMIActive: false,
        },
      ];

      const removalMonth = getPMIRemovalMonth(schedule);

      expect(removalMonth).toBe(3);
    });

    it('should return null if PMI never active', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 200000,
          isPMIActive: false,
        },
      ];

      const removalMonth = getPMIRemovalMonth(schedule);

      expect(removalMonth).toBeNull();
    });

    it('should return null if PMI always active', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 2,
          monthOfYear: 2,
          year: 2024,
          principalPaid: 101,
          interestPaid: 199,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 199899,
          isPMIActive: true,
        },
      ];

      const removalMonth = getPMIRemovalMonth(schedule);

      expect(removalMonth).toBeNull();
    });

    it('should handle empty schedule', () => {
      const removalMonth = getPMIRemovalMonth([]);

      expect(removalMonth).toBeNull();
    });

    it('should find earliest removal if PMI reactivates', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 2,
          monthOfYear: 2,
          year: 2024,
          principalPaid: 101,
          interestPaid: 199,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 180000,
          isPMIActive: false,
        },
        {
          month: 3,
          monthOfYear: 3,
          year: 2024,
          principalPaid: 102,
          interestPaid: 198,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 160000,
          isPMIActive: true,
        },
      ];

      const removalMonth = getPMIRemovalMonth(schedule);

      expect(removalMonth).toBe(2); // First removal
    });
  });

  describe('getMilestonePayments', () => {
    const originalLoan = 200000;

    it('should find all milestone payments', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 50,
          monthOfYear: 2,
          year: 2028,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 150000, // 75% threshold
          isPMIActive: false,
        },
        {
          month: 100,
          monthOfYear: 4,
          year: 2032,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 100000, // 50% threshold
          isPMIActive: false,
        },
        {
          month: 150,
          monthOfYear: 6,
          year: 2036,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 0,
          totalPaid: 300,
          remainingBalance: 50000, // 25% threshold
          isPMIActive: false,
        },
      ];

      const milestones = getMilestonePayments(schedule, originalLoan);

      expect(milestones.twentyFivePercent).toBeDefined();
      expect(milestones.twentyFivePercent?.remainingBalance).toBe(150000);

      expect(milestones.fiftyPercent).toBeDefined();
      expect(milestones.fiftyPercent?.remainingBalance).toBe(100000);

      expect(milestones.seventyFivePercent).toBeDefined();
      expect(milestones.seventyFivePercent?.remainingBalance).toBe(50000);
    });

    it('should find first payment crossing threshold', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 2,
          monthOfYear: 2,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 149000, // Below 25% threshold
          isPMIActive: true,
        },
        {
          month: 3,
          monthOfYear: 3,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 148000, // Still below
          isPMIActive: true,
        },
      ];

      const milestones = getMilestonePayments(schedule, originalLoan);

      expect(milestones.twentyFivePercent?.month).toBe(2); // First to cross
    });

    it('should handle missing milestones', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
        {
          month: 2,
          monthOfYear: 2,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 180000, // Never reaches 25%
          isPMIActive: true,
        },
      ];

      const milestones = getMilestonePayments(schedule, originalLoan);

      expect(milestones.twentyFivePercent).toBeUndefined();
      expect(milestones.fiftyPercent).toBeUndefined();
      expect(milestones.seventyFivePercent).toBeUndefined();
    });

    it('should handle empty schedule', () => {
      const milestones = getMilestonePayments([], originalLoan);

      expect(milestones.twentyFivePercent).toBeUndefined();
      expect(milestones.fiftyPercent).toBeUndefined();
      expect(milestones.seventyFivePercent).toBeUndefined();
    });
  });

  describe('sampleScheduleForChart', () => {
    it('should return full schedule if under max points', () => {
      const schedule: MonthlyPayment[] = Array(100).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule, 120);

      expect(sampled).toEqual(schedule);
      expect(sampled).toHaveLength(100);
    });

    it('should sample schedule if over max points', () => {
      const schedule: MonthlyPayment[] = Array(360).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule, 120);

      // May be up to maxPoints + 1 due to "always include last" logic
      expect(sampled.length).toBeLessThanOrEqual(121);
      expect(sampled.length).toBeGreaterThan(0);
    });

    it('should always include last payment', () => {
      const schedule: MonthlyPayment[] = Array(360).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule, 120);

      expect(sampled[sampled.length - 1].month).toBe(360);
    });

    it('should include first payment', () => {
      const schedule: MonthlyPayment[] = Array(360).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule, 120);

      expect(sampled[0].month).toBe(1);
    });

    it('should handle empty schedule', () => {
      const sampled = sampleScheduleForChart([]);

      expect(sampled).toEqual([]);
    });

    it('should handle single payment', () => {
      const schedule: MonthlyPayment[] = [
        {
          month: 1,
          monthOfYear: 1,
          year: 2024,
          principalPaid: 100,
          interestPaid: 200,
          extraPrincipalPaid: 0,
          pmiPaid: 50,
          totalPaid: 350,
          remainingBalance: 200000,
          isPMIActive: true,
        },
      ];

      const sampled = sampleScheduleForChart(schedule, 120);

      expect(sampled).toEqual(schedule);
    });

    it('should use default max points of 120', () => {
      const schedule: MonthlyPayment[] = Array(360).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule); // No maxPoints specified

      // May be up to maxPoints + 1 due to "always include last" logic
      expect(sampled.length).toBeLessThanOrEqual(121);
    });

    it('should calculate correct step size', () => {
      const schedule: MonthlyPayment[] = Array(360).fill(null).map((_, i) => ({
        month: i + 1,
        monthOfYear: ((i % 12) + 1),
        year: 2024 + Math.floor(i / 12),
        principalPaid: 100,
        interestPaid: 200,
        extraPrincipalPaid: 0,
        pmiPaid: 50,
        totalPaid: 350,
        remainingBalance: 200000 - (i * 100),
        isPMIActive: true,
      }));

      const sampled = sampleScheduleForChart(schedule, 100);

      // Step should be ceil(360 / 100) = 4
      // Should sample every 4th payment
      expect(sampled.length).toBeLessThanOrEqual(100);
    });
  });
});
