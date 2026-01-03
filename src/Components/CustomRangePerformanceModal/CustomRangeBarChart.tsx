// ============================================
// FILE: src/Components/CustomRangePerformanceModal/CustomRangeBarChart.tsx
// Custom Range Top Performers Bar Chart
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

interface CustomRangeBarChartProps {
  customRangeData: DateRangePortfolioPerformance;
  onTickerClick?: (ticker: string) => void;
}

export default function CustomRangeBarChart({ customRangeData, onTickerClick }: CustomRangeBarChartProps) {
  const chartData = useMemo(() => {
    // Sort by Range % descending
    const sorted = [...customRangeData.tickers].sort(
      (a, b) => b.rangeGainPercent - a.rangeGainPercent
    );

    // If more than 30 tickers, show top 15 and bottom 15
    if (sorted.length > 30) {
      const top15 = sorted.slice(0, 15);
      const bottom15 = sorted.slice(-15);
      return [...top15, ...bottom15];
    }

    return sorted;
  }, [customRangeData]);

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

  const customTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { ticker: string; rangeGainPercent: number; rangeGainDollar: number; currentValue: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-slate-800">{data.ticker}</p>
          <p className="text-sm text-slate-600 mt-1">
            Range Gain: <span className={`font-bold ${data.rangeGainPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(data.rangeGainPercent)}
            </span>
          </p>
          <p className="text-sm text-slate-600">
            Dollar Gain: <span className={`font-semibold ${data.rangeGainDollar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.rangeGainDollar)}
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
        Top & Bottom Performers
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
              value: 'Range Gain (%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
          <Bar
            dataKey="rangeGainPercent"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={handleBarClick}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.rangeGainPercent >= 0 ? '#10b981' : '#ef4444'}
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
