// ============================================
// Shared Types for Vanguard PDF Parser
// ============================================

/**
 * Interface representing a parsed transaction from the Vanguard PDF
 */
export interface VanguardPdfTransaction {
  settlementDate: string;    // "11/25/2025"
  tradeDate: string;         // "11/24/2025"
  symbol: string;            // "QQQ" or "—"
  investmentName: string;    // "INVESCO QQQ ETF"
  transactionType: string;   // "Buy", "Sell", "Dividend", etc.
  accountType: string;       // "CASH" or "MARGIN"
  shares: string;            // "3.0000" or "—"
  price: string;             // "595.3300" or "—"
  commission: string;        // "Free" or "$0.00" or "—"
  amount: string;            // "-$1,785.9900" or "—"
}

/**
 * Interface for the result of parsing a Vanguard PDF
 */
export interface VanguardPdfData {
  accountNumber: string;
  transactions: VanguardPdfTransaction[];
}
