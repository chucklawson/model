// ============================================
// FILE: src/utils/vanguardCsvValidator.test.ts
// Vanguard CSV Validator Tests
// ============================================

import { describe, it, expect } from 'vitest';
import {
  validateVanguardCSV,
  getValidationSummary,
} from './vanguardCsvValidator';
import type { ParsedVanguardCSV } from '../types';

describe('vanguardCsvValidator', () => {
  describe('validateVanguardCSV - Holdings', () => {
    it('should validate valid holdings', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '68411173',
            investmentName: 'INVESCO QQQ ETF',
            symbol: 'QQQ',
            shares: 7,
            sharePrice: 623.93,
            totalValue: 4367.51,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should error on missing account number', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '',
            investmentName: 'QQQ',
            symbol: 'QQQ',
            shares: 7,
            sharePrice: 623.93,
            totalValue: 4367.51,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('accountNumber');
    });

    it('should error on missing symbol', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '68411173',
            investmentName: 'QQQ',
            symbol: '',
            shares: 7,
            sharePrice: 623.93,
            totalValue: 4367.51,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'symbol')).toBe(true);
    });

    it('should error on non-positive shares', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '68411173',
            investmentName: 'QQQ',
            symbol: 'QQQ',
            shares: 0,
            sharePrice: 623.93,
            totalValue: 0,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'shares')).toBe(true);
    });

    it('should error on non-positive share price', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '68411173',
            investmentName: 'QQQ',
            symbol: 'QQQ',
            shares: 7,
            sharePrice: 0,
            totalValue: 0,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'sharePrice')).toBe(true);
    });

    it('should warn on total value mismatch', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '68411173',
            investmentName: 'QQQ',
            symbol: 'QQQ',
            shares: 7,
            sharePrice: 623.93,
            totalValue: 5000.00, // Should be 4367.51
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.field === 'totalValue')).toBe(true);
    });
  });

  describe('validateVanguardCSV - Transactions', () => {
    it('should validate valid buy transaction', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
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
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate valid sell transaction', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2025-04-25',
            settlementDate: '2025-04-28',
            transactionType: 'Sell',
            transactionDescription: 'Sell',
            investmentName: 'QQQ',
            symbol: 'QQQ',
            shares: -33.071,
            sharePrice: 468.58,
            principalAmount: 15495.98,
            commissionsAndFees: 0.43,
            netAmount: 15495.98,
            accruedInterest: 0.0,
            accountType: 'CASH',
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
    });

    it('should error on missing trade date', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '',
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'tradeDate')).toBe(true);
    });

    it('should error on invalid date format', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '07/19/2024', // Not YYYY-MM-DD
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'tradeDate' && e.message.includes('format'))).toBe(true);
    });

    it('should error on future trade date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: futureDateStr,
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('future'))).toBe(true);
    });

    it('should error on settlement before trade date', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-22',
            settlementDate: '2024-07-19', // Before trade date
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'settlementDate')).toBe(true);
    });

    it('should error on missing transaction type', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: '',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'transactionType')).toBe(true);
    });

    it('should warn on unknown transaction type', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: 'Unknown Type',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.field === 'transactionType')).toBe(true);
    });

    it('should error on buy with non-positive shares', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: -5.0, // Should be positive
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('positive'))).toBe(true);
    });

    it('should error on sell with positive shares', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: 'Sell',
            symbol: 'QQQ',
            shares: 5.0, // Should be negative
            sharePrice: 477.81,
            commissionsAndFees: 0.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('negative'))).toBe(true);
    });

    it('should error on negative fees', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: 'Buy',
            symbol: 'QQQ',
            shares: 5.0,
            sharePrice: 477.81,
            commissionsAndFees: -10.0, // Should be >= 0
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'commissionsAndFees')).toBe(true);
    });

    it('should allow cash transactions without symbol', () => {
      const data: ParsedVanguardCSV = {
        holdings: [],
        transactions: [
          {
            accountNumber: '68411173',
            tradeDate: '2024-07-19',
            transactionType: 'Funds Received',
            symbol: 'CASH',
            shares: 0,
            commissionsAndFees: 0.0,
            netAmount: 250.0,
          },
        ],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
    });
  });

  describe('getValidationSummary', () => {
    it('should return success message for valid data', () => {
      const result = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const summary = getValidationSummary(result);

      expect(summary).toBe('Validation passed with no errors.');
    });

    it('should return error count', () => {
      const result = {
        isValid: false,
        errors: [
          { row: 1, field: 'test', message: 'Error 1' },
          { row: 2, field: 'test', message: 'Error 2' },
        ],
        warnings: [],
      };

      const summary = getValidationSummary(result);

      expect(summary).toContain('2 errors');
    });

    it('should return warning count', () => {
      const result = {
        isValid: false,
        errors: [
          { row: 1, field: 'test', message: 'Error' },
        ],
        warnings: [
          { row: 1, field: 'test', message: 'Warning 1' },
          { row: 2, field: 'test', message: 'Warning 2' },
          { row: 3, field: 'test', message: 'Warning 3' },
        ],
      };

      const summary = getValidationSummary(result);

      expect(summary).toContain('1 error');
      expect(summary).toContain('3 warnings');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple errors for same row', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '',
            investmentName: 'QQQ',
            symbol: '',
            shares: 0,
            sharePrice: 0,
            totalValue: 0,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should validate symbol formats', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '123',
            investmentName: 'Test',
            symbol: 'AAPL',
            shares: 10,
            sharePrice: 150,
            totalValue: 1500,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
    });

    it('should handle special symbols like null (bonds)', () => {
      const data: ParsedVanguardCSV = {
        holdings: [
          {
            accountNumber: '123',
            investmentName: 'US Treasury',
            symbol: 'null',
            shares: 7000,
            sharePrice: 100,
            totalValue: 700000,
          },
        ],
        transactions: [],
        parseDate: new Date().toISOString(),
      };

      const result = validateVanguardCSV(data);

      expect(result.isValid).toBe(true);
    });
  });
});
