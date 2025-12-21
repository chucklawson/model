// ============================================
// FILE: src/Components/YTDPerformanceModal/YTDLineChart.tsx
// YTD Portfolio Growth Line Chart
// ============================================

import { useMemo } from 'react';
import {
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts';
import type { YTDPortfolioPerformance } from '../../types/ytd';
import { formatDateShort } from '../../utils/ytdCalculations';

interface YTDLineChartProps {
  ytdData: YTDPortfolioPerformance;
}

export default function YTDLineChart({ ytdData }: YTDLineChartProps) {
  const chartData = useMemo(() => {
    return ytdData.dailyPortfolioValues.map(day => ({
      date: formatDateShort(day.date),
      fullDate: day.date,
      value: day.totalValue,
      baseline: ytdData.totalBaselineValue
    }));
  }, [ytdData]);

  const isPositive = ytdData.totalYTDGainDollar >= 0;
  const lineColor = isPositive ? '#10b981' : '#ef4444'; // green or red
  const areaColor = isPositive ? '#10b981' : '#ef4444';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = data.value;
      const baseline = data.baseline;
      const gain = value - baseline;
      const gainPercent = baseline > 0 ? ((gain / baseline) * 100) : 0;

      return (
        <div className="bg-white border-2 border-emerald-600 rounded-lg p-3 shadow-lg">
          <p className="font-bold text-slate-800">{data.fullDate}</p>
          <p className="text-sm text-slate-600 mt-1">
            Value: <span className="font-bold">{formatCurrency(value)}</span>
          </p>
          <p className={`text-sm mt-1 font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Gain: {formatCurrency(gain)} ({gainPercent >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg">
      <h3 className="text-lg font-bold text-slate-800 mb-4">
        Portfolio Value Over Time (YTD 2025)
      </h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <defs>
            <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0.05} />
            </linearGradient>
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

          {/* Baseline reference line */}
          <ReferenceLine
            y={ytdData.totalBaselineValue}
            stroke="#94a3b8"
            strokeDasharray="5 5"
            label={{
              value: 'Baseline',
              position: 'right',
              fill: '#475569',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />

          {/* Area fill under line */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#colorGain)"
          />

          {/* Main line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
