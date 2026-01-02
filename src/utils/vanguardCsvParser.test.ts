// ============================================
// FILE: src/utils/vanguardCsvParser.test.ts
// Vanguard CSV Parser Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  parseVanguardCSV,
  detectSectionBoundary,
  parseHoldingsSection,
  parseTransactionsSection,
  validateVanguardFileSize,
} from './vanguardCsvParser';

describe('vanguardCsvParser', () => {
  describe('detectSectionBoundary', () => {
    it('should detect both holdings and transactions sections', () => {
      const lines = [
        'Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,',
        '68411173,INVESCO QQQ ETF,QQQ,7,623.93,4367.51,',
        '',
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-07-19,2024-07-22,Buy,Buy,INVESCO QQQ ETF,QQQ,5.00000,477.81,-2389.05,0.0,-2389.05,0.0,CASH,',
      ];

      const boundaries = detectSectionBoundary(lines);

      expect(boundaries.holdingsStart).toBe(0);
      expect(boundaries.holdingsEnd).toBe(1);
      expect(boundaries.transactionsStart).toBe(3);
      expect(boundaries.transactionsEnd).toBe(4);
    });

    it('should handle transactions-only CSV', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-07-19,2024-07-22,Buy,Buy,INVESCO QQQ ETF,QQQ,5.00000,477.81,-2389.05,0.0,-2389.05,0.0,CASH,',
      ];

      const boundaries = detectSectionBoundary(lines);

      expect(boundaries.holdingsStart).toBe(0);
      expect(boundaries.holdingsEnd).toBe(-1); // -1 indicates no holdings section
      expect(boundaries.transactionsStart).toBe(0);
    });

    it('should handle holdings-only CSV', () => {
      const lines = [
        'Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,',
        '68411173,INVESCO QQQ ETF,QQQ,7,623.93,4367.51,',
      ];

      const boundaries = detectSectionBoundary(lines);

      expect(boundaries.holdingsStart).toBe(0);
      expect(boundaries.holdingsEnd).toBe(1);
      expect(boundaries.transactionsStart).toBe(2);
      expect(boundaries.transactionsEnd).toBe(2);
    });

    it('should throw error if no sections found', () => {
      const lines = ['Invalid CSV', 'No headers here'];

      expect(() => detectSectionBoundary(lines)).toThrow('Could not detect Vanguard CSV format');
    });
  });

  describe('parseHoldingsSection', () => {
    it('should parse holdings correctly', () => {
      const lines = [
        'Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,',
        '68411173,INVESCO QQQ ETF,QQQ,7,623.93,4367.51,',
        '68411173,VANGUARD S&P 500 INDEX ETF,VOO,47.192,634.78,29956.54,',
      ];

      const holdings = parseHoldingsSection(lines);

      expect(holdings).toHaveLength(2);
      expect(holdings[0]).toEqual({
        accountNumber: '68411173',
        investmentName: 'INVESCO QQQ ETF',
        symbol: 'QQQ',
        shares: 7,
        sharePrice: 623.93,
        totalValue: 4367.51,
      });
      expect(holdings[1]).toEqual({
        accountNumber: '68411173',
        investmentName: 'VANGUARD S&P 500 INDEX ETF',
        symbol: 'VOO',
        shares: 47.192,
        sharePrice: 634.78,
        totalValue: 29956.54,
      });
    });

    it('should handle empty holdings section', () => {
      const lines: string[] = [];
      const holdings = parseHoldingsSection(lines);
      expect(holdings).toHaveLength(0);
    });

    it('should skip blank rows', () => {
      const lines = [
        'Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,',
        '68411173,INVESCO QQQ ETF,QQQ,7,623.93,4367.51,',
        ',,,,,,',
        '',
      ];

      const holdings = parseHoldingsSection(lines);
      expect(holdings).toHaveLength(1);
    });
  });

  describe('parseTransactionsSection', () => {
    it('should parse buy transaction correctly', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-07-19,2024-07-22,Buy,Buy,INVESCO QQQ ETF,QQQ,5.00000,477.81,-2389.05,0.0,-2389.05,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toEqual({
        accountNumber: '68411173',
        tradeDate: '2024-07-19',
        settlementDate: '2024-07-22',
        transactionType: 'Buy',
        transactionDescription: 'Buy',
        investmentName: 'INVESCO QQQ ETF',
        symbol: 'QQQ',
        shares: 5.0,
        sharePrice: 477.81,
        principalAmount: -2389.05,
        commissionsAndFees: 0.0,
        netAmount: -2389.05,
        accruedInterest: 0.0,
        accountType: 'CASH',
      });
    });

    it('should parse sell transaction with negative shares', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2025-04-25,2025-04-28,Sell,Sell,INVESCO QQQ ETF,QQQ,-33.07100,468.58,15495.98,0.43,15495.98,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].shares).toBe(-33.071);
      expect(transactions[0].commissionsAndFees).toBe(0.43);
    });

    it('should parse dividend transaction', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-10-31,2024-10-31,Dividend,Dividend Received,INVESCO QQQ ETF,QQQ,0.00000,1.0,12.86,0.0,12.86,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].transactionType).toBe('Dividend');
      expect(transactions[0].netAmount).toBe(12.86);
    });

    it('should parse cash transaction without symbol', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-06-27,2024-06-27,Funds Received,Funds received via Electronic Bank Transfer,CASH,,0.00000,0.0,250.00,0.0,250.00,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].symbol).toBe('CASH');
      expect(transactions[0].transactionType).toBe('Funds Received');
    });

    it('should skip blank rows', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-07-19,2024-07-22,Buy,Buy,INVESCO QQQ ETF,QQQ,5.00000,477.81,-2389.05,0.0,-2389.05,0.0,CASH,',
        ',,,,,,,,,,,,,,',
        '',
      ];

      const transactions = parseTransactionsSection(lines);
      expect(transactions).toHaveLength(1);
    });

    it('should handle date formats', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,7/19/2024,7/22/2024,Buy,Buy,QQQ,QQQ,5,477.81,-2389.05,0.0,-2389.05,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions[0].tradeDate).toBe('2024-07-19');
      expect(transactions[0].settlementDate).toBe('2024-07-22');
    });
  });

  describe('parseVanguardCSV', () => {
    it('should parse complete Vanguard CSV with both sections', () => {
      const csvText = `Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,
68411173,INVESCO QQQ ETF,QQQ,7,623.93,4367.51,
68411173,VANGUARD S&P 500 INDEX ETF,VOO,47.192,634.78,29956.54,

Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,
68411173,2024-07-19,2024-07-22,Buy,Buy,INVESCO QQQ ETF,QQQ,5.00000,477.81,-2389.05,0.0,-2389.05,0.0,CASH,
68411173,2025-04-25,2025-04-28,Sell,Sell,INVESCO QQQ ETF,QQQ,-33.07100,468.58,15495.98,0.43,15495.98,0.0,CASH,`;

      const result = parseVanguardCSV(csvText);

      expect(result.holdings).toHaveLength(2);
      expect(result.transactions).toHaveLength(2);
      expect(result.parseDate).toBeDefined();

      expect(result.holdings[0].symbol).toBe('QQQ');
      expect(result.transactions[0].transactionType).toBe('Buy');
      expect(result.transactions[1].transactionType).toBe('Sell');
    });

    it('should throw error on empty CSV', () => {
      expect(() => parseVanguardCSV('')).toThrow('CSV file is empty');
    });

    it('should handle CSV with only whitespace', () => {
      expect(() => parseVanguardCSV('   \n   \n   ')).toThrow('CSV file is empty');
    });
  });

  describe('validateVanguardFileSize', () => {
    it('should accept files under 10MB', () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      expect(() => validateVanguardFileSize(file)).not.toThrow();
    });

    it('should reject files over 10MB', () => {
      // Create a mock file object with size > 10MB
      const largeFile = {
        size: 11 * 1024 * 1024, // 11MB
        name: 'large.csv',
      } as File;

      expect(() => validateVanguardFileSize(largeFile)).toThrow('exceeds the maximum limit of 10MB');
    });
  });

  describe('edge cases', () => {
    it('should handle quoted fields with commas', () => {
      const csvText = `Account Number,Investment Name,Symbol,Shares,Share Price,Total Value,
68411173,"COMPANY, INC.",ABC,10,100.00,1000.00,

Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,
68411173,2024-01-01,2024-01-02,Buy,Buy,"COMPANY, INC.",ABC,10,100.00,-1000.00,0.0,-1000.00,0.0,CASH,`;

      const result = parseVanguardCSV(csvText);

      expect(result.holdings[0].investmentName).toBe('COMPANY, INC.');
      expect(result.transactions[0].investmentName).toBe('COMPANY, INC.');
    });

    it('should handle missing optional fields', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '68411173,2024-07-19,,Buy,,,,5.00000,,,0.0,,0.0,,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].settlementDate).toBeUndefined();
      expect(transactions[0].transactionDescription).toBeUndefined();
    });

    it('should handle null symbol (bond CUSIP case)', () => {
      const lines = [
        'Account Number,Trade Date,Settlement Date,Transaction Type,Transaction Description,Investment Name,Symbol,Shares,Share Price,Principal Amount,Commissions and Fees,Net Amount,Accrued Interest,Account Type,',
        '10743464,2024-01-15,2024-01-16,Buy,Buy,U S TREASURY NOTE 3.75 04/15/26 04/15/23,null,7000,100.0429,7003,0.0,7003,0.0,CASH,',
      ];

      const transactions = parseTransactionsSection(lines);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].symbol).toBe('null'); // Preserved as-is
    });
  });
});
