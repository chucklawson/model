// Drawdown calculation interfaces and functions

export interface DrawdownInputs {
  beginningBalance: number;           // Starting investment amount
  annualInterestRate: number;         // Annual percentage rate
  fixedMonthlyDrawdown: number;       // Fixed monthly withdrawal
  startDate: { month: number; year: number };
  endDate: { month: number; year: number };
  durationYears: number;              // Calculated from dates OR preset
}

export interface VariableDrawdown {
  id: string;
  type: 'one-time' | 'recurring-monthly' | 'recurring-yearly';
  amount: number;
  startMonth: number;                 // 1-indexed
  endMonth?: number;                  // For recurring
  description?: string;
}

export interface DrawdownScheduleEntry {
  month: number;                      // 1-indexed month number
  year: number;
  monthOfYear: number;                // 1-12
  beginningBalance: number;
  interestEarned: number;
  fixedDrawdown: number;
  variableDrawdown: number;
  totalDrawdown: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativeDrawdowns: number;
  isDepleted: boolean;                // True when balance reaches zero
}

export interface DrawdownResults {
  monthlyInterestRate: number;
  totalInterestEarned: number;
  totalDrawdowns: number;
  finalBalance: number;
  depletionMonth: number | null;      // Null if never depletes
  yearsUntilDepletion: number | null;
  averageMonthlyDrawdown: number;
  schedule: DrawdownScheduleEntry[];
}

export interface ScenarioComparison {
  scenarioName: string;
  drawdownRate: number;
  depletionMonth: number | null;
  finalBalance: number;
}

/**
 * Calculate interest earned on remaining balance for one month
 * Formula: Balance × (Annual Rate / 100 / 12)
 */
