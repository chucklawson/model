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
  notes: string;
}
