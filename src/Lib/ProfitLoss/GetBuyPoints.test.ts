import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetBuyPoints, type BuyPoints } from './GetBuyPoints';
import type { TickersToEvaluate } from '../TickersToEvaluate/TickersToEvaluate';

describe('GetBuyPoints', () => {
  let instance: GetBuyPoints;

  beforeEach(() => {
    instance = new GetBuyPoints();
  });

  describe('CalculateBuyPoints', () => {
    it('should calculate all buy points correctly for a standard high value', () => {
      // Arrange
      const highValue = 100;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(mockSetBuyPoints).toHaveBeenCalledOnce();
      expect(capturedBuyPoints).not.toBeNull();
      expect(capturedBuyPoints?.downFivePercent).toBe('$95.00');
      expect(capturedBuyPoints?.downTenPercent).toBe('$90.00');
      expect(capturedBuyPoints?.downFifteenPercent).toBe('$85.00');
      expect(capturedBuyPoints?.downTwentyPercent).toBe('$80.00');
      expect(capturedBuyPoints?.downTwentyFivePercent).toBe('$75.00');
      expect(capturedBuyPoints?.downThirtyPercent).toBe('$70.00');
      expect(capturedBuyPoints?.downThirtyFivePercent).toBe('$65.00');
      expect(capturedBuyPoints?.downFortyPercent).toBe('$60.00');
      expect(capturedBuyPoints?.downFortyFivePercent).toBe('$55.00');
      expect(capturedBuyPoints?.downFiftyPercent).toBe('$50.00');
      expect(capturedBuyPoints?.downFiftyFivePercent).toBe('$45.00');
      expect(capturedBuyPoints?.downSixtyPercent).toBe('$40.00');
    });

    it('should format values with exactly 2 decimal places', () => {
      // Arrange
      const highValue = 123.456;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(capturedBuyPoints?.downFivePercent).toBe('$117.28');
      expect(capturedBuyPoints?.downTenPercent).toBe('$111.11');
      expect(capturedBuyPoints?.downFifteenPercent).toBe('$104.94');
      expect(capturedBuyPoints?.downTwentyPercent).toBe('$98.76');
    });

    it('should handle small decimal values correctly', () => {
      // Arrange
      const highValue = 1.50;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      // 1.50 * 0.95 = 1.425 -> rounds to 1.42
      expect(capturedBuyPoints?.downFivePercent).toBe('$1.42');
      // 1.50 * 0.90 = 1.35
      expect(capturedBuyPoints?.downTenPercent).toBe('$1.35');
      // 1.50 * 0.85 = 1.275 -> rounds to 1.27 (banker's rounding)
      expect(capturedBuyPoints?.downFifteenPercent).toBe('$1.27');
      // 1.50 * 0.80 = 1.20
      expect(capturedBuyPoints?.downTwentyPercent).toBe('$1.20');
      // 1.50 * 0.40 = 0.60
      expect(capturedBuyPoints?.downSixtyPercent).toBe('$0.60');
    });

    it('should handle large values correctly', () => {
      // Arrange
      const highValue = 5000.75;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(capturedBuyPoints?.downFivePercent).toBe('$4750.71');
      expect(capturedBuyPoints?.downTenPercent).toBe('$4500.68');
      expect(capturedBuyPoints?.downTwentyPercent).toBe('$4000.60');
      expect(capturedBuyPoints?.downFiftyPercent).toBe('$2500.38');
    });

    it('should handle zero value', () => {
      // Arrange
      const highValue = 0;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(capturedBuyPoints?.downFivePercent).toBe('$0.00');
      expect(capturedBuyPoints?.downTenPercent).toBe('$0.00');
      expect(capturedBuyPoints?.downSixtyPercent).toBe('$0.00');
    });

    it('should handle very small fractional values', () => {
      // Arrange
      const highValue = 0.05;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(capturedBuyPoints?.downFivePercent).toBe('$0.05');
      expect(capturedBuyPoints?.downTenPercent).toBe('$0.05');
      expect(capturedBuyPoints?.downFifteenPercent).toBe('$0.04');
      expect(capturedBuyPoints?.downSixtyPercent).toBe('$0.02');
    });

    it('should round correctly for values ending in .5', () => {
      // Arrange
      const highValue = 99.99;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      // 99.99 * 0.95 = 94.9905, should round to 94.99
      expect(capturedBuyPoints?.downFivePercent).toBe('$94.99');
      // 99.99 * 0.90 = 89.991, should round to 89.99
      expect(capturedBuyPoints?.downTenPercent).toBe('$89.99');
    });

    it('should invoke callback function with calculated buy points', () => {
      // Arrange
      const highValue = 200;
      const mockSetBuyPoints = vi.fn();

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      expect(mockSetBuyPoints).toHaveBeenCalledWith(
        expect.objectContaining({
          downFivePercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downTenPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downFifteenPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downTwentyPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downTwentyFivePercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downThirtyPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downThirtyFivePercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downFortyPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downFortyFivePercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downFiftyPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downFiftyFivePercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
          downSixtyPercent: expect.stringMatching(/^\$\d+\.\d{2}$/),
        })
      );
    });

    it('should calculate correct percentage decrements', () => {
      // Arrange
      const highValue = 1000;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert - Verify mathematical accuracy
      expect(capturedBuyPoints?.downFivePercent).toBe('$950.00'); // 95% of 1000
      expect(capturedBuyPoints?.downTenPercent).toBe('$900.00'); // 90% of 1000
      expect(capturedBuyPoints?.downFifteenPercent).toBe('$850.00'); // 85% of 1000
      expect(capturedBuyPoints?.downTwentyPercent).toBe('$800.00'); // 80% of 1000
      expect(capturedBuyPoints?.downTwentyFivePercent).toBe('$750.00'); // 75% of 1000
      expect(capturedBuyPoints?.downThirtyPercent).toBe('$700.00'); // 70% of 1000
      expect(capturedBuyPoints?.downThirtyFivePercent).toBe('$650.00'); // 65% of 1000
      expect(capturedBuyPoints?.downFortyPercent).toBe('$600.00'); // 60% of 1000
      expect(capturedBuyPoints?.downFortyFivePercent).toBe('$550.00'); // 55% of 1000
      expect(capturedBuyPoints?.downFiftyPercent).toBe('$500.00'); // 50% of 1000
      expect(capturedBuyPoints?.downFiftyFivePercent).toBe('$450.00'); // 45% of 1000
      expect(capturedBuyPoints?.downSixtyPercent).toBe('$400.00'); // 40% of 1000
    });

    it('should format all values with dollar sign prefix', () => {
      // Arrange
      const highValue = 50;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      const allValues = Object.values(capturedBuyPoints || {});
      allValues.forEach(value => {
        expect(value).toMatch(/^\$/);
      });
    });
  });

  describe('calculateProjectedYield', () => {
    it('should calculate projected yield for a single ticker', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'AAPL',
          costBasis: '100.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 100 * 10 = 1000
      // Gain: 1000 * 0.05 = 50
      // Percentage: (50 / 1000) * 100 = 5.00
      expect(result.totalProjectedGain).toBe('50.00');
      expect(result.percentageGainLoss).toBe('5.00');
    });

    it('should calculate projected yield for multiple tickers', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'AAPL',
          costBasis: '100.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        },
        {
          ticker: 'MSFT',
          costBasis: '200.00',
          unitsOnHand: 5,
          calculateAccumulatedProfitLoss: true,
          baseYield: '4.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // AAPL: Cost = 1000, Gain = 50
      // MSFT: Cost = 1000, Gain = 40
      // Total Cost: 2000, Total Gain: 90
      // Percentage: (90 / 2000) * 100 = 4.50
      expect(result.totalProjectedGain).toBe('90.00');
      expect(result.percentageGainLoss).toBe('4.50');
    });

    it('should handle tickers with decimal cost basis and yields', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'BXP',
          costBasis: '70.28',
          unitsOnHand: 40,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.74'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 70.28 * 40 = 2811.20
      // Gain: 2811.20 * 0.0574 = 161.36
      // Percentage: (161.36 / 2811.20) * 100 = 5.74
      expect(result.totalProjectedGain).toBe('161.36');
      expect(result.percentageGainLoss).toBe('5.74');
    });

    it('should return zero values for empty ticker array', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Empty array results in 0 cost basis and 0 gain, so 0/0 = NaN, but toFixed() on 0 gives '0.00'
      // Actually: totalCostBasis=0, projectedTotalValue=0, gain=0, percentage=0/0=NaN but 0.toFixed(2)='0.00'
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should handle zero yield correctly', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'ZERO',
          costBasis: '100.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '0.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('0.00');
    });

    it('should handle single unit on hand', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'SINGLE',
          costBasis: '50.00',
          unitsOnHand: 1,
          calculateAccumulatedProfitLoss: true,
          baseYield: '10.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 50 * 1 = 50
      // Gain: 50 * 0.10 = 5
      // Percentage: (5 / 50) * 100 = 10.00
      expect(result.totalProjectedGain).toBe('5.00');
      expect(result.percentageGainLoss).toBe('10.00');
    });

    it('should handle large portfolios correctly', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'TICK1',
          costBasis: '100.00',
          unitsOnHand: 100,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        },
        {
          ticker: 'TICK2',
          costBasis: '200.00',
          unitsOnHand: 50,
          calculateAccumulatedProfitLoss: true,
          baseYield: '6.00'
        },
        {
          ticker: 'TICK3',
          costBasis: '150.00',
          unitsOnHand: 75,
          calculateAccumulatedProfitLoss: true,
          baseYield: '4.50'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // TICK1: Cost = 10000, Gain = 500
      // TICK2: Cost = 10000, Gain = 600
      // TICK3: Cost = 11250, Gain = 506.25
      // Total Cost: 31250, Total Gain: 1606.25
      // Percentage: (1606.25 / 31250) * 100 = 5.14
      expect(result.totalProjectedGain).toBe('1606.25');
      expect(result.percentageGainLoss).toBe('5.14');
    });

    it('should handle high yield percentages', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'HIGH',
          costBasis: '10.00',
          unitsOnHand: 100,
          calculateAccumulatedProfitLoss: true,
          baseYield: '25.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 10 * 100 = 1000
      // Gain: 1000 * 0.25 = 250
      // Percentage: (250 / 1000) * 100 = 25.00
      expect(result.totalProjectedGain).toBe('250.00');
      expect(result.percentageGainLoss).toBe('25.00');
    });

    it('should handle fractional units correctly', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'FRAC',
          costBasis: '100.50',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.25'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 100.50 * 10 = 1005
      // Gain: 1005 * 0.0525 = 52.7625
      // Percentage: (52.7625 / 1005) * 100 = 5.25
      expect(result.totalProjectedGain).toBe('52.76');
      expect(result.percentageGainLoss).toBe('5.25');
    });

    it('should format results with exactly 2 decimal places', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'TEST',
          costBasis: '33.33',
          unitsOnHand: 3,
          calculateAccumulatedProfitLoss: true,
          baseYield: '3.33'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      expect(result.totalProjectedGain).toMatch(/^\d+\.\d{2}$/);
      expect(result.percentageGainLoss).toMatch(/^\d+\.\d{2}$/);
    });

    it('should handle tickers with missing baseYield field', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'NOYIELD',
          costBasis: '100.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true
          // baseYield is optional and omitted
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Without baseYield, Number(undefined) returns NaN
      // NaN * anything = NaN, so gain will be NaN
      expect(result.totalProjectedGain).toBe('NaN');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should accumulate values correctly across mixed tickers', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'A',
          costBasis: '10.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '10.00'
        },
        {
          ticker: 'B',
          costBasis: '20.00',
          unitsOnHand: 20,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        },
        {
          ticker: 'C',
          costBasis: '30.00',
          unitsOnHand: 30,
          calculateAccumulatedProfitLoss: true,
          baseYield: '2.50'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // A: Cost = 100, Gain = 10
      // B: Cost = 400, Gain = 20
      // C: Cost = 900, Gain = 22.5
      // Total Cost: 1400, Total Gain: 52.5
      // Percentage: (52.5 / 1400) * 100 = 3.75
      expect(result.totalProjectedGain).toBe('52.50');
      expect(result.percentageGainLoss).toBe('3.75');
    });

    it('should handle zero units on hand', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'ZERO',
          costBasis: '100.00',
          unitsOnHand: 0,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // 0 units means 0 cost basis, 0 gain, so 0/0 = NaN for percentage
      expect(result.totalProjectedGain).toBe('0.00');
      expect(result.percentageGainLoss).toBe('NaN');
    });

    it('should handle very large numbers correctly', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'LARGE',
          costBasis: '10000.00',
          unitsOnHand: 1000,
          calculateAccumulatedProfitLoss: true,
          baseYield: '3.50'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 10000 * 1000 = 10000000
      // Gain: 10000000 * 0.035 = 350000
      // Percentage: (350000 / 10000000) * 100 = 3.50
      expect(result.totalProjectedGain).toBe('350000.00');
      expect(result.percentageGainLoss).toBe('3.50');
    });

    it('should return consistent results for the same input', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'CONSISTENT',
          costBasis: '75.50',
          unitsOnHand: 25,
          calculateAccumulatedProfitLoss: true,
          baseYield: '4.75'
        }
      ];

      // Act
      const result1 = instance.calculateProjectedYield(tickers);
      const result2 = instance.calculateProjectedYield(tickers);

      // Assert
      expect(result1.totalProjectedGain).toBe(result2.totalProjectedGain);
      expect(result1.percentageGainLoss).toBe(result2.percentageGainLoss);
    });

    it('should handle string numbers with extra precision in inputs', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'PRECISE',
          costBasis: '100.123456',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.123456'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      // Cost: 100.123456 * 10 = 1001.23456
      // Gain: 1001.23456 * 0.05123456 = 51.29
      expect(result.totalProjectedGain).toMatch(/^\d+\.\d{2}$/);
      expect(result.percentageGainLoss).toMatch(/^\d+\.\d{2}$/);
    });
  });

  describe('Edge Cases and Integration', () => {
    it('should handle negative high values in CalculateBuyPoints', () => {
      // Arrange
      const highValue = -100;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert
      // Negative values still calculate (though not realistic for stock prices)
      expect(capturedBuyPoints?.downFivePercent).toBe('$-95.00');
      expect(capturedBuyPoints?.downTenPercent).toBe('$-90.00');
    });

    it('should maintain instance state across multiple method calls', () => {
      // Arrange
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'TEST',
          costBasis: '100.00',
          unitsOnHand: 10,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.00'
        }
      ];
      const mockSetBuyPoints = vi.fn();

      // Act
      const result1 = instance.calculateProjectedYield(tickers);
      instance.CalculateBuyPoints(100, mockSetBuyPoints);
      const result2 = instance.calculateProjectedYield(tickers);

      // Assert
      // Results should be independent
      expect(result1.totalProjectedGain).toBe(result2.totalProjectedGain);
      expect(result1.percentageGainLoss).toBe(result2.percentageGainLoss);
    });

    it('should handle real-world scenario with multiple diverse holdings', () => {
      // Arrange - Realistic portfolio
      const tickers: TickersToEvaluate[] = [
        {
          ticker: 'BXP',
          costBasis: '70.28',
          unitsOnHand: 40,
          calculateAccumulatedProfitLoss: true,
          baseYield: '5.74'
        },
        {
          ticker: 'AAPL',
          costBasis: '150.50',
          unitsOnHand: 20,
          calculateAccumulatedProfitLoss: true,
          baseYield: '0.50'
        },
        {
          ticker: 'MSFT',
          costBasis: '330.25',
          unitsOnHand: 15,
          calculateAccumulatedProfitLoss: true,
          baseYield: '0.75'
        }
      ];

      // Act
      const result = instance.calculateProjectedYield(tickers);

      // Assert
      expect(result.totalProjectedGain).toMatch(/^\d+\.\d{2}$/);
      expect(result.percentageGainLoss).toMatch(/^\d+\.\d{2}$/);
      expect(parseFloat(result.totalProjectedGain)).toBeGreaterThan(0);
      expect(parseFloat(result.percentageGainLoss)).toBeGreaterThan(0);
    });

    it('should produce mathematically consistent buy points', () => {
      // Arrange
      const highValue = 250.75;
      let capturedBuyPoints: BuyPoints | null = null;
      const mockSetBuyPoints = vi.fn((buyPoints: BuyPoints) => {
        capturedBuyPoints = buyPoints;
      });

      // Act
      instance.CalculateBuyPoints(highValue, mockSetBuyPoints);

      // Assert - Each subsequent level should be lower
      const values = [
        parseFloat(capturedBuyPoints!.downFivePercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downTenPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downFifteenPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downTwentyPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downTwentyFivePercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downThirtyPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downThirtyFivePercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downFortyPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downFortyFivePercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downFiftyPercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downFiftyFivePercent!.replace('$', '')),
        parseFloat(capturedBuyPoints!.downSixtyPercent!.replace('$', ''))
      ];

      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeLessThan(values[i - 1]);
      }
    });
  });
});
