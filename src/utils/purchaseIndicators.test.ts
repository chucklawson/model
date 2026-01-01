import { describe, it, expect } from 'vitest';
import type { TickerLot } from '../types';
import {
  groupLotsByDate,
  matchPurchasesWithChartData,
  formatPurchaseTooltip,
  type GroupedPurchase,
} from './purchaseIndicators';

describe('purchaseIndicators', () => {
  describe('groupLotsByDate', () => {
    it('should return empty array for empty input', () => {
      const result = groupLotsByDate([]);
      expect(result).toEqual([]);
    });

    it('should group single lot correctly', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 100,
          purchaseDate: '2024-01-15',
          costPerShare: 150.50,
          totalCost: 15050,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        lots: lots,
        totalShares: 100,
        totalCost: 15050,
        averageCostPerShare: 150.50,
      });
    });

    it('should group multiple lots on same date', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 100,
          purchaseDate: '2024-01-15',
          costPerShare: 150.50,
          totalCost: 15050,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 50,
          purchaseDate: '2024-01-15',
          costPerShare: 152.00,
          totalCost: 7600,
          portfolios: ['Roth IRA'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].totalShares).toBe(150);
      expect(result[0].totalCost).toBe(22650);
      expect(result[0].averageCostPerShare).toBeCloseTo(151.00, 2);
      expect(result[0].lots).toHaveLength(2);
    });

    it('should group lots across multiple dates', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 100,
          purchaseDate: '2024-01-15',
          costPerShare: 150.50,
          totalCost: 15050,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 50,
          purchaseDate: '2024-02-20',
          costPerShare: 155.00,
          totalCost: 7750,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 75,
          purchaseDate: '2024-01-15',
          costPerShare: 151.00,
          totalCost: 11325,
          portfolios: ['Roth IRA'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(2);

      // Should be sorted by date (oldest first)
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].totalShares).toBe(175);
      expect(result[0].totalCost).toBe(26375);
      expect(result[0].lots).toHaveLength(2);

      expect(result[1].date).toBe('2024-02-20');
      expect(result[1].totalShares).toBe(50);
      expect(result[1].totalCost).toBe(7750);
      expect(result[1].lots).toHaveLength(1);
    });

    it('should sort grouped purchases by date ascending', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 100,
          purchaseDate: '2024-03-01',
          costPerShare: 160.00,
          totalCost: 16000,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 50,
          purchaseDate: '2024-01-15',
          costPerShare: 150.00,
          totalCost: 7500,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 75,
          purchaseDate: '2024-02-10',
          costPerShare: 155.00,
          totalCost: 11625,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(3);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[1].date).toBe('2024-02-10');
      expect(result[2].date).toBe('2024-03-01');
    });

    it('should calculate weighted average cost correctly', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 100,
          purchaseDate: '2024-01-15',
          costPerShare: 100.00,
          totalCost: 10000,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 200,
          purchaseDate: '2024-01-15',
          costPerShare: 150.00,
          totalCost: 30000,
          portfolios: ['Roth IRA'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(1);
      // Weighted average: (10000 + 30000) / (100 + 200) = 40000 / 300 = 133.33
      expect(result[0].averageCostPerShare).toBeCloseTo(133.33, 2);
    });

    it('should handle fractional shares', () => {
      const lots: TickerLot[] = [
        {
          ticker: 'AAPL',
          shares: 10.5,
          purchaseDate: '2024-01-15',
          costPerShare: 150.00,
          totalCost: 1575,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
        {
          ticker: 'AAPL',
          shares: 5.25,
          purchaseDate: '2024-01-15',
          costPerShare: 152.00,
          totalCost: 798,
          portfolios: ['401k'],
          id: '1',
          calculateAccumulatedProfitLoss: false,
          isDividend: false,
          baseYield: 0,
        },
      ];

      const result = groupLotsByDate(lots);

      expect(result).toHaveLength(1);
      expect(result[0].totalShares).toBeCloseTo(15.75, 2);
      expect(result[0].totalCost).toBeCloseTo(2373, 2);
      expect(result[0].averageCostPerShare).toBeCloseTo(150.67, 2);
    });

    it('should preserve lot references in grouped data', () => {
      const lot1: TickerLot = {
        ticker: 'AAPL',
        shares: 100,
        purchaseDate: '2024-01-15',
        costPerShare: 150.00,
        totalCost: 15000,
        portfolios: ['401k'],
      };
      const lot2: TickerLot = {
        ticker: 'AAPL',
        shares: 50,
        purchaseDate: '2024-01-15',
        costPerShare: 152.00,
        totalCost: 7600,
        portfolios: ['Roth IRA'],
      };

      const result = groupLotsByDate([lot1, lot2]);

      expect(result[0].lots).toContain(lot1);
      expect(result[0].lots).toContain(lot2);
      expect(result[0].lots).toHaveLength(2);
    });
  });

  describe('matchPurchasesWithChartData', () => {
    it('should return empty array when no purchases provided', () => {
      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData([], chartData, 'dailyClosingPrice');

      expect(result).toEqual([]);
    });

    it('should return empty array when no chart data provided', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const result = matchPurchasesWithChartData(groupedPurchases, [], 'dailyClosingPrice');

      expect(result).toEqual([]);
    });

    it('should match single purchase with chart data', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        date: '2024-01-15',
        yValue: 150.50,
        groupedPurchase: groupedPurchases[0],
      });
    });

    it('should match multiple purchases with chart data', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
        {
          date: '2024-02-20',
          lots: [],
          totalShares: 50,
          totalCost: 7750,
          averageCostPerShare: 155,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
        { dateOfClose: '2024-02-20', dailyClosingPrice: 155.25, rsiValue: 70 },
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2024-01-15');
      expect(result[0].yValue).toBe(150.50);
      expect(result[1].date).toBe('2024-02-20');
      expect(result[1].yValue).toBe(155.25);
    });

    it('should use specified yField from chart data', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData(groupedPurchases, chartData, 'rsiValue');

      expect(result).toHaveLength(1);
      expect(result[0].yValue).toBe(65);
    });

    it('should skip purchases with no matching chart data', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
        {
          date: '2024-02-20',
          lots: [],
          totalShares: 50,
          totalCost: 7750,
          averageCostPerShare: 155,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
        // Missing 2024-02-20
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('should skip chart data points with null y-values', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: null, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toEqual([]);
    });

    it('should skip chart data points with undefined y-values', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: undefined, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toEqual([]);
    });

    it('should handle mixed scenarios with some matches and some nulls', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
        {
          date: '2024-02-20',
          lots: [],
          totalShares: 50,
          totalCost: 7750,
          averageCostPerShare: 155,
        },
        {
          date: '2024-03-01',
          lots: [],
          totalShares: 75,
          totalCost: 12000,
          averageCostPerShare: 160,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
        { dateOfClose: '2024-02-20', dailyClosingPrice: null, rsiValue: 70 },
        // Missing 2024-03-01 entirely
      ];

      const result = matchPurchasesWithChartData(
        groupedPurchases,
        chartData,
        'dailyClosingPrice'
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('should accept zero as valid y-value', () => {
      const groupedPurchases: GroupedPurchase[] = [
        {
          date: '2024-01-15',
          lots: [],
          totalShares: 100,
          totalCost: 15000,
          averageCostPerShare: 150,
        },
      ];

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 0, rsiValue: 0 },
      ];

      const result = matchPurchasesWithChartData(groupedPurchases, chartData, 'rsiValue');

      expect(result).toHaveLength(1);
      expect(result[0].yValue).toBe(0);
    });

    it('should preserve groupedPurchase reference', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [],
        totalShares: 100,
        totalCost: 15000,
        averageCostPerShare: 150,
      };

      const chartData = [
        { dateOfClose: '2024-01-15', dailyClosingPrice: 150.50, rsiValue: 65 },
      ];

      const result = matchPurchasesWithChartData(
        [groupedPurchase],
        chartData,
        'dailyClosingPrice'
      );

      expect(result[0].groupedPurchase).toBe(groupedPurchase);
    });
  });

  describe('formatPurchaseTooltip', () => {
    it('should format single lot correctly', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [
          {
            ticker: 'AAPL',
            shares: 100,
            purchaseDate: '2024-01-15',
            costPerShare: 150.50,
            totalCost: 15050,
            portfolios: ['401k'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
        ],
        totalShares: 100,
        totalCost: 15050,
        averageCostPerShare: 150.50,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toBe(
        'Purchase: 2024-01-15\n100 shares @ $150.50\nTotal: $15050.00'
      );
    });

    it('should format multiple lots correctly', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [
          {
            ticker: 'AAPL',
            shares: 100,
            purchaseDate: '2024-01-15',
            costPerShare: 150.00,
            totalCost: 15000,
            portfolios: ['401k'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
          {
            ticker: 'AAPL',
            shares: 50,
            purchaseDate: '2024-01-15',
            costPerShare: 152.00,
            totalCost: 7600,
            portfolios: ['Roth IRA'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
        ],
        totalShares: 150,
        totalCost: 22600,
        averageCostPerShare: 150.67,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toBe(
        'Purchase: 2024-01-15\n2 lots, 150 shares\nAvg: $150.67\nTotal: $22600.00'
      );
    });

    it('should format fractional shares in single lot', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [
          {
            ticker: 'AAPL',
            shares: 10.5,
            purchaseDate: '2024-01-15',
            costPerShare: 150.50,
            totalCost: 1580.25,
            portfolios: ['401k'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
        ],
        totalShares: 10.5,
        totalCost: 1580.25,
        averageCostPerShare: 150.50,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toBe(
        'Purchase: 2024-01-15\n10.5 shares @ $150.50\nTotal: $1580.25'
      );
    });

    it('should format fractional shares in multiple lots', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [
          {
            ticker: 'AAPL',
            shares: 10.5,
            purchaseDate: '2024-01-15',
            costPerShare: 150.00,
            totalCost: 1575,
            portfolios: ['401k'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
          {
            ticker: 'AAPL',
            shares: 5.25,
            purchaseDate: '2024-01-15',
            costPerShare: 152.00,
            totalCost: 798,
            portfolios: ['Roth IRA'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
        ],
        totalShares: 15.75,
        totalCost: 2373,
        averageCostPerShare: 150.67,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toBe(
        'Purchase: 2024-01-15\n2 lots, 15.75 shares\nAvg: $150.67\nTotal: $2373.00'
      );
    });

    it('should round dollar amounts to 2 decimal places', () => {
      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots: [
          {
            ticker: 'AAPL',
            shares: 100,
            purchaseDate: '2024-01-15',
            costPerShare: 150.456,
            totalCost: 15045.6,
            portfolios: ['401k'],
            id: '1',
            calculateAccumulatedProfitLoss: false,
            isDividend: false,
            baseYield: 0,
          },
        ],
        totalShares: 100,
        totalCost: 15045.6,
        averageCostPerShare: 150.456,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toContain('$150.46'); // Rounded cost per share
      expect(result).toContain('$15045.60'); // Rounded total
    });

    it('should handle large lot counts', () => {
      const lots = Array.from({ length: 10 }, (_, i) => ({
        ticker: 'AAPL',
        shares: 10,
        purchaseDate: '2024-01-15',
        costPerShare: 150 + i,
        totalCost: 1500 + i * 10,
        portfolios: ['401k'],
      }));

      const groupedPurchase: GroupedPurchase = {
        date: '2024-01-15',
        lots,
        totalShares: 100,
        totalCost: 15450,
        averageCostPerShare: 154.50,
      };

      const result = formatPurchaseTooltip(groupedPurchase);

      expect(result).toContain('10 lots, 100 shares');
    });
  });
});
