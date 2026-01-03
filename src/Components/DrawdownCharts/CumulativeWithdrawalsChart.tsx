import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { DrawdownScheduleEntry } from '../../Lib/DrawdownCalculation';
import { formatMonthLabel, sampleScheduleForChart } from '../../Lib/DrawdownSchedule';

interface CumulativeWithdrawalsChartProps {
  schedule: DrawdownScheduleEntry[];
  beginningBalance: number;
}

export default function CumulativeWithdrawalsChart({
  schedule,
  beginningBalance
}: CumulativeWithdrawalsChartProps) {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Sample data for chart
  const sampledSchedule = sampleScheduleForChart(schedule, 120);

  // Transform data for chart
  const chartData = sampledSchedule.map(entry => ({
    month: entry.month,
    label: formatMonthLabel(entry),
    cumulativeDrawdowns: entry.cumulativeDrawdowns,
    percentOfOriginal: (entry.cumulativeDrawdowns / beginningBalance) * 100
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; cumulativeDrawdowns: number; percentOfOriginal: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{data.label}</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold">Total Withdrawn:</span> {formatCurrency(data.cumulativeDrawdowns)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">% of Original:</span> {data.percentOfOriginal.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate tick interval
  const tickInterval = Math.max(1, Math.floor(sampledSchedule.length / 20));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Cumulative Withdrawals</h4>
        <p className="text-sm text-slate-600">
          Total amount withdrawn over time compared to your starting balance
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="month"
            interval={tickInterval}
            tickFormatter={(month) => {
              const entry = sampledSchedule.find(e => e.month === month);
              return entry ? `Y${Math.floor((entry.month - 1) / 12) + 1}` : '';
            }}
            label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
            stroke="#64748b"
          />

          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Total Withdrawn', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Reference line at beginning balance */}
          <ReferenceLine
            y={beginningBalance}
            stroke="#f59e0b"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Original Balance',
              position: 'right',
              fill: '#f59e0b',
              fontSize: 12,
              fontWeight: 'bold'
            }}
          />

          <Area
            type="monotone"
            dataKey="cumulativeDrawdowns"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#cumulativeGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500"></div>
            <span>Original Balance Reference</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500"></div>
            <span>Cumulative Withdrawals</span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          When the line crosses the orange reference, you've withdrawn more than your original principal
        </p>
      </div>
    </div>
  );
}
