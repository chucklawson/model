// Investment calculation interfaces and functions

export interface InvestmentInputs {
  initialInvestment: number;      // Lump sum initial investment
  monthlyContribution: number;    // Recurring monthly investment
  annualReturnRate: number;       // Annual percentage return
  investmentTermYears: number;    // Investment duration in years
}

export interface MonthlyInvestmentGrowth {
  month: number;                  // 1-indexed month number
  year: number;                   // Calendar year
  monthOfYear: number;            // 1-12
  monthlyContribution: number;    // Amount added this month
  interestEarned: number;         // Interest earned this month
  totalValue: number;             // Total portfolio value
  cumulativeContributions: number; // Total amount invested
  cumulativeInterest: number;     // Total interest earned
}

export interface InvestmentResults {
  finalValue: number;
  totalContributions: number;
  totalInterestEarned: number;
  monthlyGrowthSchedule: MonthlyInvestmentGrowth[];
}

/**
 * Calculate future value of a lump sum investment
 * Formula: FV = PV × (1 + r)^n
 */
export function calculateLumpSumFutureValue(
  principal: number,
  annualRate: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    // No growth case
    return principal;
  }

  return principal * Math.pow(1 + monthlyRate, months);
}

/**
 * Calculate future value of monthly contributions (annuity)
 * Formula: FV = PMT × [((1 + r)^n - 1) / r]
 */
export function calculateMonthlyContributionsFutureValue(
  monthlyPayment: number,
  annualRate: number,
  years: number
): number {
  if (monthlyPayment <= 0 || years <= 0) return 0;

  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    // No growth case - just sum of contributions
    return monthlyPayment * months;
  }

  return monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

/**
 * Calculate investment growth with month-by-month schedule
 * Supports both lump sum and monthly contributions
 */
export function calculateInvestmentGrowth(
  inputs: InvestmentInputs
): InvestmentResults {
  const { initialInvestment, monthlyContribution, annualReturnRate, investmentTermYears } = inputs;

  if (investmentTermYears <= 0) {
    return {
      finalValue: 0,
      totalContributions: 0,
      totalInterestEarned: 0,
      monthlyGrowthSchedule: []
    };
  }

  const monthlyRate = annualReturnRate / 100 / 12;
  const totalMonths = investmentTermYears * 12;
  const monthlyGrowthSchedule: MonthlyInvestmentGrowth[] = [];

  let totalValue = initialInvestment;
  let cumulativeContributions = initialInvestment;

  // Current date for year calculation
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-indexed

  for (let month = 1; month <= totalMonths; month++) {
    // Add monthly contribution at the beginning of the month
    if (monthlyContribution > 0) {
      totalValue += monthlyContribution;
      cumulativeContributions += monthlyContribution;
    }

    // Apply interest to the entire balance
    const interestThisMonth = totalValue * monthlyRate;
    totalValue += interestThisMonth;

    const cumulativeInterest = totalValue - cumulativeContributions;

    // Calculate calendar year and month
    const monthsSinceStart = month - 1;
    const yearOffset = Math.floor((currentMonth - 1 + monthsSinceStart) / 12);
    const monthOfYear = ((currentMonth - 1 + monthsSinceStart) % 12) + 1;

    monthlyGrowthSchedule.push({
      month,
      year: currentYear + yearOffset,
      monthOfYear,
      monthlyContribution,
      interestEarned: interestThisMonth,
      totalValue,
      cumulativeContributions,
      cumulativeInterest
    });
  }

  const finalValue = totalValue;
  const totalContributions = cumulativeContributions;
  const totalInterestEarned = finalValue - totalContributions;

  return {
    finalValue,
    totalContributions,
    totalInterestEarned,
    monthlyGrowthSchedule
  };
}

/**
 * Validate investment inputs
 */
export function validateInvestmentInputs(inputs: InvestmentInputs): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validation rules
  if (inputs.initialInvestment < 0) {
    errors.push('Initial investment cannot be negative');
  }

  if (inputs.monthlyContribution < 0) {
    errors.push('Monthly contribution cannot be negative');
  }

  if (inputs.annualReturnRate < 0) {
    warnings.push('Negative returns are unrealistic for long-term comparisons');
  }

  if (inputs.annualReturnRate > 15) {
    warnings.push('Returns above 15% annually are extremely optimistic');
  }

  if (inputs.investmentTermYears <= 0) {
    errors.push('Investment term must be greater than 0');
  }

  if (inputs.investmentTermYears > 50) {
    errors.push('Investment term cannot exceed 50 years');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
