// ============================================
// FILE: src/utils/currentHoldingsCalculations.test.ts
// Current Holdings Calculations Test Suite
// ============================================

import { describe, it, expect } from 'vitest';
import { calculateCurrentHoldings } from './currentHoldingsCalculations';
import type { TickerLot, Ticker } from '../types';

describe('currentHoldingsCalculations', () => {
  describe('calculateCurrentHoldings', () => {
    const tickers: Ticker[] = [
      {
        id: '1',
        symbol: 'AAPL',
        companyName:'Apple Inc',
        baseYield: 0.5,
        expectedFiveYearGrowth:10,
      },
      {
        id: '2',
        symbol: 'MSFT',
        companyName:'Microsoft',
        baseYield: 1.2,
        expectedFiveYearGrowth:12,
      },
      {
        id: '3',
        symbol: 'DIA',
        companyName:'Dow Jones',
        baseYield: 2.0,
        expectedFiveYearGrowth:7,
      },
    ];

    it('should calculate holdings for single portfolio', () => {
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
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings).toHaveLength(1);
      expect(holdings[0]).toMatchObject({
        ticker: 'AAPL',
        costBasis: '150.00',
        unitsOnHand: 100,
        calculateAccumulatedProfitLoss: true,
        baseYield: '0.5',
      });
    });

    it('should aggregate multiple lots of same ticker', () => {
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
          portfolios: ['Tech'],
          baseYield: 0.5,
          expectedFiveYearGrowth:10,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings).toHaveLength(1);
      expect(holdings[0].unitsOnHand).toBe(150); // 100 + 50
      // Weighted average: (15000 + 8000) / 150 = 153.33
      expect(holdings[0].costBasis).toBe('153.33');
    });

    it('should filter by portfolio membership', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
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
          costPerShare: 380.00,
          totalCost: 19000,
          purchaseDate: '2024-02-01',
          portfolios: ['Growth'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings).toHaveLength(1);
      expect(holdings[0].ticker).toBe('AAPL');
    });

    it('should include lots that belong to any of the specified portfolios', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech', 'Growth'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings).toHaveLength(1);
      expect(holdings[0].ticker).toBe('AAPL');
    });

    it('should handle multiple portfolios in filter', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
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
          costPerShare: 380.00,
          totalCost: 19000,
          purchaseDate: '2024-02-01',
          portfolios: ['Growth'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech', 'Growth']);

      expect(holdings).toHaveLength(2);
    });

    it('should round shares to 2 decimal places', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100.12345,
          costPerShare: 150.00,
          totalCost: 15018.52,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].unitsOnHand).toBe(100.12);
    });

    it('should set calculateAccumulatedProfitLoss if any lot has it enabled', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: false,
          calculateAccumulatedProfitLoss: false,
          companyName:'',
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 160.00,
          totalCost: 8000,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].calculateAccumulatedProfitLoss).toBe(true);
    });

    it('should get baseYield from ticker metadata', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].baseYield).toBe('0.5'); // From ticker metadata
    });

    it('should return empty string for baseYield if ticker not found', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'UNKNOWN',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].baseYield).toBe('');
    });

    it('should sort priority tickers first (DIA, VOO, QQQ)', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
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
          ticker: 'DIA',
          shares: 50,
          costPerShare: 380.00,
          totalCost: 19000,
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
          ticker: 'MSFT',
          shares: 25,
          costPerShare: 400.00,
          totalCost: 10000,
          purchaseDate: '2024-03-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].ticker).toBe('DIA'); // Priority ticker first
      expect(holdings[1].ticker).toBe('AAPL'); // Alphabetical
      expect(holdings[2].ticker).toBe('MSFT'); // Alphabetical
    });

    it('should sort non-priority tickers alphabetically', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 380.00,
          totalCost: 19000,
          purchaseDate: '2024-02-01',
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
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
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
          costPerShare: 140.00,
          totalCost: 3500,
          purchaseDate: '2024-03-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings.map(h => h.ticker)).toEqual(['AAPL', 'GOOGL', 'MSFT']);
    });

    it('should handle VOO and QQQ priority tickers', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'VOO',
          shares: 100,
          costPerShare: 450.00,
          totalCost: 45000,
          purchaseDate: '2024-01-15',
          portfolios: ['Index'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '2',
          ticker: 'QQQ',
          shares: 50,
          costPerShare: 400.00,
          totalCost: 20000,
          purchaseDate: '2024-02-01',
          portfolios: ['Index'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '3',
          ticker: 'DIA',
          shares: 25,
          costPerShare: 380.00,
          totalCost: 9500,
          purchaseDate: '2024-03-01',
          portfolios: ['Index'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
        {
          id: '4',
          ticker: 'AAPL',
          shares: 10,
          costPerShare: 150.00,
          totalCost: 1500,
          purchaseDate: '2024-04-01',
          portfolios: ['Index'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Index']);

      // Priority order: DIA, VOO, QQQ, then alphabetical
      expect(holdings[0].ticker).toBe('DIA');
      expect(holdings[1].ticker).toBe('VOO');
      expect(holdings[2].ticker).toBe('QQQ');
      expect(holdings[3].ticker).toBe('AAPL');
    });

    it('should handle empty lots array', () => {
      const holdings = calculateCurrentHoldings([], tickers, ['Tech']);

      expect(holdings).toEqual([]);
    });

    it('should handle no matching portfolios', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Dividend']);

      expect(holdings).toEqual([]);
    });

    it('should handle fractional shares with rounding', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100.555,
          costPerShare: 150.00,
          totalCost: 15083.25,
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
          shares: 50.444,
          costPerShare: 160.00,
          totalCost: 8071.04,
          purchaseDate: '2024-02-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      // 100.555 + 50.444 = 150.999, rounded to 151.00
      expect(holdings[0].unitsOnHand).toBe(151.00);
    });

    it('should handle zero shares edge case', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 0,
          costPerShare: 150.00,
          totalCost: 0,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].unitsOnHand).toBe(0);
      expect(holdings[0].costBasis).toBe('0.00'); // Avoid division by zero
    });

    it('should convert ticker symbol to uppercase', () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'aapl',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickers, ['Tech']);

      expect(holdings[0].ticker).toBe('AAPL');
    });

    it('should handle undefined baseYield in ticker metadata', () => {
      const tickersNoYield: Ticker[] = [
        {
          id: '1',
          symbol: 'AAPL',
          companyName:'Apple Inc',
          baseYield: undefined as any,
          expectedFiveYearGrowth:10,
        },
      ];

      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.00,
          totalCost: 15000,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth:0,
          isDividend: false,
          calculateAccumulatedProfitLoss: true,
          companyName:'',
        },
      ];

      const holdings = calculateCurrentHoldings(lots, tickersNoYield, ['Tech']);

      expect(holdings[0].baseYield).toBe('');
    });
  });
});
