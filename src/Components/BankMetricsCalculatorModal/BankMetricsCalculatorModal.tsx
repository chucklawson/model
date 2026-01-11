import { useState, useEffect } from 'react';
import { Building, X, TrendingUp, Shield, Droplet } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { callFmpApi } from '../../utils/fmpApiClient';
import { fetchFDICMetrics, hasFDICMapping } from '../../utils/fdicApiClient';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface BankMetricsFormData {
  ticker: string;
  period: 'annual' | 'quarter';
}

interface BankMetricsData {
  // Current values (for display)
  roa?: number;
  roe?: number;
  nim?: number | 'N/A';
  efficiencyRatio?: number;
  netProfitMargin?: number;
  nplRatio?: number | 'N/A';
  loanToAssets?: number | 'N/A';
  currentRatio?: number;
  car?: number | 'N/A';
  debtToEquity?: number;

  // Historical data (for charts)
  roaHistory?: Array<{ date: string; value: number }>;
  roeHistory?: Array<{ date: string; value: number }>;
  nimHistory?: Array<{ date: string; value: number }>;
  efficiencyRatioHistory?: Array<{ date: string; value: number }>;
  netProfitMarginHistory?: Array<{ date: string; value: number }>;
  loanToAssetsHistory?: Array<{ date: string; value: number }>;
  currentRatioHistory?: Array<{ date: string; value: number }>;
  debtToEquityHistory?: Array<{ date: string; value: number }>;
  nplRatioHistory?: Array<{ date: string; value: number }>;
  carHistory?: Array<{ date: string; value: number }>;
}

interface MetricCardProps {
  label: string;
  value: number | 'N/A' | undefined;
  format: 'percentage' | 'ratio';
  description: string;
  historyData?: Array<{ date: string; value: number }>;
  trendDirection?: 'higher-is-better' | 'lower-is-better' | 'neutral';
}

function MetricCard({
  label,
  value,
  format,
  description,
  historyData = [],
  trendDirection = 'higher-is-better'
}: MetricCardProps) {
  const isAvailable = value !== 'N/A' && value !== undefined;
  const displayValue = !isAvailable
    ? 'Not Available'
    : format === 'percentage'
      ? `${value.toFixed(2)}%`
      : value.toFixed(2);

  // Determine trend color
  const hasHistory = historyData && historyData.length >= 2;
  let trendColor = '#3b82f6'; // default blue

  if (hasHistory) {
    const firstValue = historyData[0].value;
    const lastValue = historyData[historyData.length - 1].value;
    const isImproving = trendDirection === 'higher-is-better'
      ? lastValue > firstValue
      : trendDirection === 'lower-is-better'
        ? lastValue < firstValue
        : true; // neutral

    trendColor = trendDirection === 'neutral' ? '#3b82f6' : (isImproving ? '#10b981' : '#ef4444');
  }

  // Create valid gradient ID by sanitizing label
  const gradientId = `gradient-${label.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const formattedValue = format === 'percentage'
        ? `${data.value.toFixed(2)}%`
        : data.value.toFixed(2);

      return (
        <div className="bg-white border-2 border-slate-300 rounded-lg p-2 shadow-lg">
          <p className="text-xs font-bold text-slate-800">{data.date}</p>
          <p className="text-sm font-semibold text-slate-700">{formattedValue}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-2 ${
        isAvailable ? 'text-blue-600' : 'text-slate-400'
      }`}>
        {displayValue}
      </p>

      {/* Mini Area Chart */}
      {hasHistory && (
        <div className="mt-3 mb-2">
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={historyData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={trendColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-xs text-slate-400 text-center mt-1">
            Last {historyData.length} periods
          </p>
        </div>
      )}

      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      {!isAvailable && (
        <p className="text-xs text-orange-600 mt-2 font-semibold">
          Data not available
        </p>
      )}
    </div>
  );
}

