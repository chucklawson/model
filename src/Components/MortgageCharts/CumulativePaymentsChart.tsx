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
import type { MonthlyPayment, MortgageInputs } from '../../Lib/MortgageCalculation';
import { formatMonthLabel, sampleScheduleForChart } from '../../Lib/AmortizationSchedule';

interface CumulativePaymentsChartProps {
  schedule: MonthlyPayment[];
  inputs: MortgageInputs;
}

export default function CumulativePaymentsChart({
  schedule,
  inputs
}: CumulativePaymentsChartProps) {
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

  // Calculate cumulative costs
  const chartData = sampledSchedule.map(payment => {
    const cumulativePMI = schedule
      .slice(0, payment.month)
      .reduce((sum, p) => sum + p.pmiPaid, 0);

    const monthlyTax = inputs.propertyTax / 12;
    const monthlyInsurance = inputs.homeInsurance / 12;

    const cumulativeTaxes = payment.month * monthlyTax;
    const cumulativeInsurance = payment.month * monthlyInsurance;

    return {
      month: payment.month,
      label: formatMonthLabel(payment),
      principal: payment.cumulativePrincipal,
      interest: payment.cumulativeInterest,
      pmi: cumulativePMI,
      taxes: cumulativeTaxes,
      insurance: cumulativeInsurance,
      total:
        payment.cumulativePrincipal +
        payment.cumulativeInterest +
        cumulativePMI +
        cumulativeTaxes +
        cumulativeInsurance
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{data.label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-slate-700">
              <span className="font-semibold text-blue-600">Principal:</span>{' '}
              {formatCurrency(data.principal)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-red-600">Interest:</span>{' '}
              {formatCurrency(data.interest)}
            </p>
            {data.pmi > 0 && (
              <p className="text-slate-700">
                <span className="font-semibold text-orange-600">PMI:</span>{' '}
                {formatCurrency(data.pmi)}
              </p>
            )}
            <p className="text-slate-700">
              <span className="font-semibold text-green-600">Taxes:</span>{' '}
              {formatCurrency(data.taxes)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-purple-600">Insurance:</span>{' '}
              {formatCurrency(data.insurance)}
            </p>
            <p className="text-slate-700 font-bold border-t pt-1 mt-1">
              <span>Total:</span> {formatCurrency(data.total)}
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
        <h4 className="text-lg font-bold text-slate-800">Total Cost Breakdown</h4>
        <p className="text-sm text-slate-600">
          Cumulative housing costs including all payments and expenses
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="principalCumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="interestCumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="pmiCumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="taxesCumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="insuranceCumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.3} />
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
            label={{ value: 'Cumulative Total', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                principal: 'Principal',
                interest: 'Interest',
                pmi: 'PMI',
                taxes: 'Property Tax',
                insurance: 'Insurance'
              };
              return labels[value] || value;
            }}
          />

          <Area
            type="monotone"
            dataKey="principal"
            stackId="1"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="url(#principalCumGradient)"
            name="principal"
          />

          <Area
            type="monotone"
            dataKey="interest"
            stackId="1"
            stroke="#ef4444"
            strokeWidth={1}
            fill="url(#interestCumGradient)"
            name="interest"
          />

          {inputs.downPayment < 20 && (
            <Area
              type="monotone"
              dataKey="pmi"
              stackId="1"
              stroke="#f97316"
              strokeWidth={1}
              fill="url(#pmiCumGradient)"
              name="pmi"
            />
          )}

          {inputs.propertyTax > 0 && (
            <Area
              type="monotone"
              dataKey="taxes"
              stackId="1"
              stroke="#10b981"
              strokeWidth={1}
              fill="url(#taxesCumGradient)"
              name="taxes"
            />
          )}

          {inputs.homeInsurance > 0 && (
            <Area
              type="monotone"
              dataKey="insurance"
              stackId="1"
              stroke="#8b5cf6"
              strokeWidth={1}
              fill="url(#insuranceCumGradient)"
              name="insurance"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3 text-center">
        <p className="text-xs text-slate-500">
          This shows the total cumulative cost of homeownership including all expenses over time
        </p>
      </div>
    </div>
  );
}
