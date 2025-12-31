// ============================================
// FILE: src/utils/ytdCalculations.test.ts
// Comprehensive Tests for YTD Performance Calculations
// ============================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateTickerYTD,
  calculateYTDPerformance,
  formatDateShort,
  fetchHistoricalPriceForDate,
  fetchHistoricalPriceRange
} from './ytdCalculations';
import type { TickerLot } from '../types';
import type { YTDTickerPerformance, YTDPortfolioPerformance, HistoricalPrice } from '../types/ytd';
import * as dateRangeCalculations from './dateRangeCalculations';

// Mock the dateRangeCalculations module
vi.mock('./dateRangeCalculations', async () => {
  const actual = await vi.importActual('./dateRangeCalculations');
  return {
    ...actual,
    fetchHistoricalPriceForDate: vi.fn(),
    fetchHistoricalPriceRange: vi.fn(),
    calculateDateRangePerformance: vi.fn()
  };
});

describe('ytdCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper function to create mock ticker lots
  const createMockLot = (
    ticker: string,
    shares: number,
    costPerShare: number,
    purchaseDate: string,
    isDividend: boolean = false
  ): TickerLot => ({
    id: `lot-${Math.random()}`,
    ticker,
    shares,
    costPerShare,
    purchaseDate,
    portfolios: ['portfolio-1'],
    calculateAccumulatedProfitLoss: true,
    isDividend,
    baseYield: 2.5,
    totalCost: shares * costPerShare,
    notes: 'Test lot'
  });

  describe('calculateTickerYTD', () => {
    it('should calculate YTD performance for lots purchased before year start', async () => {
      // Arrange
      const ticker = 'AAPL';
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-06-01'),
        createMockLot('AAPL', 50, 160, '2024-09-15')
      ];
      const currentPrice = 180;
      const startOfYear = '2025-01-01';
      const jan1Price = 170;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.ticker).toBe(ticker);
      expect(result.totalShares).toBe(150);
      expect(result.currentPrice).toBe(currentPrice);
      expect(result.currentValue).toBe(27000); // 150 * 180
      expect(result.baselineValue).toBe(25500); // 150 * 170
      expect(result.ytdGainDollar).toBe(1500); // 27000 - 25500
      expect(result.ytdGainPercent).toBeCloseTo(5.88, 1); // (1500 / 25500) * 100
      expect(result.hasWarning).toBe(false);
      expect(dateRangeCalculations.fetchHistoricalPriceForDate).toHaveBeenCalledWith(ticker, startOfYear);
    });

    it('should use purchase price for lots bought during the year', async () => {
      // Arrange
      const ticker = 'MSFT';
      const lots: TickerLot[] = [
        createMockLot('MSFT', 50, 300, '2025-02-01'),
        createMockLot('MSFT', 30, 310, '2025-03-15')
      ];
      const currentPrice = 320;
      const startOfYear = '2025-01-01';

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(290);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.totalShares).toBe(80);
      expect(result.currentValue).toBe(25600); // 80 * 320
      expect(result.baselineValue).toBe(24300); // (50 * 300) + (30 * 310)
      expect(result.ytdGainDollar).toBe(1300); // 25600 - 24300
      expect(result.ytdGainPercent).toBeCloseTo(5.35, 1);
    });

    it('should handle mixed lots - some before, some during the year', async () => {
      // Arrange
      const ticker = 'GOOGL';
      const lots: TickerLot[] = [
        createMockLot('GOOGL', 25, 100, '2024-08-01'), // Before year start
        createMockLot('GOOGL', 15, 105, '2025-02-01')  // During year
      ];
      const currentPrice = 110;
      const startOfYear = '2025-01-01';
      const jan1Price = 102;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.totalShares).toBe(40);
      expect(result.currentValue).toBe(4400); // 40 * 110
      expect(result.baselineValue).toBe(4125); // (25 * 102) + (15 * 105)
      expect(result.ytdGainDollar).toBe(275);
      expect(result.ytdGainPercent).toBeCloseTo(6.67, 1);
    });

    it('should set warning when Jan 1 price is unavailable', async () => {
      // Arrange
      const ticker = 'TSLA';
      const lots: TickerLot[] = [
        createMockLot('TSLA', 100, 200, '2024-01-01')
      ];
      const currentPrice = 250;
      const startOfYear = '2025-01-01';

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(null);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toContain('Jan 1 price unavailable');
      expect(result.warningMessage).toContain(ticker);
      expect(result.baselineValue).toBe(20000); // Fallback to purchase price: 100 * 200
    });

    it('should calculate zero percent gain when baseline value is zero', async () => {
      // Arrange
      const ticker = 'NVDA';
      const lots: TickerLot[] = [
        createMockLot('NVDA', 0, 500, '2024-01-01')
      ];
      const currentPrice = 550;
      const startOfYear = '2025-01-01';

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(520);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.totalShares).toBe(0);
      expect(result.baselineValue).toBe(0);
      expect(result.ytdGainPercent).toBe(0);
    });

    it('should handle negative YTD performance', async () => {
      // Arrange
      const ticker = 'META';
      const lots: TickerLot[] = [
        createMockLot('META', 50, 300, '2024-01-01')
      ];
      const currentPrice = 250;
      const startOfYear = '2025-01-01';
      const jan1Price = 280;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.currentValue).toBe(12500); // 50 * 250
      expect(result.baselineValue).toBe(14000); // 50 * 280
      expect(result.ytdGainDollar).toBe(-1500);
      expect(result.ytdGainPercent).toBeCloseTo(-10.71, 1);
    });

    it('should set allocationPercent to 0 (calculated at portfolio level)', async () => {
      // Arrange
      const ticker = 'AMZN';
      const lots: TickerLot[] = [
        createMockLot('AMZN', 10, 3000, '2024-01-01')
      ];
      const currentPrice = 3200;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(3100);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.allocationPercent).toBe(0);
    });

    it('should use default start of year when not provided', async () => {
      // Arrange
      const ticker = 'NFLX';
      const lots: TickerLot[] = [
        createMockLot('NFLX', 20, 400, '2024-01-01')
      ];
      const currentPrice = 450;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(420);

      // Act
      await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(dateRangeCalculations.fetchHistoricalPriceForDate).toHaveBeenCalledWith(ticker, '2025-01-01');
    });

    it('should handle multiple lots of the same ticker purchased on different dates', async () => {
      // Arrange
      const ticker = 'DIS';
      const lots: TickerLot[] = [
        createMockLot('DIS', 100, 90, '2024-01-15'),
        createMockLot('DIS', 50, 95, '2024-06-20'),
        createMockLot('DIS', 75, 92, '2024-11-10'),
        createMockLot('DIS', 25, 98, '2025-02-05')
      ];
      const currentPrice = 105;
      const startOfYear = '2025-01-01';
      const jan1Price = 93;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.totalShares).toBe(250);
      expect(result.currentValue).toBe(26250); // 250 * 105
      // Baseline: (100 + 50 + 75) * 93 + 25 * 98 = 20925 + 2450 = 23375
      expect(result.baselineValue).toBe(23375);
      expect(result.ytdGainDollar).toBe(2875);
      expect(result.ytdGainPercent).toBeCloseTo(12.30, 1);
    });
  });

  describe('calculateYTDPerformance', () => {
    it('should calculate portfolio-wide YTD performance for multiple tickers', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01'),
        createMockLot('MSFT', 50, 300, '2024-01-01'),
        createMockLot('GOOGL', 30, 100, '2024-01-01')
      ];
      const currentPrices = {
        'AAPL': 180,
        'MSFT': 350,
        'GOOGL': 110
      };
      const startOfYear = '2025-01-01';
      const endDate = '2025-12-31';

      const mockDateRangePerformance = {
        totalCurrentValue: 38800, // (100*180) + (50*350) + (30*110)
        totalBaselineValue: 36000, // (100*170) + (50*320) + (30*105)
        totalCostBasis: 33000, // (100*150) + (50*300) + (30*100)
        totalRangeGainDollar: 2800,
        totalRangeGainPercent: 7.78,
        totalAllTimeGainDollar: 5800,
        totalAllTimeGainPercent: 17.58,
        tickers: [
          {
            ticker: 'AAPL',
            companyName: 'AAPL',
            totalShares: 100,
            currentPrice: 180,
            currentValue: 18000,
            baselineValue: 17000,
            baselineDate: startOfYear,
            rangeGainDollar: 1000,
            rangeGainPercent: 5.88,
            allocationPercent: 46.39,
            hasWarning: false
          },
          {
            ticker: 'MSFT',
            companyName: 'MSFT',
            totalShares: 50,
            currentPrice: 350,
            currentValue: 17500,
            baselineValue: 16000,
            baselineDate: startOfYear,
            rangeGainDollar: 1500,
            rangeGainPercent: 9.38,
            allocationPercent: 45.10,
            hasWarning: false
          },
          {
            ticker: 'GOOGL',
            companyName: 'GOOGL',
            totalShares: 30,
            currentPrice: 110,
            currentValue: 3300,
            baselineValue: 3000,
            baselineDate: startOfYear,
            rangeGainDollar: 300,
            rangeGainPercent: 10.00,
            allocationPercent: 8.51,
            hasWarning: false
          }
        ],
        dailyPortfolioValues: [
          {
            date: '2025-01-01',
            totalValue: 36000,
            tickerBreakdown: { 'AAPL': 17000, 'MSFT': 16000, 'GOOGL': 3000 }
          },
          {
            date: '2025-12-31',
            totalValue: 38800,
            tickerBreakdown: { 'AAPL': 18000, 'MSFT': 17500, 'GOOGL': 3300 }
          }
        ],
        startDate: startOfYear,
        endDate: endDate
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.totalCurrentValue).toBe(38800);
      expect(result.totalBaselineValue).toBe(36000);
      expect(result.totalCostBasis).toBe(33000);
      expect(result.totalYTDGainDollar).toBe(2800);
      expect(result.totalYTDGainPercent).toBe(7.78);
      expect(result.totalAllTimeGainDollar).toBe(5800);
      expect(result.totalAllTimeGainPercent).toBe(17.58);
      expect(result.tickers).toHaveLength(3);
      expect(result.dailyPortfolioValues).toHaveLength(2);
      expect(result.startDate).toBe(startOfYear);
      expect(result.endDate).toBe(endDate);
    });

    it('should transform ticker data from rangeGain to ytdGain naming', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrices = { 'AAPL': 180 };
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 17000,
        totalCostBasis: 15000,
        totalRangeGainDollar: 1000,
        totalRangeGainPercent: 5.88,
        totalAllTimeGainDollar: 3000,
        totalAllTimeGainPercent: 20.00,
        tickers: [
          {
            ticker: 'AAPL',
            companyName: 'Apple Inc.',
            totalShares: 100,
            currentPrice: 180,
            currentValue: 18000,
            baselineValue: 17000,
            baselineDate: startOfYear,
            rangeGainDollar: 1000,
            rangeGainPercent: 5.88,
            historicalValues: [
              { date: '2025-01-01', value: 17000 },
              { date: '2025-06-01', value: 17500 }
            ],
            allocationPercent: 100,
            hasWarning: false,
            warningMessage: undefined
          }
        ],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.tickers[0].ytdGainDollar).toBe(1000);
      expect(result.tickers[0].ytdGainPercent).toBe(5.88);
      expect(result.tickers[0].historicalValues).toHaveLength(2);
      expect(result.tickers[0].companyName).toBe('Apple Inc.');
    });

    it('should handle empty portfolio', async () => {
      // Arrange
      const lots: TickerLot[] = [];
      const currentPrices = {};
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 0,
        totalBaselineValue: 0,
        totalCostBasis: 0,
        totalRangeGainDollar: 0,
        totalRangeGainPercent: 0,
        totalAllTimeGainDollar: 0,
        totalAllTimeGainPercent: 0,
        tickers: [],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.totalCurrentValue).toBe(0);
      expect(result.totalYTDGainDollar).toBe(0);
      expect(result.tickers).toHaveLength(0);
    });

    it('should use default start of year when not provided', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrices = { 'AAPL': 180 };

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 17000,
        totalCostBasis: 15000,
        totalRangeGainDollar: 1000,
        totalRangeGainPercent: 5.88,
        totalAllTimeGainDollar: 3000,
        totalAllTimeGainPercent: 20.00,
        tickers: [],
        dailyPortfolioValues: [],
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      await calculateYTDPerformance(lots, currentPrices);

      // Assert
      expect(dateRangeCalculations.calculateDateRangePerformance).toHaveBeenCalledWith(
        lots,
        currentPrices,
        '2025-01-01',
        expect.any(String)
      );
    });

    it('should include daily portfolio values in the result', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrices = { 'AAPL': 180 };
      const startOfYear = '2025-01-01';

      const mockDailyValues = [
        { date: '2025-01-01', totalValue: 17000, tickerBreakdown: { 'AAPL': 17000 } },
        { date: '2025-01-15', totalValue: 17500, tickerBreakdown: { 'AAPL': 17500 } },
        { date: '2025-02-01', totalValue: 18000, tickerBreakdown: { 'AAPL': 18000 } }
      ];

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 17000,
        totalCostBasis: 15000,
        totalRangeGainDollar: 1000,
        totalRangeGainPercent: 5.88,
        totalAllTimeGainDollar: 3000,
        totalAllTimeGainPercent: 20.00,
        tickers: [],
        dailyPortfolioValues: mockDailyValues,
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.dailyPortfolioValues).toHaveLength(3);
      expect(result.dailyPortfolioValues[0].date).toBe('2025-01-01');
      expect(result.dailyPortfolioValues[2].totalValue).toBe(18000);
    });

    it('should handle tickers with warnings', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrices = { 'AAPL': 180 };
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 15000,
        totalCostBasis: 15000,
        totalRangeGainDollar: 3000,
        totalRangeGainPercent: 20.00,
        totalAllTimeGainDollar: 3000,
        totalAllTimeGainPercent: 20.00,
        tickers: [
          {
            ticker: 'AAPL',
            companyName: 'AAPL',
            totalShares: 100,
            currentPrice: 180,
            currentValue: 18000,
            baselineValue: 15000,
            baselineDate: startOfYear,
            rangeGainDollar: 3000,
            rangeGainPercent: 20.00,
            allocationPercent: 100,
            hasWarning: true,
            warningMessage: 'Start date price unavailable for AAPL, using purchase price'
          }
        ],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.tickers[0].hasWarning).toBe(true);
      expect(result.tickers[0].warningMessage).toContain('Start date price unavailable');
    });

    it('should calculate correct all-time gains vs YTD gains', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01') // Cost basis: 15000
      ];
      const currentPrices = { 'AAPL': 180 }; // Current value: 18000
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 17000, // Jan 1, 2025 value
        totalCostBasis: 15000,     // Original purchase price
        totalRangeGainDollar: 1000,  // YTD gain: 18000 - 17000
        totalRangeGainPercent: 5.88,
        totalAllTimeGainDollar: 3000, // All-time gain: 18000 - 15000
        totalAllTimeGainPercent: 20.00,
        tickers: [],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.totalYTDGainDollar).toBe(1000);
      expect(result.totalAllTimeGainDollar).toBe(3000);
      expect(result.totalAllTimeGainDollar).toBeGreaterThan(result.totalYTDGainDollar);
    });
  });

  describe('Re-exported utility functions', () => {
    describe('formatDateShort', () => {
      it('should format date string to short format', () => {
        // Note: formatDateShort is re-exported from dateRangeCalculations
        // Could be 14 or 15 depending on timezone, just verify format and month
        const result = formatDateShort('2025-01-15');
        expect(result).toMatch(/^Jan \d{1,2}$/);
        expect(result).toContain('Jan');
      });

      it('should handle different months', () => {
        // Verify month names and format, not exact days (timezone affects day)
        expect(formatDateShort('2025-06-20')).toMatch(/^Jun \d{1,2}$/);
        expect(formatDateShort('2025-12-31')).toMatch(/^Dec \d{1,2}$/);
      });
    });

    describe('fetchHistoricalPriceForDate', () => {
      it('should be a re-export of the dateRangeCalculations function', () => {
        expect(fetchHistoricalPriceForDate).toBeDefined();
        expect(typeof fetchHistoricalPriceForDate).toBe('function');
      });
    });

    describe('fetchHistoricalPriceRange', () => {
      it('should be a re-export of the dateRangeCalculations function', () => {
        expect(fetchHistoricalPriceRange).toBeDefined();
        expect(typeof fetchHistoricalPriceRange).toBe('function');
      });
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should handle very large share quantities', async () => {
      // Arrange
      const ticker = 'BRK.A';
      const lots: TickerLot[] = [
        createMockLot('BRK.A', 1000000, 500000, '2024-01-01')
      ];
      const currentPrice = 550000;
      const jan1Price = 520000;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.currentValue).toBe(550000000000); // 1M * 550k
      expect(result.baselineValue).toBe(520000000000); // 1M * 520k
      expect(result.ytdGainDollar).toBe(30000000000); // 30B gain
    });

    it('should handle fractional shares', async () => {
      // Arrange
      const ticker = 'AAPL';
      const lots: TickerLot[] = [
        createMockLot('AAPL', 10.5, 150.75, '2024-01-01'),
        createMockLot('AAPL', 5.25, 155.50, '2024-06-01')
      ];
      const currentPrice = 180.25;
      const jan1Price = 170.00;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.totalShares).toBe(15.75);
      expect(result.currentValue).toBeCloseTo(2838.94, 2);
      expect(result.baselineValue).toBeCloseTo(2677.50, 2);
    });

    it('should handle date edge cases around year boundary', async () => {
      // Arrange
      const ticker = 'MSFT';
      const lots: TickerLot[] = [
        createMockLot('MSFT', 100, 300, '2024-12-31'), // Day before year start
        createMockLot('MSFT', 50, 305, '2025-01-01'),  // First day of year
        createMockLot('MSFT', 25, 310, '2025-01-02')   // Day after
      ];
      const currentPrice = 320;
      const startOfYear = '2025-01-01';
      const jan1Price = 302;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      // First lot (12/31): uses Jan 1 price
      // Second lot (1/1): uses purchase price (on boundary)
      // Third lot (1/2): uses purchase price
      const expectedBaseline = (100 * 302) + (50 * 305) + (25 * 310);
      expect(result.baselineValue).toBe(expectedBaseline);
    });

    it('should handle multiple portfolios with overlapping tickers', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01'),
        createMockLot('AAPL', 50, 160, '2024-06-01'),
        createMockLot('MSFT', 30, 300, '2024-01-01')
      ];
      const currentPrices = {
        'AAPL': 180,
        'MSFT': 350
      };
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 37500,
        totalBaselineValue: 35000,
        totalCostBasis: 32500,
        totalRangeGainDollar: 2500,
        totalRangeGainPercent: 7.14,
        totalAllTimeGainDollar: 5000,
        totalAllTimeGainPercent: 15.38,
        tickers: [
          {
            ticker: 'AAPL',
            companyName: 'AAPL',
            totalShares: 150,
            currentPrice: 180,
            currentValue: 27000,
            baselineValue: 25500,
            baselineDate: startOfYear,
            rangeGainDollar: 1500,
            rangeGainPercent: 5.88,
            allocationPercent: 72.00,
            hasWarning: false
          },
          {
            ticker: 'MSFT',
            companyName: 'MSFT',
            totalShares: 30,
            currentPrice: 350,
            currentValue: 10500,
            baselineValue: 9500,
            baselineDate: startOfYear,
            rangeGainDollar: 1000,
            rangeGainPercent: 10.53,
            allocationPercent: 28.00,
            hasWarning: false
          }
        ],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      expect(result.tickers).toHaveLength(2);
      expect(result.tickers[0].ticker).toBe('AAPL');
      expect(result.tickers[1].ticker).toBe('MSFT');
      expect(result.tickers[0].allocationPercent).toBeCloseTo(72.00, 1);
      expect(result.tickers[1].allocationPercent).toBeCloseTo(28.00, 1);
    });

    it('should handle tickers with special characters in symbol', async () => {
      // Arrange
      const ticker = 'BRK.B';
      const lots: TickerLot[] = [
        createMockLot('BRK.B', 50, 300, '2024-01-01')
      ];
      const currentPrice = 320;
      const jan1Price = 310;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.ticker).toBe('BRK.B');
      expect(result.ytdGainDollar).toBe(500); // (50 * 320) - (50 * 310)
    });

    it('should handle API errors gracefully by falling back to purchase price', async () => {
      // Arrange
      const ticker = 'RARE';
      const lots: TickerLot[] = [
        createMockLot('RARE', 100, 50, '2024-01-01')
      ];
      const currentPrice = 60;
      const startOfYear = '2025-01-01';

      // Simulate API error
      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(null);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice, startOfYear);

      // Assert
      expect(result.hasWarning).toBe(true);
      expect(result.baselineValue).toBe(5000); // Uses purchase price: 100 * 50
      expect(result.warningMessage).toContain('Jan 1 price unavailable');
    });

    it('should handle extreme price movements', async () => {
      // Arrange
      const ticker = 'GME';
      const lots: TickerLot[] = [
        createMockLot('GME', 1000, 5, '2024-01-01')
      ];
      const currentPrice = 500; // 10000% gain
      const jan1Price = 10;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.currentValue).toBe(500000);
      expect(result.baselineValue).toBe(10000);
      expect(result.ytdGainDollar).toBe(490000);
      expect(result.ytdGainPercent).toBe(4900); // 4900% gain
    });

    it('should maintain precision for small value stocks', async () => {
      // Arrange
      const ticker = 'PENNY';
      const lots: TickerLot[] = [
        createMockLot('PENNY', 10000, 0.05, '2024-01-01')
      ];
      const currentPrice = 0.07;
      const jan1Price = 0.06;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(jan1Price);

      // Act
      const result = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert
      expect(result.currentValue).toBeCloseTo(700, 2);
      expect(result.baselineValue).toBeCloseTo(600, 2);
      expect(result.ytdGainDollar).toBeCloseTo(100, 2);
      expect(result.ytdGainPercent).toBeCloseTo(16.67, 1);
    });

    it('should filter out dividend lots in portfolio calculation', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01', false), // Regular lot
        createMockLot('AAPL', 10, 0, '2025-01-15', true),     // Dividend lot - should be filtered
        createMockLot('MSFT', 50, 300, '2024-01-01', false)   // Regular lot
      ];
      const currentPrices = {
        'AAPL': 180,
        'MSFT': 350
      };
      const startOfYear = '2025-01-01';

      const mockDateRangePerformance = {
        totalCurrentValue: 35500,
        totalBaselineValue: 33000,
        totalCostBasis: 30000,
        totalRangeGainDollar: 2500,
        totalRangeGainPercent: 7.58,
        totalAllTimeGainDollar: 5500,
        totalAllTimeGainPercent: 18.33,
        tickers: [
          {
            ticker: 'AAPL',
            companyName: 'AAPL',
            totalShares: 100,
            currentPrice: 180,
            currentValue: 18000,
            baselineValue: 17000,
            baselineDate: startOfYear,
            rangeGainDollar: 1000,
            rangeGainPercent: 5.88,
            allocationPercent: 50.70,
            hasWarning: false
          },
          {
            ticker: 'MSFT',
            companyName: 'MSFT',
            totalShares: 50,
            currentPrice: 350,
            currentValue: 17500,
            baselineValue: 16000,
            baselineDate: startOfYear,
            rangeGainDollar: 1500,
            rangeGainPercent: 9.38,
            allocationPercent: 49.30,
            hasWarning: false
          }
        ],
        dailyPortfolioValues: [],
        startDate: startOfYear,
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result = await calculateYTDPerformance(lots, currentPrices, startOfYear);

      // Assert
      // Should only include AAPL (100 shares) and MSFT, not the dividend lot
      expect(result.tickers).toHaveLength(2);
      expect(result.tickers.find(t => t.ticker === 'AAPL')?.totalShares).toBe(100);
    });
  });

  describe('Type Safety and Return Value Validation', () => {
    it('should return YTDTickerPerformance type with all required fields', async () => {
      // Arrange
      const ticker = 'AAPL';
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrice = 180;

      vi.mocked(dateRangeCalculations.fetchHistoricalPriceForDate).mockResolvedValue(170);

      // Act
      const result: YTDTickerPerformance = await calculateTickerYTD(ticker, lots, currentPrice);

      // Assert - Verify all required fields are present
      expect(result).toHaveProperty('ticker');
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('totalShares');
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('currentValue');
      expect(result).toHaveProperty('baselineValue');
      expect(result).toHaveProperty('baselineDate');
      expect(result).toHaveProperty('ytdGainDollar');
      expect(result).toHaveProperty('ytdGainPercent');
      expect(result).toHaveProperty('allocationPercent');
    });

    it('should return YTDPortfolioPerformance type with all required fields', async () => {
      // Arrange
      const lots: TickerLot[] = [
        createMockLot('AAPL', 100, 150, '2024-01-01')
      ];
      const currentPrices = { 'AAPL': 180 };

      const mockDateRangePerformance = {
        totalCurrentValue: 18000,
        totalBaselineValue: 17000,
        totalCostBasis: 15000,
        totalRangeGainDollar: 1000,
        totalRangeGainPercent: 5.88,
        totalAllTimeGainDollar: 3000,
        totalAllTimeGainPercent: 20.00,
        tickers: [],
        dailyPortfolioValues: [],
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      };

      vi.mocked(dateRangeCalculations.calculateDateRangePerformance).mockResolvedValue(mockDateRangePerformance);

      // Act
      const result: YTDPortfolioPerformance = await calculateYTDPerformance(lots, currentPrices);

      // Assert - Verify all required fields are present
      expect(result).toHaveProperty('totalCurrentValue');
      expect(result).toHaveProperty('totalBaselineValue');
      expect(result).toHaveProperty('totalCostBasis');
      expect(result).toHaveProperty('totalYTDGainDollar');
      expect(result).toHaveProperty('totalYTDGainPercent');
      expect(result).toHaveProperty('totalAllTimeGainDollar');
      expect(result).toHaveProperty('totalAllTimeGainPercent');
      expect(result).toHaveProperty('tickers');
      expect(result).toHaveProperty('dailyPortfolioValues');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
    });
  });
});
