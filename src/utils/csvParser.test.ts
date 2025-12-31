// ============================================
// FILE: src/utils/csvParser.test.ts
// CSV Parser Test Suite
// ============================================

import { describe, it, expect } from 'vitest';
import {
  parseCSVLine,
  parsePortfolioField,
  parseCSVText,
  validateFileSize,
  validateRowCount,
} from './csvParser';
import type { ParsedCSVData } from '../types';

describe('csvParser', () => {
  describe('parseCSVLine', () => {
    it('should parse simple comma-separated values', () => {
      const line = 'AAPL,100,150.50,2024-01-15';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', '100', '150.50', '2024-01-15']);
    });

    it('should handle quoted fields with commas', () => {
      const line = '"Apple, Inc.",100,150.50,"Tech Portfolio"';
      const result = parseCSVLine(line);
      expect(result).toEqual(['Apple, Inc.', '100', '150.50', 'Tech Portfolio']);
    });

    it('should handle escaped quotes within quoted fields', () => {
      const line = '"Company ""Special"" Name",100,150.50';
      const result = parseCSVLine(line);
      expect(result).toEqual(['Company "Special" Name', '100', '150.50']);
    });

    it('should handle empty fields', () => {
      const line = 'AAPL,,150.50,';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', '', '150.50', '']);
    });

    it('should handle fields with only spaces', () => {
      const line = 'AAPL,  ,150.50,  ';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', '', '150.50', '']);
    });

    it('should handle quoted empty fields', () => {
      const line = 'AAPL,"",150.50,""';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', '', '150.50', '']);
    });

    it('should handle mix of quoted and unquoted fields', () => {
      const line = 'AAPL,"Apple Inc",100,150.50';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', 'Apple Inc', '100', '150.50']);
    });

    it('should trim whitespace from unquoted fields', () => {
      const line = '  AAPL  ,  100  ,  150.50  ';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL', '100', '150.50']);
    });

    it('should trim whitespace even in quoted fields', () => {
      const line = '"  AAPL  ","  Apple Inc  "';
      const result = parseCSVLine(line);
      // Current implementation trims all values
      expect(result).toEqual(['AAPL', 'Apple Inc']);
    });

    it('should handle single field', () => {
      const line = 'AAPL';
      const result = parseCSVLine(line);
      expect(result).toEqual(['AAPL']);
    });

    it('should handle empty line', () => {
      const line = '';
      const result = parseCSVLine(line);
      expect(result).toEqual(['']);
    });
  });

  describe('parsePortfolioField', () => {
    it('should parse single portfolio', () => {
      const result = parsePortfolioField('Tech');
      expect(result).toEqual(['Tech']);
    });

    it('should parse pipe-separated portfolios', () => {
      const result = parsePortfolioField('Tech|Growth|Dividend');
      expect(result).toEqual(['Tech', 'Growth', 'Dividend']);
    });

    it('should trim whitespace from portfolio names', () => {
      const result = parsePortfolioField('  Tech  |  Growth  |  Dividend  ');
      expect(result).toEqual(['Tech', 'Growth', 'Dividend']);
    });

    it('should filter out empty portfolios', () => {
      const result = parsePortfolioField('Tech||Growth|');
      expect(result).toEqual(['Tech', 'Growth']);
    });

    it('should return empty array for empty string', () => {
      const result = parsePortfolioField('');
      expect(result).toEqual([]);
    });

    it('should return empty array for only pipes', () => {
      const result = parsePortfolioField('|||');
      expect(result).toEqual([]);
    });

    it('should handle portfolio with special characters', () => {
      const result = parsePortfolioField('Tech-Growth|High-Yield');
      expect(result).toEqual(['Tech-Growth', 'High-Yield']);
    });
  });

  describe('parseCSVText - Date Parsing', () => {
    it('should parse YYYY-MM-DD format dates', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should parse M/D/YYYY format dates', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,1/15/2024,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should parse MM/DD/YYYY format dates', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,01/15/2024,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should parse YYYY/MM/DD format dates', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024/01/15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should pad single-digit months and days', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,1/5/2024,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-05');
    });
  });

  describe('parseCSVText - Column Normalization', () => {
    it('should normalize "Symbol" to ticker', () => {
      const csv = `Symbol,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('AAPL');
    });

    it('should normalize "Quantity" to shares', () => {
      const csv = `Ticker,Quantity,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].shares).toBe(100);
    });

    it('should normalize "Qty" to shares', () => {
      const csv = `Ticker,Qty,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].shares).toBe(100);
    });

    it('should normalize "Price" to costPerShare', () => {
      const csv = `Ticker,Shares,Price,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].costPerShare).toBe(150.50);
    });

    it('should normalize "Purchase Date" to purchaseDate (case-insensitive)', () => {
      const csv = `Ticker,Shares,Cost,PurchaseDate,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should handle headers with spaces', () => {
      const csv = `Ticker,Shares,Cost Per Share,Purchase Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('AAPL');
      expect(result.rows[0].costPerShare).toBe(150.50);
      expect(result.rows[0].purchaseDate).toBe('2024-01-15');
    });

    it('should handle mixed case headers', () => {
      const csv = `TICKER,SHARES,COSTPERSHARE,PURCHASEDATE,PORTFOLIOS
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('AAPL');
      expect(result.rows[0].shares).toBe(100);
      expect(result.rows[0].costPerShare).toBe(150.50);
    });

    it('should normalize "Company Name" to companyName', () => {
      const csv = `Ticker,CompanyName,Shares,Cost,Date,Portfolio
AAPL,Apple Inc,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].companyName).toBe('Apple Inc');
    });

    it('should normalize "Yield" to baseYield', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,Yield
AAPL,100,150.50,2024-01-15,Tech,2.5`;
      const result = parseCSVText(csv);
      expect(result.rows[0].baseYield).toBe(2.5);
    });
  });

  describe('parseCSVText - Boolean Fields', () => {
    it('should parse "true" as true', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL,IsDividend
AAPL,100,150.50,2024-01-15,Tech,true,false`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBe(true);
      expect(result.rows[0].isDividend).toBe(false);
    });

    it('should parse "yes" as true', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL
AAPL,100,150.50,2024-01-15,Tech,yes`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBe(true);
    });

    it('should parse "1" as true', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,IsDividend
AAPL,100,150.50,2024-01-15,Tech,1`;
      const result = parseCSVText(csv);
      expect(result.rows[0].isDividend).toBe(true);
    });

    it('should parse "false" as false', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL
AAPL,100,150.50,2024-01-15,Tech,false`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBe(false);
    });

    it('should parse "no" as false', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,IsDividend
AAPL,100,150.50,2024-01-15,Tech,no`;
      const result = parseCSVText(csv);
      expect(result.rows[0].isDividend).toBe(false);
    });

    it('should parse "0" as false', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL
AAPL,100,150.50,2024-01-15,Tech,0`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBe(false);
    });

    it('should parse empty boolean field as undefined', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL
AAPL,100,150.50,2024-01-15,Tech,`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBeUndefined();
    });

    it('should handle case-insensitive boolean values', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,CalculatePL,IsDividend
AAPL,100,150.50,2024-01-15,Tech,TRUE,YES`;
      const result = parseCSVText(csv);
      expect(result.rows[0].calculatePL).toBe(true);
      expect(result.rows[0].isDividend).toBe(true);
    });
  });

  describe('parseCSVText - Full Parsing', () => {
    it('should parse complete valid CSV', () => {
      const csv = `Ticker,Company Name,Shares,Cost,Date,Portfolio,Base Yield
AAPL,Apple Inc,100,150.50,2024-01-15,Tech,0.5
MSFT,Microsoft,50,380.25,2024-02-01,Tech|Growth,1.2`;
      const result = parseCSVText(csv);

      expect(result.totalRows).toBe(2);
      expect(result.rows).toHaveLength(2);

      expect(result.rows[0]).toMatchObject({
        ticker: 'AAPL',
        companyName: 'Apple Inc',
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        baseYield: 0.5,
      });

      expect(result.rows[1]).toMatchObject({
        ticker: 'MSFT',
        companyName: 'Microsoft',
        shares: 50,
        costPerShare: 380.25,
        purchaseDate: '2024-02-01',
        portfolios: ['Tech', 'Growth'],
        baseYield: 1.2,
      });
    });

    it('should convert ticker to uppercase', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
aapl,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('AAPL');
    });

    it('should include original row data', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].originalRow).toBe('AAPL,100,150.50,2024-01-15,Tech');
      expect(result.rows[0].rowIndex).toBe(1);
    });

    it('should skip empty lines', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech

MSFT,50,380.25,2024-02-01,Growth
`;
      const result = parseCSVText(csv);
      expect(result.totalRows).toBe(2);
    });

    it('should parse Notes field', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio,Notes
AAPL,100,150.50,2024-01-15,Tech,"Good entry point"`;
      const result = parseCSVText(csv);
      expect(result.rows[0].notes).toBe('Good entry point');
    });

    it('should handle multiple portfolios', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech|Growth|Dividend`;
      const result = parseCSVText(csv);
      expect(result.rows[0].portfolios).toEqual(['Tech', 'Growth', 'Dividend']);
    });
  });

  describe('parseCSVText - Error Handling', () => {
    it('should throw error for empty CSV', () => {
      expect(() => parseCSVText('')).toThrow('CSV file is empty');
    });

    it('should throw error for CSV with only whitespace', () => {
      expect(() => parseCSVText('   \n  \n  ')).toThrow('CSV file is empty');
    });

    it('should throw error for missing required columns', () => {
      const csv = `Ticker,Shares
AAPL,100`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
    });

    it('should throw error for missing Ticker column', () => {
      const csv = `Shares,Cost,Date,Portfolio
100,150.50,2024-01-15,Tech`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
      expect(() => parseCSVText(csv)).toThrow('Ticker');
    });

    it('should throw error for missing Shares column', () => {
      const csv = `Ticker,Cost,Date,Portfolio
AAPL,150.50,2024-01-15,Tech`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
      expect(() => parseCSVText(csv)).toThrow('shares');
    });

    it('should throw error for missing Cost column', () => {
      const csv = `Ticker,Shares,Date,Portfolio
AAPL,100,2024-01-15,Tech`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
      expect(() => parseCSVText(csv)).toThrow('costPerShare');
    });

    it('should throw error for missing Date column', () => {
      const csv = `Ticker,Shares,Cost,Portfolio
AAPL,100,150.50,Tech`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
      expect(() => parseCSVText(csv)).toThrow('purchaseDate');
    });

    it('should throw error for missing Portfolio column', () => {
      const csv = `Ticker,Shares,Cost,Date
AAPL,100,150.50,2024-01-15`;
      expect(() => parseCSVText(csv)).toThrow('Missing required columns');
      expect(() => parseCSVText(csv)).toThrow('portfolios');
    });

    it('should include error row with empty values for malformed data', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,invalid,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      // Parser will still create row, but shares will be NaN
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].ticker).toBe('AAPL');
      expect(result.rows[0].shares).toBeNaN();
    });
  });

  describe('validateFileSize', () => {
    it('should accept file under 5MB', () => {
      const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
      expect(() => validateFileSize(file)).not.toThrow();
    });

    it('should throw error for file over 5MB', () => {
      // Create a file that's just over 5MB
      const size = 5 * 1024 * 1024 + 1;
      const largeContent = 'x'.repeat(size);
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' });

      expect(() => validateFileSize(file)).toThrow('exceeds the maximum limit of 5MB');
    });

    it('should include file size in error message', () => {
      const size = 6 * 1024 * 1024; // 6MB
      const largeContent = 'x'.repeat(size);
      const file = new File([largeContent], 'test.csv', { type: 'text/csv' });

      expect(() => validateFileSize(file)).toThrow('6.0MB');
    });
  });

  describe('validateRowCount', () => {
    it('should accept data with 1000 rows or less', () => {
      const data: ParsedCSVData = {
        rows: Array(1000).fill({
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        }),
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1000,
      };

      expect(() => validateRowCount(data)).not.toThrow();
    });

    it('should throw error for data over 1000 rows', () => {
      const data: ParsedCSVData = {
        rows: Array(1001).fill({
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 150.50,
          purchaseDate: '2024-01-15',
          portfolios: ['Tech'],
          rowIndex: 1,
          originalRow: 'test',
        }),
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 1001,
      };

      expect(() => validateRowCount(data)).toThrow('exceeds the maximum limit of 1000');
      expect(() => validateRowCount(data)).toThrow('1001 rows');
    });

    it('should accept empty data', () => {
      const data: ParsedCSVData = {
        rows: [],
        headers: ['Ticker', 'Shares', 'Cost', 'Date', 'Portfolio'],
        totalRows: 0,
      };

      expect(() => validateRowCount(data)).not.toThrow();
    });
  });

  describe('Edge Cases and Real-world Scenarios', () => {
    it('should handle CSV with all optional fields', () => {
      const csv = `Ticker,Company Name,Base Yield,Shares,Cost,Date,Portfolio,CalculatePL,IsDividend,Notes
AAPL,Apple Inc,0.5,100,150.50,2024-01-15,Tech,true,false,"Strong buy"`;
      const result = parseCSVText(csv);

      expect(result.rows[0]).toMatchObject({
        ticker: 'AAPL',
        companyName: 'Apple Inc',
        baseYield: 0.5,
        shares: 100,
        costPerShare: 150.50,
        purchaseDate: '2024-01-15',
        portfolios: ['Tech'],
        calculatePL: true,
        isDividend: false,
        notes: 'Strong buy',
      });
    });

    it('should handle fractional shares', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100.5,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].shares).toBe(100.5);
    });

    it('should handle large cost values', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
BRK.A,1,540000.00,2024-01-15,Value`;
      const result = parseCSVText(csv);
      expect(result.rows[0].costPerShare).toBe(540000.00);
    });

    it('should handle ticker symbols with dots', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
BRK.A,10,540000.00,2024-01-15,Value`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('BRK.A');
    });

    it('should handle ticker symbols with hyphens', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
BRK-A,10,340000.00,2024-01-15,Value`;
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('BRK-A');
    });

    it('should preserve headers in result', () => {
      const csv = `Ticker,Shares,Cost Per Share,Purchase Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.headers).toEqual(['Ticker', 'Shares', 'Cost Per Share', 'Purchase Date', 'Portfolio']);
    });

    it('should handle CSV with BOM (Byte Order Mark)', () => {
      const csv = '\uFEFFTicker,Shares,Cost,Date,Portfolio\nAAPL,100,150.50,2024-01-15,Tech';
      const result = parseCSVText(csv);
      expect(result.rows[0].ticker).toBe('AAPL');
    });

    it('should handle very long notes field', () => {
      const longNote = 'A'.repeat(500);
      const csv = `Ticker,Shares,Cost,Date,Portfolio,Notes
AAPL,100,150.50,2024-01-15,Tech,"${longNote}"`;
      const result = parseCSVText(csv);
      expect(result.rows[0].notes).toBe(longNote);
    });

    it('should handle zero shares (edge case)', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,0,150.50,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].shares).toBe(0);
    });

    it('should handle zero cost (edge case)', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,0,2024-01-15,Tech`;
      const result = parseCSVText(csv);
      expect(result.rows[0].costPerShare).toBe(0);
    });

    it('should handle multiple rows with same ticker', () => {
      const csv = `Ticker,Shares,Cost,Date,Portfolio
AAPL,100,150.50,2024-01-15,Tech
AAPL,50,155.00,2024-02-01,Tech`;
      const result = parseCSVText(csv);
      expect(result.totalRows).toBe(2);
      expect(result.rows[0].ticker).toBe('AAPL');
      expect(result.rows[1].ticker).toBe('AAPL');
      expect(result.rows[0].shares).toBe(100);
      expect(result.rows[1].shares).toBe(50);
    });
  });
});
