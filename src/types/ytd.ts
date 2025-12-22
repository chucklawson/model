// ============================================
// FILE: src/types/ytd.ts
// Year-to-Date Performance Type Definitions
// ============================================

export interface YTDTickerPerformance {
  ticker: string;
  companyName: string;

  // Current holdings
  totalShares: number;
  currentPrice: number;
  currentValue: number;

  // YTD baseline (Jan 1 or purchase date)
  baselineValue: number;
  baselineDate: string;

  // Performance metrics
  ytdGainDollar: number;
  ytdGainPercent: number;

  // For time-series charts
  historicalValues?: { date: string; value: number }[];

  // Portfolio allocation
  allocationPercent: number;

  // Warning flags for data quality
  hasWarning?: boolean;
  warningMessage?: string;
}

export interface YTDPortfolioPerformance {
  // Totals
  totalCurrentValue: number;
  totalBaselineValue: number;
  totalCostBasis: number;
  totalYTDGainDollar: number;
  totalYTDGainPercent: number;
  totalAllTimeGainDollar: number;
  totalAllTimeGainPercent: number;

  // Ticker breakdown
  tickers: YTDTickerPerformance[];

  // Time series for portfolio growth chart
  dailyPortfolioValues: {
    date: string;
    totalValue: number;
    tickerBreakdown: { [ticker: string]: number };
  }[];

  // Date range
  startDate: string;  // '2025-01-01'
  endDate: string;    // Today
}

export interface HistoricalPrice {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}
