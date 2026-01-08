// ============================================
// Vanguard Text to CSV Converter
// ============================================

import type { ParsedVanguardText } from './vanguardTextParser';

/**
 * Convert parsed Vanguard text data to CSV format
 */
export function convertToCSV(data: ParsedVanguardText): string {
  const headers = [
    'Account Number',
    'Symbol',
    'Company Name',
    'Date Sold',
    'Date Acquired',
    'Event',
    'Cost Basis Method',
    'Quantity',
    'Total Cost',
    'Proceeds',
    'Short Term Gain/Loss',
    'Long Term Gain/Loss',
    'Total Gain/Loss',
  ];

  // Create CSV rows
  const rows: string[] = [headers.join(',')];

  for (const lot of data.lots) {
    const row = [
      lot.accountNumber,
      lot.symbol,
      `"${lot.companyName}"`, // Quote to handle commas and special chars
      lot.dateSold,
      lot.dateAcquired,
      lot.event,
      `"${lot.costBasisMethod}"`, // Quote to handle commas
      lot.quantity,
      lot.totalCost,
      lot.proceeds,
      lot.shortTermGainLoss,
      lot.longTermGainLoss,
      lot.totalGainLoss,
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
