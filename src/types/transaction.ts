// ============================================
// FILE: src/types/transaction.ts
// Vanguard Transaction Import Type Definitions
// ============================================

// ===== Vanguard CSV Data Structures =====

export interface VanguardTransaction {
  accountNumber: string;
  tradeDate: string;
  settlementDate?: string;
  transactionType: string;
  transactionDescription?: string;
  investmentName?: string;
  symbol: string;
  shares: number;
  sharePrice?: number;
  principalAmount?: number;
  commissionsAndFees: number;
  netAmount?: number;
  accruedInterest?: number;
  accountType?: string;
}

export interface VanguardHolding {
  accountNumber: string;
  investmentName: string;
  symbol: string;
  shares: number;
  sharePrice: number;
  totalValue: number;
}

export interface ParsedVanguardCSV {
  holdings: VanguardHolding[];
  transactions: VanguardTransaction[];
  parseDate: string;
}

// ===== Lot Matching =====

export type MatchingMethod = 'FIFO' | 'LIFO' | 'SpecID';

export interface LotMatchingRequest {
  symbol: string;
  sellTransaction: VanguardTransaction;
  availableBuys: VanguardTransaction[];
  method: MatchingMethod;
  specificLotId?: string; // For SpecID method
}

export interface LotMatchingResult {
  buyTransaction: VanguardTransaction;
  sellTransaction: VanguardTransaction;
  matchedShares: number;
  remainingBuyShares: number;
  remainingSellShares: number;
  realizedGainLoss: number;
  holdingPeriodDays: number;
  isLongTerm: boolean;
}

// ===== Tax Reporting =====

export interface TaxReport {
  taxYear: number;
  shortTermTransactions: CompletedTransactionSummary[];
  longTermTransactions: CompletedTransactionSummary[];
  totalShortTermGain: number;
  totalLongTermGain: number;
  totalDividends: number;
  qualifiedDividends: number;
  nonQualifiedDividends: number;
  totalFeesAndCommissions: number;
}

export interface CompletedTransactionSummary {
  symbol: string;
  buyDate: string;
  sellDate: string;
  shares: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  holdingPeriodDays: number;
}

// ===== Time-Weighted Returns =====

export interface TimeWeightedReturn {
  symbol?: string; // undefined for portfolio-wide
  startDate: string;
  endDate: string;
  twr: number; // Time-weighted return percentage
  cashFlows: CashFlow[];
  periodReturns: PeriodReturn[];
}

export interface CashFlow {
  date: string;
  amount: number; // Positive for buys, negative for sells
  type: 'buy' | 'sell' | 'dividend';
}

export interface PeriodReturn {
  startDate: string;
  endDate: string;
  startValue: number;
  endValue: number;
  return: number;
}

// ===== Import Statistics =====

export interface ImportStats {
  totalRows: number;
  holdingsCount: number;
  transactionsCount: number;
  newTransactions: number;
  duplicateTransactions: number;
  matchedPairs: number;
  errors: string[];
}

export interface ImportProgress {
  stage: string;
  percent: number;
  current?: number;
  total?: number;
}

// ===== Validation =====

export interface VanguardValidationResult {
  isValid: boolean;
  errors: VanguardValidationError[];
  warnings: VanguardValidationWarning[];
}

export interface VanguardValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface VanguardValidationWarning {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

// ===== Section Boundary Detection =====

export interface SectionBoundaries {
  holdingsStart: number;
  holdingsEnd: number;
  transactionsStart: number;
  transactionsEnd: number;
}

// ===== Database Model Interfaces (from Amplify schema) =====

export interface Transaction {
  id: string;
  accountNumber: string;
  tradeDate: string;
  settlementDate?: string;
  transactionType: string;
  transactionDescription?: string;
  investmentName?: string;
  symbol: string;
  shares: number;
  sharePrice?: number;
  principalAmount?: number;
  commissionsAndFees: number;
  netAmount?: number;
  accruedInterest?: number;
  accountType?: string;
  importBatchId: string;
  importDate: string;
  sourceFile?: string;
  isMatched: boolean;
  matchedTransactionId?: string;
  rawData?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface CompletedTransaction {
  id: string;
  symbol: string;
  buyTransactionId: string;
  buyDate: string;
  buyShares: number;
  buyPrice: number;
  buyFees: number;
  buyTotalCost: number;
  sellTransactionId: string;
  sellDate: string;
  sellShares: number;
  sellPrice: number;
  sellFees: number;
  sellTotalProceeds: number;
  realizedGainLoss: number;
  realizedGainLossPercent?: number;
  holdingPeriodDays: number;
  isLongTerm: boolean;
  taxYear: number;
  matchingMethod: string;
  accountNumber?: string;
  completedDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface ImportHistory {
  id: string;
  batchId: string;
  importDate: string;
  sourceFileName: string;
  fileHash: string;
  totalTransactions: number;
  holdingsImported?: number;
  transactionsImported?: number;
  duplicatesSkipped?: number;
  errorsEncountered?: number;
  status: string;
  errorMessage?: string;
  matchingMethodUsed?: string;
  importedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface LotMatchingConfig {
  id: string;
  defaultMethod: string;
  symbolOverrides?: string;
  preferLongTermGains: boolean;
  taxLossHarvestingEnabled: boolean;
  trackWashSales: boolean;
  washSalePeriodDays: number;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}

export interface DividendTransaction {
  id: string;
  transactionId: string;
  symbol: string;
  payDate: string;
  exDividendDate?: string;
  dividendPerShare: number;
  totalDividend: number;
  shares: number;
  isReinvested: boolean;
  reinvestmentTransactionId?: string;
  isQualified?: boolean;
  taxYear: number;
  accountNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
}
