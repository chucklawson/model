import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { MortgageInputs } from '../../Lib/MortgageCalculation';
import { generateAmortizationSchedule } from '../../Lib/MortgageCalculation';

interface TotalInterestComparisonChartProps {
  inputs: MortgageInputs;
}

export default function TotalInterestComparisonChart({
  inputs
}: TotalInterestComparisonChartProps) {
  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate totals for different loan terms
  const loanTerms = [15, 20, 25, 30];
  const comparisonData = loanTerms.map(term => {
    const termInputs = { ...inputs, loanTermYears: term };
    const schedule = generateAmortizationSchedule(termInputs);

    const totalInterest = schedule.reduce((sum, p) => sum + p.interestPaid, 0);
    const totalPrincipal = inputs.loanAmount;
    const totalCost = totalPrincipal + totalInterest;

    return {
      term: `${term} Years`,
      termValue: term,
      totalInterest,
      totalPrincipal,
      totalCost,
      monthlySavings: 0 // Will calculate below
    };
  });

  // Calculate savings compared to 30-year baseline
  const baselineInterest = comparisonData.find(d => d.termValue === 30)?.totalInterest || 0;
  comparisonData.forEach(data => {
    data.monthlySavings = baselineInterest - data.totalInterest;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length >= 2) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{data.term} Loan</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold text-blue-600">Principal:</span>{' '}
              {formatCurrency(data.totalPrincipal)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-red-600">Interest:</span>{' '}
              {formatCurrency(data.totalInterest)}
            </p>
            <p className="text-slate-700 font-bold border-t pt-1 mt-1">
              <span>Total Cost:</span> {formatCurrency(data.totalCost)}
            </p>
            {data.monthlySavings > 0 && (
              <p className="text-green-600 font-bold">
                Saves: {formatCurrency(data.monthlySavings)} vs 30yr
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Color mapping for interest bars (different from principal blue)
  const colors = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444']; // green, orange, purple, red

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Loan Term Comparison</h4>
        <p className="text-sm text-slate-600">
          Compare total interest paid across different loan terms
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={comparisonData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          layout="horizontal"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="term"
            stroke="#64748b"
            angle={0}
            textAnchor="middle"
          />

          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Total Amount', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => {
              if (value === 'totalPrincipal') return 'Principal';
              if (value === 'totalInterest') return 'Interest';
              return value;
            }}
          />

          <Bar dataKey="totalPrincipal" stackId="a" fill="#3b82f6" name="totalPrincipal">
            {comparisonData.map((_entry, index) => (
              <Cell key={`cell-principal-${index}`} fill="#3b82f6" />
            ))}
          </Bar>

          <Bar dataKey="totalInterest" stackId="a" fill="#ef4444" name="totalInterest">
            {comparisonData.map((_entry, index) => (
              <Cell key={`cell-interest-${index}`} fill={colors[index]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
        <h5 className="font-bold text-slate-800 mb-2">Key Insights:</h5>
        <ul className="space-y-1 text-sm text-slate-700">
          {comparisonData.map((data, index) => {
            if (index === comparisonData.length - 1) {
              return (
                <li key={data.termValue}>
                  <span className="font-semibold">{data.term}:</span> Lowest monthly payment, highest total cost
                </li>
              );
            }
            if (data.monthlySavings > 0) {
              return (
                <li key={data.termValue}>
                  <span className="font-semibold">{data.term}:</span> Save{' '}
                  {formatCurrency(data.monthlySavings)} in interest vs 30yr loan
                </li>
              );
            }
            return null;
          })}
        </ul>
      </div>
    </div>
  );
}
