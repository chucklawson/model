// Amortization schedule type definitions and utilities

import type { MonthlyPayment } from './MortgageCalculation';

/**
 * Format month number to readable date string
 */
export function formatMonthLabel(payment: MonthlyPayment): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${monthNames[payment.monthOfYear - 1]} ${payment.year}`;
}

/**
 * Get payment for specific month number
 */
export function getPaymentByMonth(
  schedule: MonthlyPayment[],
  monthNumber: number
): MonthlyPayment | undefined {
  return schedule.find(p => p.month === monthNumber);
}

/**
 * Get payments for a specific year
 */
export function getPaymentsByYear(
  schedule: MonthlyPayment[],
  year: number
): MonthlyPayment[] {
  return schedule.filter(p => p.year === year);
}

/**
 * Calculate total payments for a year
 */
export function getTotalForYear(
  schedule: MonthlyPayment[],
  year: number
): {
  totalPrincipal: number;
  totalInterest: number;
  totalPMI: number;
  totalPaid: number;
} {
  const yearPayments = getPaymentsByYear(schedule, year);

  return {
    totalPrincipal: yearPayments.reduce((sum, p) => sum + p.principalPaid + p.extraPrincipalPaid, 0),
    totalInterest: yearPayments.reduce((sum, p) => sum + p.interestPaid, 0),
    totalPMI: yearPayments.reduce((sum, p) => sum + p.pmiPaid, 0),
    totalPaid: yearPayments.reduce((sum, p) => sum + p.totalPaid, 0)
  };
}

/**
 * Find when PMI is removed (if applicable)
 */
export function getPMIRemovalMonth(schedule: MonthlyPayment[]): number | null {
  // Find the first month where PMI becomes inactive after being active
  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i - 1].isPMIActive && !schedule[i].isPMIActive) {
      return schedule[i].month;
    }
  }
  return null;
}

/**
 * Get milestone payments (25%, 50%, 75% paid off)
 */
export function getMilestonePayments(
  schedule: MonthlyPayment[],
  originalLoan: number
): {
  twentyFivePercent?: MonthlyPayment;
  fiftyPercent?: MonthlyPayment;
  seventyFivePercent?: MonthlyPayment;
} {
  const milestones: {
    twentyFivePercent?: MonthlyPayment;
    fiftyPercent?: MonthlyPayment;
    seventyFivePercent?: MonthlyPayment;
  } = {};

  const threshold25 = originalLoan * 0.75;
  const threshold50 = originalLoan * 0.50;
  const threshold75 = originalLoan * 0.25;

  for (const payment of schedule) {
    if (!milestones.twentyFivePercent && payment.remainingBalance <= threshold25) {
      milestones.twentyFivePercent = payment;
    }
    if (!milestones.fiftyPercent && payment.remainingBalance <= threshold50) {
      milestones.fiftyPercent = payment;
    }
    if (!milestones.seventyFivePercent && payment.remainingBalance <= threshold75) {
      milestones.seventyFivePercent = payment;
    }
  }

  return milestones;
}

/**
 * Sample schedule for charting (reduce data points for long loans)
 */
export function sampleScheduleForChart(
  schedule: MonthlyPayment[],
  maxPoints: number = 120
): MonthlyPayment[] {
  if (schedule.length <= maxPoints) {
    return schedule;
  }

  const sampledSchedule: MonthlyPayment[] = [];
  const step = Math.ceil(schedule.length / maxPoints);

  for (let i = 0; i < schedule.length; i += step) {
    sampledSchedule.push(schedule[i]);
  }

  // Always include the last payment
  if (sampledSchedule[sampledSchedule.length - 1] !== schedule[schedule.length - 1]) {
    sampledSchedule.push(schedule[schedule.length - 1]);
  }

  return sampledSchedule;
}
