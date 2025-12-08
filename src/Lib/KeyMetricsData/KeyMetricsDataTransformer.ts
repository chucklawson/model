import StatementAnalysisKeyMetricsData from '../StatementsData/StatementAnalysisKeyMetricsData';

export interface TableRow {
  label: string;
  values: (string | number)[];
  average?: string | number;
}

interface TransformedTableData {
  columns: string[];
  rows: TableRow[];
}

/**
 * Transform key metrics API data into table-ready format
 * @param data Array of key metrics data from API
 * @param periodsToShow Number of periods to display
 * @returns Object with columns (period headers) and rows (metric data)
 */
export function transformToTableData(
  data: StatementAnalysisKeyMetricsData[],
  periodsToShow: number
): TransformedTableData {
  if (!data || data.length === 0) {
    return { columns: [], rows: [] };
  }

  const periods = Math.min(periodsToShow, data.length);

  // Build column headers (periods + Average)
  const columns = buildColumnHeaders(data, periods);

  // Build data rows for all metrics
  const rows = buildMetricRows(data, periods);

  return { columns, rows };
}

/**
 * Build column headers from period data
 * Pattern from CollectStatementData.ts buildColumnTitlesByPeriod()
 */
function buildColumnHeaders(
  data: StatementAnalysisKeyMetricsData[],
  periods: number
): string[] {
  const columns: string[] = [];

  for (let i = 0; i < periods; i++) {
    columns.push(data[i].xAxisDataKey);
  }

  columns.push('Average');
  return columns;
}

/**
 * Build all metric rows with values and averages
 * Pattern from CollectStatementData.ts buildDataToShow()
 */
