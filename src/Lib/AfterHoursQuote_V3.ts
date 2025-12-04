// ============================================
// FILE: src/Lib/AfterHoursQuote_V3.ts
// ============================================

/**
 * After-hours quote data from Financial Modeling Prep API
 * Endpoint: /api/v3/aftermarket-quote
 */
export default interface AfterHoursQuote_V3 {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  timestamp: number;
  regularMarketPrice?: number;
}
