// ============================================
// FILE: src/types/index.ts
// ============================================
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface Ticker {
  id: string;
  symbol: string;
  companyName?: string;
  baseYield: number;
  expectedFiveYearGrowth: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface TickerLot {
  id: string;
  ticker: string;
  shares: number;
  costPerShare: number;
  purchaseDate: string;
  portfolios: string[];
  calculateAccumulatedProfitLoss: boolean;
  isDividend: boolean;
  baseYield: number;
  notes?: string;
  totalCost: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface TickerSummary {
  ticker: string;
  companyName?: string;
  baseYield: number;
  expectedFiveYearGrowth: number;
  totalShares: number;
  totalCost: number;
  averageCostPerShare: number;
  lotCount: number;
  earliestPurchase: string;
  latestPurchase: string;
  portfolios: string[];
}

export interface LotFormData {
  ticker: string;
  shares: number;
  costPerShare: number;
  purchaseDate: string;
  portfolios: string[];
  calculateAccumulatedProfitLoss: boolean;
  isDividend: boolean;
  notes: string;
}

// CSV Import Types
export interface ParsedCSVRow {
  ticker: string;
  companyName?: string;
  baseYield?: number;
  expectedFiveYearGrowth?: number;
  shares: number;
  costPerShare: number;
  purchaseDate: string;
  portfolios: string[];
  calculatePL?: boolean;
  isDividend?: boolean;
  notes?: string;
  rowIndex: number;
  originalRow: string;
}

export interface ParsedCSVData {
  rows: ParsedCSVRow[];
  headers: string[];
  totalRows: number;
}

export interface FieldError {
  field: string;
  message: string;
}

export type ValidationStatus = 'valid' | 'duplicate' | 'invalid';

export interface ValidationResult {
  row: ParsedCSVRow;
  status: ValidationStatus;
  errors: FieldError[];
  isDuplicate?: boolean;
  duplicateReason?: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  percentage: number;
  currentOperation: string;
}

export interface ImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  failed: number;
  tickersCreated: number;
  tickersSkipped: number;
  portfoliosCreated: string[];
  details: {
    row: ParsedCSVRow;
    status: 'success' | 'skipped' | 'failed';
    reason?: string;
  }[];
}

// YTD Performance Types
export type { YTDTickerPerformance, YTDPortfolioPerformance, HistoricalPrice } from './ytd';

// Vanguard Transaction Import Types
export * from './transaction';
