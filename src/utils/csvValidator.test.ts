// ============================================
// FILE: src/utils/csvValidator.test.ts
// CSV Validator Test Suite
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateRow,
  isDuplicateLot,
  validateCSVData,
  getValidationSummary,
  getMissingPortfolios,
  getUniqueTickers,
  tickerExists,
} from './csvValidator';
import type { ParsedCSVRow, ParsedCSVData, TickerLot, Portfolio, Ticker } from '../types';

describe('csvValidator', () => {
  describe('validateRow', () => {
    const existingPortfolios = new Set(['tech', 'growth', 'dividend']);

    describe('Ticker Validation', () => {
      it('should accept valid uppercase ticker', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const tickerErrors = errors.filter(e => e.field === 'ticker');
        expect(tickerErrors).toHaveLength(0);
      });

      it('should reject empty ticker', () => {
        const row: ParsedCSVRow = {
          ticker: '',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'ticker',
          message: 'Ticker symbol is required',
        });
      });

      it('should reject ticker with lowercase letters', () => {
        const row: ParsedCSVRow = {
          ticker: 'aapl',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'ticker',
          message: 'Ticker must be 1-10 uppercase letters',
        });
      });

      it('should reject ticker with numbers', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL123',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'ticker',
          message: 'Ticker must be 1-10 uppercase letters',
        });
      });

      it('should reject ticker with special characters', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL.US',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'ticker',
          message: 'Ticker must be 1-10 uppercase letters',
        });
      });

      it('should reject ticker longer than 10 characters', () => {
        const row: ParsedCSVRow = {
          ticker: 'VERYLONGTICKER',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'ticker',
          message: 'Ticker must be 1-10 uppercase letters',
        });
      });

      it('should accept single character ticker', () => {
        const row: ParsedCSVRow = {
          ticker: 'F',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const tickerErrors = errors.filter(e => e.field === 'ticker');
        expect(tickerErrors).toHaveLength(0);
      });
    });

    describe('Shares Validation', () => {
      it('should accept positive shares', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const sharesErrors = errors.filter(e => e.field === 'shares');
        expect(sharesErrors).toHaveLength(0);
      });

      it('should accept fractional shares', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100.5,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const sharesErrors = errors.filter(e => e.field === 'shares');
        expect(sharesErrors).toHaveLength(0);
      });

      it('should reject zero shares', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 0,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'shares',
          message: 'Shares must be a positive number',
        });
      });

      it('should reject negative shares', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: -100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'shares',
          message: 'Shares must be a positive number',
        });
      });

      it('should reject NaN shares', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: NaN,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'shares',
          message: 'Shares must be a positive number',
        });
      });
    });

    describe('Cost Per Share Validation', () => {
      it('should accept positive cost', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const costErrors = errors.filter(e => e.field === 'costPerShare');
        expect(costErrors).toHaveLength(0);
      });

      it('should accept very large cost values', () => {
        const row: ParsedCSVRow = {
          ticker: 'BRKA',
          shares: 1,
          costPerShare: 540000.00,
          purchaseDate: '2024-01-15',
          portfolios: ['Value'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const costErrors = errors.filter(e => e.field === 'costPerShare');
        expect(costErrors).toHaveLength(0);
      });

      it('should reject zero cost', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 0,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'costPerShare',
          message: 'Cost per share must be a positive number',
        });
      });

      it('should reject negative cost', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: -150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'costPerShare',
          message: 'Cost per share must be a positive number',
        });
      });

      it('should reject NaN cost', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: NaN,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'costPerShare',
          message: 'Cost per share must be a positive number',
        });
      });
    });

    describe('Purchase Date Validation', () => {
      beforeEach(() => {
        // Mock current date to 2024-12-31 for consistent testing
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-12-31T12:00:00Z'));
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should accept valid date in YYYY-MM-DD format', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const dateErrors = errors.filter(e => e.field === 'purchaseDate');
        expect(dateErrors).toHaveLength(0);
      });

      it('should reject empty date', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'purchaseDate',
          message: 'Purchase date is required',
        });
      });

      it('should reject date not in YYYY-MM-DD format', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '01/15/2024',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'purchaseDate',
          message: 'Date must be in YYYY-MM-DD format (e.g., 2024-01-15)',
        });
      });

      it('should reject invalid date', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-02-30', // February doesn't have 30 days
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'purchaseDate',
          message: 'Invalid date',
        });
      });

      it('should reject future date', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2025-01-01',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'purchaseDate',
          message: 'Purchase date cannot be in the future',
        });
      });

      it('should reject date before 1900', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '1899-12-31',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'purchaseDate',
          message: 'Purchase date seems too far in the past',
        });
      });

      it('should accept date from exactly 1900', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '1900-01-01',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const dateErrors = errors.filter(e => e.field === 'purchaseDate');
        expect(dateErrors).toHaveLength(0);
      });

      it('should accept leap year date', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-02-29',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const dateErrors = errors.filter(e => e.field === 'purchaseDate');
        expect(dateErrors).toHaveLength(0);
      });
    });

    describe('Portfolio Validation', () => {
      it('should accept existing portfolio', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const portfolioErrors = errors.filter(e => e.field === 'portfolios');
        expect(portfolioErrors).toHaveLength(0);
      });

      it('should accept multiple portfolios', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech', 'Growth'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const portfolioErrors = errors.filter(e => e.field === 'portfolios');
        expect(portfolioErrors).toHaveLength(0);
      });

      it('should reject empty portfolio array', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: [],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'portfolios',
          message: 'At least one portfolio is required',
        });
      });

      it('should allow non-existent portfolios (will be auto-created)', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['NewPortfolio'],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        // Should not have portfolio errors - new portfolios are auto-created
        const portfolioErrors = errors.filter(e => e.field === 'portfolios');
        expect(portfolioErrors).toHaveLength(0);
      });
    });

    describe('Base Yield Validation', () => {
      it('should accept valid base yield', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 2.5,
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const yieldErrors = errors.filter(e => e.field === 'baseYield');
        expect(yieldErrors).toHaveLength(0);
      });

      it('should accept zero base yield', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: 0,
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const yieldErrors = errors.filter(e => e.field === 'baseYield');
        expect(yieldErrors).toHaveLength(0);
      });

      it('should accept undefined base yield', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: undefined,
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        const yieldErrors = errors.filter(e => e.field === 'baseYield');
        expect(yieldErrors).toHaveLength(0);
      });

      it('should reject negative base yield', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: -2.5,
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'baseYield',
          message: 'Base yield must be 0 or a positive number',
        });
      });

      it('should reject NaN base yield', () => {
        const row: ParsedCSVRow = {
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          baseYield: NaN,
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors).toContainEqual({
          field: 'baseYield',
          message: 'Base yield must be 0 or a positive number',
        });
      });
    });

    describe('Multiple Errors', () => {
      it('should return multiple errors for invalid row', () => {
        const row: ParsedCSVRow = {
          ticker: '',
          shares: -100,
          costPerShare: 0,
          purchaseDate: 'invalid',
          portfolios: [],
          rowIndex: 1,
          originalRow: 'test',
        };
        const errors = validateRow(row, existingPortfolios);
        expect(errors.length).toBeGreaterThanOrEqual(5);
        expect(errors.some(e => e.field === 'ticker')).toBe(true);
        expect(errors.some(e => e.field === 'shares')).toBe(true);
        expect(errors.some(e => e.field === 'costPerShare')).toBe(true);
        expect(errors.some(e => e.field === 'purchaseDate')).toBe(true);
        expect(errors.some(e => e.field === 'portfolios')).toBe(true);
      });
    });
  });

  describe('isDuplicateLot', () => {
    const existingLots: TickerLot[] = [
      {
        id: '1',
        ticker: 'AAPL',
        companyName: 'Apple Inc',
        shares: 100,
        costPerShare: 150.50,
        totalCost: 15050,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        baseYield: 0.5,
        expectedFiveYearGrowth: 10,
        isDividend: false,
        calculatePL: true,
      },
      {
        id: '2',
        ticker: 'MSFT',
        companyName: 'Microsoft',
        shares: 50.25,
        costPerShare: 380.75,
        totalCost: 19132.69,
        purchaseDate: '2024-02-01',
        portfolios: ['Tech'],
        baseYield: 1.2,
        expectedFiveYearGrowth: 12,
        isDividend: false,
        calculatePL: true,
      },
    ];

    it('should detect exact duplicate', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(true);
    });

    it('should detect duplicate with case-insensitive ticker', () => {
      const row: ParsedCSVRow = {
        ticker: 'aapl',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(true);
    });

    it('should handle float comparison tolerance for shares', () => {
      const row: ParsedCSVRow = {
        ticker: 'MSFT',
        shares: 50.250000001, // Within float tolerance
        costPerShare: 380.75,
        purchaseDate: '2024-02-01',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(true);
    });

    it('should handle cent-level tolerance for cost', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 150.505, // Within 1 cent
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(true);
    });

    it('should not match different ticker', () => {
      const row: ParsedCSVRow = {
        ticker: 'GOOGL',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(false);
    });

    it('should not match different shares', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 101,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(false);
    });

    it('should not match different cost (beyond tolerance)', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 151.00, // More than 1 cent difference
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(false);
    });

    it('should not match different date', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-16',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, existingLots)).toBe(false);
    });

    it('should return false for empty existing lots', () => {
      const row: ParsedCSVRow = {
        ticker: 'AAPL',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        rowIndex: 1,
        originalRow: 'test',
      };
      expect(isDuplicateLot(row, [])).toBe(false);
    });
  });

  describe('validateCSVData', () => {
    const existingLots: TickerLot[] = [
      {
        id: '1',
        ticker: 'AAPL',
        companyName: 'Apple Inc',
        shares: 100,
        costPerShare: 150.50,
        totalCost: 15050,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        baseYield: 0.5,
        expectedFiveYearGrowth: 10,
        isDividend: false,
        calculatePL: true,
      },
    ];

    const existingPortfolios: Portfolio[] = [
      { id: '1', name: 'Tech', color: '#blue' },
      { id: '2', name: 'Growth', color: '#green' },
    ];

    it('should validate all rows and return results', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'MSFT',
            shares: 50,
            costPerShare: 380.25,
            purchaseDate: '2024-02-01',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test1',
          },
          {
            ticker: 'GOOGL',
            shares: 25,
            costPerShare: 140.00,
            purchaseDate: '2024-02-15',
            portfolios: ['Growth'],
            rowIndex: 2,
            originalRow: 'test2',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 2,
      };

      const results = validateCSVData(data, existingLots, existingPortfolios);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('valid');
      expect(results[1].status).toBe('valid');
    });

    it('should mark duplicates', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const results = validateCSVData(data, existingLots, existingPortfolios);

      expect(results[0].status).toBe('duplicate');
      expect(results[0].isDuplicate).toBe(true);
      expect(results[0].duplicateReason).toContain('Identical lot already exists');
    });

    it('should mark invalid rows', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: '',
            shares: -100,
            costPerShare: 0,
            purchaseDate: 'invalid',
            portfolios: [],
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const results = validateCSVData(data, existingLots, existingPortfolios);

      expect(results[0].status).toBe('invalid');
      expect(results[0].errors.length).toBeGreaterThan(0);
      expect(results[0].isDuplicate).toBe(false);
    });

    it('should prioritize invalid over duplicate', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: -100, // Invalid
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const results = validateCSVData(data, existingLots, existingPortfolios);

      expect(results[0].status).toBe('invalid');
    });
  });

  describe('getValidationSummary', () => {
    it('should calculate summary statistics', () => {
      const results = [
        {
          row: {} as ParsedCSVRow,
          status: 'valid' as const,
          errors: [],
          isDuplicate: false,
        },
        {
          row: {} as ParsedCSVRow,
          status: 'valid' as const,
          errors: [],
          isDuplicate: false,
        },
        {
          row: {} as ParsedCSVRow,
          status: 'duplicate' as const,
          errors: [],
          isDuplicate: true,
          duplicateReason: 'test',
        },
        {
          row: {} as ParsedCSVRow,
          status: 'invalid' as const,
          errors: [{ field: 'ticker', message: 'Invalid' }],
          isDuplicate: false,
        },
      ];

      const summary = getValidationSummary(results);

      expect(summary.total).toBe(4);
      expect(summary.valid).toBe(2);
      expect(summary.duplicates).toBe(1);
      expect(summary.invalid).toBe(1);
    });

    it('should handle empty results', () => {
      const summary = getValidationSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.valid).toBe(0);
      expect(summary.duplicates).toBe(0);
      expect(summary.invalid).toBe(0);
    });
  });

  describe('getMissingPortfolios', () => {
    const existingPortfolios: Portfolio[] = [
      { id: '1', name: 'Tech', color: '#blue' },
      { id: '2', name: 'Growth', color: '#green' },
    ];

    it('should find missing portfolios', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech', 'Value'], // Value doesn't exist
            rowIndex: 1,
            originalRow: 'test1',
          },
          {
            ticker: 'MSFT',
            shares: 50,
            costPerShare: 380.25,
            purchaseDate: '2024-02-01',
            portfolios: ['Dividend'], // Dividend doesn't exist
            rowIndex: 2,
            originalRow: 'test2',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 2,
      };

      const missing = getMissingPortfolios(data, existingPortfolios);

      expect(missing).toContain('Value');
      expect(missing).toContain('Dividend');
      expect(missing).not.toContain('Tech');
      expect(missing).toHaveLength(2);
    });

    it('should handle case-insensitive matching', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['TECH', 'tech', 'Tech'], // All match existing
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const missing = getMissingPortfolios(data, existingPortfolios);

      expect(missing).toHaveLength(0);
    });

    it('should return sorted unique portfolios', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Value', 'Dividend'],
            rowIndex: 1,
            originalRow: 'test1',
          },
          {
            ticker: 'MSFT',
            shares: 50,
            costPerShare: 380.25,
            purchaseDate: '2024-02-01',
            portfolios: ['Value', 'Income'], // Value is duplicate
            rowIndex: 2,
            originalRow: 'test2',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 2,
      };

      const missing = getMissingPortfolios(data, existingPortfolios);

      expect(missing).toEqual(['Dividend', 'Income', 'Value']); // Alphabetically sorted
    });

    it('should ignore empty portfolio names', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Value', '', '  '], // Empty and whitespace
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const missing = getMissingPortfolios(data, existingPortfolios);

      expect(missing).toEqual(['Value']);
    });
  });

  describe('getUniqueTickers', () => {
    it('should extract unique tickers', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test1',
          },
          {
            ticker: 'MSFT',
            shares: 50,
            costPerShare: 380.25,
            purchaseDate: '2024-02-01',
            portfolios: ['Tech'],
            rowIndex: 2,
            originalRow: 'test2',
          },
          {
            ticker: 'AAPL', // Duplicate
            shares: 50,
            costPerShare: 155.00,
            purchaseDate: '2024-03-01',
            portfolios: ['Growth'],
            rowIndex: 3,
            originalRow: 'test3',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 3,
      };

      const tickers = getUniqueTickers(data);

      expect(tickers).toEqual(['AAPL', 'MSFT']); // Unique and sorted
    });

    it('should convert to uppercase', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'aapl',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1,
      };

      const tickers = getUniqueTickers(data);

      expect(tickers).toEqual(['AAPL']);
    });

    it('should ignore empty tickers', () => {
      const data: ParsedCSVData = {
        rows: [
          {
            ticker: 'AAPL',
            shares: 100,
            costPerShare: 150.50,
            purchaseDate: '2024-01-15',
            portfolios: ['Tech'],
            rowIndex: 1,
            originalRow: 'test1',
          },
          {
            ticker: '',
            shares: 50,
            costPerShare: 380.25,
            purchaseDate: '2024-02-01',
            portfolios: ['Tech'],
            rowIndex: 2,
            originalRow: 'test2',
          },
        ],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 2,
      };

      const tickers = getUniqueTickers(data);

      expect(tickers).toEqual(['AAPL']);
    });
  });

  describe('tickerExists', () => {
    const existingTickers: Ticker[] = [
      {
        id: '1',
        symbol: 'AAPL',
        companyName: 'Apple Inc',
        baseYield: 0.5,
        expectedFiveYearGrowth: 10,
      },
      {
        id: '2',
        symbol: 'MSFT',
        companyName: 'Microsoft',
        baseYield: 1.2,
        expectedFiveYearGrowth: 12,
      },
    ];

    it('should find existing ticker', () => {
      expect(tickerExists('AAPL', existingTickers)).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(tickerExists('aapl', existingTickers)).toBe(true);
      expect(tickerExists('Aapl', existingTickers)).toBe(true);
    });

    it('should return false for non-existent ticker', () => {
      expect(tickerExists('GOOGL', existingTickers)).toBe(false);
    });

    it('should return false for empty ticker list', () => {
      expect(tickerExists('AAPL', [])).toBe(false);
    });
  });
});
