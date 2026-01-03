// ============================================
// FILE: src/Components/CustomRangePerformanceModal/CustomRangePieChart.tsx
// Custom Range Portfolio Allocation Donut Chart
// ============================================

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import type { DateRangePortfolioPerformance } from '../../types/customRange';

interface CustomRangePieChartProps {
  customRangeData: DateRangePortfolioPerformance;
  onTickerClick?: (ticker: string) => void;
}

// Color palette for up to 12 tickers
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#d946ef'  // fuchsia
];

export default function CustomRangePieChart({ customRangeData, onTickerClick }: CustomRangePieChartProps) {
  const chartData = useMemo(() => {
    return customRangeData.tickers.map(ticker => ({
      name: ticker.ticker,
      value: ticker.currentValue,
      percentage: ticker.allocationPercent
    }));
  }, [customRangeData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0];

      return (
        <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600 mt-1">
            Value: <span className="font-bold">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-slate-600">
            Allocation: <span className="font-bold">{data.payload.percentage.toFixed(2)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: { name: string; percentage: number }) => {
    // Only show label if allocation is > 3%
    if (entry.percentage < 3) return '';
    return `${entry.name} ${entry.percentage.toFixed(1)}%`;
  };

  const handlePieClick = (data: { name: string } | null) => {
    if (onTickerClick && data) {
      onTickerClick(data.name);
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Current Portfolio Allocation
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={140}
            paddingAngle={2}
            dataKey="value"
            label={renderCustomLabel}
            onClick={handlePieClick}
            cursor="pointer"
          >
            {chartData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={customTooltip} />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            wrapperStyle={{
              paddingLeft: '20px',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-sm text-slate-600">Total Portfolio Value</p>
        <p className="text-2xl font-bold text-blue-600">
          {formatCurrency(customRangeData.totalCurrentValue)}
        </p>
      </div>
      {onTickerClick && (
        <p className="text-xs text-slate-500 text-center mt-2">
          Click a slice to view ticker details
        </p>
      )}
    </div>
  );
}