export function calculateMonthlyInterest(
  balance: number,
  annualRate: number
): number {
  if (balance <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  return balance * monthlyRate;
}

/**
 * Calculate the total number of months between start and end dates
 */
function calculateTotalMonths(
  startDate: { month: number; year: number },
  endDate: { month: number; year: number }
): number {
  return (endDate.year - startDate.year) * 12 + (endDate.month - startDate.month);
}

/**
 * Calculate variable drawdown amount for a specific month
 */
function getVariableDrawdownForMonth(
  month: number,
  variableDrawdowns: VariableDrawdown[]
): number {
  let totalVariable = 0;

  for (const vd of variableDrawdowns) {
    if (vd.type === 'one-time' && month === vd.startMonth) {
      totalVariable += vd.amount;
    } else if (vd.type === 'recurring-monthly') {
      if (month >= vd.startMonth && (!vd.endMonth || month <= vd.endMonth)) {
        totalVariable += vd.amount;
      }
    } else if (vd.type === 'recurring-yearly') {
      // Calculate month of year for current month
      const monthOfYear = ((month - 1) % 12) + 1;
      const startMonthOfYear = ((vd.startMonth - 1) % 12) + 1;

      if (month >= vd.startMonth && monthOfYear === startMonthOfYear && (!vd.endMonth || month <= vd.endMonth)) {
        totalVariable += vd.amount;
      }
    }
  }

  return totalVariable;
}

/**
 * Generate month-by-month schedule of balance, interest, and withdrawals
 * Process:
 * 1. Start with beginning balance
 * 2. Each month: calculate interest on current balance (BEFORE withdrawals)
 * 3. Apply fixed monthly drawdown
 * 4. Apply any variable drawdowns for this month
 * 5. Update balance (balance + interest - drawdowns)
 * 6. Track cumulative totals
 * 7. Detect if balance reaches zero (depletion)
 * 8. Continue until end date OR depletion
 */
export function generateDrawdownSchedule(
  inputs: DrawdownInputs,
  variableDrawdowns: VariableDrawdown[] = []
): DrawdownScheduleEntry[] {
  const schedule: DrawdownScheduleEntry[] = [];
  const totalMonths = calculateTotalMonths(inputs.startDate, inputs.endDate);

  let currentBalance = inputs.beginningBalance;
  let cumulativeInterest = 0;
  let cumulativeDrawdowns = 0;
  let isDepleted = false;

  for (let i = 0; i <= totalMonths; i++) {
    const year = inputs.startDate.year + Math.floor((inputs.startDate.month + i - 1) / 12);
    const monthOfYear = ((inputs.startDate.month + i - 1) % 12) + 1;

    const beginningBalance = currentBalance;

    // If already depleted, all subsequent months have zero values
    if (isDepleted) {
      schedule.push({
        month: i + 1,
        year,
        monthOfYear,
        beginningBalance: 0,
        interestEarned: 0,
        fixedDrawdown: 0,
        variableDrawdown: 0,
        totalDrawdown: 0,
        endingBalance: 0,
        cumulativeInterest,
        cumulativeDrawdowns,
        isDepleted: true
      });
      continue;
    }

    // Calculate interest FIRST (before withdrawals)
    const interestEarned = calculateMonthlyInterest(currentBalance, inputs.annualInterestRate);

    // Add interest to balance
    currentBalance += interestEarned;
    cumulativeInterest += interestEarned;

    // Apply withdrawals
    const fixedDrawdown = inputs.fixedMonthlyDrawdown;
    const variableDrawdown = getVariableDrawdownForMonth(i + 1, variableDrawdowns);
    const totalDrawdown = fixedDrawdown + variableDrawdown;

    // Cap drawdown at remaining balance
    const actualDrawdown = Math.min(totalDrawdown, currentBalance);
    const actualFixed = totalDrawdown > currentBalance
      ? Math.min(fixedDrawdown, currentBalance)
      : fixedDrawdown;
    const actualVariable = actualDrawdown - actualFixed;

    currentBalance -= actualDrawdown;
    cumulativeDrawdowns += actualDrawdown;

    // Check for depletion
    if (currentBalance <= 0.01) { // Use small epsilon for floating point comparison
      currentBalance = 0;
      isDepleted = true;
    }

    schedule.push({
      month: i + 1,
      year,
      monthOfYear,
      beginningBalance,
      interestEarned,
      fixedDrawdown: actualFixed,
      variableDrawdown: actualVariable,
      totalDrawdown: actualDrawdown,
      endingBalance: currentBalance,
      cumulativeInterest,
      cumulativeDrawdowns,
      isDepleted
    });
  }

  return schedule;
}

/**
 * Main calculation function - returns complete results
 */
export function calculateDrawdown(
  inputs: DrawdownInputs,
  variableDrawdowns: VariableDrawdown[] = []
): DrawdownResults {
  // Generate schedule
  const schedule = generateDrawdownSchedule(inputs, variableDrawdowns);

  // Calculate totals from schedule
  const lastEntry = schedule[schedule.length - 1];
  const totalInterestEarned = lastEntry.cumulativeInterest;
  const totalDrawdowns = lastEntry.cumulativeDrawdowns;
  const finalBalance = lastEntry.endingBalance;

  // Find depletion month
  const depletionEntry = schedule.find(entry => entry.isDepleted);
  const depletionMonth = depletionEntry ? depletionEntry.month : null;
  const yearsUntilDepletion = depletionMonth ? depletionMonth / 12 : null;

  // Calculate average monthly drawdown
  const averageMonthlyDrawdown = totalDrawdowns / schedule.length;

  // Calculate monthly interest rate
  const monthlyInterestRate = inputs.annualInterestRate / 12;

  return {
    monthlyInterestRate,
    totalInterestEarned,
    totalDrawdowns,
    finalBalance,
    depletionMonth,
    yearsUntilDepletion,
    averageMonthlyDrawdown,
    schedule
  };
}

/**
 * Validate all input fields
 * Rules:
 * - Beginning balance > 0, < $100M
 * - Interest rate >= 0, <= 20%
 * - Fixed drawdown >= 0, < beginning balance
 * - Duration 1-50 years
 * - Start date before end date
 */
export function validateInputs(inputs: DrawdownInputs): string | null {
  // Beginning balance validation
  if (inputs.beginningBalance <= 0) {
    return 'Beginning balance must be greater than $0';
  }
  if (inputs.beginningBalance > 100000000) {
    return 'Beginning balance must be less than $100,000,000';
  }

  // Interest rate validation
  if (inputs.annualInterestRate < 0) {
    return 'Interest rate cannot be negative';
  }
  if (inputs.annualInterestRate > 20) {
    return 'Interest rate must be 20% or less';
  }

  // Fixed drawdown validation
  if (inputs.fixedMonthlyDrawdown < 0) {
    return 'Monthly drawdown cannot be negative';
  }
  if (inputs.fixedMonthlyDrawdown >= inputs.beginningBalance) {
    return 'Monthly drawdown must be less than beginning balance';
  }

  // Duration validation
  if (inputs.durationYears < 1) {
    return 'Duration must be at least 1 year';
  }
  if (inputs.durationYears > 50) {
    return 'Duration must be 50 years or less';
  }

  // Date validation
  const startMonthTotal = inputs.startDate.year * 12 + inputs.startDate.month;
  const endMonthTotal = inputs.endDate.year * 12 + inputs.endDate.month;

  if (endMonthTotal <= startMonthTotal) {
    return 'End date must be after start date';
  }

  return null;
}

/**
 * Calculate multiple scenarios with different drawdown rates
 * Used for the 4th chart showing how different withdrawal amounts
 * affect when the money runs out
 */
export function calculateDepletionScenarios(
  beginningBalance: number,
  annualRate: number,
  durationYears: number,
  drawdownRates: number[] // Array of monthly amounts to test
): ScenarioComparison[] {
  const scenarios: ScenarioComparison[] = [];
  const currentDate = new Date();
  const startDate = {
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear()
  };
  const endDate = {
    month: startDate.month,
    year: startDate.year + durationYears
  };

  for (const drawdownRate of drawdownRates) {
    const inputs: DrawdownInputs = {
      beginningBalance,
      annualInterestRate: annualRate,
      fixedMonthlyDrawdown: drawdownRate,
      startDate,
      endDate,
      durationYears
    };

    const results = calculateDrawdown(inputs);

    scenarios.push({
      scenarioName: `$${(drawdownRate / 1000).toFixed(1)}k/month`,
      drawdownRate,
      depletionMonth: results.depletionMonth,
      finalBalance: results.finalBalance
    });
  }

  return scenarios;
}
