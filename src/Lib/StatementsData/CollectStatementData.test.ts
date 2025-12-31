import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadStatmentMetricsData,
  buildRowTitles,
  buildColumnTitlesByPeriod,
  buildDataToShow
} from './CollectStatementData';
import StatementAnalysisKeyMetricsData from './StatementAnalysisKeyMetricsData';

describe('CollectStatementData', () => {
  // Helper function to create mock statement data
  const createMockStatement = (overrides: Partial<StatementAnalysisKeyMetricsData> = {}): StatementAnalysisKeyMetricsData => {
    const defaultData: StatementAnalysisKeyMetricsData = {
      symbol: 'AAPL',
      date: '2024-01-01',
      calendarYear: '2024',
      period: 'Q1',
      revenuePerShare: 100.5,
      netIncomePerShare: 20.5,
      operatingCashFlowPerShare: 25.0,
      freeCashFlowPerShare: 18.0,
      cashPerShare: 15.5,
      bookValuePerShare: 45.0,
      tangibleBookValuePerShare: 40.0,
      shareholdersEquityPerShare: 50.0,
      interestDebtPerShare: 5.0,
      marketCap: 1000000000,
      enterpriseValue: 1100000000,
      peRatio: 15.5,
      priceToSalesRatio: 3.5,
      pocfratio: 12.0,
      pfcfRatio: 14.0,
      pbRatio: 2.5,
      ptbRatio: 2.8,
      evToSales: 3.8,
      enterpriseValueOverEBITDA: 10.0,
      evToOperatingCashFlow: 12.5,
      evToFreeCashFlow: 15.0,
      earningsYield: 0.065,
      freeCashFlowYield: 0.071,
      debtToEquity: 1.2,
      debtToAssets: 0.4,
      netDebtToEBITDA: 2.5,
      currentRatio: 1.5,
      interestCoverage: 8.0,
      incomeQuality: 1.1,
      dividendYield: 0.015,
      payoutRatio: 0.25,
      salesGeneralAndAdministrativeToRevenue: 0.15,
      researchAndDevelopmentToRevenue: 0.08,
      intangiblesToTotalAssets: 0.3,
      capexToOperatingCashFlow: 0.2,
      capexToRevenue: 0.05,
      capexToDepreciation: 1.2,
      stockBasedCompensationToRevenue: 0.03,
      grahamNumber: 50.0,
      roic: 0.18,
      returnOnTangibleAssets: 0.22,
      grahamNetNet: 45.0,
      workingCapital: 50000000,
      tangibleAssetValue: 100000000,
      netCurrentAssetValue: 60000000,
      investedCapital: 200000000,
      averageReceivables: 10000000,
      averagePayables: 8000000,
      averageInventory: 5000000,
      daysSalesOutstanding: 45.0,
      daysPayablesOutstanding: 30.0,
      daysOfInventoryOnHand: 25.0,
      receivablesTurnover: 8.0,
      payablesTurnover: 12.0,
      inventoryTurnover: 14.0,
      roe: 0.25,
      capexPerShare: 5.0,
      xAxisDataKey: 'Q1 2024',
      priceToEarnings: '15.50',
      ...overrides
    };
    return new StatementAnalysisKeyMetricsData(defaultData);
  };

  describe('loadStatmentMetricsData', () => {
    it('should load and convert statement metrics data into StatementAnalysisKeyMetricsData instances', () => {
      // Arrange
      const inputData = [
        createMockStatement({ symbol: 'AAPL', period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ symbol: 'AAPL', period: 'Q2', calendarYear: '2024' })
      ];

      // Act
      const result = loadStatmentMetricsData(inputData);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(StatementAnalysisKeyMetricsData);
      expect(result[1]).toBeInstanceOf(StatementAnalysisKeyMetricsData);
      expect(result[0].symbol).toBe('AAPL');
      expect(result[1].symbol).toBe('AAPL');
    });

    it('should return empty array when input is null', () => {
      // Act
      const result = loadStatmentMetricsData(null as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input is undefined', () => {
      // Act
      const result = loadStatmentMetricsData(undefined as any);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input array is empty', () => {
      // Arrange
      const inputData: StatementAnalysisKeyMetricsData[] = [];

      // Act
      const result = loadStatmentMetricsData(inputData);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle single item array', () => {
      // Arrange
      const inputData = [createMockStatement({ symbol: 'MSFT' })];

      // Act
      const result = loadStatmentMetricsData(inputData);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('MSFT');
    });

    it('should preserve all data fields when loading', () => {
      // Arrange
      const inputData = [
        createMockStatement({
          symbol: 'GOOGL',
          revenuePerShare: 123.45,
          netIncomePerShare: 67.89,
          peRatio: 25.5
        })
      ];

      // Act
      const result = loadStatmentMetricsData(inputData);

      // Assert
      expect(result[0].symbol).toBe('GOOGL');
      expect(result[0].revenuePerShare).toBe(123.45);
      expect(result[0].netIncomePerShare).toBe(67.89);
      expect(result[0].peRatio).toBe(25.5);
    });

    it('should handle large arrays efficiently', () => {
      // Arrange
      const inputData = Array.from({ length: 100 }, (_, i) =>
        createMockStatement({ period: `Q${(i % 4) + 1}`, calendarYear: `${2020 + Math.floor(i / 4)}` })
      );

      // Act
      const result = loadStatmentMetricsData(inputData);

      // Assert
      expect(result).toHaveLength(100);
      expect(result[0]).toBeInstanceOf(StatementAnalysisKeyMetricsData);
      expect(result[99]).toBeInstanceOf(StatementAnalysisKeyMetricsData);
    });
  });

  describe('buildRowTitles', () => {
    it('should return array of all metric row titles', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include priceToEarnings at beginning and end', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result[0]).toBe('priceToEarnings');
      expect(result[result.length - 1]).toBe('priceToEarnings');
    });

    it('should include date field', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('date');
    });

    it('should include key financial metrics', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('revenuePerShare');
      expect(result).toContain('netIncomePerShare');
      expect(result).toContain('operatingCashFlowPerShare');
      expect(result).toContain('freeCashFlowPerShare');
    });

    it('should include valuation ratios', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('peRatio');
      expect(result).toContain('priceToSalesRatio');
      expect(result).toContain('pbRatio');
      expect(result).toContain('ptbRatio');
    });

    it('should include leverage metrics', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('debtToEquity');
      expect(result).toContain('debtToAssets');
      expect(result).toContain('currentRatio');
      expect(result).toContain('interestCoverage');
    });

    it('should include efficiency metrics', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('receivablesTurnover');
      expect(result).toContain('payablesTurnover');
      expect(result).toContain('inventoryTurnover');
      expect(result).toContain('daysSalesOutstanding');
    });

    it('should include return metrics', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('roe');
      expect(result).toContain('roic');
      expect(result).toContain('returnOnTangibleAssets');
    });

    it('should include xAxisDataKey', () => {
      // Act
      const result = buildRowTitles();

      // Assert
      expect(result).toContain('xAxisDataKey');
    });

    it('should return consistent results on multiple calls', () => {
      // Act
      const result1 = buildRowTitles();
      const result2 = buildRowTitles();

      // Assert
      expect(result1).toEqual(result2);
    });

    it('should not include commented out fields', () => {
      // Act
      const result = buildRowTitles();

      // Assert - These fields are commented out in the source
      expect(result).not.toContain('symbol');
      expect(result).not.toContain('period');
      expect(result).not.toContain('calendarYear');
      expect(result).not.toContain('updatedAt');
      expect(result).not.toContain('createdAt');
    });
  });

  describe('buildColumnTitlesByPeriod', () => {
    it('should build column titles from statement data', () => {
      // Arrange
      const statementData = [
        createMockStatement({ period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ period: 'Q2', calendarYear: '2024' }),
        createMockStatement({ period: 'Q3', calendarYear: '2024' })
      ];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 3);

      // Assert
      expect(result).toHaveLength(4); // 3 periods + 'Average'
      expect(result[0]).toBe('Q1 2024');
      expect(result[1]).toBe('Q2 2024');
      expect(result[2]).toBe('Q3 2024');
      expect(result[3]).toBe('Average');
    });

    it('should always append "Average" as last column', () => {
      // Arrange
      const statementData = [createMockStatement()];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 1);

      // Assert
      expect(result[result.length - 1]).toBe('Average');
    });

    it('should limit columns to maxPeriodsIn when data has more items', () => {
      // Arrange
      const statementData = [
        createMockStatement({ period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ period: 'Q2', calendarYear: '2024' }),
        createMockStatement({ period: 'Q3', calendarYear: '2024' }),
        createMockStatement({ period: 'Q4', calendarYear: '2024' }),
        createMockStatement({ period: 'Q1', calendarYear: '2025' })
      ];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 3);

      // Assert
      expect(result).toHaveLength(4); // 3 periods + 'Average'
      expect(result[0]).toBe('Q1 2024');
      expect(result[1]).toBe('Q2 2024');
      expect(result[2]).toBe('Q3 2024');
    });

    it('should use all data when maxPeriodsIn is larger than data length', () => {
      // Arrange
      const statementData = [
        createMockStatement({ period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ period: 'Q2', calendarYear: '2024' })
      ];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 10);

      // Assert
      expect(result).toHaveLength(3); // 2 periods + 'Average'
      expect(result[0]).toBe('Q1 2024');
      expect(result[1]).toBe('Q2 2024');
      expect(result[2]).toBe('Average');
    });

    it('should handle empty statement data array', () => {
      // Arrange
      const statementData: StatementAnalysisKeyMetricsData[] = [];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 5);

      // Assert
      expect(result).toHaveLength(1); // Only 'Average'
      expect(result[0]).toBe('Average');
    });

    it('should handle single statement data', () => {
      // Arrange
      const statementData = [createMockStatement({ period: 'Q4', calendarYear: '2023' })];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 1);

      // Assert
      expect(result).toHaveLength(2); // 1 period + 'Average'
      expect(result[0]).toBe('Q4 2023');
      expect(result[1]).toBe('Average');
    });

    it('should use xAxisDataKey for column titles', () => {
      // Arrange
      const statementData = [
        createMockStatement({ period: 'FY', calendarYear: '2023' }),
        createMockStatement({ period: 'FY', calendarYear: '2022' })
      ];

      // Act
      const result = buildColumnTitlesByPeriod(statementData, 2);

      // Assert
      expect(result[0]).toBe('FY 2023');
      expect(result[1]).toBe('FY 2022');
    });
  });

  describe('buildDataToShow', () => {
    let mockStatementData: StatementAnalysisKeyMetricsData[];

    beforeEach(() => {
      mockStatementData = [
        createMockStatement({
          period: 'Q1',
          calendarYear: '2024',
          revenuePerShare: 100.0,
          netIncomePerShare: 20.0,
          peRatio: 15.0,
          priceToEarnings: '15.00'
        }),
        createMockStatement({
          period: 'Q2',
          calendarYear: '2024',
          revenuePerShare: 110.0,
          netIncomePerShare: 22.0,
          peRatio: 16.0,
          priceToEarnings: '16.00'
        }),
        createMockStatement({
          period: 'Q3',
          calendarYear: '2024',
          revenuePerShare: 120.0,
          netIncomePerShare: 24.0,
          peRatio: 17.0,
          priceToEarnings: '17.00'
        })
      ];
    });

    it('should build data rows with averages', () => {
      // Act
      const result = buildDataToShow(mockStatementData, 3);

      // Assert
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toBeInstanceOf(Array);
    });

    it('should format decimal numbers to 4 decimal places', () => {
      // Arrange
      const data = [
        createMockStatement({
          revenuePerShare: 123.456789,
          netIncomePerShare: 45.678912
        })
      ];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert - First row is priceToEarnings, second is date, third is revenuePerShare
      const revenueRow = result[2];
      expect(revenueRow[0].value).toBe('123.4568');
    });

    it('should preserve integer values without decimal formatting', () => {
      // Arrange
      const data = [createMockStatement({ marketCap: 1000000000 })];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert
      // marketCap is the 12th metric row (index 11)
      const marketCapRow = result[11];
      expect(marketCapRow[0].value).toBe(1000000000);
    });

    it('should calculate averages correctly for numeric metrics', () => {
      // Arrange
      const data = [
        createMockStatement({ revenuePerShare: 100.0 }),
        createMockStatement({ revenuePerShare: 200.0 }),
        createMockStatement({ revenuePerShare: 300.0 })
      ];

      // Act
      const result = buildDataToShow(data, 3);

      // Assert - revenuePerShare is 3rd row, average is last element
      const revenueRow = result[2];
      const averageValue = revenueRow[revenueRow.length - 1].value;
      // Average of 100, 200, 300 is 200, which is stored as integer (not formatted)
      expect(averageValue).toBe(200); // (100 + 200 + 300) / 3
    });

    it('should limit rows to periodsToUse when data has more items', () => {
      // Arrange
      const data = [
        createMockStatement({ period: 'Q1', revenuePerShare: 100 }),
        createMockStatement({ period: 'Q2', revenuePerShare: 110 }),
        createMockStatement({ period: 'Q3', revenuePerShare: 120 }),
        createMockStatement({ period: 'Q4', revenuePerShare: 130 }),
        createMockStatement({ period: 'Q1', revenuePerShare: 140 })
      ];

      // Act
      const result = buildDataToShow(data, 3);

      // Assert - Each row should have 3 periods + 1 average = 4 elements
      expect(result[0]).toHaveLength(4); // priceToEarnings row
      expect(result[2]).toHaveLength(4); // revenuePerShare row
    });

    it('should use all data when periodsToUse is larger than data length', () => {
      // Arrange
      const data = [
        createMockStatement({ revenuePerShare: 100 }),
        createMockStatement({ revenuePerShare: 200 })
      ];

      // Act
      const result = buildDataToShow(data, 10);

      // Assert - Each row should have 2 periods + 1 average = 3 elements
      expect(result[0]).toHaveLength(3);
    });

    it('should handle single statement data', () => {
      // Arrange
      const data = [createMockStatement({ revenuePerShare: 150.5 })];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveLength(2); // 1 period + 1 average
    });

    it('should include date row without average calculation', () => {
      // Arrange
      const data = [
        createMockStatement({ date: '2024-01-01' }),
        createMockStatement({ date: '2024-02-01' })
      ];

      // Act
      const result = buildDataToShow(data, 2);

      // Assert - date is 2nd row (after first priceToEarnings)
      const dateRow = result[1];
      expect(dateRow).toHaveLength(2); // Only dates, no average for date field
      expect(dateRow[0].value).toBe('2024-01-01');
      expect(dateRow[1].value).toBe('2024-02-01');
    });

    it('should include marketCap and enterpriseValue without averages', () => {
      // Arrange
      const data = [
        createMockStatement({ marketCap: 1000000, enterpriseValue: 1100000 }),
        createMockStatement({ marketCap: 2000000, enterpriseValue: 2200000 })
      ];

      // Act
      const result = buildDataToShow(data, 2);

      // Assert - Check that marketCap and enterpriseValue rows don't have averages
      // These metrics don't include average calculation in the source
      const marketCapRow = result[11]; // marketCap is 12th row (index 11)
      const enterpriseValueRow = result[12]; // enterpriseValue is 13th row (index 12)

      // These should only have the data values, not an average column
      expect(marketCapRow).toHaveLength(2);
      expect(enterpriseValueRow).toHaveLength(2);
    });

    it('should handle zero values correctly', () => {
      // Arrange
      const data = [
        createMockStatement({ dividendYield: 0, payoutRatio: 0 })
      ];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert - Should handle zeros without errors
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle negative values correctly', () => {
      // Arrange
      const data = [
        createMockStatement({
          netIncomePerShare: -10.5,
          freeCashFlowPerShare: -5.25
        })
      ];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert
      const netIncomeRow = result[3]; // netIncomePerShare row
      expect(netIncomeRow[0].value).toBe('-10.5000');
    });

    it('should maintain proper row structure for all metrics', () => {
      // Act
      const result = buildDataToShow(mockStatementData, 3);

      // Assert - Verify each row has proper structure with value property
      result.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toHaveProperty('value');
          expect(typeof cell.value === 'string' || typeof cell.value === 'number').toBe(true);
        });
      });
    });

    it('should include xAxisDataKey row at the end', () => {
      // Arrange
      const data = [
        createMockStatement({ period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ period: 'Q2', calendarYear: '2024' })
      ];

      // Act
      const result = buildDataToShow(data, 2);

      // Assert - xAxisDataKey should be second to last row (before final priceToEarnings)
      const xAxisRow = result[result.length - 2];
      expect(xAxisRow[0].value).toBe('Q1 2024');
      expect(xAxisRow[1].value).toBe('Q2 2024');
    });

    it('should have priceToEarnings as last row', () => {
      // Arrange
      // The default priceToEarnings from createMockStatement is '15.50'
      const data = [createMockStatement()];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert - Last row should be priceToEarnings
      const lastRow = result[result.length - 1];
      expect(lastRow[0].value).toBe('15.50');
    });

    it('should calculate complex averages correctly across multiple periods', () => {
      // Arrange
      const data = [
        createMockStatement({ roe: 0.20, roic: 0.15 }),
        createMockStatement({ roe: 0.25, roic: 0.18 }),
        createMockStatement({ roe: 0.30, roic: 0.21 }),
        createMockStatement({ roe: 0.35, roic: 0.24 })
      ];

      // Act
      const result = buildDataToShow(data, 4);

      // Assert - ROE average should be (0.20 + 0.25 + 0.30 + 0.35) / 4 = 0.275
      // Find the ROE row
      const roeRowIndex = result.length - 4; // roe is near the end
      const roeRow = result[roeRowIndex];
      const roeAverage = parseFloat(roeRow[roeRow.length - 1].value as string);
      expect(roeAverage).toBeCloseTo(0.275, 3);
    });

    it('should handle empty statement data array', () => {
      // Arrange
      const data: StatementAnalysisKeyMetricsData[] = [];

      // Act
      const result = buildDataToShow(data, 0);

      // Assert
      expect(result).toBeInstanceOf(Array);
      // Should still return rows structure even with no data
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    it('should work together: load data, build titles, and build display data', () => {
      // Arrange
      const rawData = [
        createMockStatement({ symbol: 'AAPL', period: 'Q1', calendarYear: '2024' }),
        createMockStatement({ symbol: 'AAPL', period: 'Q2', calendarYear: '2024' }),
        createMockStatement({ symbol: 'AAPL', period: 'Q3', calendarYear: '2024' })
      ];

      // Act
      const statementData = loadStatmentMetricsData(rawData);
      const rowTitles = buildRowTitles();
      const columnTitles = buildColumnTitlesByPeriod(statementData, 3);
      const dataRows = buildDataToShow(statementData, 3);

      // Assert
      expect(statementData).toHaveLength(3);
      expect(rowTitles.length).toBeGreaterThan(0);
      expect(columnTitles).toHaveLength(4); // 3 periods + Average
      expect(dataRows.length).toBeGreaterThan(0);
      expect(dataRows[0]).toHaveLength(4); // 3 periods + average
    });

    it('should maintain data consistency between column titles and data rows', () => {
      // Arrange
      const rawData = [
        createMockStatement({ period: 'Q1', calendarYear: '2024', revenuePerShare: 100 }),
        createMockStatement({ period: 'Q2', calendarYear: '2024', revenuePerShare: 110 })
      ];

      // Act
      const statementData = loadStatmentMetricsData(rawData);
      const columnTitles = buildColumnTitlesByPeriod(statementData, 2);
      const dataRows = buildDataToShow(statementData, 2);

      // Assert - Number of columns should match
      expect(columnTitles).toHaveLength(3); // 2 periods + Average
      dataRows.forEach((row) => {
        // Each row should have same number of elements as columns
        // Note: some rows (date, marketCap, etc.) don't have averages
        expect(row.length).toBeLessThanOrEqual(3);
        expect(row.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should handle real-world scenario with mixed data types', () => {
      // Arrange - Simulate real financial data
      const rawData = [
        createMockStatement({
          symbol: 'TSLA',
          period: 'FY',
          calendarYear: '2023',
          revenuePerShare: 250.5,
          netIncomePerShare: 15.75,
          peRatio: 45.2,
          debtToEquity: 0.8,
          roe: 0.18,
          marketCap: 800000000000
        }),
        createMockStatement({
          symbol: 'TSLA',
          period: 'FY',
          calendarYear: '2022',
          revenuePerShare: 220.3,
          netIncomePerShare: 12.50,
          peRatio: 50.5,
          debtToEquity: 1.0,
          roe: 0.15,
          marketCap: 700000000000
        })
      ];

      // Act
      const statementData = loadStatmentMetricsData(rawData);
      const rowTitles = buildRowTitles();
      const columnTitles = buildColumnTitlesByPeriod(statementData, 2);
      const dataRows = buildDataToShow(statementData, 2);

      // Assert - Complete workflow should work without errors
      expect(statementData).toHaveLength(2);
      expect(rowTitles).toContain('revenuePerShare');
      expect(rowTitles).toContain('netIncomePerShare');
      expect(columnTitles[0]).toBe('FY 2023');
      expect(columnTitles[1]).toBe('FY 2022');
      expect(dataRows.length).toBe(rowTitles.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers without overflow', () => {
      // Arrange
      const data = [
        createMockStatement({
          marketCap: 999999999999999,
          enterpriseValue: 888888888888888
        })
      ];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert - Should handle large numbers
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very small decimal numbers', () => {
      // Arrange
      const data = [
        createMockStatement({
          dividendYield: 0.0001,
          earningsYield: 0.00005
        })
      ];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle special values correctly', () => {
      // Arrange
      const data = [
        createMockStatement({
          revenuePerShare: 0,
          netIncomePerShare: -0,
          peRatio: 0.0001
        })
      ];

      // Act & Assert - Should not throw
      expect(() => {
        loadStatmentMetricsData(data);
        buildRowTitles();
        buildColumnTitlesByPeriod(data, 1);
        buildDataToShow(data, 1);
      }).not.toThrow();
    });

    it('should handle maximum period counts', () => {
      // Arrange - Create 20 quarters of data
      const data = Array.from({ length: 20 }, (_, i) =>
        createMockStatement({
          period: `Q${(i % 4) + 1}`,
          calendarYear: `${2020 + Math.floor(i / 4)}`,
          revenuePerShare: 100 + i * 5
        })
      );

      // Act
      const statementData = loadStatmentMetricsData(data);
      const columnTitles = buildColumnTitlesByPeriod(statementData, 20);
      const dataRows = buildDataToShow(statementData, 20);

      // Assert
      expect(columnTitles).toHaveLength(21); // 20 periods + Average
      expect(dataRows[0]).toHaveLength(21);
    });

    it('should handle minimum period count (1)', () => {
      // Arrange
      const data = [createMockStatement()];

      // Act
      const result = buildDataToShow(data, 1);

      // Assert - Should work with single period
      expect(result.length).toBeGreaterThan(0);
      result.forEach((row) => {
        expect(row.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
