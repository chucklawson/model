// ============================================
// FILE: src/Components/YTDPerformanceModal/YTDBarChart.tsx
// YTD Top Performers Bar Chart
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
import type { YTDPortfolioPerformance } from '../../types/ytd';

interface YTDBarChartProps {
  ytdData: YTDPortfolioPerformance;
  onTickerClick?: (ticker: string) => void;
}

export default function YTDBarChart({ ytdData, onTickerClick }: YTDBarChartProps) {
  const chartData = useMemo(() => {
    // Sort by YTD % descending
    const sorted = [...ytdData.tickers].sort(
      (a, b) => b.ytdGainPercent - a.ytdGainPercent
    );

    // If more than 30 tickers, show top 15 and bottom 15
    if (sorted.length > 30) {
      const top15 = sorted.slice(0, 15);
      const bottom15 = sorted.slice(-15);
      return [...top15, ...bottom15];
    }

    return sorted;
  }, [ytdData]);

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { ticker: string; ytdGainPercent: number; ytdGainDollar: number; currentValue: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white border-2 border-emerald-600 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-slate-800">{data.ticker}</p>
          <p className="text-sm text-slate-600 mt-1">
            YTD Gain: <span className={`font-bold ${data.ytdGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(data.ytdGainPercent)}
            </span>
          </p>
          <p className="text-sm text-slate-600">
            Dollar Gain: <span className={`font-semibold ${data.ytdGainDollar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.ytdGainDollar)}
            </span>
          </p>
          <p className="text-sm text-slate-600">
            Current Value: <span className="font-semibold">{formatCurrency(data.currentValue)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: { ticker: string } | null) => {
    if (onTickerClick && data) {
      onTickerClick(data.ticker);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Top & Bottom Performers (YTD 2025)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="ticker"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12 }}
            label={{
              value: 'YTD Gain (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
          <Bar
            dataKey="ytdGainPercent"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.ytdGainPercent >= 0 ? '#10b981' : '#ef4444'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {onTickerClick && (
        <p className="text-xs text-slate-500 text-center mt-2">
          Click a bar to view ticker details
        </p>
      )}
    </div>
  );
}
