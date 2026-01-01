import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { calculateDepletionScenarios } from '../../Lib/DrawdownCalculation';

interface DepletionScenariosChartProps {
  beginningBalance: number;
  annualRate: number;
  durationYears: number;
}

export default function DepletionScenariosChart({
  beginningBalance,
  annualRate,
  durationYears
}: DepletionScenariosChartProps) {
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate monthly interest for reference
  const monthlyInterestEarned = beginningBalance * (annualRate / 100 / 12);

  // Generate test scenarios - range from 50% to 200% of interest earned
  const testRates: number[] = [];
  const baseAmount = Math.max(1000, Math.round(monthlyInterestEarned / 500) * 500);

  for (let i = -2; i <= 4; i++) {
    testRates.push(baseAmount + (i * 1000));
  }

  // Calculate scenarios
  const scenarios = calculateDepletionScenarios(
    beginningBalance,
    annualRate,
    durationYears,
    testRates
  );

  // Transform data for chart
  const chartData = scenarios.map(scenario => ({
    name: scenario.scenarioName,
    months: scenario.depletionMonth || (durationYears * 12 + 1), // Use max months if never depletes
    years: scenario.depletionMonth ? (scenario.depletionMonth / 12).toFixed(1) : `${durationYears}+`,
    depletes: scenario.depletionMonth !== null,
    drawdownRate: scenario.drawdownRate
  }));

  // Color scale - green for sustainable, yellow/orange/red for depleting
  const getColor = (data: typeof chartData[0]) => {
    if (!data.depletes) return '#10b981'; // Green - sustainable

    const yearsToDepletion = data.months / 12;
    const pctOfDuration = yearsToDepletion / durationYears;

    if (pctOfDuration > 0.75) return '#22c55e'; // Light green
    if (pctOfDuration > 0.5) return '#eab308'; // Yellow
    if (pctOfDuration > 0.25) return '#f59e0b'; // Orange
    return '#ef4444'; // Red - quick depletion
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-teal-400">
          <p className="font-bold text-teal-700 mb-2">{data.name} Withdrawal</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold">Monthly:</span> {formatCurrency(data.drawdownRate)}
            </p>
            {data.depletes ? (
              <>
                <p className="text-red-600">
                  <span className="font-semibold">Depletes in:</span> {data.years} years
                </p>
                <p className="text-slate-600 text-sm">
                  ({data.months} months)
                </p>
              </>
            ) : (
              <p className="text-green-600 font-semibold">
                Sustainable (never depletes)
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Depletion Scenarios</h4>
        <p className="text-sm text-slate-600">
          Compare different withdrawal amounts to see sustainability
        </p>
      </div>

      <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <p className="text-sm text-slate-700">
          <span className="font-semibold">Reference:</span> At {annualRate}% on {formatCurrency(beginningBalance)},
          you earn approximately <span className="font-semibold text-teal-600">{formatCurrency(monthlyInterestEarned)}/month</span> in interest.
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Withdrawals below this amount may be sustainable. Higher withdrawals will deplete your balance faster.
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            stroke="#64748b"
            fontSize={12}
          />

          <YAxis
            label={{ value: 'Months Until Depletion', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
            tickFormatter={(value) => {
              if (value > durationYears * 12) return 'Never';
              return value.toString();
            }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar dataKey="months" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Sustainable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-lime-500 rounded"></div>
            <span>Lasts 75%+</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Lasts 50-75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Lasts 25-50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Depletes quickly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
