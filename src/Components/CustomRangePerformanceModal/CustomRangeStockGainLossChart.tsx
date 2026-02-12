// ============================================
// FILE: src/Components/CustomRangePerformanceModal/CustomRangeStockGainLossChart.tsx
// Bar chart showing each stock's gain/loss with portfolio breakdown on hover
// ============================================

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { DateRangePortfolioPerformance } from '../../types/customRange';
import type { TickerLot } from '../../types';

interface CustomRangeStockGainLossChartProps {
  customRangeData: DateRangePortfolioPerformance;
  lots: TickerLot[];
  selectedPortfolios: string[];
}

interface PortfolioBreakdown {
  portfolio: string;
  shares: number;
  gainDollar: number;
}

interface ChartDataItem {
  ticker: string;
  rangeGainDollar: number;
  rangeGainPercent: number;
  portfolioBreakdown: PortfolioBreakdown[];
}

export default function CustomRangeStockGainLossChart({
  customRangeData,
  lots,
  selectedPortfolios
}: CustomRangeStockGainLossChartProps) {
  const chartData = useMemo(() => {
    // Build portfolio breakdown for each ticker
    const tickerPortfolioMap = new Map<string, Map<string, number>>();

    // Filter lots to non-dividend and matching selected portfolios
    const filteredLots = lots.filter(
      lot => !lot.isDividend && lot.portfolios.some(p => selectedPortfolios.includes(p))
    );

    // Sum shares per ticker per portfolio
    for (const lot of filteredLots) {
      if (!tickerPortfolioMap.has(lot.ticker)) {
        tickerPortfolioMap.set(lot.ticker, new Map());
      }
      const portfolioMap = tickerPortfolioMap.get(lot.ticker) ?? new Map<string, number>();
      for (const portfolio of lot.portfolios) {
        if (selectedPortfolios.includes(portfolio)) {
          portfolioMap.set(portfolio, (portfolioMap.get(portfolio) || 0) + lot.shares);
        }
      }
    }

    // Build chart data sorted alphabetically by ticker
    const data: ChartDataItem[] = customRangeData.tickers
      .map(t => {
        const portfolioMap = tickerPortfolioMap.get(t.ticker);
        const portfolioBreakdown: PortfolioBreakdown[] = [];

        if (portfolioMap && t.totalShares > 0) {
          for (const [portfolio, shares] of portfolioMap.entries()) {
            const proportion = shares / t.totalShares;
            portfolioBreakdown.push({
              portfolio,
              shares,
              gainDollar: t.rangeGainDollar * proportion
            });
          }
          // Sort portfolios alphabetically
          portfolioBreakdown.sort((a, b) => a.portfolio.localeCompare(b.portfolio));
        }

        return {
          ticker: t.ticker,
          rangeGainDollar: t.rangeGainDollar,
          rangeGainPercent: t.rangeGainPercent,
          portfolioBreakdown
        };
      })
      .sort((a, b) => a.ticker.localeCompare(b.ticker));

    return data;
  }, [customRangeData, lots, selectedPortfolios]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const customTooltip = ({
    active,
    payload
  }: {
    active?: boolean;
    payload?: Array<{ payload: ChartDataItem }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-bold text-slate-800 text-base">{data.ticker}</p>
          <p className="text-sm text-slate-600 mt-1">
            Gain/Loss:{' '}
            <span
              className={`font-bold ${
                data.rangeGainDollar >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(data.rangeGainDollar)} ({formatPercent(data.rangeGainPercent)})
            </span>
          </p>

          {data.portfolioBreakdown.length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Portfolios
              </p>
              {data.portfolioBreakdown.map(pb => (
                <div key={pb.portfolio} className="flex justify-between items-center text-sm mt-1">
                  <span className="text-slate-700 font-medium">{pb.portfolio}</span>
                  <span
                    className={`font-semibold ml-3 ${
                      pb.gainDollar >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(pb.gainDollar)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Dynamic height based on number of tickers
  const chartHeight = Math.max(350, chartData.length * 14);

  return (
    <div className="bg-slate-50 p-6 rounded-lg mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Gain / Loss by Stock
      </h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="ticker"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            label={{
              value: 'Gain / Loss ($)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
          <Bar dataKey="rangeGainDollar" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.rangeGainDollar >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
