// ============================================
// FILE: src/utils/dividendProcessor.test.ts
// Dividend Processor Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  processDividends,
  getDividendSummary,
  groupDividendsBySymbol,
  groupDividendsByTaxYear,
  filterDividendsByTaxYear,
  getTotalDividendIncome,
  getReinvestedDividends,
  getCashDividends,
  getAverageDividendPerShare,
  getDividendGrowthRate,
} from './dividendProcessor';
import type { VanguardTransaction } from '../types';

describe('dividendProcessor', () => {
  describe('processDividends', () => {
    it('should process dividend transactions', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-10-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          sharePrice: 1.0,
          principalAmount: 12.86,
          commissionsAndFees: 0.0,
          netAmount: 12.86,
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends).toHaveLength(1);
      expect(dividends[0].symbol).toBe('QQQ');
      expect(dividends[0].totalDividend).toBe(12.86);
      expect(dividends[0].isReinvested).toBe(false);
      expect(dividends[0].taxYear).toBe(2024);
    });

    it('should link dividend to reinvestment', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-10-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          sharePrice: 1.0,
          principalAmount: 12.86,
          commissionsAndFees: 0.0,
          netAmount: 12.86,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-10-31',
          transactionType: 'Reinvestment',
          symbol: 'QQQ',
          shares: 0.026,
          sharePrice: 492.0801,
          principalAmount: -12.86,
          commissionsAndFees: 0.0,
          netAmount: -12.86,
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends).toHaveLength(1);
      expect(dividends[0].isReinvested).toBe(true);
      expect(dividends[0].reinvestmentTransaction).toBeDefined();
      expect(dividends[0].reinvestmentTransaction?.shares).toBe(0.026);
    });

    it('should handle multiple dividends from same symbol', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-07-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 12.0,
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends).toHaveLength(3);
      expect(dividends[0].totalDividend).toBe(10.0);
      expect(dividends[1].totalDividend).toBe(11.0);
      expect(dividends[2].totalDividend).toBe(12.0);
    });

    it('should handle dividends from multiple symbols', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'VOO',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 20.0,
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends).toHaveLength(2);
      expect(dividends.find(d => d.symbol === 'QQQ')).toBeDefined();
      expect(dividends.find(d => d.symbol === 'VOO')).toBeDefined();
    });

    it('should calculate dividend per share when shares provided', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-10-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 10, // 10 shares held
          commissionsAndFees: 0,
          netAmount: 25.0, // $25 total
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends[0].dividendPerShare).toBe(2.5); // $25 / 10 shares = $2.50/share
    });

    it('should handle interest transactions like dividends', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-05-13',
          transactionType: 'Interest',
          symbol: 'BOND123',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 340.27,
        },
      ];

      const dividends = processDividends(transactions);

      expect(dividends).toHaveLength(1);
      expect(dividends[0].totalDividend).toBe(340.27);
    });
  });

  describe('getDividendSummary', () => {
    it('should calculate summary statistics', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Reinvestment',
          symbol: 'QQQ',
          shares: 0.05,
          sharePrice: 200,
          commissionsAndFees: 0,
          netAmount: -10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'VOO',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 20.0,
        },
      ];

      const dividends = processDividends(transactions);
      const summary = getDividendSummary(dividends);

      expect(summary.totalDividends).toBe(30.0);
      expect(summary.reinvestedDividends).toBe(10.0);
      expect(summary.cashDividends).toBe(20.0);
      expect(summary.dividendCount).toBe(2);
      expect(summary.reinvestmentCount).toBe(1);
    });

    it('should group by symbol', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'VOO',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 20.0,
        },
      ];

      const dividends = processDividends(transactions);
      const summary = getDividendSummary(dividends);

      expect(summary.bySymbol['QQQ'].totalDividends).toBe(21.0);
      expect(summary.bySymbol['QQQ'].count).toBe(2);
      expect(summary.bySymbol['VOO'].totalDividends).toBe(20.0);
      expect(summary.bySymbol['VOO'].count).toBe(1);
    });

    it('should group by tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-12-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 12.0,
        },
      ];

      const dividends = processDividends(transactions);
      const summary = getDividendSummary(dividends);

      expect(summary.byTaxYear[2024].totalDividends).toBe(21.0);
      expect(summary.byTaxYear[2024].count).toBe(2);
      expect(summary.byTaxYear[2025].totalDividends).toBe(12.0);
      expect(summary.byTaxYear[2025].count).toBe(1);
    });
  });

  describe('grouping functions', () => {
    it('should group dividends by symbol', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'VOO',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 20.0,
        },
      ];

      const dividends = processDividends(transactions);
      const grouped = groupDividendsBySymbol(dividends);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['QQQ']).toHaveLength(1);
      expect(grouped['VOO']).toHaveLength(1);
    });

    it('should group dividends by tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
      ];

      const dividends = processDividends(transactions);
      const grouped = groupDividendsByTaxYear(dividends);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped[2024]).toHaveLength(1);
      expect(grouped[2025]).toHaveLength(1);
    });

    it('should filter by tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
      ];

      const dividends = processDividends(transactions);
      const filtered2024 = filterDividendsByTaxYear(dividends, 2024);
      const filtered2025 = filterDividendsByTaxYear(dividends, 2025);

      expect(filtered2024).toHaveLength(1);
      expect(filtered2024[0].totalDividend).toBe(10.0);
      expect(filtered2025).toHaveLength(1);
      expect(filtered2025[0].totalDividend).toBe(11.0);
    });
  });

  describe('income calculations', () => {
    it('should calculate total dividend income for tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 11.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 12.0,
        },
      ];

      const dividends = processDividends(transactions);
      const income2024 = getTotalDividendIncome(dividends, 2024);
      const income2025 = getTotalDividendIncome(dividends, 2025);

      expect(income2024).toBe(21.0);
      expect(income2025).toBe(12.0);
    });
  });

  describe('reinvestment vs cash', () => {
    it('should separate reinvested and cash dividends', () => {
      const transactions: VanguardTransaction[] = [
        // Reinvested
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 10.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Reinvestment',
          symbol: 'QQQ',
          shares: 0.05,
          commissionsAndFees: 0,
          netAmount: -10.0,
        },
        // Cash
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'VOO',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 20.0,
        },
      ];

      const dividends = processDividends(transactions);
      const reinvested = getReinvestedDividends(dividends);
      const cash = getCashDividends(dividends);

      expect(reinvested).toHaveLength(1);
      expect(reinvested[0].symbol).toBe('QQQ');
      expect(cash).toHaveLength(1);
      expect(cash[0].symbol).toBe('VOO');
    });
  });

  describe('analytics', () => {
    it('should calculate average dividend per share', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 10,
          commissionsAndFees: 0,
          netAmount: 20.0, // $2/share
        },
        {
          accountNumber: '123',
          tradeDate: '2024-04-30',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 10,
          commissionsAndFees: 0,
          netAmount: 30.0, // $3/share
        },
      ];

      const dividends = processDividends(transactions);
      const avgDps = getAverageDividendPerShare(dividends, 'QQQ');

      expect(avgDps).toBe(2.5); // Average of $2 and $3
    });

    it('should calculate dividend growth rate', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2023-12-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 100.0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-12-31',
          transactionType: 'Dividend',
          symbol: 'QQQ',
          shares: 0,
          commissionsAndFees: 0,
          netAmount: 110.0,
        },
      ];

      const dividends = processDividends(transactions);
      const growthRate = getDividendGrowthRate(dividends, 'QQQ', 2023, 2024);

      expect(growthRate).toBeCloseTo(10.0, 2); // 10% growth
    });
  });
});
