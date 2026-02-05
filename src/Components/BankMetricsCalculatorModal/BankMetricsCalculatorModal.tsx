import { useState, useEffect } from 'react';
import { Building, X, TrendingUp, Shield, Droplet, Award, Star, CheckCircle, AlertCircle } from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { callFmpApi } from '../../utils/fmpApiClient';
import { fetchFDICMetrics, hasFDICMapping } from '../../utils/fdicApiClient';
import {
  AreaChart,
  Area,
  Line,
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
  rotce?: number;
  tbvps?: number;
  cte1?: number | 'N/A';

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
  rotceHistory?: Array<{ date: string; value: number }>;
  tbvpsHistory?: Array<{ date: string; value: number }>;
  cte1History?: Array<{ date: string; value: number }>;
}

interface BankRecommendation {
  // Overall scores
  finalScore: number;                    // 0-100
  stars: number;                         // 1-5
  recommendation: 'Buy' | 'Hold' | 'Sell';
  confidence: 'High' | 'Medium' | 'Low'; // Confidence in recommendation

  // Component scores
  safetyScore: number;                   // 0-25 points
  profitabilityScore: number;            // 0-25 points
  trendScore: number;                    // 0-50 points

  // Performance metrics
  metricsAboveAverage: number;
  metricsBelowAverage: number;

  // Insights
  strengths: string[];                   // Top 3 performing metrics
  concerns: string[];                    // Bottom 3 performing metrics

  // Target price
  targetPrice: number | null;            // Analyst consensus target
  currentPrice: number;
  upside: number;                        // Percentage upside/downside
  targetSource: string;                  // Source of target (e.g., "Analyst Consensus")
}

interface MetricCardProps {
  label: string;
  value: number | 'N/A' | undefined;
  format: 'percentage' | 'ratio';
  description: string;
  historyData?: Array<{ date: string; value: number }>;
  trendDirection?: 'higher-is-better' | 'lower-is-better' | 'neutral';
  sectorAverage?: number;
}

