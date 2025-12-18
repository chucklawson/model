// Mortgage calculation interfaces and functions

export interface MortgageInputs {
  loanAmount: number;
  downPayment: number;         // Percentage (0-100)
  interestRate: number;        // Annual percentage
  loanTermYears: number;
  propertyTax: number;         // Annual amount
  homeInsurance: number;       // Annual amount
  hoaFees: number;             // Monthly amount
  pmiRate: number;             // Annual percentage (default 0.85)
}

export interface ExtraPayment {
  id: string;
  type: 'one-time' | 'recurring-monthly' | 'recurring-yearly';
  amount: number;
  startMonth: number;          // 1-indexed month number
  endMonth?: number;           // For recurring (optional)
}

export interface MonthlyPayment {
  month: number;               // 1-indexed month number
  year: number;                // Calendar year
  monthOfYear: number;         // 1-12
  principalPaid: number;
  interestPaid: number;
  extraPrincipalPaid: number;
  totalPaid: number;
  remainingBalance: number;
  cumulativePrincipal: number;
  cumulativeInterest: number;
  cumulativeTotal: number;
  pmiPaid: number;
  isPMIActive: boolean;
}

export interface MortgageResults {
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyPMI: number;
  monthlyHOA: number;
  totalMonthlyPayment: number;
  totalInterest: number;
  totalPaid: number;
  downPaymentAmount: number;
  ltvRatio: number;            // Loan-to-Value ratio
  requiresPMI: boolean;
  payoffMonth: number;
  amortizationSchedule: MonthlyPayment[];
}

/**
 * Calculate the monthly principal and interest payment
 * Formula: M = P * [i(1 + i)^n] / [(1 + i)^n - 1]
 */
export function calculateMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  loanTermYears: number
): number {
  if (principal <= 0 || loanTermYears <= 0) return 0;

  const monthlyRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;

  if (monthlyRate === 0) {
    // No interest case
    return principal / numberOfPayments;
  }

  const monthlyPayment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return monthlyPayment;
}

/**
 * Calculate monthly PMI payment
 */
export function calculatePMI(
  loanAmount: number,
  downPaymentPercent: number,
  pmiRate: number
): { monthlyPMI: number; requiresPMI: boolean } {
  const requiresPMI = downPaymentPercent < 20;

  if (!requiresPMI) {
    return { monthlyPMI: 0, requiresPMI: false };
  }

  const annualPMI = loanAmount * (pmiRate / 100);
  const monthlyPMI = annualPMI / 12;

  return { monthlyPMI, requiresPMI: true };
}

/**
 * Calculate down payment amount and home price
 */
export function calculateDownPaymentAmount(
  loanAmount: number,
  downPaymentPercent: number
): { downPaymentAmount: number; homePrice: number } {
  const homePrice = loanAmount / (1 - downPaymentPercent / 100);
  const downPaymentAmount = homePrice * (downPaymentPercent / 100);

  return { downPaymentAmount, homePrice };
}

/**
 * Calculate LTV (Loan-to-Value) ratio
 */
export function calculateLTV(
  _loanAmount: number,
  downPaymentPercent: number
): number {
  return 100 - downPaymentPercent;
}

/**
 * Generate complete amortization schedule with extra payments
 */
