// ============================================
// FILE: src/utils/dateRangeCalculations.test.ts
// Date Range Calculations Test Suite
// ============================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateShort,
  fetchHistoricalPriceForDate,
  fetchHistoricalPriceRange,
  calculateTickerDateRangePerformance,
  calculateDateRangePerformance,
} from './dateRangeCalculations';
import * as fmpApiClient from './fmpApiClient';
import type { TickerLot } from '../types';
import type { HistoricalPrice } from '../types/customRange';

// Mock the API client
vi.mock('./fmpApiClient');

describe('dateRangeCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    // Note: Caches in the actual module persist between tests
    // This is expected behavior and tests should account for it
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-03-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-03-15');
    });

    it('should pad single-digit months', () => {
      const date = new Date('2024-01-05T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-05');
    });

    it('should pad single-digit days', () => {
      const date = new Date('2024-12-09T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-12-09');
    });

    it('should handle year-end dates', () => {
      const date = new Date('2024-12-31T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-12-31');
    });

    it('should handle year-start dates', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-01');
    });

    it('should handle leap year dates', () => {
      const date = new Date('2024-02-29T12:00:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-02-29');
    });
  });

  describe('formatDateShort', () => {
    it('should format date as "Mon DD"', () => {
      const result = formatDateShort('2024-03-15');
      // Could be 14 or 15 depending on timezone, just verify format
      expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/);
      expect(result).toContain('Mar');
    });

    it('should handle January', () => {
      const result = formatDateShort('2024-01-05');
      expect(result).toMatch(/^Jan \d{1,2}$/);
    });

    it('should handle December', () => {
      const result = formatDateShort('2024-12-25');
      expect(result).toMatch(/^Dec \d{1,2}$/);
    });

    it('should handle all months correctly', () => {
      const months = [
        ['2024-01-15', 'Jan'],
        ['2024-02-15', 'Feb'],
        ['2024-03-15', 'Mar'],
        ['2024-04-15', 'Apr'],
        ['2024-05-15', 'May'],
        ['2024-06-15', 'Jun'],
        ['2024-07-15', 'Jul'],
        ['2024-08-15', 'Aug'],
        ['2024-09-15', 'Sep'],
        ['2024-10-15', 'Oct'],
        ['2024-11-15', 'Nov'],
        ['2024-12-15', 'Dec'],
      ];

      months.forEach(([input, expectedMonth]) => {
        const result = formatDateShort(input);
        expect(result).toContain(expectedMonth);
      });
    });
  });

  describe('fetchHistoricalPriceForDate', () => {
    it('should fetch historical price for a specific date', async () => {
      const mockResponse = {
        historical: [
          { date: '2024-01-15', close: 150.50 },
          { date: '2024-01-14', close: 149.75 },
        ],
      };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockResponse);

      const price = await fetchHistoricalPriceForDate('TEST1', '2024-01-15');

      expect(price).toBe(150.50);
      // Verify API was called with the correct endpoint and ticker
      expect(fmpApiClient.callFmpApi).toHaveBeenCalled();
      const call = vi.mocked(fmpApiClient.callFmpApi).mock.calls[0][0];
      expect(call.endpoint).toBe('/api/v3/historical-price-full/TEST1');
      expect(call.queryParams).toHaveProperty('from');
      expect(call.queryParams).toHaveProperty('to');
    });

    it('should use most recent price when target date is weekend', async () => {
      const mockResponse = {
        historical: [
          { date: '2024-01-12', close: 150.50 }, // Friday
          { date: '2024-01-11', close: 149.75 }, // Thursday
        ],
      };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockResponse);

      // Target is Saturday 2024-01-13, should get Friday's price
      const price = await fetchHistoricalPriceForDate('AAPL', '2024-01-13');

      expect(price).toBe(150.50);
    });

    it('should cache results for same ticker and date', async () => {
      const mockResponse = {
        historical: [{ date: '2024-01-15', close: 150.50 }],
      };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockResponse);

      // First call
      const price1 = await fetchHistoricalPriceForDate('AAPL-CACHE-TEST', '2024-01-15');
      // Second call (should use cache)
      const price2 = await fetchHistoricalPriceForDate('AAPL-CACHE-TEST', '2024-01-15');

      expect(price1).toBe(150.50);
      expect(price2).toBe(150.50);
      // Should only call API once due to caching
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledTimes(1);
    });

    it('should return null when no historical data available', async () => {
      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({ historical: [] });

      const price = await fetchHistoricalPriceForDate('NODATA', '2024-01-15');

      expect(price).toBeNull();
    });

    it('should return null and log error on API failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fmpApiClient.callFmpApi).mockRejectedValue(new Error('API Error'));

      const price = await fetchHistoricalPriceForDate('ERROR-TEST', '2024-01-15');

      expect(price).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle different tickers separately in cache', async () => {
      const mockResponseAAPL = {
        historical: [{ date: '2024-01-15', close: 150.50 }],
      };
      const mockResponseMSFT = {
        historical: [{ date: '2024-01-15', close: 380.25 }],
      };

      vi.mocked(fmpApiClient.callFmpApi)
        .mockResolvedValueOnce(mockResponseAAPL)
        .mockResolvedValueOnce(mockResponseMSFT);

      const priceAAPL = await fetchHistoricalPriceForDate('CACHE-AAPL', '2024-01-15');
      const priceMSFT = await fetchHistoricalPriceForDate('CACHE-MSFT', '2024-01-15');

      expect(priceAAPL).toBe(150.50);
      expect(priceMSFT).toBe(380.25);
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchHistoricalPriceRange', () => {
    it('should fetch historical price range and sort by date ascending', async () => {
      const mockResponse = {
        historical: [
          { date: '2024-01-17', close: 152.00 },
          { date: '2024-01-15', close: 150.50 },
          { date: '2024-01-16', close: 151.25 },
        ],
      };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockResponse);

      const prices = await fetchHistoricalPriceRange('RANGE1', '2024-01-15', '2024-01-17');

      expect(prices).toHaveLength(3);
      expect(prices[0].date).toBe('2024-01-15');
      expect(prices[1].date).toBe('2024-01-16');
      expect(prices[2].date).toBe('2024-01-17');
    });

    it('should cache results for same parameters', async () => {
      const mockResponse = {
        historical: [{ date: '2024-01-15', close: 150.50 }],
      };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockResponse);

      // First call
      const prices1 = await fetchHistoricalPriceRange('AAPL-RANGE-TEST', '2024-01-15', '2024-01-17');
      // Second call (should use cache)
      const prices2 = await fetchHistoricalPriceRange('AAPL-RANGE-TEST', '2024-01-15', '2024-01-17');

      expect(prices1).toEqual(prices2);
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on API error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(fmpApiClient.callFmpApi).mockRejectedValue(new Error('API Error'));

      const prices = await fetchHistoricalPriceRange('ERROR-RANGE', '2024-01-15', '2024-01-17');

      expect(prices).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should call API with correct parameters', async () => {
      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({ historical: [] });

      await fetchHistoricalPriceRange('PARAMS-TEST', '2024-01-15', '2024-01-17');

      expect(fmpApiClient.callFmpApi).toHaveBeenCalledWith({
        endpoint: '/api/v3/historical-price-full/PARAMS-TEST',
        queryParams: {
          from: '2024-01-15',
          to: '2024-01-17',
        },
      });
    });
  });

  describe('calculateTickerDateRangePerformance', () => {
    it('should calculate performance for ticker with single lot purchased before range', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName: 'Apple Inc',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
        },
      ];

      // Mock start date price
      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({
        historical: [{ date: '2024-01-02', close: 145.00 }],
      });

      const result = await calculateTickerDateRangePerformance(
        'AAPL',
        lots,
        150.50,
        '2024-01-02',
        '2024-01-15'
      );

      expect(result.ticker).toBe('AAPL');
      expect(result.totalShares).toBe(100);
      expect(result.currentPrice).toBe(150.50);
      expect(result.currentValue).toBe(15050); // 100 * 150.50
      expect(result.baselineValue).toBe(14500); // 100 * 145.00 (start date price)
      expect(result.rangeGainDollar).toBe(550); // 15050 - 14500
      expect(result.rangeGainPercent).toBeCloseTo(3.79, 1); // (550 / 14500) * 100
    });

    it('should calculate performance for ticker with lot purchased during range', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          companyName: 'Apple Inc',
          shares: 100,
          costPerShare: 148.00,
          totalCost: 14800,
          purchaseDate: '2024-01-10', // During range
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
        },
      ];

      // Mock start date price (won't be used for this lot)
      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({
        historical: [{ date: '2024-01-02', close: 145.00 }],
      });

      const result = await calculateTickerDateRangePerformance(
        'AAPL',
        lots,
        150.50,
        '2024-01-02',
        '2024-01-15'
      );

      expect(result.baselineValue).toBe(14800); // Uses purchase price, not start date price
      expect(result.rangeGainDollar).toBe(250); // 15050 - 14800
    });

    it('should calculate performance for ticker with multiple lots', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01', // Before range
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 50,
          costPerShare: 148.00,
          totalCost: 7400,
          purchaseDate: '2024-01-10', // During range
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({
        historical: [{ date: '2024-01-02', close: 145.00 }],
      });

      const result = await calculateTickerDateRangePerformance(
        'AAPL',
        lots,
        150.50,
        '2024-01-02',
        '2024-01-15'
      );

      expect(result.totalShares).toBe(150); // 100 + 50
      expect(result.currentValue).toBe(22575); // 150 * 150.50
      // Baseline: (100 * 145.00) + (50 * 148.00) = 14500 + 7400 = 21900
      expect(result.baselineValue).toBe(21900);
      expect(result.rangeGainDollar).toBe(675); // 22575 - 21900
    });

    it('should handle missing start date price with warning', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'WARN-TEST',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Test Company',
        },
      ];

      // Mock no historical data
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({ historical: [] });

      const result = await calculateTickerDateRangePerformance(
        'WARN-TEST',
        lots,
        150.50,
        '2024-01-02',
        '2024-01-15'
      );

      expect(result.hasWarning).toBe(true);
      expect(result.warningMessage).toContain('Start date price unavailable');
      expect(result.baselineValue).toBe(14000); // Falls back to purchase price

      consoleWarnSpy.mockRestore();
    });

    it('should handle zero baseline value gracefully', async () => {
      const lots: TickerLot[] = [];

      const result = await calculateTickerDateRangePerformance(
        'AAPL',
        lots,
        150.50,
        '2024-01-02',
        '2024-01-15'
      );

      expect(result.totalShares).toBe(0);
      expect(result.baselineValue).toBe(0);
      expect(result.rangeGainPercent).toBe(0);
    });
  });

  describe('calculateDateRangePerformance', () => {
    it('should calculate portfolio-wide performance for single ticker', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
      ];

      const currentPrices = { AAPL: 150.50 };

      vi.mocked(fmpApiClient.callFmpApi)
        .mockResolvedValueOnce({
          // Start date price
          historical: [{ date: '2024-01-02', close: 145.00 }],
        })
        .mockResolvedValueOnce({
          // Historical range for daily values
          historical: [
            { date: '2024-01-02', close: 145.00 },
            { date: '2024-01-03', close: 146.50 },
          ],
        });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-03'
      );

      expect(result.totalCurrentValue).toBe(15050); // 100 * 150.50
      expect(result.totalBaselineValue).toBe(14500); // 100 * 145.00
      expect(result.totalCostBasis).toBe(14000); // Original cost
      expect(result.totalRangeGainDollar).toBe(550); // 15050 - 14500
      expect(result.totalAllTimeGainDollar).toBe(1050); // 15050 - 14000
      expect(result.tickers).toHaveLength(1);
    });

    it('should calculate performance for multiple tickers', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
        {
          id: '2',
          ticker: 'MSFT',
          shares: 50,
          costPerShare: 370.00,
          totalCost: 18500,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Microsoft',
        },
      ];

      const currentPrices = { AAPL: 150.50, MSFT: 380.25 };

      vi.mocked(fmpApiClient.callFmpApi)
        .mockResolvedValueOnce({
          // AAPL start date price
          historical: [{ date: '2024-01-02', close: 145.00 }],
        })
        .mockResolvedValueOnce({
          // MSFT start date price
          historical: [{ date: '2024-01-02', close: 375.00 }],
        })
        .mockResolvedValueOnce({
          // AAPL historical range
          historical: [{ date: '2024-01-02', close: 145.00 }],
        })
        .mockResolvedValueOnce({
          // MSFT historical range
          historical: [{ date: '2024-01-02', close: 375.00 }],
        });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-03'
      );

      expect(result.tickers).toHaveLength(2);
      expect(result.totalCurrentValue).toBe(34062.50); // (100 * 150.50) + (50 * 380.25)
      expect(result.totalCostBasis).toBe(32500); // 14000 + 18500
    });

    it('should filter out dividend lots', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
        {
          id: '2',
          ticker: 'AAPL',
          shares: 10,
          costPerShare: 0,
          totalCost: 0,
          purchaseDate: '2024-01-05',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: true, // Dividend lot
          calculatePL: false,
          companyName: 'Apple Inc',
        },
      ];

      const currentPrices = { AAPL: 150.50 };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({
        historical: [{ date: '2024-01-02', close: 145.00 }],
      });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-03'
      );

      // Should only include the non-dividend lot
      expect(result.tickers[0].totalShares).toBe(100); // Not 110
    });

    it('should return empty result for empty lot list', async () => {
      const result = await calculateDateRangePerformance(
        [],
        {},
        '2024-01-02',
        '2024-01-03'
      );

      expect(result.totalCurrentValue).toBe(0);
      expect(result.totalBaselineValue).toBe(0);
      expect(result.tickers).toEqual([]);
      expect(result.dailyPortfolioValues).toEqual([]);
    });

    it('should skip tickers without current price', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
      ];

      const currentPrices = {}; // No price for AAPL

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-03'
      );

      expect(result.tickers).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('No current price available for AAPL')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should calculate allocation percentages correctly', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'AAPL',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Apple Inc',
        },
        {
          id: '2',
          ticker: 'MSFT',
          shares: 100,
          costPerShare: 370.00,
          totalCost: 37000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Microsoft',
        },
      ];

      const currentPrices = { AAPL: 150.00, MSFT: 400.00 };

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue({
        historical: [{ date: '2024-01-02', close: 145.00 }],
      });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-03'
      );

      // AAPL: 100 * 150 = 15000
      // MSFT: 100 * 400 = 40000
      // Total: 55000
      // AAPL allocation: 15000/55000 = 27.27%
      // MSFT allocation: 40000/55000 = 72.73%

      const aaplTicker = result.tickers.find(t => t.ticker === 'AAPL');
      const msftTicker = result.tickers.find(t => t.ticker === 'MSFT');

      expect(aaplTicker?.allocationPercent).toBeCloseTo(27.27, 1);
      expect(msftTicker?.allocationPercent).toBeCloseTo(72.73, 1);
    });

    it('should calculate daily portfolio values', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'DAILY-TEST',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2023-12-01',
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Test Company',
        },
      ];

      const currentPrices = { 'DAILY-TEST': 150.50 };

      vi.mocked(fmpApiClient.callFmpApi)
        .mockResolvedValueOnce({
          // Start date price
          historical: [{ date: '2024-01-02', close: 145.00 }],
        })
        .mockResolvedValueOnce({
          // Historical range
          historical: [
            { date: '2024-01-02', close: 145.00 },
            { date: '2024-01-03', close: 146.50 },
            { date: '2024-01-04', close: 148.00 },
          ],
        });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-04'
      );

      expect(result.dailyPortfolioValues).toHaveLength(3);
      expect(result.dailyPortfolioValues[0]).toMatchObject({
        date: '2024-01-02',
        totalValue: 14500, // 100 * 145.00
      });
      expect(result.dailyPortfolioValues[1]).toMatchObject({
        date: '2024-01-03',
        totalValue: 14650, // 100 * 146.50
      });
      expect(result.dailyPortfolioValues[2]).toMatchObject({
        date: '2024-01-04',
        totalValue: 14800, // 100 * 148.00
      });
    });

    it('should only include lots owned on specific date in daily values', async () => {
      const lots: TickerLot[] = [
        {
          id: '1',
          ticker: 'OWNED-TEST',
          shares: 100,
          costPerShare: 140.00,
          totalCost: 14000,
          purchaseDate: '2024-01-01', // Owned from start
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Test Company',
        },
        {
          id: '2',
          ticker: 'OWNED-TEST',
          shares: 50,
          costPerShare: 148.00,
          totalCost: 7400,
          purchaseDate: '2024-01-03', // Purchased mid-range
          portfolios: ['Tech'],
          baseYield: 0,
          expectedFiveYearGrowth: 0,
          isDividend: false,
          calculatePL: true,
          companyName: 'Test Company',
        },
      ];

      const currentPrices = { 'OWNED-TEST': 150.50 };

      vi.mocked(fmpApiClient.callFmpApi)
        .mockResolvedValueOnce({
          // Start date price
          historical: [{ date: '2024-01-02', close: 145.00 }],
        })
        .mockResolvedValueOnce({
          // Historical range
          historical: [
            { date: '2024-01-02', close: 145.00 },
            { date: '2024-01-03', close: 146.50 },
            { date: '2024-01-04', close: 148.00 },
          ],
        });

      const result = await calculateDateRangePerformance(
        lots,
        currentPrices,
        '2024-01-02',
        '2024-01-04'
      );

      // Jan 2: Only first lot (100 shares)
      expect(result.dailyPortfolioValues[0].totalValue).toBe(14500);

      // Jan 3 onwards: Both lots (150 shares)
      expect(result.dailyPortfolioValues[1].totalValue).toBe(21975); // 150 * 146.50
      expect(result.dailyPortfolioValues[2].totalValue).toBe(22200); // 150 * 148.00
    });
  });
});
