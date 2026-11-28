// ============================================
// FILE: src/utils/tickerCalculations.test.ts
// Ticker Calculations Test Suite
// ============================================

import { describe, it, expect } from 'vitest';
import {
  calculateTickerSummaries,
  getLotsForTicker,
  calculateDividendMetrics,
} from './tickerCalculations';
import type { TickerLot, Ticker } from '../types';

describe('tickerCalculations', () => {
  describe('calculateTickerSummaries', () => {
    it('should calculate summary for single ticker with single lot', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 100,
          costPerShare: 150.50,
          totalCost: 15050,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const tickers: Ticker[] = [
        {
          id: '1',
          symbol: 'AAPL',
          companyName:'Apple Inc',
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
        },
      ];

      const summaries = calculateTickerSummaries(lots, tickers);

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        ticker: 'AAPL',
        companyName:'Apple Inc',
        baseYield: 0.5,
        expectedFiveYearGrowth:10,
        totalShares: 100,
        totalCost: 15050,
        averageCostPerShare: 150.50,
        lotCount: 1,
        earliestPurchase: '2024-01-15',
        latestPurchase: '2024-01-15',
        portfolios: ['Tech'],
      });
    });

    it('should calculate summary for single ticker with multiple lots', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
        {
          id: '2',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 50,
          costPerShare: 160.00,
          totalCost: 8000,
          purchaseDate: '2024-02-01',
          portfolios: ['Growth'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const summaries = calculateTickerSummaries(lots);

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        ticker: 'AAPL',
        totalShares: 150, // 100 + 50
        totalCost: 23000, // 15000 + 8000
        averageCostPerShare: 153.33333333333334, // 23000 / 150
        lotCount: 2,
        earliestPurchase: '2024-01-15',
        latestPurchase: '2024-02-01',
        portfolios: ['Growth', 'Tech'], // Sorted alphabetically
      });
    });

    it('should handle multiple tickers', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
        {
          id: '2',
          ticker: 'MSFT',
          companyName:'Microsoft',
          shares: 50,
          costPerShare: 380.00,
          totalCost: 19000,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          baseYield: 1.2,
          expectedFiveYearGrowth:12,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const summaries = calculateTickerSummaries(lots);

      expect(summaries).toHaveLength(2);
      // Should be sorted by totalCost descending (MSFT first)
      expect(summaries[0].ticker).toBe('MSFT');
      expect(summaries[1].ticker).toBe('AAPL');
    });

    it('should aggregate unique portfolios across lots', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech', 'Growth'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
        {
          id: '2',
          ticker: 'AAPL',
          companyName:'Apple Inc',
          shares: 50,
          costPerShare: 160.00,
          totalCost: 8000,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech', 'Dividend'], // Tech is duplicate
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const summaries = calculateTickerSummaries(lots);

      expect(summaries[0].portfolios).toEqual(['Dividend', 'Growth', 'Tech']); // Unique and sorted
    });

    it('should handle ticker without metadata', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'UNKNOWN',
          companyName:'',
          shares: 100,
          costPerShare: 50.00,
          totalCost: 5000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const tickers: Ticker[] = []; // No matching ticker metadata

      const summaries = calculateTickerSummaries(lots, tickers);

      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        ticker: 'UNKNOWN',
        companyName:'',
        baseYield: 0,
        expectedFiveYearGrowth:0,
      });
    });

    it('should sort by total cost descending', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 100.00,
          totalCost: 10000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '2',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 500.00,
          totalCost: 25000,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '3',
          ticker: 'GOOGL',
          shares: 25,
          costPerShare: 600.00,
          totalCost: 15000,
          purchaseDate: '2024-03-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const summaries = calculateTickerSummaries(lots);

      expect(summaries.map(s => s.ticker)).toEqual(['MSFT', 'GOOGL', 'AAPL']);
    });

    it('should handle empty lots array', () => {
      const summaries = calculateTickerSummaries([]);

      expect(summaries).toEqual([]);
    });

    // ── Short position tests ─────────────────────────────────────────────────

    it('should assign positionType long for a normal lot', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'AAPL', companyName: 'Apple Inc',
          shares: 100, costPerShare: 150, totalCost: 15000,
          purchaseDate: '2024-01-15', portfolios: ['Tech'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          isShort: false,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries[0].positionType).toBe('long');
    });

    it('should assign positionType long when isShort is undefined (backward compat)', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'AAPL', companyName: 'Apple Inc',
          shares: 100, costPerShare: 150, totalCost: 15000,
          purchaseDate: '2024-01-15', portfolios: ['Tech'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          // isShort deliberately omitted
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries[0].positionType).toBe('long');
    });

    it('should assign positionType short for a short lot', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'NVDA', companyName: 'NVIDIA',
          shares: 50, costPerShare: 800, totalCost: 40000,
          purchaseDate: '2024-03-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries).toHaveLength(1);
      expect(summaries[0].positionType).toBe('short');
    });

    it('should produce two rows when a ticker has both long and short lots', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'TSLA', companyName: 'Tesla',
          shares: 100, costPerShare: 200, totalCost: 20000,
          purchaseDate: '2024-01-01', portfolios: ['Retirement'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          isShort: false,
        },
        {
          id: '2', ticker: 'TSLA', companyName: 'Tesla',
          shares: 30, costPerShare: 250, totalCost: 7500,
          purchaseDate: '2024-06-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries).toHaveLength(2);
      const types = summaries.map(s => s.positionType).sort();
      expect(types).toEqual(['long', 'short']);
    });

    it('long row should only reflect long lots when ticker has mixed positions', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'TSLA', companyName: 'Tesla',
          shares: 100, costPerShare: 200, totalCost: 20000,
          purchaseDate: '2024-01-01', portfolios: ['Retirement'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          isShort: false,
        },
        {
          id: '2', ticker: 'TSLA', companyName: 'Tesla',
          shares: 30, costPerShare: 250, totalCost: 7500,
          purchaseDate: '2024-06-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      const longRow = summaries.find(s => s.positionType === 'long')!;
      expect(longRow.totalShares).toBe(100);
      expect(longRow.totalCost).toBe(20000);
      expect(longRow.averageCostPerShare).toBe(200);
      expect(longRow.lotCount).toBe(1);
    });

    it('short row should only reflect short lots when ticker has mixed positions', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'TSLA', companyName: 'Tesla',
          shares: 100, costPerShare: 200, totalCost: 20000,
          purchaseDate: '2024-01-01', portfolios: ['Retirement'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          isShort: false,
        },
        {
          id: '2', ticker: 'TSLA', companyName: 'Tesla',
          shares: 30, costPerShare: 250, totalCost: 7500,
          purchaseDate: '2024-06-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      const shortRow = summaries.find(s => s.positionType === 'short')!;
      expect(shortRow.totalShares).toBe(30);
      expect(shortRow.totalCost).toBe(7500);   // proceeds
      expect(shortRow.averageCostPerShare).toBe(250); // avg sale price
      expect(shortRow.lotCount).toBe(1);
    });

    it('should aggregate multiple short lots for the same ticker', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'GME', companyName: 'GameStop',
          shares: 50, costPerShare: 100, totalCost: 5000,
          purchaseDate: '2024-01-10', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
        {
          id: '2', ticker: 'GME', companyName: 'GameStop',
          shares: 50, costPerShare: 120, totalCost: 6000,
          purchaseDate: '2024-02-10', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries).toHaveLength(1);
      const shortRow = summaries[0];
      expect(shortRow.positionType).toBe('short');
      expect(shortRow.totalShares).toBe(100);        // 50 + 50
      expect(shortRow.totalCost).toBe(11000);        // 5000 + 6000 (total proceeds)
      expect(shortRow.averageCostPerShare).toBe(110); // 11000 / 100 (avg sale price)
      expect(shortRow.lotCount).toBe(2);
    });

    it('short averageCostPerShare should be zero when totalShares is zero', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'GME', companyName: 'GameStop',
          shares: 0, costPerShare: 100, totalCost: 0,
          purchaseDate: '2024-01-10', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries[0].averageCostPerShare).toBe(0);
    });

    it('mixed ticker should produce two separate entries each with correct ticker and portfolios', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'NVDA', companyName: 'NVIDIA',
          shares: 100, costPerShare: 500, totalCost: 50000,
          purchaseDate: '2024-01-01', portfolios: ['Growth'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: true,
          isShort: false,
        },
        {
          id: '2', ticker: 'NVDA', companyName: 'NVIDIA',
          shares: 20, costPerShare: 700, totalCost: 14000,
          purchaseDate: '2024-05-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const summaries = calculateTickerSummaries(lots);
      expect(summaries).toHaveLength(2);
      summaries.forEach(s => expect(s.ticker).toBe('NVDA'));
      const longRow = summaries.find(s => s.positionType === 'long')!;
      const shortRow = summaries.find(s => s.positionType === 'short')!;
      expect(longRow.portfolios).toEqual(['Growth']);
      expect(shortRow.portfolios).toEqual(['Trading']);
    });

    it('short lot should inherit ticker metadata (companyName, baseYield)', () => {
      const lots: TickerLot[] = [
        {
          id: '1', ticker: 'KO', companyName: '',
          shares: 200, costPerShare: 60, totalCost: 12000,
          purchaseDate: '2024-01-01', portfolios: ['Trading'],
          baseYield: 0, expectedFiveYearGrowth: 0,
          isDividend: false, calculateAccumulatedProfitLoss: false,
          isShort: true,
        },
      ];
      const tickers: Ticker[] = [
        { id: '1', symbol: 'KO', companyName: 'Coca-Cola', baseYield: 3.1, expectedFiveYearGrowth: 5 },
      ];
      const summaries = calculateTickerSummaries(lots, tickers);
      expect(summaries[0].companyName).toBe('Coca-Cola');
      expect(summaries[0].baseYield).toBe(3.1);
    });

    it('should calculate fractional shares correctly', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100.5,
          costPerShare: 150.00,
          totalCost: 15075,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50.25,
          costPerShare: 160.00,
          totalCost: 8040,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const summaries = calculateTickerSummaries(lots);

      expect(summaries[0].totalShares).toBe(150.75); // 100.5 + 50.25
      // (15075 + 8040) / 150.75 = 23115 / 150.75 = 153.333...
      expect(summaries[0].averageCostPerShare).toBeCloseTo(153.33, 2);
    });
  });

  describe('getLotsForTicker', () => {
    const lots: TickerLot[] = [
      {
        id: '1',
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 150.00,
        totalCost: 15000,
        purchaseDate: '2024-03-01', // Newer date
        portfolios: ['Tech'],
        baseYield: 0,
        expectedFiveYearGrowth:0,
        isDividend: false,
        calculateAccumulatedProfitLoss: true,
        companyName:'',
      },
      {
        id: '2',
        ticker: 'AAPL',
        shares: 200,
        costPerShare: 140.00,
        totalCost: 28000,
        purchaseDate: '2024-01-15', // Older date, more shares
        portfolios: ['Tech'],
        baseYield: 0,
        expectedFiveYearGrowth:0,
        isDividend: false,
        calculateAccumulatedProfitLoss: true,
        companyName:'',
      },
      {
        id: '3',
        ticker: 'AAPL',
        shares: 50,
        costPerShare: 160.00,
        totalCost: 8000,
        purchaseDate: '2024-01-15', // Same date as id:2, fewer shares
        portfolios: ['Tech'],
        baseYield: 0,
        expectedFiveYearGrowth:0,
        isDividend: false,
        calculateAccumulatedProfitLoss: true,
        companyName:'',
      },
      {
        id: '4',
        ticker: 'AAPL',
        shares: 50,
        costPerShare: 155.00,
        totalCost: 7750,
        purchaseDate: '2024-01-15', // Same date and shares as id:3, lower cost
        portfolios: ['Tech'],
        baseYield: 0,
        expectedFiveYearGrowth:0,
        isDividend: false,
        calculateAccumulatedProfitLoss: true,
        companyName:'',
      },
      {
        id: '5',
        ticker: 'MSFT',
        shares: 100,
        costPerShare: 380.00,
        totalCost: 38000,
        purchaseDate: '2024-02-01',
        portfolios: ['Tech'],
        baseYield: 0,
        expectedFiveYearGrowth:0,
        isDividend: false,
        calculateAccumulatedProfitLoss: true,
        companyName:'',
      },
    ];

    it('should filter by ticker', () => {
      const aaplLots = getLotsForTicker(lots, 'AAPL');

      expect(aaplLots).toHaveLength(4);
      expect(aaplLots.every(lot => lot.ticker === 'AAPL')).toBe(true);
    });

    it('should sort by purchase date (oldest first)', () => {
      const aaplLots = getLotsForTicker(lots, 'AAPL');

      expect(aaplLots[0].purchaseDate).toBe('2024-01-15');
      expect(aaplLots[aaplLots.length - 1].purchaseDate).toBe('2024-03-01');
    });

    it('should sort by shares (largest first) for same date', () => {
      const aaplLots = getLotsForTicker(lots, 'AAPL');
      const jan15Lots = aaplLots.filter(lot => lot.purchaseDate === '2024-01-15');

      expect(jan15Lots[0].shares).toBe(200); // Largest
      expect(jan15Lots[1].shares).toBe(50);
      expect(jan15Lots[2].shares).toBe(50);
    });

    it('should sort by cost per share (highest first) for same date and shares', () => {
      const aaplLots = getLotsForTicker(lots, 'AAPL');
      const jan15_50ShareLots = aaplLots.filter(
        lot => lot.purchaseDate === '2024-01-15' && lot.shares === 50
      );

      expect(jan15_50ShareLots[0].costPerShare).toBe(160.00); // Highest cost
      expect(jan15_50ShareLots[1].costPerShare).toBe(155.00);
    });

    it('should return empty array for non-existent ticker', () => {
      const lots = getLotsForTicker([], 'GOOGL');

      expect(lots).toEqual([]);
    });

    it('should handle case-sensitive ticker matching', () => {
      const aaplLots = getLotsForTicker(lots, 'aapl');

      expect(aaplLots).toHaveLength(0); // No match due to case
    });
  });

  describe('calculateDividendMetrics', () => {
    it('should calculate weighted yield and annual income', () => {
      const summaries = [
        {
          ticker: 'AAPL',
          companyName:'Apple Inc',
          baseYield: 2.0,
          expectedFiveYearGrowth:10,
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Tech'],
          positionType: 'long'
        },
        {
          ticker: 'MSFT',
          companyName:'Microsoft',
          baseYield: 3.0,
          expectedFiveYearGrowth:12,
          totalShares: 50,
          totalCost: 20000,
          averageCostPerShare: 400.00,
          lotCount: 1,
          earliestPurchase: '2024-02-01',
          latestPurchase: '2024-02-01',
          portfolios: ['Tech'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      // Total investment: 15000 + 20000 = 35000
      // AAPL return: 15000 * 0.02 = 300
      // MSFT return: 20000 * 0.03 = 600
      // Total return: 900
      // Weighted yield: (900 / 35000) * 100 = 2.571...%

      expect(metrics.annualDividendIncome).toBe(900);
      expect(metrics.weightedYieldPercentage).toBeCloseTo(2.571, 2);
    });

    it('should handle zero yield', () => {
      const summaries = [
        {
          ticker: 'AAPL',
          companyName:'Apple Inc',
          baseYield: 0,
          expectedFiveYearGrowth:10,
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Tech'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      expect(metrics.annualDividendIncome).toBe(0);
      expect(metrics.weightedYieldPercentage).toBe(0);
    });

    it('should handle empty summaries', () => {
      const metrics = calculateDividendMetrics([]);

      expect(metrics.annualDividendIncome).toBe(0);
      expect(metrics.weightedYieldPercentage).toBe(0);
    });

    it('should handle mixed yields', () => {
      const summaries = [
        {
          ticker: 'AAPL',
          companyName:'Apple Inc',
          baseYield: 0,
          expectedFiveYearGrowth:10,
          totalShares: 100,
          totalCost: 10000,
          averageCostPerShare: 100.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Tech'],
          positionType: 'long'
        },
        {
          ticker: 'T',
          companyName:'AT&T',
          baseYield: 5.0,
          expectedFiveYearGrowth:2,
          totalShares: 500,
          totalCost: 10000,
          averageCostPerShare: 20.00,
          lotCount: 1,
          earliestPurchase: '2024-02-01',
          latestPurchase: '2024-02-01',
          portfolios: ['Dividend'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      // Total investment: 20000
      // AAPL return: 0
      // T return: 10000 * 0.05 = 500
      // Total return: 500
      // Weighted yield: (500 / 20000) * 100 = 2.5%

      expect(metrics.annualDividendIncome).toBe(500);
      expect(metrics.weightedYieldPercentage).toBe(2.5);
    });

    it('should handle high yield stocks', () => {
      const summaries = [
        {
          ticker: 'REIT',
          companyName:'High Yield REIT',
          baseYield: 8.5,
          expectedFiveYearGrowth:5,
          totalShares: 100,
          totalCost: 10000,
          averageCostPerShare: 100.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Dividend'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      expect(metrics.annualDividendIncome).toBeCloseTo(850, 10); // 10000 * 0.085
      expect(metrics.weightedYieldPercentage).toBe(8.5);
    });

    it('should handle fractional percentages', () => {
      const summaries = [
        {
          ticker: 'AAPL',
          companyName:'Apple Inc',
          baseYield: 0.53,
          expectedFiveYearGrowth:10,
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Tech'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      expect(metrics.annualDividendIncome).toBe(79.5); // 15000 * 0.0053
      expect(metrics.weightedYieldPercentage).toBe(0.53);
    });

    it('should weight yields by investment amount', () => {
      const summaries = [
        {
          ticker: 'LOW_YIELD',
          companyName:'Low Yield Corp',
          baseYield: 1.0,
          expectedFiveYearGrowth:10,
          totalShares: 100,
          totalCost: 90000, // Large investment
          averageCostPerShare: 900.00,
          lotCount: 1,
          earliestPurchase: '2024-01-15',
          latestPurchase: '2024-01-15',
          portfolios: ['Tech'],
          positionType: 'long'
        },
        {
          ticker: 'HIGH_YIELD',
          companyName:'High Yield Corp',
          baseYield: 10.0,
          expectedFiveYearGrowth:2,
          totalShares: 100,
          totalCost: 10000, // Small investment
          averageCostPerShare: 100.00,
          lotCount: 1,
          earliestPurchase: '2024-02-01',
          latestPurchase: '2024-02-01',
          portfolios: ['Dividend'],
          positionType: 'long'
        },
      ];

      const metrics = calculateDividendMetrics(summaries);

      // Total investment: 100000
      // LOW_YIELD return: 90000 * 0.01 = 900
      // HIGH_YIELD return: 10000 * 0.10 = 1000
      // Total return: 1900
      // Weighted yield: (1900 / 100000) * 100 = 1.9%
      // Note: Even though HIGH_YIELD has 10% yield, its small investment
      // means the portfolio's weighted yield is closer to LOW_YIELD's 1%

      expect(metrics.annualDividendIncome).toBe(1900);
      expect(metrics.weightedYieldPercentage).toBe(1.9);
    });
  });
});
