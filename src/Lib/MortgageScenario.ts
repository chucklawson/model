// Mortgage preset scenarios and constants

import type { MortgageInputs } from './MortgageCalculation';

export interface MortgagePreset {
  id: string;
  name: string;
  description: string;
  icon: string;                 // Lucide icon name
  inputs: MortgageInputs;
}

export const MORTGAGE_PRESETS: MortgagePreset[] = [
  {
    id: 'starter-30yr',
    name: 'Starter Home 30yr',
    description: '15% down, conventional loan',
    icon: 'Home',
    inputs: {
      loanAmount: 300000,
      downPayment: 15,
      interestRate: 6.5,
      loanTermYears: 30,
      propertyTax: 3600,
      homeInsurance: 1200,
      hoaFees: 0,
      pmiRate: 0.85
    }
  },
  {
    id: 'refinance-15yr',
    name: 'Refinance 15yr',
    description: '20% down, shorter term',
    icon: 'RefreshCw',
    inputs: {
      loanAmount: 250000,
      downPayment: 20,
      interestRate: 5.5,
      loanTermYears: 15,
      propertyTax: 4200,
      homeInsurance: 1500,
      hoaFees: 0,
      pmiRate: 0.85
    }
  },
  {
    id: 'fha-low-down',
    name: 'FHA Low Down',
    description: '3.5% down, PMI required',
    icon: 'TrendingDown',
    inputs: {
      loanAmount: 350000,
      downPayment: 3.5,
      interestRate: 6.0,
      loanTermYears: 30,
      propertyTax: 4000,
      homeInsurance: 1400,
      hoaFees: 150,
      pmiRate: 0.85
    }
  },
  {
    id: 'jumbo-loan',
    name: 'Jumbo Loan',
    description: 'High-value property',
    icon: 'Building',
    inputs: {
      loanAmount: 800000,
      downPayment: 25,
      interestRate: 7.0,
      loanTermYears: 30,
      propertyTax: 12000,
      homeInsurance: 3000,
      hoaFees: 300,
      pmiRate: 0.85
    }
  }
];

// Common interest rates for quick selection
export const COMMON_INTEREST_RATES = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];

// Standard loan terms
export const LOAN_TERMS = [
  { years: 15, label: '15 Year', color: 'green' },
  { years: 20, label: '20 Year', color: 'blue' },
  { years: 30, label: '30 Year', color: 'purple' }
];