function buildMetricRows(
  data: StatementAnalysisKeyMetricsData[],
  periods: number
): TableRow[] {
  const rows: TableRow[] = [];

  // Define metrics to display (same as buildRowTitles in CollectStatementData.ts)
  const metrics: Array<{
    key: keyof StatementAnalysisKeyMetricsData;
    label: string;
    includeAverage: boolean;
  }> = [
    { key: 'peRatio', label: 'priceToEarnings', includeAverage: true },
    { key: 'date', label: 'date', includeAverage: false },
    { key: 'revenuePerShare', label: 'revenuePerShare', includeAverage: true },
    { key: 'netIncomePerShare', label: 'netIncomePerShare', includeAverage: true },
    { key: 'operatingCashFlowPerShare', label: 'operatingCashFlowPerShare', includeAverage: true },
    { key: 'freeCashFlowPerShare', label: 'freeCashFlowPerShare', includeAverage: true },
    { key: 'cashPerShare', label: 'cashPerShare', includeAverage: true },
    { key: 'bookValuePerShare', label: 'bookValuePerShare', includeAverage: true },
    { key: 'tangibleBookValuePerShare', label: 'tangibleBookValuePerShare', includeAverage: true },
    { key: 'shareholdersEquityPerShare', label: 'shareholdersEquityPerShare', includeAverage: true },
    { key: 'interestDebtPerShare', label: 'interestDebtPerShare', includeAverage: true },
    { key: 'marketCap', label: 'marketCap', includeAverage: false },
    { key: 'enterpriseValue', label: 'enterpriseValue', includeAverage: false },
    { key: 'peRatio', label: 'peRatio', includeAverage: true },
    { key: 'priceToSalesRatio', label: 'priceToSalesRatio', includeAverage: true },
    { key: 'pocfratio', label: 'pocfratio', includeAverage: true },
    { key: 'pfcfRatio', label: 'pfcfRatio', includeAverage: true },
    { key: 'pbRatio', label: 'pbRatio', includeAverage: true },
    { key: 'ptbRatio', label: 'ptbRatio', includeAverage: true },
    { key: 'evToSales', label: 'evToSales', includeAverage: true },
    { key: 'evToFreeCashFlow', label: 'evToFreeCashFlow', includeAverage: true },
    { key: 'enterpriseValueOverEBITDA', label: 'enterpriseValueOverEBITDA', includeAverage: true },
    { key: 'evToOperatingCashFlow', label: 'evToOperatingCashFlow', includeAverage: true },
    { key: 'earningsYield', label: 'earningsYield', includeAverage: true },
    { key: 'freeCashFlowYield', label: 'freeCashFlowYield', includeAverage: true },
    { key: 'debtToEquity', label: 'debtToEquity', includeAverage: true },
    { key: 'debtToAssets', label: 'debtToAssets', includeAverage: true },
    { key: 'netDebtToEBITDA', label: 'netDebtToEBITDA', includeAverage: true },
    { key: 'currentRatio', label: 'currentRatio', includeAverage: true },
    { key: 'interestCoverage', label: 'interestCoverage', includeAverage: true },
    { key: 'incomeQuality', label: 'incomeQuality', includeAverage: true },
    { key: 'dividendYield', label: 'dividendYield', includeAverage: true },
    { key: 'payoutRatio', label: 'payoutRatio', includeAverage: true },
    { key: 'salesGeneralAndAdministrativeToRevenue', label: 'salesGeneralAndAdministrativeToRevenue', includeAverage: true },
    { key: 'researchAndDevelopmentToRevenue', label: 'researchAndDevelopmentToRevenue', includeAverage: true },
    { key: 'intangiblesToTotalAssets', label: 'intangiblesToTotalAssets', includeAverage: true },
    { key: 'capexToOperatingCashFlow', label: 'capexToOperatingCashFlow', includeAverage: true },
    { key: 'capexToRevenue', label: 'capexToRevenue', includeAverage: true },
    { key: 'capexToDepreciation', label: 'capexToDepreciation', includeAverage: true },
    { key: 'stockBasedCompensationToRevenue', label: 'stockBasedCompensationToRevenue', includeAverage: true },
    { key: 'grahamNumber', label: 'grahamNumber', includeAverage: true },
    { key: 'roic', label: 'roic', includeAverage: true },
    { key: 'returnOnTangibleAssets', label: 'returnOnTangibleAssets', includeAverage: true },
    { key: 'grahamNetNet', label: 'grahamNetNet', includeAverage: true },
    { key: 'workingCapital', label: 'workingCapital', includeAverage: true },
    { key: 'tangibleAssetValue', label: 'tangibleAssetValue', includeAverage: true },
    { key: 'netCurrentAssetValue', label: 'netCurrentAssetValue', includeAverage: true },
    { key: 'investedCapital', label: 'investedCapital', includeAverage: true },
    { key: 'averageReceivables', label: 'averageReceivables', includeAverage: true },
    { key: 'averagePayables', label: 'averagePayables', includeAverage: true },
    { key: 'averageInventory', label: 'averageInventory', includeAverage: true },
    { key: 'daysSalesOutstanding', label: 'daysSalesOutstanding', includeAverage: true },
    { key: 'daysPayablesOutstanding', label: 'daysPayablesOutstanding', includeAverage: true },
    { key: 'daysOfInventoryOnHand', label: 'daysOfInventoryOnHand', includeAverage: true },
    { key: 'receivablesTurnover', label: 'receivablesTurnover', includeAverage: true },
    { key: 'payablesTurnover', label: 'payablesTurnover', includeAverage: true },
    { key: 'inventoryTurnover', label: 'inventoryTurnover', includeAverage: true },
    { key: 'roe', label: 'roe', includeAverage: true },
    { key: 'capexPerShare', label: 'capexPerShare', includeAverage: true },
    { key: 'peRatio', label: 'priceToEarnings', includeAverage: false },
  ];

  // Build each row
  for (const metric of metrics) {
    const values: (string | number)[] = [];
    let sum = 0;
    let count = 0;

    // Collect values for each period
    for (let i = 0; i < periods; i++) {
      const value = data[i][metric.key];
      const formattedValue = formatValue(value);
      values.push(formattedValue);

      // Accumulate for average calculation
      if (metric.includeAverage && typeof value === 'number') {
        sum += value;
        count++;
      }
    }

    // Calculate and add average if applicable
    let average: string | number | undefined;
    if (metric.includeAverage && count > 0) {
      const avgValue = sum / count;
      average = formatValue(avgValue);
    }

    rows.push({
      label: metric.label,
      values,
      average,
    });
  }

  return rows;
}

/**
 * Format value for display
 * Pattern from CollectStatementData.ts addOneRowElement()
 */
function formatValue(value: any): string | number {
  // Handle undefined, null, or empty values
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  // Handle string representations of invalid numbers
  if (typeof value === 'string' && (value === 'NaN' || value === 'undefined' || value === 'null')) {
    return '—';
  }

  // Format decimal numbers to 2 places
  if (typeof value === 'number' && !Number.isInteger(value)) {
    return value.toFixed(2);
  }

  // If it's already a string (like priceToEarnings), return as-is
  return value;
}