export function generateAmortizationSchedule(
  inputs: MortgageInputs,
  extraPayments: ExtraPayment[] = []
): MonthlyPayment[] {
  const { loanAmount, interestRate, loanTermYears, downPayment, pmiRate } = inputs;

  const monthlyPI = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);
  const monthlyRate = interestRate / 100 / 12;
  const { homePrice } = calculateDownPaymentAmount(loanAmount, downPayment);
  const pmiThreshold = homePrice * 0.8; // PMI removed at 80% LTV

  const schedule: MonthlyPayment[] = [];
  let remainingBalance = loanAmount;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  let cumulativeTotal = 0;

  const currentYear = new Date().getFullYear();
  let monthNumber = 1;

  while (remainingBalance > 0.01 && monthNumber <= loanTermYears * 12 * 2) {
    // Calculate interest for this month
    const interestPayment = remainingBalance * monthlyRate;

    // Calculate principal payment
    let principalPayment = monthlyPI - interestPayment;

    // Handle last payment (might be less than full payment)
    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance;
    }

    // Apply extra payments for this month
    let extraPrincipal = 0;
    for (const extra of extraPayments) {
      if (extra.type === 'one-time' && extra.startMonth === monthNumber) {
        extraPrincipal += extra.amount;
      } else if (extra.type === 'recurring-monthly') {
        if (monthNumber >= extra.startMonth && (!extra.endMonth || monthNumber <= extra.endMonth)) {
          extraPrincipal += extra.amount;
        }
      } else if (extra.type === 'recurring-yearly') {
        const monthsSinceStart = monthNumber - extra.startMonth;
        if (monthNumber >= extra.startMonth && monthsSinceStart % 12 === 0) {
          if (!extra.endMonth || monthNumber <= extra.endMonth) {
            extraPrincipal += extra.amount;
          }
        }
      }
    }

    // Ensure extra payment doesn't exceed remaining balance
    if (extraPrincipal > remainingBalance - principalPayment) {
      extraPrincipal = Math.max(0, remainingBalance - principalPayment);
    }

    // Update balance
    remainingBalance -= (principalPayment + extraPrincipal);
    if (remainingBalance < 0) remainingBalance = 0;

    // Calculate PMI for this month
    const isPMIActive = remainingBalance > pmiThreshold && downPayment < 20;
    const { monthlyPMI } = calculatePMI(loanAmount, downPayment, pmiRate);
    const pmiPayment = isPMIActive ? monthlyPMI : 0;

    // Update cumulative totals
    cumulativePrincipal += principalPayment + extraPrincipal;
    cumulativeInterest += interestPayment;
    cumulativeTotal += principalPayment + interestPayment + extraPrincipal;

    // Calculate calendar date
    const yearOffset = Math.floor((monthNumber - 1) / 12);
    const monthOfYear = ((monthNumber - 1) % 12) + 1;
    const year = currentYear + yearOffset;

    // Add to schedule
    schedule.push({
      month: monthNumber,
      year,
      monthOfYear,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      extraPrincipalPaid: extraPrincipal,
      totalPaid: principalPayment + interestPayment + extraPrincipal,
      remainingBalance,
      cumulativePrincipal,
      cumulativeInterest,
      cumulativeTotal,
      pmiPaid: pmiPayment,
      isPMIActive
    });

    monthNumber++;
  }

  return schedule;
}

/**
 * Calculate complete mortgage results
 */
export function calculateMortgage(
  inputs: MortgageInputs,
  extraPayments: ExtraPayment[] = []
): MortgageResults {
  const { loanAmount, downPayment, propertyTax, homeInsurance, hoaFees, pmiRate } = inputs;

  // Calculate monthly P&I
  const monthlyPI = calculateMonthlyPayment(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears
  );

  // Calculate PMI
  const { monthlyPMI, requiresPMI } = calculatePMI(loanAmount, downPayment, pmiRate);

  // Calculate other monthly costs
  const monthlyPropertyTax = propertyTax / 12;
  const monthlyInsurance = homeInsurance / 12;

  // Total monthly payment (PITI + HOA)
  const totalMonthlyPayment =
    monthlyPI +
    monthlyPropertyTax +
    monthlyInsurance +
    monthlyPMI +
    hoaFees;

  // Generate amortization schedule
  const amortizationSchedule = generateAmortizationSchedule(inputs, extraPayments);

  // Calculate totals from schedule
  const totalInterest = amortizationSchedule.reduce(
    (sum, payment) => sum + payment.interestPaid,
    0
  );

  const totalPaid = loanAmount + totalInterest;
  const payoffMonth = amortizationSchedule.length;

  // Calculate down payment
  const { downPaymentAmount } = calculateDownPaymentAmount(loanAmount, downPayment);

  // Calculate LTV
  const ltvRatio = calculateLTV(loanAmount, downPayment);

  return {
    monthlyPrincipalAndInterest: monthlyPI,
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyPMI,
    monthlyHOA: hoaFees,
    totalMonthlyPayment,
    totalInterest,
    totalPaid,
    downPaymentAmount,
    ltvRatio,
    requiresPMI,
    payoffMonth,
    amortizationSchedule
  };
}

/**
 * Validate mortgage inputs
 */
export function validateInputs(inputs: MortgageInputs): string | null {
  if (inputs.loanAmount <= 0) {
    return "Loan amount must be greater than 0";
  }
  if (inputs.loanAmount > 10000000) {
    return "Loan amount too high (max $10M)";
  }
  if (inputs.downPayment < 0 || inputs.downPayment >= 100) {
    return "Down payment must be between 0% and 99%";
  }
  if (inputs.interestRate <= 0 || inputs.interestRate > 20) {
    return "Interest rate must be between 0% and 20%";
  }
  if (inputs.loanTermYears < 1 || inputs.loanTermYears > 50) {
    return "Loan term must be between 1 and 50 years";
  }
  if (inputs.propertyTax < 0) {
    return "Property tax cannot be negative";
  }
  if (inputs.homeInsurance < 0) {
    return "Home insurance cannot be negative";
  }
  if (inputs.hoaFees < 0) {
    return "HOA fees cannot be negative";
  }

  return null; // Valid
}
