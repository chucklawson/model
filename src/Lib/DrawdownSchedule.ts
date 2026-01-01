// Drawdown schedule type definitions and utilities

import type { DrawdownScheduleEntry } from './DrawdownCalculation';

/**
 * Format month number to readable date string
 */
export function formatMonthLabel(entry: DrawdownScheduleEntry): string {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return `${monthNames[entry.monthOfYear - 1]} ${entry.year}`;
}

/**
 * Get entry for specific month number
 */
export function getEntryByMonth(
  schedule: DrawdownScheduleEntry[],
  monthNumber: number
): DrawdownScheduleEntry | undefined {
  return schedule.find(e => e.month === monthNumber);
}

/**
 * Get entries for a specific year
 */
export function getEntriesByYear(
  schedule: DrawdownScheduleEntry[],
  year: number
): DrawdownScheduleEntry[] {
  return schedule.filter(e => e.year === year);
}

/**
 * Calculate total for a specific year
 */
export function getTotalForYear(
  schedule: DrawdownScheduleEntry[],
  year: number
): {
  totalInterestEarned: number;
  totalFixedDrawdown: number;
  totalVariableDrawdown: number;
  totalDrawdowns: number;
  endingBalance: number;
} {
  const yearEntries = getEntriesByYear(schedule, year);

  const lastEntry = yearEntries[yearEntries.length - 1];

  return {
    totalInterestEarned: yearEntries.reduce((sum, e) => sum + e.interestEarned, 0),
    totalFixedDrawdown: yearEntries.reduce((sum, e) => sum + e.fixedDrawdown, 0),
    totalVariableDrawdown: yearEntries.reduce((sum, e) => sum + e.variableDrawdown, 0),
    totalDrawdowns: yearEntries.reduce((sum, e) => sum + e.totalDrawdown, 0),
    endingBalance: lastEntry?.endingBalance || 0
  };
}

/**
 * Find when balance is depleted (if applicable)
 */
export function getDepletionMonth(schedule: DrawdownScheduleEntry[]): number | null {
  const depletedEntry = schedule.find(e => e.isDepleted);
  return depletedEntry ? depletedEntry.month : null;
}

/**
 * Get milestone entries (75%, 50%, 25% of balance remaining)
 */
export function getMilestoneEntries(
  schedule: DrawdownScheduleEntry[],
  originalBalance: number
): {
  seventyFivePercent?: DrawdownScheduleEntry;
  fiftyPercent?: DrawdownScheduleEntry;
  twentyFivePercent?: DrawdownScheduleEntry;
} {
  const milestones: {
    seventyFivePercent?: DrawdownScheduleEntry;
    fiftyPercent?: DrawdownScheduleEntry;
    twentyFivePercent?: DrawdownScheduleEntry;
  } = {};

  const threshold75 = originalBalance * 0.75;
  const threshold50 = originalBalance * 0.50;
  const threshold25 = originalBalance * 0.25;

  for (const entry of schedule) {
    if (!milestones.seventyFivePercent && entry.endingBalance <= threshold75) {
      milestones.seventyFivePercent = entry;
    }
    if (!milestones.fiftyPercent && entry.endingBalance <= threshold50) {
      milestones.fiftyPercent = entry;
    }
    if (!milestones.twentyFivePercent && entry.endingBalance <= threshold25) {
      milestones.twentyFivePercent = entry;
    }
  }

  return milestones;
}

/**
 * Sample schedule for charting (reduce data points for long durations)
 */
export function sampleScheduleForChart(
  schedule: DrawdownScheduleEntry[],
  maxPoints: number = 120
): DrawdownScheduleEntry[] {
  if (schedule.length <= maxPoints) {
    return schedule;
  }

  const sampledSchedule: DrawdownScheduleEntry[] = [];
  const step = Math.ceil(schedule.length / maxPoints);

  for (let i = 0; i < schedule.length; i += step) {
    sampledSchedule.push(schedule[i]);
  }

  // Always include the last entry
  if (sampledSchedule[sampledSchedule.length - 1] !== schedule[schedule.length - 1]) {
    sampledSchedule.push(schedule[schedule.length - 1]);
  }

  return sampledSchedule;
}

/**
 * Calculate years from months
 */
export function monthsToYears(months: number): number {
  return months / 12;
}

/**
 * Calculate months from years
 */
export function yearsToMonths(years: number): number {
  return years * 12;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