function MetricCard({
  label,
  value,
  format,
  description,
  historyData = [],
  trendDirection = 'higher-is-better',
  sectorAverage
}: MetricCardProps) {
  const isAvailable = value !== 'N/A' && value !== undefined;
  const displayValue = !isAvailable
    ? 'Not Available'
    : format === 'percentage'
      ? `${value.toFixed(2)}%`
      : value.toFixed(2);

  // Sector comparison
  const hasSectorData = isAvailable && sectorAverage !== undefined;
  let comparisonText = '';
  let comparisonColor = '';
  let comparisonIcon = '';

  if (hasSectorData && typeof value === 'number') {
    const isAboveAverage = trendDirection === 'higher-is-better'
      ? value > sectorAverage
      : trendDirection === 'lower-is-better'
        ? value < sectorAverage
        : value === sectorAverage;

    if (trendDirection === 'neutral') {
      comparisonText = value > sectorAverage ? 'Above Average' : value < sectorAverage ? 'Below Average' : 'At Average';
      comparisonColor = 'text-slate-600';
      comparisonIcon = value > sectorAverage ? '↑' : value < sectorAverage ? '↓' : '→';
    } else {
      comparisonText = isAboveAverage ? 'Above Average' : 'Below Average';
      comparisonColor = isAboveAverage ? 'text-green-600' : 'text-red-600';
      comparisonIcon = isAboveAverage ? '↑' : '↓';
    }
  }

  const sectorDisplayValue = sectorAverage !== undefined
    ? format === 'percentage'
      ? `${sectorAverage.toFixed(2)}%`
      : sectorAverage.toFixed(2)
    : '';

  // Determine trend color
  const hasHistory = historyData && historyData.length >= 2;
  let trendColor = '#3b82f6'; // default blue
  let trendLineColor = '#3b82f6'; // trend line color

  // Calculate linear regression for trend line
  let trendLineData: Array<{ date: string; trend: number }> = [];

  if (hasHistory) {
    // Simple first-to-last comparison for area fill color
    const firstValue = historyData[0].value;
    const lastValue = historyData[historyData.length - 1].value;
    const isImproving = trendDirection === 'higher-is-better'
      ? lastValue > firstValue
      : trendDirection === 'lower-is-better'
        ? lastValue < firstValue
        : true; // neutral

    trendColor = trendDirection === 'neutral' ? '#3b82f6' : (isImproving ? '#10b981' : '#ef4444');

    // Calculate linear regression slope across all points
    const n = historyData.length;
    const sumX = (n * (n - 1)) / 2; // Sum of indices 0,1,2...n-1
    const sumY = historyData.reduce((acc, point) => acc + point.value, 0);
    const sumXY = historyData.reduce((acc, point, idx) => acc + idx * point.value, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Determine trend line color based on slope
    const isTrendingUp = slope > 0;
    const isTrendGood = trendDirection === 'higher-is-better'
      ? isTrendingUp
      : trendDirection === 'lower-is-better'
        ? !isTrendingUp
        : true; // neutral

    // Darker green (#059669) for good trends, darker red (#dc2626) for bad trends
    trendLineColor = trendDirection === 'neutral'
      ? '#3b82f6'
      : (isTrendGood ? '#059669' : '#dc2626');

    // Generate trend line data points
    trendLineData = historyData.map((point, idx) => ({
      date: point.date,
      trend: slope * idx + intercept
    }));
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
          {hasSectorData && (
            <p className="text-xs text-slate-500 mt-1">
              Sector: {sectorDisplayValue}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <p className="text-sm font-bold text-slate-700 mb-1">{label}</p>
      <p className={`text-3xl font-bold mb-1 ${
        isAvailable ? 'text-blue-600' : 'text-slate-400'
      }`}>
        {displayValue}
      </p>

      {/* Sector Comparison */}
      {hasSectorData && (
        <div className="mb-2">
          <p className="text-xs text-slate-500">
            Sector Avg: {sectorDisplayValue}
          </p>
          <p className={`text-xs font-semibold ${comparisonColor} flex items-center gap-1`}>
            <span>{comparisonIcon}</span>
            <span>{comparisonText}</span>
          </p>
        </div>
      )}

      {/* Mini Area Chart */}
      {hasHistory && (() => {
        // Merge history data with trend line data
        const chartData = historyData.map((point, idx) => ({
          ...point,
          trend: trendLineData[idx]?.trend
        }));

        return (
          <div className="mt-3 mb-2">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
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
                  dot={{ fill: trendColor, r: 3 }}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="trend"
                  stroke={trendLineColor}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 text-center mt-1">
              Last {historyData.length} periods
            </p>
          </div>
        );
      })()}

      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
      {/* Objective indicator */}
      {trendDirection !== 'neutral' && (
        <p className="text-xs font-semibold mt-2" style={{
          color: trendDirection === 'higher-is-better' ? '#059669' : '#dc2626'
        }}>
          Objective: {trendDirection === 'higher-is-better' ? 'Rising ↑' : 'Decreasing ↓'}
        </p>
      )}
      {!isAvailable && (
        <p className="text-xs text-orange-600 mt-2 font-semibold">
          Data not available
        </p>
      )}
    </div>
  );
}

// Banking sector benchmark averages (based on US banking industry standards)
const SECTOR_BENCHMARKS = {
  roa: 1.05, // Return on Assets - typical for healthy banks
  roe: 10.5, // Return on Equity
  nim: 3.2, // Net Interest Margin
  efficiencyRatio: 55.0, // Efficiency Ratio (lower is better)
  netProfitMargin: 25.0, // Net Profit Margin
  nplRatio: 0.8, // Non-Performing Loan Ratio (lower is better)
  loanToAssets: 65.0, // Loan-to-Assets Ratio
  currentRatio: 0.30, // Current Ratio
  car: 13.0, // Capital Adequacy Ratio (Tier 1)
  debtToEquity: 1.2, // Debt-to-Equity Ratio (lower is better)
  rotce: 15.0, // Return on Tangible Common Equity
  tbvps: 55.0, // Tangible Book Value Per Share
  cte1: 12.0, // Common Equity Tier 1 Ratio
};

interface RecommendationSummaryCardProps {
  recommendation: BankRecommendation;
}

function RecommendationSummaryCard({ recommendation }: RecommendationSummaryCardProps) {
  const { finalScore, stars, recommendation: rec, confidence, safetyScore, profitabilityScore,
          trendScore, metricsAboveAverage, metricsBelowAverage, strengths, concerns} = recommendation;

  // Recommendation styling
  const recStyles = {
    'Buy': { bg: 'bg-green-600', text: 'text-white', border: 'border-green-400' },
    'Hold': { bg: 'bg-yellow-600', text: 'text-white', border: 'border-yellow-400' },
    'Sell': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-400' }
  };

  const style = recStyles[rec];

  // Star display
  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={32}
            fill={i <= stars ? '#f59e0b' : 'none'}
            color={i <= stars ? '#f59e0b' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 rounded-xl border-3 border-orange-400 shadow-lg mb-6">

      {/* Top Row: Stars + Recommendation Badge + Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {renderStars()}
          <div>
            <div className={`px-5 py-2 ${style.bg} ${style.text} rounded-full font-bold text-xl shadow-md`}>
              {rec.toUpperCase()}
            </div>
            <p className={`text-xs mt-1 text-center font-semibold ${
              confidence === 'High' ? 'text-green-700' : confidence === 'Medium' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {confidence} Confidence
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 font-semibold">Overall Score</p>
          <p className="text-4xl font-bold text-orange-600">{finalScore}<span className="text-2xl text-slate-500">/100</span></p>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-xs text-slate-600 mb-1">Safety</p>
          <p className="text-xl font-bold text-blue-600">{safetyScore}<span className="text-sm text-slate-500">/25</span></p>
          <p className="text-xs text-slate-500">CAR, CET1, NPL, D/E</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-xs text-slate-600 mb-1">Profitability</p>
          <p className="text-xl font-bold text-green-600">{profitabilityScore}<span className="text-sm text-slate-500">/25</span></p>
          <p className="text-xs text-slate-500">ROA, ROE, ROTCE, NIM</p>
        </div>
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <p className="text-xs text-slate-600 mb-1">Trend Momentum</p>
          <p className="text-xl font-bold text-purple-600">{trendScore}<span className="text-sm text-slate-500">/50</span></p>
          <p className="text-xs text-slate-500">Improving trends</p>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="bg-white p-3 rounded-lg shadow-sm mb-4">
        <p className="text-sm font-semibold text-slate-700 mb-2">Performance vs Sector</p>
        <div className="flex items-center gap-2">
          {metricsAboveAverage >= metricsBelowAverage ? (
            <TrendingUp size={20} className="text-green-600" />
          ) : (
            <TrendingUp size={20} className="text-red-600 rotate-180" />
          )}
          <p className="text-sm text-slate-700">
            <span className={`font-bold ${metricsAboveAverage >= metricsBelowAverage ? 'text-green-600' : 'text-red-600'}`}>
              {metricsAboveAverage} of {metricsAboveAverage + metricsBelowAverage}
            </span> metrics above sector average
          </p>
        </div>
      </div>

      {/* Strengths and Concerns */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {strengths.length > 0 && (
          <div>
            <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
              <CheckCircle size={16} /> KEY STRENGTHS
            </p>
            <ul className="text-xs text-slate-700 space-y-1">
              {strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {concerns.length > 0 && (
          <div>
            <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle size={16} /> AREAS OF CONCERN
            </p>
            <ul className="text-xs text-slate-700 space-y-1">
              {concerns.map((c, i) => (
                <li key={i}>• {c}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
  const [recommendation, setRecommendation] = useState<BankRecommendation | null>(null);

  // Subscribe to real-time ticker updates and filter Financial portfolio
  useEffect(() => {
    const subscription = client.models.TickerLot.observeQuery().subscribe({
      next: ({ items }) => {
        // Filter lots where portfolios array includes "Financial" (case-insensitive, trimmed)
        const financialLots = items.filter(lot => {
          if (!lot.portfolios || !Array.isArray(lot.portfolios)) return false;
          return lot.portfolios.some(p =>
            p && typeof p === 'string' && p.trim().toLowerCase() === 'financial'
          );
        });

        // Extract unique ticker symbols
        const uniqueTickers = Array.from(
          new Set(financialLots.map(lot => lot.ticker).filter(Boolean))
        ).sort();

        setAvailableTickers(uniqueTickers);
      },
      error: (err) => {
        console.error('Error fetching Financial tickers:', err);
        setError('Failed to load Financial portfolio tickers');
      }
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
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

  const calculateROTCE = (
    netIncome: number,
    totalEquity: number,
    goodwill: number,
    intangibleAssets: number,
    preferredStock: number
  ): number | undefined => {
    // ROTCE = Net Income / Tangible Common Equity × 100
    // Tangible Common Equity = Total Equity - Goodwill - Intangible Assets - Preferred Stock
    if (!netIncome || !totalEquity || totalEquity <= 0) return undefined;

    const tangibleCommonEquity = totalEquity - (goodwill || 0) - (intangibleAssets || 0) - (preferredStock || 0);
    if (tangibleCommonEquity <= 0) return undefined;

    return (netIncome / tangibleCommonEquity) * 100;
  };

  const calculateTBVPS = (
    totalEquity: number,
    goodwill: number,
    intangibleAssets: number,
    preferredStock: number,
    commonShares: number
  ): number | undefined => {
    // TBVPS = Tangible Book Value / Common Shares Outstanding
    // Tangible Book Value = Total Equity - Goodwill - Intangible Assets - Preferred Stock
    if (!totalEquity || !commonShares || commonShares <= 0) return undefined;

    const tangibleBookValue = totalEquity - (goodwill || 0) - (intangibleAssets || 0) - (preferredStock || 0);

    return tangibleBookValue / commonShares;
  };

  const scoreMetric = (
    value: number | 'N/A' | undefined,
    benchmark: number,
    trendDirection: 'higher-is-better' | 'lower-is-better',
    historyData?: Array<{ date: string; value: number }>
  ): { baseScore: number; trendMultiplier: number; trend: 'improving' | 'declining' | 'neutral' } => {
    // Handle N/A or missing data
    if (value === 'N/A' || value === undefined) {
      return { baseScore: 5, trendMultiplier: 1.0, trend: 'neutral' };
    }

    // Calculate percentage difference from benchmark
    const percentDiff = ((value - benchmark) / benchmark) * 100;

    // Determine if "better" based on trend direction
    const effectiveDiff = trendDirection === 'lower-is-better' ? -percentDiff : percentDiff;

    // Score 0-10 based on performance vs benchmark
    let baseScore: number;
    if (effectiveDiff > 20) baseScore = 10;
    else if (effectiveDiff > 10) baseScore = 8;
    else if (effectiveDiff > 0) baseScore = 6;
    else if (effectiveDiff > -10) baseScore = 4;
    else if (effectiveDiff > -20) baseScore = 2;
    else baseScore = 0;

    // Calculate trend multiplier from historical data
    let trendMultiplier = 1.0;
    let trend: 'improving' | 'declining' | 'neutral' = 'neutral';

    if (historyData && historyData.length >= 3) {
      // Linear regression slope (reuse logic from MetricCard)
      const n = historyData.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = historyData.reduce((acc, point) => acc + point.value, 0);
      const sumXY = historyData.reduce((acc, point, idx) => acc + idx * point.value, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

      // Determine if trend is improving
      const isImproving = (trendDirection === 'higher-is-better' && slope > 0) ||
                         (trendDirection === 'lower-is-better' && slope < 0);

      if (isImproving && Math.abs(slope) > 0.01) {
        trendMultiplier = 1.3; // 30% bonus for improving trend
        trend = 'improving';
      } else if (!isImproving && Math.abs(slope) > 0.01) {
        trendMultiplier = 0.7; // 30% penalty for declining trend
        trend = 'declining';
      }
    }

    return { baseScore, trendMultiplier, trend };
  };

  const calculateRecommendation = (
    metrics: BankMetricsData,
    currentPrice: number
  ): BankRecommendation => {
    // === SAFETY METRICS (25% of total score) ===
    const safetyMetrics = [
      {
        name: 'CAR',
        value: metrics.car,
        benchmark: SECTOR_BENCHMARKS.car,
        direction: 'higher-is-better' as const,
        history: metrics.carHistory,
        weight: 6.25 // 25% / 4 metrics
      },
      {
        name: 'CET1',
        value: metrics.cte1,
        benchmark: SECTOR_BENCHMARKS.cte1,
        direction: 'higher-is-better' as const,
        history: metrics.cte1History,
        weight: 6.25
      },
      {
        name: 'NPL Ratio',
        value: metrics.nplRatio,
        benchmark: SECTOR_BENCHMARKS.nplRatio,
        direction: 'lower-is-better' as const,
        history: metrics.nplRatioHistory,
        weight: 6.25
      },
      {
        name: 'Debt-to-Equity',
        value: metrics.debtToEquity,
        benchmark: SECTOR_BENCHMARKS.debtToEquity,
        direction: 'lower-is-better' as const,
        history: metrics.debtToEquityHistory,
        weight: 6.25
      }
    ];

    // === PROFITABILITY METRICS (25% of total score) ===
    const profitabilityMetrics = [
      {
        name: 'ROA',
        value: metrics.roa,
        benchmark: SECTOR_BENCHMARKS.roa,
        direction: 'higher-is-better' as const,
        history: metrics.roaHistory,
        weight: 5.0 // 25% / 5 metrics
      },
      {
        name: 'ROE',
        value: metrics.roe,
        benchmark: SECTOR_BENCHMARKS.roe,
        direction: 'higher-is-better' as const,
        history: metrics.roeHistory,
        weight: 5.0
      },
      {
        name: 'ROTCE',
        value: metrics.rotce,
        benchmark: SECTOR_BENCHMARKS.rotce,
        direction: 'higher-is-better' as const,
        history: metrics.rotceHistory,
        weight: 5.0
      },
      {
        name: 'NIM',
        value: metrics.nim,
        benchmark: SECTOR_BENCHMARKS.nim,
        direction: 'higher-is-better' as const,
        history: metrics.nimHistory,
        weight: 5.0
      },
      {
        name: 'Net Profit Margin',
        value: metrics.netProfitMargin,
        benchmark: SECTOR_BENCHMARKS.netProfitMargin,
        direction: 'higher-is-better' as const,
        history: metrics.netProfitMarginHistory,
        weight: 5.0
      }
    ];

    // === CALCULATE SCORES ===
    let safetyScore = 0;
    let profitabilityScore = 0;
    let aboveAvgCount = 0;
    let belowAvgCount = 0;

    const allMetricScores: Array<{ name: string; score: number; trend: string; value: any }> = [];

    // Score safety metrics
    for (const metric of safetyMetrics) {
      const result = scoreMetric(metric.value, metric.benchmark, metric.direction, metric.history);
      const weightedScore = (result.baseScore / 10) * metric.weight;
      safetyScore += weightedScore;

      allMetricScores.push({
        name: metric.name,
        score: result.baseScore,
        trend: result.trend,
        value: metric.value
      });

      // Count metrics above/below average
      if (metric.value !== 'N/A' && metric.value !== undefined) {
        const isAbove = metric.direction === 'higher-is-better'
          ? metric.value > metric.benchmark
          : metric.value < metric.benchmark;
        if (isAbove) aboveAvgCount++;
        else belowAvgCount++;
      }
    }

    // Score profitability metrics
    for (const metric of profitabilityMetrics) {
      const result = scoreMetric(metric.value, metric.benchmark, metric.direction, metric.history);
      const weightedScore = (result.baseScore / 10) * metric.weight;
      profitabilityScore += weightedScore;

      allMetricScores.push({
        name: metric.name,
        score: result.baseScore,
        trend: result.trend,
        value: metric.value
      });

      // Count metrics above/below average
      if (metric.value !== 'N/A' && metric.value !== undefined) {
        const isAbove = metric.direction === 'higher-is-better'
          ? metric.value > metric.benchmark
          : metric.value < metric.benchmark;
        if (isAbove) aboveAvgCount++;
        else belowAvgCount++;
      }
    }

    // === TREND MOMENTUM SCORE (50% of total) ===
    // Average trend multiplier across all metrics with history
    const metricsWithTrend = [...safetyMetrics, ...profitabilityMetrics].filter(m => m.history && m.history.length >= 3);
    let avgTrendMultiplier = 1.0;

    if (metricsWithTrend.length > 0) {
      const trendSum = metricsWithTrend.reduce((sum, metric) => {
        const result = scoreMetric(metric.value, metric.benchmark, metric.direction, metric.history);
        return sum + result.trendMultiplier;
      }, 0);
      avgTrendMultiplier = trendSum / metricsWithTrend.length;
    }

    // Convert trend multiplier to 0-50 point score
    // 1.3 (strong improving) = 50 points
    // 1.0 (neutral) = 25 points
    // 0.7 (declining) = 0 points
    const trendScore = ((avgTrendMultiplier - 0.7) / 0.6) * 50;

    // === FINAL SCORE (0-100) ===
    const finalScore = Math.min(100, Math.max(0, safetyScore + profitabilityScore + trendScore));

    // === DETERMINE STARS AND RECOMMENDATION ===
    let stars: number;
    let recommendation: 'Buy' | 'Hold' | 'Sell';

    if (finalScore >= 70) {
      stars = finalScore >= 85 ? 5 : 4;
      recommendation = 'Buy';
    } else if (finalScore >= 45) {
      stars = 3;
      recommendation = 'Hold';
    } else {
      stars = finalScore >= 30 ? 2 : 1;
      recommendation = 'Sell';
    }

    // === IDENTIFY STRENGTHS AND CONCERNS ===
    const sortedMetrics = [...allMetricScores].sort((a, b) => b.score - a.score);
    const strengths = sortedMetrics.slice(0, 3)
      .filter(m => m.score >= 6 && m.value !== 'N/A')
      .map(m => {
        const trendIcon = m.trend === 'improving' ? ' ↑' : m.trend === 'declining' ? ' ↓' : '';
        return `${m.name}${trendIcon}`;
      });

    const concerns = sortedMetrics.slice(-3)
      .reverse()
      .filter(m => m.score < 6 && m.value !== 'N/A')
      .map(m => {
        const trendIcon = m.trend === 'improving' ? ' ↑' : m.trend === 'declining' ? ' ↓' : '';
        return `${m.name}${trendIcon}`;
      });

    // === DETERMINE CONFIDENCE LEVEL ===
    let confidence: 'High' | 'Medium' | 'Low';
    if (finalScore >= 70) confidence = 'High';
    else if (finalScore >= 50) confidence = 'Medium';
    else confidence = 'Low';

    // Target price removed - not displayed in UI
    const targetPrice = null;
    const targetSource = 'Not Displayed';
    const upside = 0;

    return {
      finalScore: Math.round(finalScore),
      stars,
      recommendation,
      confidence,
      safetyScore: Math.round(safetyScore),
      profitabilityScore: Math.round(profitabilityScore),
      trendScore: Math.round(trendScore),
      metricsAboveAverage: aboveAvgCount,
      metricsBelowAverage: belowAvgCount,
      strengths: strengths.slice(0, 3),
      concerns: concerns.slice(0, 3),
      targetPrice,
      currentPrice,
      upside: Math.round(upside * 10) / 10, // Round to 1 decimal
      targetSource
    };
  };

  const handleCalculate = async () => {
    setError(null);
    setLoading(true);
    setMetrics(null);
    setCompanyName('');
    setRecommendation(null);

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
          queryParams: { period: formData.period, limit: '10' }
        }),
        callFmpApi({
          endpoint: `/api/v3/income-statement/${formData.ticker}`,
          queryParams: { period: formData.period, limit: '10' }
        }),
        callFmpApi({
          endpoint: `/api/v3/balance-sheet-statement/${formData.ticker}`,
          queryParams: { period: formData.period, limit: '10' }
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

      // Calculate Club Metrics
      const rotce = calculateROTCE(
        latestIncome?.netIncome,
        latestBalance?.totalStockholdersEquity,
        latestBalance?.goodwill,
        latestBalance?.intangibleAssets,
        latestBalance?.preferredStock
      );

      const tbvps = calculateTBVPS(
        latestBalance?.totalStockholdersEquity,
        latestBalance?.goodwill,
        latestBalance?.intangibleAssets,
        latestBalance?.preferredStock,
        latestBalance?.commonStock || quote?.sharesOutstanding
      );

      // CTE1 from FDIC data (Common Equity Tier 1 Ratio)
      const cte1 = fdicData.commonEquityTier1Ratio ?? 'N/A';

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

      // Club Metrics History
      const rotceHistory = incomeStatements
        .map((income, idx) => {
          const date = income?.date || balanceSheets[idx]?.date;
          const value = calculateROTCE(
            income?.netIncome,
            balanceSheets[idx]?.totalStockholdersEquity,
            balanceSheets[idx]?.goodwill,
            balanceSheets[idx]?.intangibleAssets,
            balanceSheets[idx]?.preferredStock
          );
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const tbvpsHistory = balanceSheets
        .map((balance) => {
          const date = balance?.date;
          const value = calculateTBVPS(
            balance?.totalStockholdersEquity,
            balance?.goodwill,
            balance?.intangibleAssets,
            balance?.preferredStock,
            balance?.commonStock || quote?.sharesOutstanding
          );
          return date && value !== undefined ? { date, value } : null;
        })
        .filter((item): item is { date: string; value: number } => item !== null)
        .reverse();

      const cte1History = fdicData.cte1History;

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
        rotce,
        tbvps,
        cte1,

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
        carHistory: fdicData.carHistory,
        rotceHistory,
        tbvpsHistory,
        cte1History
      };

      setMetrics(calculatedMetrics);

      // Calculate recommendation
      const currentPrice = quote?.price || 0;
      const bankRecommendation = calculateRecommendation(calculatedMetrics, currentPrice);
      setRecommendation(bankRecommendation);
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

              {/* Recommendation Summary Card */}
              {recommendation && (
                <RecommendationSummaryCard recommendation={recommendation} />
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
                    sectorAverage={SECTOR_BENCHMARKS.roa}
                  />
                  <MetricCard
                    label="Return on Equity (ROE)"
                    value={metrics.roe}
                    format="percentage"
                    description="Compares net income to shareholder equity"
                    historyData={metrics.roeHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.roe}
                  />
                  <MetricCard
                    label="Net Interest Margin (NIM)"
                    value={metrics.nim}
                    format="percentage"
                    description="Interest income minus interest expense, as % of earning assets"
                    historyData={metrics.nimHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.nim}
                  />
                  <MetricCard
                    label="Efficiency Ratio"
                    value={metrics.efficiencyRatio}
                    format="percentage"
                    description="Operating expenses as a percentage of revenue"
                    historyData={metrics.efficiencyRatioHistory}
                    trendDirection="lower-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.efficiencyRatio}
                  />
                  <MetricCard
                    label="Net Profit Margin"
                    value={metrics.netProfitMargin}
                    format="percentage"
                    description="Revenue remaining after all expenses and taxes"
                    historyData={metrics.netProfitMarginHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.netProfitMargin}
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
                    sectorAverage={SECTOR_BENCHMARKS.nplRatio}
                  />
                  <MetricCard
                    label="Loan-to-Assets Ratio"
                    value={metrics.loanToAssets}
                    format="percentage"
                    description="Proportion of assets tied up in loans"
                    historyData={metrics.loanToAssetsHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.loanToAssets}
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
                    sectorAverage={SECTOR_BENCHMARKS.currentRatio}
                  />
                  <MetricCard
                    label="Capital Adequacy Ratio (CAR)"
                    value={metrics.car}
                    format="percentage"
                    description="Capital relative to risk-weighted assets"
                    historyData={metrics.carHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.car}
                  />
                  <MetricCard
                    label="Debt-to-Equity Ratio"
                    value={metrics.debtToEquity}
                    format="ratio"
                    description="Total debt compared to shareholder equity"
                    historyData={metrics.debtToEquityHistory}
                    trendDirection="lower-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.debtToEquity}
                  />
                </div>
              </div>

              {/* Section 4: Club Metrics */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-300">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award size={24} className="text-amber-600" />
                  Club Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    label="Return on Tangible Common Equity (ROTCE)"
                    value={metrics.rotce}
                    format="percentage"
                    description="Net income relative to tangible common equity"
                    historyData={metrics.rotceHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.rotce}
                  />
                  <MetricCard
                    label="Tangible Book Value Per Share (TBVPS)"
                    value={metrics.tbvps}
                    format="ratio"
                    description="Tangible book value divided by common shares outstanding"
                    historyData={metrics.tbvpsHistory}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.tbvps}
                  />
                  <MetricCard
                    label="Common Equity Tier 1 Ratio (CET1)"
                    value={metrics.cte1}
                    format="percentage"
                    description="Common equity tier 1 capital relative to risk-weighted assets"
                    historyData={metrics.cte1History}
                    trendDirection="higher-is-better"
                    sectorAverage={SECTOR_BENCHMARKS.cte1}
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
