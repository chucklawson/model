import { describe, it, expect, beforeEach } from 'vitest';
import { transformToTableData, type TableRow } from './KeyMetricsDataTransformer';
import StatementAnalysisKeyMetricsData from '../StatementsData/StatementAnalysisKeyMetricsData';

describe('KeyMetricsDataTransformer', () => {
  // Helper function to create mock key metrics data
  const createMockKeyMetricsData = (
    period: string,
    calendarYear: string,
    overrides: Partial<StatementAnalysisKeyMetricsData> = {}
  ): StatementAnalysisKeyMetricsData => {
    const baseData: StatementAnalysisKeyMetricsData = {
      symbol: 'AAPL',
      date: `${calendarYear}-12-31`,
      calendarYear,
      period,
      revenuePerShare: 25.5,
      netIncomePerShare: 6.5,
      operatingCashFlowPerShare: 8.0,
      freeCashFlowPerShare: 7.5,
      cashPerShare: 10.0,
      bookValuePerShare: 5.0,
      tangibleBookValuePerShare: 4.5,
      shareholdersEquityPerShare: 5.5,
      interestDebtPerShare: 2.0,
      marketCap: 3000000000000,
      enterpriseValue: 3100000000000,
      peRatio: 30.5,
      priceToSalesRatio: 8.5,
      pocfratio: 25.0,
      pfcfRatio: 28.0,
      pbRatio: 45.0,
      ptbRatio: 50.0,
      evToSales: 9.0,
      evToFreeCashFlow: 30.0,
      enterpriseValueOverEBITDA: 20.0,
      evToOperatingCashFlow: 27.0,
      earningsYield: 0.033,
      freeCashFlowYield: 0.036,
      debtToEquity: 1.8,
      debtToAssets: 0.35,
      netDebtToEBITDA: 1.2,
      currentRatio: 1.5,
      interestCoverage: 15.0,
      incomeQuality: 1.2,
      dividendYield: 0.005,
      payoutRatio: 0.15,
      salesGeneralAndAdministrativeToRevenue: 0.06,
      researchAndDevelopmentToRevenue: 0.08,
      intangiblesToTotalAssets: 0.02,
      capexToOperatingCashFlow: 0.1,
      capexToRevenue: 0.05,
      capexToDepreciation: 1.2,
      stockBasedCompensationToRevenue: 0.03,
      grahamNumber: 150.0,
      roic: 0.35,
      returnOnTangibleAssets: 0.4,
      grahamNetNet: 50.0,
      workingCapital: 50000000000,
      tangibleAssetValue: 100000000000,
      netCurrentAssetValue: 40000000000,
      investedCapital: 200000000000,
      averageReceivables: 20000000000,
      averagePayables: 30000000000,
      averageInventory: 5000000000,
      daysSalesOutstanding: 45,
      daysPayablesOutstanding: 60,
      daysOfInventoryOnHand: 10,
      receivablesTurnover: 8.0,
      payablesTurnover: 6.0,
      inventoryTurnover: 35.0,
      roe: 0.55,
      capexPerShare: 0.5,
      xAxisDataKey: `${period} ${calendarYear}`,
      priceToEarnings: '30.50',
      ...overrides
    };

    return new StatementAnalysisKeyMetricsData(baseData);
  };

  describe('transformToTableData', () => {
    describe('empty or invalid data handling', () => {
      it('should return empty columns and rows for null data', () => {
        // Act
        const result = transformToTableData(null as any, 4);

        // Assert
        expect(result.columns).toEqual([]);
        expect(result.rows).toEqual([]);
      });

      it('should return empty columns and rows for undefined data', () => {
        // Act
        const result = transformToTableData(undefined as any, 4);

        // Assert
        expect(result.columns).toEqual([]);
        expect(result.rows).toEqual([]);
      });

      it('should return empty columns and rows for empty array', () => {
        // Act
        const result = transformToTableData([], 4);

        // Assert
        expect(result.columns).toEqual([]);
        expect(result.rows).toEqual([]);
      });

      it('should handle zero periodsToShow', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023')
        ];

        // Act
        const result = transformToTableData(data, 0);

        // Assert
        expect(result.columns).toEqual(['Average']);
        expect(result.rows.length).toBeGreaterThan(0);
        result.rows.forEach(row => {
          expect(row.values).toEqual([]);
        });
      });
    });

    describe('column header generation', () => {
      it('should generate correct column headers for single period', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        expect(result.columns).toEqual(['Q4 2023', 'Average']);
      });

      it('should generate correct column headers for multiple periods', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023'),
          createMockKeyMetricsData('Q2', '2023'),
          createMockKeyMetricsData('Q1', '2023')
        ];

        // Act
        const result = transformToTableData(data, 4);

        // Assert
        expect(result.columns).toEqual([
          'Q4 2023',
          'Q3 2023',
          'Q2 2023',
          'Q1 2023',
          'Average'
        ]);
      });

      it('should limit columns when periodsToShow is less than data length', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023'),
          createMockKeyMetricsData('Q2', '2023'),
          createMockKeyMetricsData('Q1', '2023')
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        expect(result.columns).toEqual(['Q4 2023', 'Q3 2023', 'Average']);
      });

      it('should handle periodsToShow greater than data length', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023')
        ];

        // Act
        const result = transformToTableData(data, 10);

        // Assert
        expect(result.columns).toEqual(['Q4 2023', 'Q3 2023', 'Average']);
      });

      it('should always include "Average" as last column', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023')
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        expect(result.columns[result.columns.length - 1]).toBe('Average');
      });
    });

    describe('metric rows generation', () => {
      it('should generate all expected metric rows', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        expect(result.rows.length).toBeGreaterThan(0);

        // Verify some key metrics exist
        const labels = result.rows.map(row => row.label);
        expect(labels).toContain('priceToEarnings');
        expect(labels).toContain('revenuePerShare');
        expect(labels).toContain('netIncomePerShare');
        expect(labels).toContain('marketCap');
        expect(labels).toContain('peRatio');
        expect(labels).toContain('debtToEquity');
      });

      it('should format integer values correctly', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            marketCap: 3000000000000,
            daysSalesOutstanding: 45
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const marketCapRow = result.rows.find(row => row.label === 'marketCap');
        const daysRow = result.rows.find(row => row.label === 'daysSalesOutstanding');

        expect(marketCapRow?.values[0]).toBe(3000000000000);
        expect(daysRow?.values[0]).toBe(45);
      });

      it('should format decimal values to 2 decimal places', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            revenuePerShare: 25.567,
            peRatio: 30.123456
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        const peRow = result.rows.find(row => row.label === 'peRatio');

        expect(revenueRow?.values[0]).toBe('25.57');
        expect(peRow?.values[0]).toBe('30.12');
      });

      it('should handle null values with em dash', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            dividendYield: null as any,
            payoutRatio: undefined as any
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        const payoutRow = result.rows.find(row => row.label === 'payoutRatio');

        expect(dividendRow?.values[0]).toBe('—');
        expect(payoutRow?.values[0]).toBe('—');
      });

      it('should handle undefined values with em dash', () => {
        // Arrange
        const partialData: any = {
          symbol: 'TEST',
          date: '2023-12-31',
          calendarYear: '2023',
          period: 'Q4',
          xAxisDataKey: 'Q4 2023',
          peRatio: 20,
          priceToEarnings: '20.00',
          // Many fields undefined
        };
        const data = [new StatementAnalysisKeyMetricsData(partialData)];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        expect(revenueRow?.values[0]).toBe('—');
      });

      it('should handle empty string values with em dash', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            date: '' as any
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const dateRow = result.rows.find(row => row.label === 'date');
        expect(dateRow?.values[0]).toBe('—');
      });

      it('should preserve string values like priceToEarnings', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const priceToEarningsRow = result.rows.find(row => row.label === 'priceToEarnings');
        expect(priceToEarningsRow?.values[0]).toBe('30.50');
      });
    });

    describe('average calculation', () => {
      it('should calculate average for metrics with includeAverage=true', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { revenuePerShare: 100 }),
          createMockKeyMetricsData('Q3', '2023', { revenuePerShare: 200 }),
          createMockKeyMetricsData('Q2', '2023', { revenuePerShare: 300 })
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        // Average is 200, which is an integer, so it returns as number not string
        expect(revenueRow?.average).toBe(200);
      });

      it('should not calculate average for metrics with includeAverage=false', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023')
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const dateRow = result.rows.find(row => row.label === 'date');
        const marketCapRow = result.rows.find(row => row.label === 'marketCap');

        expect(dateRow?.average).toBeUndefined();
        expect(marketCapRow?.average).toBeUndefined();
      });

      it('should calculate average correctly for decimal values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { peRatio: 30.5 }),
          createMockKeyMetricsData('Q3', '2023', { peRatio: 25.5 }),
          createMockKeyMetricsData('Q2', '2023', { peRatio: 28.0 })
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        const peRow = result.rows.find(row => row.label === 'peRatio');
        // Average is (30.5 + 25.5 + 28.0) / 3 = 28, which is an integer, so returns as number
        expect(peRow?.average).toBe(28);
      });

      it('should skip null/undefined values when calculating average', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { dividendYield: 0.01 }),
          createMockKeyMetricsData('Q3', '2023', { dividendYield: null as any }),
          createMockKeyMetricsData('Q2', '2023', { dividendYield: 0.03 })
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        // Average should be (0.01 + 0.03) / 2 = 0.02
        expect(dividendRow?.average).toBe('0.02');
      });

      it('should handle all null values for a metric', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { dividendYield: null as any }),
          createMockKeyMetricsData('Q3', '2023', { dividendYield: null as any })
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        expect(dividendRow?.average).toBeUndefined();
      });

      it('should calculate average for single period', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { revenuePerShare: 100.5 })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        expect(revenueRow?.average).toBe('100.50');
      });

      it('should format average to 2 decimal places for decimals', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { roic: 0.333333 }),
          createMockKeyMetricsData('Q3', '2023', { roic: 0.444444 })
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const roicRow = result.rows.find(row => row.label === 'roic');
        expect(roicRow?.average).toBe('0.39');
      });
    });

    describe('multiple periods integration', () => {
      it('should correctly transform data with multiple periods', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            revenuePerShare: 100,
            peRatio: 30,
            marketCap: 3000000000000
          }),
          createMockKeyMetricsData('Q3', '2023', {
            revenuePerShare: 95,
            peRatio: 28,
            marketCap: 2900000000000
          }),
          createMockKeyMetricsData('Q2', '2023', {
            revenuePerShare: 90,
            peRatio: 26,
            marketCap: 2800000000000
          })
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        expect(result.columns).toEqual(['Q4 2023', 'Q3 2023', 'Q2 2023', 'Average']);

        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        expect(revenueRow?.values).toEqual([100, 95, 90]);
        // Average is 95, which is an integer, so returns as number
        expect(revenueRow?.average).toBe(95);

        const marketCapRow = result.rows.find(row => row.label === 'marketCap');
        expect(marketCapRow?.values).toEqual([3000000000000, 2900000000000, 2800000000000]);
        expect(marketCapRow?.average).toBeUndefined();
      });

      it('should handle mixed data types across periods', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            date: '2023-12-31',
            revenuePerShare: 100.5,
            daysSalesOutstanding: 45
          }),
          createMockKeyMetricsData('Q3', '2023', {
            date: '2023-09-30',
            revenuePerShare: 95.7,
            daysSalesOutstanding: 50
          })
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const dateRow = result.rows.find(row => row.label === 'date');
        expect(dateRow?.values).toEqual(['2023-12-31', '2023-09-30']);
        expect(dateRow?.average).toBeUndefined();

        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        expect(revenueRow?.values).toEqual(['100.50', '95.70']);
        expect(revenueRow?.average).toBe('98.10');

        const daysRow = result.rows.find(row => row.label === 'daysSalesOutstanding');
        expect(daysRow?.values).toEqual([45, 50]);
        expect(daysRow?.average).toBe('47.50');
      });
    });

    describe('edge cases', () => {
      it('should handle very large numbers', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            marketCap: 9999999999999,
            enterpriseValue: 8888888888888
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const marketCapRow = result.rows.find(row => row.label === 'marketCap');
        const evRow = result.rows.find(row => row.label === 'enterpriseValue');

        expect(marketCapRow?.values[0]).toBe(9999999999999);
        expect(evRow?.values[0]).toBe(8888888888888);
      });

      it('should handle zero values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            dividendYield: 0,
            payoutRatio: 0
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        const payoutRow = result.rows.find(row => row.label === 'payoutRatio');

        expect(dividendRow?.values[0]).toBe(0);
        expect(payoutRow?.values[0]).toBe(0);
      });

      it('should handle negative values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            netIncomePerShare: -5.5,
            freeCashFlowPerShare: -2.3
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const netIncomeRow = result.rows.find(row => row.label === 'netIncomePerShare');
        const fcfRow = result.rows.find(row => row.label === 'freeCashFlowPerShare');

        expect(netIncomeRow?.values[0]).toBe('-5.50');
        expect(fcfRow?.values[0]).toBe('-2.30');
      });

      it('should handle very small decimal values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            dividendYield: 0.00123,
            earningsYield: 0.00456
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        const earningsRow = result.rows.find(row => row.label === 'earningsYield');

        expect(dividendRow?.values[0]).toBe('0.00');
        expect(earningsRow?.values[0]).toBe('0.00');
      });

      it('should handle NaN string values', () => {
        // StatementAnalysisKeyMetricsData constructor will throw when peRatio is 'NaN' string
        // because it calls toFixed(2) on peRatio
        expect(() => {
          createMockKeyMetricsData('Q4', '2023', {
            peRatio: 'NaN' as any
          });
        }).toThrow();
      });

      it('should handle "undefined" and "null" string values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            roic: 'undefined' as any,
            roe: 'null' as any
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const roicRow = result.rows.find(row => row.label === 'roic');
        const roeRow = result.rows.find(row => row.label === 'roe');

        expect(roicRow?.values[0]).toBe('—');
        expect(roeRow?.values[0]).toBe('—');
      });

      it('should maintain order of metrics as defined in buildMetricRows', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        expect(result.rows[0].label).toBe('priceToEarnings');
        expect(result.rows[1].label).toBe('date');
        expect(result.rows[2].label).toBe('revenuePerShare');
      });

      it('should handle duplicate metric definitions correctly', () => {
        // Arrange - Note: peRatio and priceToEarnings both map to peRatio field
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            peRatio: 30.5
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const priceToEarningsRows = result.rows.filter(
          row => row.label === 'priceToEarnings' || row.label === 'peRatio'
        );

        // There should be multiple entries for PE ratio based on the metrics array
        expect(priceToEarningsRows.length).toBeGreaterThan(1);
      });
    });

    describe('data validation and consistency', () => {
      it('should ensure all rows have same number of values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023'),
          createMockKeyMetricsData('Q2', '2023')
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        const expectedLength = 3;
        result.rows.forEach(row => {
          expect(row.values.length).toBe(expectedLength);
        });
      });

      it('should ensure TableRow structure is correct', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        result.rows.forEach(row => {
          expect(row).toHaveProperty('label');
          expect(row).toHaveProperty('values');
          expect(typeof row.label).toBe('string');
          expect(Array.isArray(row.values)).toBe(true);
          // average is optional
          if (row.average !== undefined) {
            expect(typeof row.average === 'string' || typeof row.average === 'number').toBe(true);
          }
        });
      });

      it('should return object with correct structure', () => {
        // Arrange
        const data = [createMockKeyMetricsData('Q4', '2023')];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        expect(result).toHaveProperty('columns');
        expect(result).toHaveProperty('rows');
        expect(Array.isArray(result.columns)).toBe(true);
        expect(Array.isArray(result.rows)).toBe(true);
      });
    });

    describe('real-world scenarios', () => {
      it('should handle typical quarterly data', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            revenuePerShare: 25.5,
            netIncomePerShare: 6.5,
            peRatio: 30.5,
            marketCap: 3000000000000
          }),
          createMockKeyMetricsData('Q3', '2023', {
            revenuePerShare: 24.8,
            netIncomePerShare: 6.2,
            peRatio: 29.8,
            marketCap: 2950000000000
          }),
          createMockKeyMetricsData('Q2', '2023', {
            revenuePerShare: 24.1,
            netIncomePerShare: 5.9,
            peRatio: 29.1,
            marketCap: 2900000000000
          }),
          createMockKeyMetricsData('Q1', '2023', {
            revenuePerShare: 23.5,
            netIncomePerShare: 5.7,
            peRatio: 28.5,
            marketCap: 2850000000000
          })
        ];

        // Act
        const result = transformToTableData(data, 4);

        // Assert
        expect(result.columns.length).toBe(5); // 4 periods + Average
        expect(result.rows.length).toBeGreaterThan(0);

        const revenueRow = result.rows.find(row => row.label === 'revenuePerShare');
        expect(revenueRow?.values.length).toBe(4);
        expect(revenueRow?.average).toBeDefined();
      });

      it('should handle annual data', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('FY', '2023'),
          createMockKeyMetricsData('FY', '2022'),
          createMockKeyMetricsData('FY', '2021')
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        expect(result.columns).toEqual(['FY 2023', 'FY 2022', 'FY 2021', 'Average']);
      });

      it('should handle mixed period types', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023'),
          createMockKeyMetricsData('Q3', '2023'),
          createMockKeyMetricsData('FY', '2022')
        ];

        // Act
        const result = transformToTableData(data, 3);

        // Assert
        expect(result.columns).toEqual(['Q4 2023', 'Q3 2023', 'FY 2022', 'Average']);
      });

      it('should handle company with no dividends', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            dividendYield: 0,
            payoutRatio: 0
          }),
          createMockKeyMetricsData('Q3', '2023', {
            dividendYield: 0,
            payoutRatio: 0
          })
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');
        const payoutRow = result.rows.find(row => row.label === 'payoutRatio');

        expect(dividendRow?.values).toEqual([0, 0]);
        expect(dividendRow?.average).toBe(0); // Integer average is not formatted
        expect(payoutRow?.values).toEqual([0, 0]);
        expect(payoutRow?.average).toBe(0); // Integer average is not formatted
      });

      it('should handle high-growth tech company metrics', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            peRatio: 150.5,
            priceToSalesRatio: 25.0,
            researchAndDevelopmentToRevenue: 0.35,
            roe: 0.25
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const peRow = result.rows.find(row => row.label === 'peRatio');
        const psRow = result.rows.find(row => row.label === 'priceToSalesRatio');
        const rdRow = result.rows.find(row => row.label === 'researchAndDevelopmentToRevenue');

        expect(peRow?.values[0]).toBe('150.50');
        expect(psRow?.values[0]).toBe(25); // Integer value is not formatted
        expect(rdRow?.values[0]).toBe('0.35');
      });

      it('should handle value stock with low multiples', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            peRatio: 8.5,
            pbRatio: 1.2,
            priceToSalesRatio: 0.8,
            dividendYield: 0.045
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const peRow = result.rows.find(row => row.label === 'peRatio');
        const pbRow = result.rows.find(row => row.label === 'pbRatio');
        const dividendRow = result.rows.find(row => row.label === 'dividendYield');

        expect(peRow?.values[0]).toBe('8.50');
        expect(pbRow?.values[0]).toBe('1.20');
        // 0.045 formatted to 2 decimal places is '0.04' (not '0.05')
        expect(dividendRow?.values[0]).toBe('0.04');
      });
    });

    describe('performance and boundary conditions', () => {
      it('should handle large number of periods efficiently', () => {
        // Arrange
        const data = Array.from({ length: 100 }, (_, i) =>
          createMockKeyMetricsData(`Q${(i % 4) + 1}`, `${2023 - Math.floor(i / 4)}`)
        );

        // Act
        const startTime = performance.now();
        const result = transformToTableData(data, 20);
        const endTime = performance.now();

        // Assert
        expect(result.columns.length).toBe(21); // 20 periods + Average
        expect(result.rows.length).toBeGreaterThan(0);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
      });

      it('should handle maximum safe integer values', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', {
            marketCap: Number.MAX_SAFE_INTEGER,
            enterpriseValue: Number.MAX_SAFE_INTEGER - 1
          })
        ];

        // Act
        const result = transformToTableData(data, 1);

        // Assert
        const marketCapRow = result.rows.find(row => row.label === 'marketCap');
        expect(marketCapRow?.values[0]).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle very precise decimal calculations', () => {
        // Arrange
        const data = [
          createMockKeyMetricsData('Q4', '2023', { roic: 0.123456789 }),
          createMockKeyMetricsData('Q3', '2023', { roic: 0.987654321 })
        ];

        // Act
        const result = transformToTableData(data, 2);

        // Assert
        const roicRow = result.rows.find(row => row.label === 'roic');
        expect(roicRow?.values[0]).toBe('0.12');
        expect(roicRow?.values[1]).toBe('0.99');
        // Average should be properly calculated and formatted
        expect(roicRow?.average).toBe('0.56');
      });
    });
  });
});
