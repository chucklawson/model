// ============================================
// FILE: src/types/customRange.ts
// Custom Date Range Performance Type Definitions
// ============================================

export interface DateRangeTickerPerformance {
  ticker: string;
  companyName: string;

  // Current holdings
  totalShares: number;
  currentPrice: number;
  currentValue: number;

  // Range baseline (start date or purchase date)
  baselineValue: number;
  baselineDate: string;

  // Performance metrics
  rangeGainDollar: number;
  rangeGainPercent: number;

  // For time-series charts
  historicalValues?: { date: string; value: number }[];

  // Portfolio allocation
  allocationPercent: number;

  // Warning flags for data quality
  hasWarning?: boolean;
  warningMessage?: string;
}

export interface DateRangePortfolioPerformance {
  // Totals
  totalCurrentValue: number;
  totalBaselineValue: number;
  totalCostBasis: number;
  totalRangeGainDollar: number;
  totalRangeGainPercent: number;
  totalAllTimeGainDollar: number;
  totalAllTimeGainPercent: number;

  // Ticker breakdown
  tickers: DateRangeTickerPerformance[];

  // Time series for portfolio growth chart
  dailyPortfolioValues: {
    date: string;
    totalValue: number;
    tickerBreakdown: { [ticker: string]: number };
  }[];

  // Date range
  startDate: string;
  endDate: string;
}

export interface HistoricalPrice {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}
