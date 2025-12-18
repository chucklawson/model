import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { MonthlyPayment } from '../../Lib/MortgageCalculation';
import { formatMonthLabel, sampleScheduleForChart } from '../../Lib/AmortizationSchedule';

interface PrincipalVsInterestChartProps {
  schedule: MonthlyPayment[];
}

export default function PrincipalVsInterestChart({ schedule }: PrincipalVsInterestChartProps) {
  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Sample data for chart (reduce points for long schedules)
  const sampledSchedule = sampleScheduleForChart(schedule, 120);

  // Transform data for chart
  const chartData = sampledSchedule.map(payment => ({
    month: payment.month,
    label: formatMonthLabel(payment),
    principal: payment.principalPaid + payment.extraPrincipalPaid,
    interest: payment.interestPaid,
    total: payment.principalPaid + payment.extraPrincipalPaid + payment.interestPaid
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length >= 2) {
      const principal = payload[0].value;
      const interest = payload[1].value;
      const total = principal + interest;
      const principalPercent = ((principal / total) * 100).toFixed(1);
      const interestPercent = ((interest / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{payload[0].payload.label}</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold text-blue-600">Principal:</span>{' '}
              {formatCurrency(principal)} ({principalPercent}%)
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-red-600">Interest:</span>{' '}
              {formatCurrency(interest)} ({interestPercent}%)
            </p>
            <p className="text-slate-700 font-bold border-t pt-1 mt-1">
              <span>Total:</span> {formatCurrency(total)}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate tick interval for X-axis (show every 12 months)
  const tickInterval = Math.max(1, Math.floor(sampledSchedule.length / 20));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Principal vs Interest Over Time</h4>
        <p className="text-sm text-slate-600">
          See how your payment splits between principal and interest each month
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="principalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
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
            label={{ value: 'Monthly Payment', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => {
              if (value === 'principal') return 'Principal';
              if (value === 'interest') return 'Interest';
              return value;
            }}
          />

          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#principalGradient)"
            name="principal"
          />

          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#interestGradient)"
            name="interest"
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-3 text-center">
        <p className="text-xs text-slate-500">
          Early payments are mostly interest (red), later payments are mostly principal (blue)
        </p>
      </div>
    </div>
  );
}
