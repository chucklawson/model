// ============================================
// FILE: src/utils/lotMatching.test.ts
// Lot Matching Engine Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  matchTransactions,
  getMatchingSummary,
  groupResultsBySymbol,
  groupResultsByTaxYear,
  filterByTaxYear,
  getUnmatchedBuys,
} from './lotMatching';
import type { VanguardTransaction } from '../types';

describe('lotMatching', () => {
  describe('FIFO - First In, First Out', () => {
    it('should match single buy to single sell', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 5,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 5,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(1);
      expect(results[0].matchedShares).toBe(10);
      expect(results[0].remainingBuyShares).toBe(0);
      expect(results[0].remainingSellShares).toBe(0);

      // Cost basis = (10 * 150) + 5 = 1505
      // Proceeds = (10 * 180) - 5 = 1795
      // Gain = 1795 - 1505 = 290
      expect(results[0].realizedGainLoss).toBeCloseTo(290, 2);
    });

    it('should match oldest buy first (FIFO)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-02-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 160,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(1);
      expect(results[0].buyTransaction.tradeDate).toBe('2024-01-01'); // Oldest buy
      expect(results[0].buyTransaction.sharePrice).toBe(150);
    });

    it('should match multiple buys to single large sell', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-02-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 15,
          sharePrice: 160,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -20,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(2);

      // First match: Jan buy (10 shares @ 150)
      expect(results[0].matchedShares).toBe(10);
      expect(results[0].buyTransaction.tradeDate).toBe('2024-01-01');

      // Second match: Feb buy (10 shares @ 160)
      expect(results[1].matchedShares).toBe(10);
      expect(results[1].buyTransaction.tradeDate).toBe('2024-02-01');
      expect(results[1].remainingBuyShares).toBe(5); // 15 - 10 = 5 remaining
    });

    it('should match single buy to multiple sells (partial)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 20,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-07-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 190,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(2);

      // First sell matched to first 10 shares
      expect(results[0].matchedShares).toBe(10);
      expect(results[0].remainingBuyShares).toBe(10);

      // Second sell matched to remaining 10 shares
      expect(results[1].matchedShares).toBe(10);
      expect(results[1].remainingBuyShares).toBe(0);
    });
  });

  describe('LIFO - Last In, First Out', () => {
    it('should match newest buy first (LIFO)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-02-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 160,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'LIFO');

      expect(results).toHaveLength(1);
      expect(results[0].buyTransaction.tradeDate).toBe('2024-02-01'); // Newest buy
      expect(results[0].buyTransaction.sharePrice).toBe(160);
    });

    it('should match multiple buys in LIFO order', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-02-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 15,
          sharePrice: 160,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -20,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'LIFO');

      expect(results).toHaveLength(2);

      // First match: Feb buy (15 shares @ 160)
      expect(results[0].matchedShares).toBe(15);
      expect(results[0].buyTransaction.tradeDate).toBe('2024-02-01');

      // Second match: Jan buy (5 shares @ 150)
      expect(results[1].matchedShares).toBe(5);
      expect(results[1].buyTransaction.tradeDate).toBe('2024-01-01');
    });
  });

  describe('Holding Period & Tax Classification', () => {
    it('should classify short-term gains (≤365 days)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results[0].holdingPeriodDays).toBeLessThanOrEqual(365);
      expect(results[0].isLongTerm).toBe(false);
    });

    it('should classify long-term gains (>365 days)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2023-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results[0].holdingPeriodDays).toBeGreaterThan(365);
      expect(results[0].isLongTerm).toBe(true);
    });

    it('should calculate exact holding period in days', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-31',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results[0].holdingPeriodDays).toBe(30); // Jan 1 to Jan 31
    });
  });

  describe('Fees and Cost Basis', () => {
    it('should include buy fees in cost basis', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 10, // $10 fee
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      // Cost basis = (10 * 150) + 10 = 1510
      // Proceeds = 10 * 180 = 1800
      // Gain = 1800 - 1510 = 290
      expect(results[0].realizedGainLoss).toBeCloseTo(290, 2);
    });

    it('should subtract sell fees from proceeds', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 10, // $10 fee
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      // Cost basis = 10 * 150 = 1500
      // Proceeds = (10 * 180) - 10 = 1790
      // Gain = 1790 - 1500 = 290
      expect(results[0].realizedGainLoss).toBeCloseTo(290, 2);
    });

    it('should prorate fees for partial matches', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 20,
          sharePrice: 150,
          commissionsAndFees: 20, // $1 per share
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 10, // $1 per share
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      // Cost basis = (10 * 150) + (20 * 10/20) = 1500 + 10 = 1510
      // Proceeds = (10 * 180) - (10 * 10/10) = 1800 - 10 = 1790
      // Gain = 1790 - 1510 = 280
      expect(results[0].realizedGainLoss).toBeCloseTo(280, 2);
    });
  });

  describe('Multiple Symbols', () => {
    it('should match transactions independently per symbol', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'MSFT',
          shares: 5,
          sharePrice: 300,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'MSFT',
          shares: -5,
          sharePrice: 350,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(2);

      const aaplResult = results.find(r => r.buyTransaction.symbol === 'AAPL');
      const msftResult = results.find(r => r.buyTransaction.symbol === 'MSFT');

      expect(aaplResult).toBeDefined();
      expect(msftResult).toBeDefined();
      expect(aaplResult!.matchedShares).toBe(10);
      expect(msftResult!.matchedShares).toBe(5);
    });
  });

  describe('Dividend Reinvestments', () => {
    it('should treat reinvestments as buy transactions', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Reinvestment',
          symbol: 'AAPL',
          shares: 0.5,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -0.5,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(1);
      expect(results[0].matchedShares).toBe(0.5);
      expect(results[0].buyTransaction.transactionType).toBe('Reinvestment');
    });
  });

  describe('Summary Functions', () => {
    it('should calculate matching summary', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const summary = getMatchingSummary(results);

      expect(summary.totalMatches).toBe(1);
      expect(summary.totalShares).toBe(10);
      expect(summary.totalGainLoss).toBeCloseTo(300, 2);
      expect(summary.shortTermCount).toBe(1);
      expect(summary.longTermCount).toBe(0);
    });

    it('should separate short-term and long-term gains', () => {
      const transactions: VanguardTransaction[] = [
        // Short-term
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        // Long-term
        {
          accountNumber: '123',
          tradeDate: '2023-01-01',
          transactionType: 'Buy',
          symbol: 'MSFT',
          shares: 5,
          sharePrice: 300,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'MSFT',
          shares: -5,
          sharePrice: 350,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const summary = getMatchingSummary(results);

      expect(summary.shortTermCount).toBe(1);
      expect(summary.longTermCount).toBe(1);
      expect(summary.shortTermGainLoss).toBeCloseTo(300, 2);
      expect(summary.longTermGainLoss).toBeCloseTo(250, 2);
    });
  });

  describe('Grouping Functions', () => {
    it('should group results by symbol', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'MSFT',
          shares: 5,
          sharePrice: 300,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'MSFT',
          shares: -5,
          sharePrice: 350,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const grouped = groupResultsBySymbol(results);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped['AAPL']).toHaveLength(1);
      expect(grouped['MSFT']).toHaveLength(1);
    });

    it('should group results by tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -5,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -5,
          sharePrice: 190,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const grouped = groupResultsByTaxYear(results);

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped[2024]).toHaveLength(1);
      expect(grouped[2025]).toHaveLength(1);
    });

    it('should filter by tax year', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -5,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2025-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -5,
          sharePrice: 190,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const filtered2024 = filterByTaxYear(results, 2024);
      const filtered2025 = filterByTaxYear(results, 2025);

      expect(filtered2024).toHaveLength(1);
      expect(filtered2025).toHaveLength(1);
    });
  });

  describe('Unmatched Buys', () => {
    it('should identify unmatched buy lots (open positions)', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 20,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const unmatched = getUnmatchedBuys(transactions, results);

      expect(unmatched).toHaveLength(1);
      expect(unmatched[0].shares).toBe(10); // 20 - 10 = 10 remaining
      expect(unmatched[0].symbol).toBe('AAPL');
    });

    it('should return empty array when all buys are matched', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');
      const unmatched = getUnmatchedBuys(transactions, results);

      expect(unmatched).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should skip CASH transactions', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Funds Received',
          symbol: 'CASH',
          shares: 0,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(0);
    });

    it('should handle fractional shares', () => {
      const transactions: VanguardTransaction[] = [
        {
          accountNumber: '123',
          tradeDate: '2024-01-01',
          transactionType: 'Buy',
          symbol: 'AAPL',
          shares: 10.5,
          sharePrice: 150,
          commissionsAndFees: 0,
        },
        {
          accountNumber: '123',
          tradeDate: '2024-06-01',
          transactionType: 'Sell',
          symbol: 'AAPL',
          shares: -10.5,
          sharePrice: 180,
          commissionsAndFees: 0,
        },
      ];

      const results = matchTransactions(transactions, 'FIFO');

      expect(results).toHaveLength(1);
      expect(results[0].matchedShares).toBe(10.5);
    });
  });
});
