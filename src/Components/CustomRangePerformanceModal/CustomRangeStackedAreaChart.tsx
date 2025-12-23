// ============================================
// FILE: src/Components/CustomRangePerformanceModal/CustomRangeStackedAreaChart.tsx
// Custom Range Ticker Contribution Stacked Area Chart
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
import type { DateRangePortfolioPerformance } from '../../types/customRange';
import { formatDateShort } from '../../utils/dateRangeCalculations';

interface CustomRangeStackedAreaChartProps {
  customRangeData: DateRangePortfolioPerformance;
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

export default function CustomRangeStackedAreaChart({ customRangeData }: CustomRangeStackedAreaChartProps) {
  const { chartData, tickerKeys } = useMemo(() => {
    // Get top 10 tickers by current value
    const sortedTickers = [...customRangeData.tickers]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 10);

    const top10Symbols = new Set(sortedTickers.map(t => t.ticker));

    // Transform daily data for stacked area chart
    const data = customRangeData.dailyPortfolioValues.map(day => {
      const point: any = {
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
  }, [customRangeData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

      // Sort payload to match the stacking order (reversed to match visual bottom-to-top)
      const sortedPayload = [...payload].sort((a: any, b: any) => {
        const indexA = tickerKeys.indexOf(a.name);
        const indexB = tickerKeys.indexOf(b.name);
        return indexB - indexA;
      });

      return (
        <div className="bg-white border-2 border-blue-600 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-bold text-slate-800 mb-2">{payload[0]?.payload?.fullDate || label}</p>
          <p className="text-sm font-bold text-blue-600 mb-2">
            Total: {formatCurrency(total)}
          </p>
          <div className="space-y-1">
            {sortedPayload.map((entry: any, index: number) => (
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

  // Calculate label positions for the rightmost data point
  const labelPositions = useMemo(() => {
    if (chartData.length === 0) return [];

    const lastPoint = chartData[chartData.length - 1];
    const positions: { ticker: string; yStart: number; yEnd: number; color: string }[] = [];

    let cumulativeValue = 0;

    tickerKeys.forEach((ticker, index) => {
      const value = lastPoint[ticker] || 0;
      if (value > 0) {
        positions.push({
          ticker,
          yStart: cumulativeValue,
          yEnd: cumulativeValue + value,
          color: COLORS[index % COLORS.length]
        });
        cumulativeValue += value;
      }
    });

    return positions;
  }, [chartData, tickerKeys]);

  // Custom label renderer component
  const CustomLabels = (props: any) => {
    const { viewBox } = props;
    if (!viewBox || labelPositions.length === 0) return null;

    const { width, height, x, y } = viewBox;
    const totalValue = labelPositions[labelPositions.length - 1]?.yEnd || 1;

    // Position labels on the right side
    const labelX = x + width - 70;

    return (
      <g>
        {labelPositions.map((pos) => {
          // Calculate Y position as percentage of total height
          const midValue = (pos.yStart + pos.yEnd) / 2;
          const yPercent = midValue / totalValue;
          const labelY = y + height - (yPercent * height);

          return (
            <g key={pos.ticker}>
              {/* White background for readability */}
              <rect
                x={labelX - 3}
                y={labelY - 9}
                width={pos.ticker.length * 7 + 6}
                height={18}
                fill="white"
                fillOpacity={0.85}
                rx={3}
              />
              {/* Ticker text */}
              <text
                x={labelX}
                y={labelY}
                fill={pos.color}
                fontSize={12}
                fontWeight="bold"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {pos.ticker}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Ticker Contribution Over Time (Top 10)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 5, right: 80, left: 20, bottom: 60 }}>
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
          <CustomLabels />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
