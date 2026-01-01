// Drawdown preset scenarios and constants

import type { DrawdownInputs } from './DrawdownCalculation';

export interface DrawdownPreset {
  id: string;
  name: string;
  description: string;
  category: 'time-based' | 'scenario-based';
  icon: string;                 // Lucide icon name
  inputs: DrawdownInputs;
}

// Get current date for preset scenarios
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

export const DRAWDOWN_PRESETS: DrawdownPreset[] = [
  // ============================================================================
  // TIME-BASED SCENARIOS (3)
  // ============================================================================
  {
    id: '10-year-drawdown',
    name: '10 Year Plan',
    description: 'Short-term drawdown strategy',
    category: 'time-based',
    icon: 'Calendar',
    inputs: {
      beginningBalance: 500000,
      annualInterestRate: 5.0,
      fixedMonthlyDrawdown: 4500,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 10 },
      durationYears: 10
    }
  },
  {
    id: '20-year-drawdown',
    name: '20 Year Plan',
    description: 'Medium-term retirement income',
    category: 'time-based',
    icon: 'CalendarCheck',
    inputs: {
      beginningBalance: 800000,
      annualInterestRate: 6.0,
      fixedMonthlyDrawdown: 4000,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 20 },
      durationYears: 20
    }
  },
  {
    id: '30-year-drawdown',
    name: '30 Year Plan',
    description: 'Long-term sustainable income',
    category: 'time-based',
    icon: 'CalendarRange',
    inputs: {
      beginningBalance: 1000000,
      annualInterestRate: 6.5,
      fixedMonthlyDrawdown: 4500,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 30 },
      durationYears: 30
    }
  },

  // ============================================================================
  // SCENARIO-BASED (3)
  // ============================================================================
  {
    id: 'early-retirement',
    name: 'Early Retirement',
    description: 'Age 55-65, aggressive drawdown',
    category: 'scenario-based',
    icon: 'Palmtree',
    inputs: {
      beginningBalance: 750000,
      annualInterestRate: 7.0,
      fixedMonthlyDrawdown: 5500,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 10 },
      durationYears: 10
    }
  },
  {
    id: 'standard-retirement',
    name: 'Standard Retirement',
    description: 'Age 65+, balanced approach',
    category: 'scenario-based',
    icon: 'Armchair',
    inputs: {
      beginningBalance: 1200000,
      annualInterestRate: 5.5,
      fixedMonthlyDrawdown: 5000,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 25 },
      durationYears: 25
    }
  },
  {
    id: 'conservative-withdrawal',
    name: 'Conservative',
    description: 'Low drawdown, preserve capital',
    category: 'scenario-based',
    icon: 'Shield',
    inputs: {
      beginningBalance: 1500000,
      annualInterestRate: 4.5,
      fixedMonthlyDrawdown: 4000,
      startDate: { month: currentMonth, year: currentYear },
      endDate: { month: currentMonth, year: currentYear + 35 },
      durationYears: 35
    }
  }
];

// Common return rates for quick selection (similar to mortgage interest rates)
export const COMMON_RETURN_RATES = [
  3.0, 4.0, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 9.0, 10.0
];

// Duration presets for quick selection
export const DURATION_PRESETS = [
  { years: 10, label: '10 Years' },
  { years: 15, label: '15 Years' },
  { years: 20, label: '20 Years' },
  { years: 25, label: '25 Years' },
  { years: 30, label: '30 Years' }
];
