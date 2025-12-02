// ============================================
// FILE: src/utils/tickerExporter.ts
// Ticker CSV Export Utility
// ============================================

import type { TickerLot } from '../types';

/**
 * Generate CSV content for a single ticker's lots
 *
 * @param ticker - Ticker symbol
 * @param lots - Array of lots for this ticker
 * @returns CSV content as string
 */
export function generateTickerCSV(ticker: string, lots: TickerLot[]): string {
  // CSV header
  const header = 'Ticker,Date,Quantity,Cost,Portfolio,BaseYield,CalculatePL,Notes,TotalCost';

  // Generate rows for each lot
  const rows = lots.map(lot => {
    const portfolios = lot.portfolios.join('|');
    const calculatePL = lot.calculateAccumulatedProfitLoss ? 'TRUE' : 'FALSE';
    const notes = `"${(lot.notes || '').replace(/"/g, '""')}"`;  // Escape quotes

    return [
      lot.ticker,
      lot.purchaseDate,
      lot.shares,
      lot.costPerShare,
      portfolios,
      lot.baseYield || 0,
      calculatePL,
      notes,
      lot.totalCost
    ].join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Download a single CSV file
 *
 * @param filename - Name of file to download
 * @param content - CSV content
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export all tickers as separate CSV files
 * Downloads happen sequentially with a small delay to prevent browser blocking
 *
 * @param lots - All ticker lots from database
 * @returns Number of files exported
 */
export async function exportAllTickers(lots: TickerLot[]): Promise<number> {
  // Group lots by ticker
  const groupedByTicker = lots.reduce((acc, lot) => {
    const symbol = lot.ticker.toUpperCase();
    if (!acc[symbol]) {
      acc[symbol] = [];
    }
    acc[symbol].push(lot);
    return acc;
  }, {} as Record<string, TickerLot[]>);

  // Sort tickers alphabetically
  const tickers = Object.keys(groupedByTicker).sort();

  // Export each ticker with a small delay between downloads
  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i];
    const tickerLots = groupedByTicker[ticker];

    // Generate CSV content
    const csvContent = generateTickerCSV(ticker, tickerLots);

    // Download file
    downloadCSV(`${ticker}.csv`, csvContent);

    // Small delay to prevent browser from blocking multiple downloads
    if (i < tickers.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return tickers.length;
}
