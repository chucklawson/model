import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import type { MonthlyPayment } from '../../Lib/MortgageCalculation';
import {
  formatMonthLabel,
  sampleScheduleForChart,
  getMilestonePayments,
  getPMIRemovalMonth
} from '../../Lib/AmortizationSchedule';

interface RemainingBalanceChartProps {
  schedule: MonthlyPayment[];
  originalLoan: number;
}

export default function RemainingBalanceChart({
  schedule,
  originalLoan
}: RemainingBalanceChartProps) {
  // Format currency for tooltips
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
  const chartData = sampledSchedule.map(payment => ({
    month: payment.month,
    label: formatMonthLabel(payment),
    balance: payment.remainingBalance,
    percentPaid: ((originalLoan - payment.remainingBalance) / originalLoan) * 100
  }));

  // Get milestones
  const milestones = getMilestonePayments(schedule, originalLoan);
  const pmiRemovalMonth = getPMIRemovalMonth(schedule);

  // Find closest sampled points for milestones
  const findClosestSampledPoint = (targetMonth: number) => {
    return sampledSchedule.reduce((prev, curr) => {
      return Math.abs(curr.month - targetMonth) < Math.abs(prev.month - targetMonth) ? curr : prev;
    });
  };

  const sampledMilestones = {
    twentyFivePercent: milestones.twentyFivePercent ? findClosestSampledPoint(milestones.twentyFivePercent.month) : null,
    fiftyPercent: milestones.fiftyPercent ? findClosestSampledPoint(milestones.fiftyPercent.month) : null,
    seventyFivePercent: milestones.seventyFivePercent ? findClosestSampledPoint(milestones.seventyFivePercent.month) : null
  };

  const sampledPmiMonth = pmiRemovalMonth ? findClosestSampledPoint(pmiRemovalMonth) : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; balance: number; totalPaid: number; paidOffPercent: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{data.label}</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold">Remaining:</span> {formatCurrency(data.balance)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold">Paid Off:</span> {data.percentPaid.toFixed(1)}%
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate tick interval for X-axis
  const tickInterval = Math.max(1, Math.floor(sampledSchedule.length / 20));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Remaining Balance Over Time</h4>
        <p className="text-sm text-slate-600">
          Watch your mortgage balance decrease as you build equity
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="month"
            interval={tickInterval}
            tickFormatter={(month) => {
              const payment = sampledSchedule.find(p => p.month === month);
              return payment ? `Y${Math.floor((payment.month - 1) / 12) + 1}` : '';
            }}
            label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
            stroke="#64748b"
          />

          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Remaining Balance', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#balanceGradient)"
          />

          <Line
            type="monotone"
            dataKey="balance"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />

          {/* Milestone markers */}
          {sampledMilestones.twentyFivePercent && (
            <ReferenceDot
              x={sampledMilestones.twentyFivePercent.month}
              y={sampledMilestones.twentyFivePercent.remainingBalance}
              r={8}
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: '25%',
                position: 'top',
                fill: '#f59e0b',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}

          {sampledMilestones.fiftyPercent && (
            <ReferenceDot
              x={sampledMilestones.fiftyPercent.month}
              y={sampledMilestones.fiftyPercent.remainingBalance}
              r={8}
              fill="#10b981"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: '50%',
                position: 'top',
                fill: '#10b981',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}

          {sampledMilestones.seventyFivePercent && (
            <ReferenceDot
              x={sampledMilestones.seventyFivePercent.month}
              y={sampledMilestones.seventyFivePercent.remainingBalance}
              r={8}
              fill="#8b5cf6"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: '75%',
                position: 'top',
                fill: '#8b5cf6',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}

          {/* PMI removal marker */}
          {sampledPmiMonth && (
            <ReferenceDot
              x={sampledPmiMonth.month}
              y={sampledPmiMonth.remainingBalance}
              r={8}
              fill="#ef4444"
              stroke="#fff"
              strokeWidth={2}
              label={{
                value: 'PMI',
                position: 'top',
                fill: '#ef4444',
                fontSize: 12,
                fontWeight: 'bold'
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3 text-center">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>25% Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>50% Paid</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>75% Paid</span>
          </div>
          {pmiRemovalMonth && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>PMI Removed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
