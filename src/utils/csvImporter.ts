// ============================================
// FILE: src/utils/csvImporter.ts
// CSV Import Orchestration
// ============================================

import type { Schema } from '../../amplify/data/resource';
import type { generateClient } from 'aws-amplify/data';
import type {
  ParsedCSVRow,
  ValidationResult,
  ImportResult,
  ImportProgress,
  Portfolio,
  Ticker,
} from '../types';
import { getUniqueTickers, tickerExists } from './csvValidator';

type Client = ReturnType<typeof generateClient<Schema>>;

/**
 * Import CSV data into the database
 */
export async function importCSVData(
  validationResults: ValidationResult[],
  client: Client,
  existingTickers: Ticker[],
  existingPortfolios: Portfolio[],
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const validRows = validationResults.filter(r => r.status === 'valid');
  const totalSteps = validRows.length + 10; // Extra steps for portfolios and tickers
  let currentStep = 0;

  const updateProgress = (operation: string) => {
    currentStep++;
    if (onProgress) {
      onProgress({
        current: currentStep,
        total: totalSteps,
        percentage: Math.round((currentStep / totalSteps) * 100),
        currentOperation: operation,
      });
    }
  };

  const result: ImportResult = {
    totalRows: validationResults.length,
    imported: 0,
    skipped: validationResults.filter(r => r.status === 'duplicate').length,
    failed: 0,
    tickersCreated: 0,
    tickersSkipped: 0,
    portfoliosCreated: [],
    details: [],
  };

  try {
    // Step 1: Ensure all portfolios exist
    updateProgress('Checking portfolios...');
    const portfoliosToCreate = getPortfoliosToCreate(validRows, existingPortfolios);

    for (const portfolioName of portfoliosToCreate) {
      try {
        updateProgress(`Creating portfolio: ${portfolioName}`);
        await client.models.Portfolio.create({
          name: portfolioName,
          description: 'Auto-created from CSV import',
        });
        result.portfoliosCreated.push(portfolioName);
      } catch (err) {
        console.error(`Failed to create portfolio ${portfolioName}:`, err);
      }
    }

    // Step 2: Create/skip tickers
    updateProgress('Processing tickers...');
    const uniqueTickers = getUniqueTickers({
      rows: validRows.map(r => r.row),
      headers: [],
      totalRows: validRows.length,
    });

    for (const tickerSymbol of uniqueTickers) {
      const exists = tickerExists(tickerSymbol, existingTickers);

      if (exists) {
        // Skip existing ticker (keep existing metadata)
        result.tickersSkipped++;
      } else {
        // Create new ticker
        const sampleRow = validRows.find(r => r.row.ticker === tickerSymbol);
        if (sampleRow) {
          try {
            updateProgress(`Creating ticker: ${tickerSymbol}`);
            await client.models.Ticker.create({
              symbol: tickerSymbol,
              companyName: sampleRow.row.companyName ?? '',
              baseYield: sampleRow.row.baseYield ?? 0,
            });
            result.tickersCreated++;
          } catch (err) {
            console.error(`Failed to create ticker ${tickerSymbol}:`, err);
          }
        }
      }
    }

    // Step 3: Create lots
    for (const validationResult of validationResults) {
      const row = validationResult.row;

      if (validationResult.status === 'duplicate') {
        // Skip duplicate
        result.details.push({
          row,
          status: 'skipped',
          reason: validationResult.duplicateReason,
        });
        continue;
      }

      if (validationResult.status === 'invalid') {
        // Skip invalid
        result.details.push({
          row,
          status: 'skipped',
          reason: validationResult.errors.map(e => e.message).join(', '),
        });
        continue;
      }

      // Create lot
      try {
        updateProgress(`Importing ${row.ticker} (${row.shares} shares)`);

        const totalCost = row.shares * row.costPerShare;

        await client.models.TickerLot.create({
          ticker: row.ticker,
          shares: row.shares,
          costPerShare: row.costPerShare,
          purchaseDate: row.purchaseDate,
          portfolios: row.portfolios,
          calculateAccumulatedProfitLoss: row.calculatePL ?? true,
          notes: row.notes ?? '',
          totalCost,
        });

        result.imported++;
        result.details.push({
          row,
          status: 'success',
        });
      } catch (err) {
        console.error(`Failed to import lot for ${row.ticker}:`, err);
        result.failed++;
        result.details.push({
          row,
          status: 'failed',
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    updateProgress('Import complete!');
  } catch (err) {
    console.error('Import error:', err);
    throw err;
  }

  return result;
}

/**
 * Get list of portfolios that need to be created
 */
function getPortfoliosToCreate(
  validRows: ValidationResult[],
  existingPortfolios: Portfolio[]
): string[] {
  const existingNames = new Set(existingPortfolios.map(p => p.name.toLowerCase()));
  const allPortfolios = new Set<string>();

  for (const result of validRows) {
    for (const portfolio of result.row.portfolios) {
      if (!existingNames.has(portfolio.toLowerCase()) && portfolio.trim()) {
        allPortfolios.add(portfolio);
      }
    }
  }

  return Array.from(allPortfolios).sort();
}

/**
 * Format import result as a human-readable summary
 */
export function formatImportSummary(result: ImportResult): string {
  const lines: string[] = [];

  lines.push(`Import Complete!`);
  lines.push('');
  lines.push(`Total rows: ${result.totalRows}`);
  lines.push(`✓ Imported: ${result.imported} lots`);
  lines.push(`⊝ Skipped: ${result.skipped} lots (duplicates)`);
  if (result.failed > 0) {
    lines.push(`✗ Failed: ${result.failed} lots`);
  }
  lines.push('');
  lines.push(`Tickers:`);
  lines.push(`  Created: ${result.tickersCreated} new`);
  lines.push(`  Skipped: ${result.tickersSkipped} existing`);

  if (result.portfoliosCreated.length > 0) {
    lines.push('');
    lines.push(`Portfolios created: ${result.portfoliosCreated.join(', ')}`);
  }

  return lines.join('\n');
}
