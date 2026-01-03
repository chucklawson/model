// ============================================
// FILE: src/Components/YTDPerformanceModal/YTDStackedAreaChart.tsx
// YTD Ticker Contribution Stacked Area Chart
// ============================================

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { YTDPortfolioPerformance } from '../../types/ytd';
import { formatDateShort } from '../../utils/ytdCalculations';

interface YTDStackedAreaChartProps {
  ytdData: YTDPortfolioPerformance;
}

// Color palette matching the pie chart
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

export default function YTDStackedAreaChart({ ytdData }: YTDStackedAreaChartProps) {
  const { chartData, tickerKeys } = useMemo(() => {
    // Get top 10 tickers by current value
    const sortedTickers = [...ytdData.tickers]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10);

    const top10Symbols = new Set(sortedTickers.map(t => t.ticker));

    // Transform daily data for stacked area chart
    const data = ytdData.dailyPortfolioValues.map(day => {
      const point: Record<string, string | number> = {
        date: formatDateShort(day.date),
        fullDate: day.date
      };

      let othersValue = 0;

      for (const [ticker, value] of Object.entries(day.tickerBreakdown)) {
        if (top10Symbols.has(ticker)) {
          point[ticker] = value;
        } else {
          othersValue += value;
        }
      }

      if (othersValue > 0) {
        point['Others'] = othersValue;
      }

      return point;
    });

    // Build array of ticker keys for rendering
    const keys = [...Array.from(top10Symbols)];
    if (data.some(d => d['Others'])) {
      keys.push('Others');
    }

    return { chartData: data, tickerKeys: keys };
  }, [ytdData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload?: { fullDate?: string } }>; label?: string }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: { value: number }) => sum + (entry.value || 0), 0);

      return (
        <div className="bg-white border-2 border-emerald-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-bold text-slate-800 mb-2">{payload[0]?.payload?.fullDate || label}</p>
          <p className="text-sm font-bold text-emerald-600 mb-2">
            Total: {formatCurrency(total)}
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {payload
              .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
              .map((entry: { name: string; value: number; color: string }, index: number) => (
                <p key={index} className="text-xs text-slate-600">
                  <span
                    className="inline-block w-3 h-3 rounded-sm mr-2"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}: {formatCurrency(entry.value)}
                </p>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Ticker Contribution Over Time (Top 10)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <defs>
            {tickerKeys.map((ticker, index) => (
              <linearGradient key={ticker} id={`color${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            label={{
              value: 'Portfolio Value',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: 14, fontWeight: 'bold' }
            }}
          />
          <Tooltip content={customTooltip} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px'
            }}
          />
          {tickerKeys.map((ticker, index) => (
            <Area
              key={ticker}
              type="monotone"
              dataKey={ticker}
              stackId="1"
              stroke={COLORS[index % COLORS.length]}
              fill={`url(#color${ticker})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