export default function BankMetricsCalculatorModal({ onClose }: { onClose: () => void }) {
  const client = generateClient<Schema>();

  const [formData, setFormData] = useState<BankMetricsFormData>({
    ticker: '',
    period: 'annual',
  });

  const [metrics, setMetrics] = useState<BankMetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [companyName, setCompanyName] = useState<string>('');

  // Fetch Financial portfolio tickers on mount
  useEffect(() => {
    const fetchFinancialTickers = async () => {
      try {
        const { data: lots } = await client.models.TickerLot.list();

        // Filter lots where portfolios array includes "Financial"
        const financialLots = lots.filter(lot =>
          lot.portfolios && lot.portfolios.includes('Financial')
        );

        // Extract unique ticker symbols
        const uniqueTickers = Array.from(
          new Set(financialLots.map(lot => lot.ticker))
        ).sort();

        setAvailableTickers(uniqueTickers);
      } catch (err) {
        console.error('Error fetching Financial tickers:', err);
        setError('Failed to load Financial portfolio tickers');
      }
    };

    fetchFinancialTickers();
  }, []);

  const calculateEfficiencyRatio = (opex: number, revenue: number): number | undefined => {
    if (!opex || !revenue || revenue <= 0) return undefined;
    return (opex / revenue) * 100;
  };

  const calculateNetInterestMargin = (
    interestIncome: number,
    interestExpense: number,
    totalAssets: number
  ): number | 'N/A' => {
    // NIM = (Interest Income - Interest Expense) / Average Interest-Earning Assets
    // Using total assets as proxy for interest-earning assets
    if (!interestIncome || !interestExpense || !totalAssets || totalAssets <= 0) {
      return 'N/A';
    }
    const netInterestIncome = interestIncome - interestExpense;
    return (netInterestIncome / totalAssets) * 100;
  };

  const calculateLoanToAssets = (
    netReceivables: number,
    shortTermInvestments: number,
    longTermInvestments: number,
    totalAssets: number
  ): number | 'N/A' => {
    // For banks, loans are often reported in receivables or investments
    // This is an approximation - we'll sum receivables and investments as proxy for loans
    if (!totalAssets || totalAssets <= 0) return 'N/A';

    const receivables = netReceivables || 0;
    const shortInv = shortTermInvestments || 0;
    const longInv = longTermInvestments || 0;

    // If we have any loan-like assets, calculate the ratio
    const totalLoanLikeAssets = receivables + shortInv + longInv;
    if (totalLoanLikeAssets === 0) return 'N/A';

    return (totalLoanLikeAssets / totalAssets) * 100;
  };

  const calculateROA = (netIncome: number, totalAssets: number): number | undefined => {
    // ROA = Net Income / Total Assets × 100
    if (!netIncome || !totalAssets || totalAssets <= 0) return undefined;
    return (netIncome / totalAssets) * 100;
  };

  const calculateROE = (netIncome: number, shareholderEquity: number): number | undefined => {
    // ROE = Net Income / Shareholder Equity × 100
    if (!netIncome || !shareholderEquity || shareholderEquity <= 0) return undefined;
    return (netIncome / shareholderEquity) * 100;
  };

  const calculateNetProfitMargin = (netIncome: number, revenue: number): number | undefined => {
    // Net Profit Margin = Net Income / Revenue × 100
    if (!netIncome || !revenue || revenue <= 0) return undefined;
    return (netIncome / revenue) * 100;
  };

  const handleCalculate = async () => {
    setError(null);
    setLoading(true);
    setMetrics(null);
    setCompanyName('');

    try {
      // Validate ticker is from Financial portfolio
      if (!availableTickers.includes(formData.ticker)) {
        setError('Please select a ticker from the Financial portfolio');
        setLoading(false);
        return;
      }

      // Fetch all data in parallel (FMP + FDIC)
      const [quoteData, keyMetricsData, incomeStatementData, balanceSheetData, fdicData] = await Promise.all([
        callFmpApi({ endpoint: `/api/v3/quote/${formData.ticker}` }),
        callFmpApi({
          endpoint: `/api/v3/key-metrics/${formData.ticker}`,
          queryParams: { period: formData.period, limit: 10 }
        }),
        callFmpApi({
          endpoint: `/api/v3/income-statement/${formData.ticker}`,
          queryParams: { period: formData.period, limit: 10 }
        }),
        callFmpApi({
          endpoint: `/api/v3/balance-sheet-statement/${formData.ticker}`,
          queryParams: { period: formData.period, limit: 10 }
        }),
        // Fetch FDIC regulatory data (US banks only)
        fetchFDICMetrics(formData.ticker)
      ]);

      // Extract data from responses
      const quote = Array.isArray(quoteData) ? quoteData[0] : quoteData;

      // Extract arrays (FMP returns last 10 periods)
      const keyMetrics = Array.isArray(keyMetricsData) ? keyMetricsData : [keyMetricsData];
      const incomeStatements = Array.isArray(incomeStatementData) ? incomeStatementData : [incomeStatementData];
      const balanceSheets = Array.isArray(balanceSheetData) ? balanceSheetData : [balanceSheetData];

      // Latest period data (first item in arrays)
      const latestKeyMetrics = keyMetrics[0];
      const latestIncome = incomeStatements[0];
      const latestBalance = balanceSheets[0];

      // Set company name
      if (quote?.name) {
        setCompanyName(quote.name);
      }

      // Calculate current period metrics
      const efficiencyRatio = calculateEfficiencyRatio(
        latestIncome?.operatingExpenses,
        latestIncome?.revenue
      );

      const nim = calculateNetInterestMargin(
        latestIncome?.interestIncome,
        latestIncome?.interestExpense,
        latestBalance?.totalAssets
      );

      const loanToAssets = calculateLoanToAssets(
        latestBalance?.netReceivables,
        latestBalance?.shortTermInvestments,
        latestBalance?.longTermInvestments,
        latestBalance?.totalAssets
      );

      const roa = latestKeyMetrics?.returnOnAssets ?? calculateROA(
        latestIncome?.netIncome,
        latestBalance?.totalAssets
      );

      const roe = latestKeyMetrics?.returnOnEquity ?? calculateROE(
        latestIncome?.netIncome,
        latestBalance?.totalStockholdersEquity
      );

      const netProfitMargin = latestKeyMetrics?.netProfitMargin ?? calculateNetProfitMargin(
        latestIncome?.netIncome,
        latestIncome?.revenue
      );

      // Build historical data for charts
      const roaHistory = keyMetrics
        .map((km, idx) => {
          const date = km?.date || incomeStatements[idx]?.date || balanceSheets[idx]?.date;
          const value = km?.returnOnAssets ?? calculateROA(
            incomeStatements[idx]?.netIncome,
            balanceSheets[idx]?.totalAssets
          );
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const roeHistory = keyMetrics
        .map((km, idx) => {
          const date = km?.date || incomeStatements[idx]?.date || balanceSheets[idx]?.date;
          const value = km?.returnOnEquity ?? calculateROE(
            incomeStatements[idx]?.netIncome,
            balanceSheets[idx]?.totalStockholdersEquity
          );
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const nimHistory = incomeStatements
        .map((income, idx) => {
          const date = income?.date || balanceSheets[idx]?.date;
          const value = calculateNetInterestMargin(
            income?.interestIncome,
            income?.interestExpense,
            balanceSheets[idx]?.totalAssets
          );
          return date && value !== 'N/A' ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const efficiencyRatioHistory = incomeStatements
        .map((income) => {
          const date = income?.date;
          const value = calculateEfficiencyRatio(income?.operatingExpenses, income?.revenue);
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const netProfitMarginHistory = keyMetrics
        .map((km, idx) => {
          const date = km?.date || incomeStatements[idx]?.date;
          const value = km?.netProfitMargin ?? calculateNetProfitMargin(
            incomeStatements[idx]?.netIncome,
            incomeStatements[idx]?.revenue
          );
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const loanToAssetsHistory = balanceSheets
        .map((balance) => {
          const date = balance?.date;
          const value = calculateLoanToAssets(
            balance?.netReceivables,
            balance?.shortTermInvestments,
            balance?.longTermInvestments,
            balance?.totalAssets
          );
          return date && value !== 'N/A' ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const currentRatioHistory = keyMetrics
        .map((km) => {
          const date = km?.date;
          const value = km?.currentRatio;
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const debtToEquityHistory = keyMetrics
        .map((km) => {
          const date = km?.date;
          const value = km?.debtToEquity;
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      // Build metrics object
      const calculatedMetrics: BankMetricsData = {
        // Current values
        roa,
        roe,
        netProfitMargin,
        currentRatio: latestKeyMetrics?.currentRatio,
        debtToEquity: latestKeyMetrics?.debtToEquity,
        efficiencyRatio,
        nim,
        loanToAssets,
        nplRatio: fdicData.nplRatio ?? 'N/A',
        car: fdicData.capitalAdequacyRatio ?? fdicData.tier1CapitalRatio ?? 'N/A',

        // Historical data for charts
        roaHistory,
        roeHistory,
        nimHistory,
        efficiencyRatioHistory,
        netProfitMarginHistory,
        loanToAssetsHistory,
        currentRatioHistory,
        debtToEquityHistory,
        nplRatioHistory: fdicData.nplRatioHistory,
        carHistory: fdicData.carHistory
      };

      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Error calculating bank metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch bank metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Building size={28} />
              <h2 className="text-2xl font-bold">Bank Metrics Calculator</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-2">
            Analyze key financial metrics for banking institutions
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Input Section */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border-2 border-orange-200">

            {/* No tickers message */}
            {availableTickers.length === 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-semibold">
                  No tickers found in Financial portfolio. Please add tickers to your Financial portfolio first.
                </p>
              </div>
            )}

            {/* Ticker Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Select Bank Ticker (Financial Portfolio)
              </label>
              <select
                value={formData.ticker}
                onChange={(e) => setFormData({...formData, ticker: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:outline-none"
                disabled={availableTickers.length === 0}
              >
                <option value="">-- Select Ticker --</option>
                {availableTickers.map(ticker => (
                  <option key={ticker} value={ticker}>{ticker}</option>
                ))}
              </select>
            </div>

            {/* Period Toggle */}
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Period
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormData({...formData, period: 'annual'})}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    formData.period === 'annual'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white border-2 border-orange-300 text-slate-700 hover:border-orange-500'
                  }`}
                >
                  Annual
                </button>
                <button
                  onClick={() => setFormData({...formData, period: 'quarter'})}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    formData.period === 'quarter'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white border-2 border-orange-300 text-slate-700 hover:border-orange-500'
                  }`}
                >
                  Quarterly
                </button>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={!formData.ticker || loading}
              className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white
                         rounded-lg font-bold hover:from-orange-700 hover:to-amber-700
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center
                         justify-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              {loading ? (
                'Calculating...'
              ) : (
                <>
                  <Building size={24} />
                  Calculate Metrics
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Results */}
          {metrics && (
            <div className="space-y-6">

              {/* Company Name Header */}
              {companyName && (
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-slate-800">{companyName}</h3>
                  <p className="text-sm text-slate-600">
                    {formData.ticker} - {formData.period === 'annual' ? 'Annual' : 'Quarterly'} Metrics
                  </p>
                  {hasFDICMapping(formData.ticker) && (
                    <p className="text-xs text-blue-600 mt-2">
                      ✓ Regulatory metrics (NPL, CAR) from FDIC
                    </p>
                  )}
                </div>
              )}

              {/* Section 1: Profitability & Efficiency */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <TrendingUp size={24} className="text-green-600" />
                  Profitability & Efficiency
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <MetricCard
                    label="Return on Assets (ROA)"
                    value={metrics.roa}
                    format="percentage"
                    description="Measures net income relative to total assets"
                    historyData={metrics.roaHistory}
                    trendDirection="higher-is-better"
                  />
                  <MetricCard
                    label="Return on Equity (ROE)"
                    value={metrics.roe}
                    format="percentage"
                    description="Compares net income to shareholder equity"
                    historyData={metrics.roeHistory}
                    trendDirection="higher-is-better"
                  />
                  <MetricCard
                    label="Net Interest Margin (NIM)"
                    value={metrics.nim}
                    format="percentage"
                    description="Interest income minus interest expense, as % of earning assets"
                    historyData={metrics.nimHistory}
                    trendDirection="higher-is-better"
                  />
                  <MetricCard
                    label="Efficiency Ratio"
                    value={metrics.efficiencyRatio}
                    format="percentage"
                    description="Operating expenses as a percentage of revenue"
                    historyData={metrics.efficiencyRatioHistory}
                    trendDirection="lower-is-better"
                  />
                  <MetricCard
                    label="Net Profit Margin"
                    value={metrics.netProfitMargin}
                    format="percentage"
                    description="Revenue remaining after all expenses and taxes"
                    historyData={metrics.netProfitMarginHistory}
                    trendDirection="higher-is-better"
                  />
                </div>
              </div>

              {/* Section 2: Asset Quality & Risk */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Shield size={24} className="text-blue-600" />
                  Asset Quality & Risk
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MetricCard
                    label="Non-Performing Loan (NPL) Ratio"
                    value={metrics.nplRatio}
                    format="percentage"
                    description="Ratio of non-performing loans to total loans"
                    historyData={metrics.nplRatioHistory}
                    trendDirection="lower-is-better"
                  />
                  <MetricCard
                    label="Loan-to-Assets Ratio"
                    value={metrics.loanToAssets}
                    format="percentage"
                    description="Proportion of assets tied up in loans"
                    historyData={metrics.loanToAssetsHistory}
                    trendDirection="neutral"
                  />
                </div>
              </div>

              {/* Section 3: Liquidity & Capital Adequacy */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Droplet size={24} className="text-purple-600" />
                  Liquidity & Capital Adequacy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    label="Current Ratio"
                    value={metrics.currentRatio}
                    format="ratio"
                    description="Ability to cover short-term liabilities with short-term assets"
                    historyData={metrics.currentRatioHistory}
                    trendDirection="higher-is-better"
                  />
                  <MetricCard
                    label="Capital Adequacy Ratio (CAR)"
                    value={metrics.car}
                    format="percentage"
                    description="Capital relative to risk-weighted assets"
                    historyData={metrics.carHistory}
                    trendDirection="higher-is-better"
                  />
                  <MetricCard
                    label="Debt-to-Equity Ratio"
                    value={metrics.debtToEquity}
                    format="ratio"
                    description="Total debt compared to shareholder equity"
                    historyData={metrics.debtToEquityHistory}
                    trendDirection="lower-is-better"
                  />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
