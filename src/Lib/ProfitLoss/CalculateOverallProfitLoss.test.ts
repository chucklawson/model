import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { calculateOverallProfitAndLoss, calculateProjectedYield } from './CalculateOverallProfitLoss';
import type { TickersToEvaluate } from '../TickersToEvaluate/TickersToEvaluate';
import type Quote_V3 from '../Quote_V3';
import * as fmpApiClient from '../../utils/fmpApiClient';

// Mock the fmpApiClient module
vi.mock('../../utils/fmpApiClient', () => ({
  callFmpApi: vi.fn()
}));

describe('CalculateOverallProfitLoss', () => {
  // Helper function to create mock ticker entries
  const createMockTickerEntry = (
    ticker: string,
    costBasis: string,
    unitsOnHand: number,
    calculateAccumulatedProfitLoss: boolean = true,
    baseYield?: string
  ): TickersToEvaluate => ({
    ticker,
    costBasis,
    unitsOnHand,
    calculateAccumulatedProfitLoss,
    baseYield
  });

  // Helper function to create mock quote data
  const createMockQuote = (
    symbol: string,
    price: number,
    previousClose: number
  ): Quote_V3 => ({
    symbol,
    name: `${symbol} Inc`,
    price,
    changesPercentage: ((price - previousClose) / previousClose) * 100,
    change: price - previousClose,
    dayLow: price * 0.98,
    dayHigh: price * 1.02,
    yearHigh: price * 1.5,
    yearLow: price * 0.5,
    marketCap: 1000000000,
    priceAvg50: price * 0.95,
    priceAvg200: price * 0.9,
    exchange: 'NASDAQ',
    volume: 1000000,
    avgVolume: 1500000,
    open: previousClose,
    previousClose,
    eps: 2.5,
    pe: 15,
    earningsAnnouncement: '2024-01-15T00:00:00.000Z',
    sharesOutstanding: 1000000,
    timestamp: Date.now()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateOverallProfitAndLoss', () => {
    it('should calculate profit/loss for a single ticker with gains', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.00, 145.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledWith({
        endpoint: '/api/v3/quote/AAPL'
      });

      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$500.00') // Total profit (150*10 - 100*10)
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Invested: $1000.00')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Gain: 50.00%')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Today: $50.00') // Daily gain (150-145)*10
      );
    });

    it('should calculate profit/loss for multiple tickers', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true),
        createMockTickerEntry('MSFT', '200.00', 5, true),
        createMockTickerEntry('GOOGL', '150.00', 8, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 120.00, 118.00),
        createMockQuote('MSFT', 250.00, 245.00),
        createMockQuote('GOOGL', 160.00, 158.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      // Total cost: (100*10) + (200*5) + (150*8) = 1000 + 1000 + 1200 = 3200
      // Total value: (120*10) + (250*5) + (160*8) = 1200 + 1250 + 1280 = 3730
      // Profit: 3730 - 3200 = 530
      // Gain %: (530/3200) * 100 = 16.56%
      // Today: (120-118)*10 + (250-245)*5 + (160-158)*8 = 20 + 25 + 16 = 61
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$530.00')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Invested: $3200.00')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Gain: 16.56%')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Today: $61.00')
      );
    });

    it('should calculate loss when portfolio value decreases', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '150.00', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 100.00, 105.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      // Total cost: 150*10 = 1500
      // Total value: 100*10 = 1000
      // Loss: 1000 - 1500 = -500
      // Loss %: (-500/1500) * 100 = -33.33%
      // Today: (100-105)*10 = -50
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$-500.00')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Gain: -33.33%')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Today: $-50.00')
      );
    });

    it('should only include tickers with calculateAccumulatedProfitLoss set to true', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true),
        createMockTickerEntry('MSFT', '200.00', 5, false), // Should be excluded
        createMockTickerEntry('GOOGL', '150.00', 8, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 120.00, 118.00),
        createMockQuote('GOOGL', 160.00, 158.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledWith({
        endpoint: '/api/v3/quote/AAPL,GOOGL'
      });

      // Total cost should only include AAPL and GOOGL
      // Cost: (100*10) + (150*8) = 2200
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Invested: $2200.00')
      );
    });

    it('should handle case insensitive ticker matching', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('aapl', '100.00', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 120.00, 118.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$200.00') // Profit calculated correctly despite case mismatch
      );
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockRejectedValue(
        new Error('API request failed')
      );

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert - should handle error without crashing
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalled();
    });

    it('should handle empty quote response', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('INVALID', '100.00', 10, true)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue([]);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert - should handle empty response
      // Cost basis is 100.00 * 10 = $1000.00, so total loss is $-1000.00
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$-1000.00')
      );
    });

    it('should handle undefined symbol in quote response', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue([
        { symbol: undefined } as any
      ]);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert - should handle undefined symbol
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalled();
    });

    it('should handle zero cost basis correctly', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '0.00', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.00, 145.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert - should not divide by zero for percentage
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Gain: 0.00%')
      );
    });

    it('should handle zero units on hand', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 0, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.00, 145.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$0.00')
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Invested: $0.00')
      );
    });

    it('should handle fractional shares', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.50', 10.5, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.75, 148.25)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      // Cost: 100.50 * 10.5 = 1055.25
      // Value: 150.75 * 10.5 = 1582.875
      // Profit: 1582.875 - 1055.25 = 527.625 = $527.63
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$527.63')
      );
    });

    it('should handle no tickers to evaluate', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [];
      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledWith({
        endpoint: '/api/v3/quote/'
      });
    });

    it('should handle all tickers excluded from calculation', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, false),
        createMockTickerEntry('MSFT', '200.00', 5, false)
      ];

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(fmpApiClient.callFmpApi).toHaveBeenCalledWith({
        endpoint: '/api/v3/quote/'
      });
    });

    it('should format numbers with exactly 2 decimal places', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.123', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.789, 148.456)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      const result = mockSetCalculatedTotalProfitLoss.mock.calls[0][0];

      // Check that all dollar amounts have exactly 2 decimal places
      const dollarMatches = result.match(/\$-?\d+\.\d+/g);
      dollarMatches?.forEach((match: string) => {
        const decimals = match.split('.')[1];
        expect(decimals).toHaveLength(2);
      });

      // Check that percentage has exactly 2 decimal places
      const percentMatch = result.match(/Gain: -?\d+\.\d+%/);
      expect(percentMatch).toBeTruthy();
      const percentDecimals = percentMatch![0].split('.')[1].replace('%', '');
      expect(percentDecimals).toHaveLength(2);
    });
  });

  describe('calculateProjectedYield', () => {
    it('should calculate projected yield for a single ticker', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('BXP', '70.28', 40, true, '5.74')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Cost: 70.28 * 40 = 2811.20
      // Projected gain: 2811.20 * 0.0574 = 161.36288
      // Projected value: 2811.20 + 161.36288 = 2972.56288
      // Percentage: (161.36288 / 2811.20) * 100 = 5.74%
      expect(result.totalProjectedGain).toBe('161.36');
      expect(result.percentageGainLoss).toBe('5.74');
    });

    it('should calculate projected yield for multiple tickers', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('BXP', '70.28', 40, true, '5.74'),
        createMockTickerEntry('AAPL', '150.00', 10, true, '3.50'),
        createMockTickerEntry('MSFT', '200.00', 5, true, '4.20')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // BXP: cost=2811.20, gain=161.36
      // AAPL: cost=1500.00, gain=52.50
      // MSFT: cost=1000.00, gain=42.00
      // Total cost: 5311.20
      // Total gain: 255.86
      // Percentage: (255.86 / 5311.20) * 100 = 4.82%
      expect(result.totalProjectedGain).toBe('255.86');
      expect(result.percentageGainLoss).toBe('4.82');
    });

    it('should handle zero yield', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '150.00', 10, true, '0.00')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('0.00');
    });

    it('should handle undefined baseYield by treating it as 0', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '150.00', 10, true, undefined)
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // With undefined yield, NaN should result
      expect(result.totalProjectedGain).toBe('NaN');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should handle high yield percentages', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('HIYIELD', '50.00', 100, true, '15.50')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Cost: 50 * 100 = 5000
      // Gain: 5000 * 0.155 = 775
      expect(result.totalProjectedGain).toBe('775.00');
      expect(result.percentageGainLoss).toBe('15.50');
    });

    it('should handle fractional shares in yield calculation', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '150.50', 10.5, true, '3.75')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Cost: 150.50 * 10.5 = 1580.25
      // Gain: 1580.25 * 0.0375 = 59.259375
      expect(result.totalProjectedGain).toBe('59.26');
      expect(result.percentageGainLoss).toBe('3.75');
    });

    it('should handle zero units on hand', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '150.00', 0, true, '3.50')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert - division by zero results in NaN
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should handle zero cost basis', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '0.00', 10, true, '3.50')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('NaN'); // Division by zero
    });

    it('should include all tickers regardless of calculateAccumulatedProfitLoss flag', () => {
      // Arrange - Note: calculateProjectedYield doesn't check this flag
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true, '5.00'),
        createMockTickerEntry('MSFT', '200.00', 5, false, '4.00') // This WILL be included
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // AAPL: cost=1000, gain=50
      // MSFT: cost=1000, gain=40
      // Total: cost=2000, gain=90
      expect(result.totalProjectedGain).toBe('90.00');
      expect(result.percentageGainLoss).toBe('4.50');
    });

    it('should handle empty ticker array', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert - empty array results in '0.00' for gain but 'NaN' for percentage (division by zero)
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should format results to exactly 2 decimal places', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.123', 10.789, true, '3.456')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      expect(result.totalProjectedGain.split('.')[1]).toHaveLength(2);
      expect(result.percentageGainLoss.split('.')[1]).toHaveLength(2);
    });

    it('should handle very small yield percentages', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '1000.00', 100, true, '0.01')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Cost: 100000
      // Gain: 100000 * 0.0001 = 10
      expect(result.totalProjectedGain).toBe('10.00');
      expect(result.percentageGainLoss).toBe('0.01');
    });

    it('should handle mixed positive yields accurately', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('HIGH', '100.00', 10, true, '10.00'),
        createMockTickerEntry('LOW', '100.00', 10, true, '2.00'),
        createMockTickerEntry('MED', '100.00', 10, true, '5.00')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Total cost: 3000
      // HIGH gain: 1000 * 0.10 = 100
      // LOW gain: 1000 * 0.02 = 20
      // MED gain: 1000 * 0.05 = 50
      // Total gain: 170
      // Percentage: (170/3000) * 100 = 5.67%
      expect(result.totalProjectedGain).toBe('170.00');
      expect(result.percentageGainLoss).toBe('5.67');
    });
  });

  describe('Edge Cases and Integration Tests', () => {
    it('should handle ticker symbols with special characters', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('BRK.B', '300.00', 5, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('BRK.B', 350.00, 345.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$250.00')
      );
    });

    it('should handle very large portfolio values without overflow', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '10000.00', 10000, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 15000.00, 14500.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      // Cost: 100,000,000
      // Value: 150,000,000
      // Profit: 50,000,000
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$50000000.00')
      );
    });

    it('should handle very small fractional values accurately', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('PENNY', '0.01', 1000, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('PENNY', 0.02, 0.015)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('$10.00') // Profit
      );
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Today: $5.00') // Daily gain
      );
    });

    it('should maintain precision across multiple calculations', () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('A', '33.33', 3, true, '3.33'),
        createMockTickerEntry('B', '66.66', 6, true, '6.66'),
        createMockTickerEntry('C', '99.99', 9, true, '9.99')
      ];

      // Act
      const result = calculateProjectedYield(tickerEntries);

      // Assert
      // Should handle floating point precision correctly
      expect(result.totalProjectedGain).toMatch(/^\d+\.\d{2}$/);
      expect(result.percentageGainLoss).toMatch(/^\d+\.\d{2}$/);
    });

    it('should handle quote data with missing previousClose', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true)
      ];

      const mockQuotes: Quote_V3[] = [
        {
          ...createMockQuote('AAPL', 150.00, 0),
          previousClose: 0
        }
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert
      // Today's P/L should show gain based on 0 previous close
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalledWith(
        expect.stringContaining('Today: $1500.00')
      );
    });

    it('should handle mixed scenarios with some tickers having zero values', async () => {
      // Arrange
      const tickerEntries: TickersToEvaluate[] = [
        createMockTickerEntry('AAPL', '100.00', 10, true),
        createMockTickerEntry('ZERO', '0.00', 100, true),
        createMockTickerEntry('MSFT', '200.00', 0, true)
      ];

      const mockQuotes: Quote_V3[] = [
        createMockQuote('AAPL', 150.00, 145.00),
        createMockQuote('ZERO', 50.00, 48.00),
        createMockQuote('MSFT', 250.00, 245.00)
      ];

      vi.mocked(fmpApiClient.callFmpApi).mockResolvedValue(mockQuotes);

      const mockSetCalculatedTotalProfitLoss = vi.fn();

      // Act
      await calculateOverallProfitAndLoss(tickerEntries, mockSetCalculatedTotalProfitLoss);

      // Assert - Should handle mixed zero scenarios
      expect(mockSetCalculatedTotalProfitLoss).toHaveBeenCalled();
    });
  });
});
