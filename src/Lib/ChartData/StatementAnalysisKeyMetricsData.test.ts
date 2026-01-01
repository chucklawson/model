import { describe, it, expect } from 'vitest';
import StatementAnalysisKeyMetricsData from './StatementAnalysisKeyMetricsData';
import type AnalysisKeyMetricsItem_V3 from '../AnalysisKeyMetricsItem_V3';

describe('StatementAnalysisKeyMetricsData', () => {
  // Helper to create minimal mock data
  function createMockKeyMetrics(): AnalysisKeyMetricsItem_V3 {
    return {
      symbol: 'AAPL',
      date: '2024-01-15',
      period: 'Q4',
      calendarYear: '2024',
      revenuePerShare: 25.5,
      netIncomePerShare: 5.5,
      operatingCashFlowPerShare: 6.2,
      freeCashFlowPerShare: 5.8,
      cashPerShare: 10.5,
      bookValuePerShare: 4.5,
      tangibleBookValuePerShare: 4.0,
      shareholdersEquityPerShare: 4.5,
      interestDebtPerShare: 1.5,
      marketCap: 2500000000000,
      enterpriseValue: 2600000000000,
      peRatio: 28.5,
      priceToSalesRatio: 7.2,
      pocfratio: 25.8,
      pfcfRatio: 27.5,
      pbRatio: 35.5,
      ptbRatio: 37.8,
      evToSales: 7.5,
      evToFreeCashFlow: 28.2,
      enterpriseValueOverEBITDA: 18.5,
      evToOperatingCashFlow: 26.5,
      earningsYield: 0.035,
      freeCashFlowYield: 0.036,
      debtToEquity: 1.8,
      debtToAssets: 0.32,
      netDebtToEBITDA: 1.2,
      currentRatio: 1.05,
      interestCoverage: 15.5,
      incomeQuality: 1.1,
      dividendYield: 0.005,
      payoutRatio: 0.15,
      salesGeneralAndAdministrativeToRevenue: 0.08,
      intangiblesToTotalAssets: 0.02,
      capexToOperatingCashFlow: 0.12,
      capexToRevenue: 0.03,
      capexToDepreciation: 1.1,
      stockBasedCompensationToRevenue: 0.02,
      grahamNumber: 85.5,
      roic: 0.32,
      returnOnTangibleAssets: 0.38,
      grahamNetNet: 0,
      workingCapital: 15000000000,
      tangibleAssetValue: 100000000000,
      netCurrentAssetValue: 14000000000,
      investedCapital: 120000000000,
      averageReceivables: 8000000000,
      averagePayables: 9000000000,
      averageInventory: 3000000000,
      daysSalesOutstanding: 45,
      daysPayablesOutstanding: 55,
      daysOfInventoryOnHand: 12,
      receivablesTurnover: 8.1,
      payablesTurnover: 6.6,
      inventoryTurnover: 30.4,
      capexPerShare: 0.75,
    } as AnalysisKeyMetricsItem_V3;
  }

  describe('constructor', () => {
    it('should create StatementAnalysisKeyMetricsData with all properties', () => {
      const mockData = createMockKeyMetrics();
      const metricsData = new StatementAnalysisKeyMetricsData(mockData);

      expect(metricsData.symbol).toBe('AAPL');
      expect(metricsData.date).toBe('2024-01-15');
      expect(metricsData.period).toBe('Q4');
      expect(metricsData.calendarYear).toBe('2024');
      expect(metricsData.xAxisDataKey).toBe('Q4 2024');
      expect(metricsData.priceToEarnings).toBe('28.50');
    });
  });

  describe('toString', () => {
    it('should return formatted string representation', () => {
      const mockData = createMockKeyMetrics();
      const metricsData = new StatementAnalysisKeyMetricsData(mockData);
      const result = metricsData.toString();

      expect(result).toContain('symbol: AAPL');
      expect(result).toContain('date: 2024-01-15');
      expect(result).toContain('period: Q4');
      expect(result).toContain('calendarYear: 2024');
      expect(result).toContain('revenuePerShare: 25.5');
      expect(result).toContain('netIncomePerShare: 5.5');
    });

    it('should include all key metrics in string', () => {
      const mockData = createMockKeyMetrics();
      const metricsData = new StatementAnalysisKeyMetricsData(mockData);
      const result = metricsData.toString();

      // Verify several important fields are present
      expect(result).toContain('operatingCashFlowPerShare:');
      expect(result).toContain('freeCashFlowPerShare:');
      expect(result).toContain('cashPerShare:');
      expect(result).toContain('bookValuePerShare:');
    });
  });
});
