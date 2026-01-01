import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { DrawdownScheduleEntry } from '../../Lib/DrawdownCalculation';
import { formatMonthLabel, sampleScheduleForChart } from '../../Lib/DrawdownSchedule';

interface InterestVsDrawdownsChartProps {
  schedule: DrawdownScheduleEntry[];
}

export default function InterestVsDrawdownsChart({
  schedule
}: InterestVsDrawdownsChartProps) {
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
    interestEarned: entry.interestEarned,
    totalDrawdown: entry.totalDrawdown,
    netChange: entry.interestEarned - entry.totalDrawdown
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-teal-400">
          <p className="font-bold text-teal-700 mb-2">{data.label}</p>
          <div className="space-y-1">
            <p className="text-green-600">
              <span className="font-semibold">Interest:</span> {formatCurrency(data.interestEarned)}
            </p>
            <p className="text-red-600">
              <span className="font-semibold">Drawdown:</span> {formatCurrency(data.totalDrawdown)}
            </p>
            <p className={`font-semibold ${data.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Net: {formatCurrency(data.netChange)}
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
        <h4 className="text-lg font-bold text-slate-800">Interest Earned vs Withdrawals</h4>
        <p className="text-sm text-slate-600">
          Compare monthly interest income against withdrawal amounts
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
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
            label={{ value: 'Amount', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Area
            type="monotone"
            dataKey="interestEarned"
            stackId="1"
            stroke="#10b981"
            fill="url(#interestGradient)"
            name="Interest Earned"
          />

          <Area
            type="monotone"
            dataKey="totalDrawdown"
            stackId="2"
            stroke="#ef4444"
            fill="url(#drawdownGradient)"
            name="Withdrawals"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 text-center text-sm text-slate-600">
        <p>
          When interest (green) exceeds drawdowns (red), your balance grows.
          When drawdowns exceed interest, your balance decreases.
        </p>
      </div>
    </div>
  );
}
