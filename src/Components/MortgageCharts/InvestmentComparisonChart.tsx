import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import type { MonthlyPayment, MortgageInputs } from '../../Lib/MortgageCalculation';
import { calculateMonthlyPayment } from '../../Lib/MortgageCalculation';
import { formatMonthLabel, sampleScheduleForChart } from '../../Lib/AmortizationSchedule';
import { calculateInvestmentGrowth, calculateDrawDownInvestment, validateInvestmentInputs, calculateBreakevenRate } from '../../Lib/InvestmentCalculation';
import type { DrawDownInvestmentInputs } from '../../Lib/InvestmentCalculation';

interface InvestmentComparisonChartProps {
  mortgageSchedule: MonthlyPayment[];
  mortgageInputs: MortgageInputs;
  investmentReturnRate: number;
  comparisonMode: 'lump-sum' | 'monthly-payment' | 'draw-down';
}

export default function InvestmentComparisonChart({
  mortgageSchedule,
  mortgageInputs,
  investmentReturnRate,
  comparisonMode
}: InvestmentComparisonChartProps) {
  // Format currency for tooltips
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate investment growth based on comparison mode
  const monthlyPayment = calculateMonthlyPayment(
    mortgageInputs.loanAmount,
    mortgageInputs.interestRate,
    mortgageInputs.loanTermYears
  );

  // Calculate investment growth based on mode
  let investmentResults;
  let validation: { isValid: boolean; errors: string[]; warnings: string[] } = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (comparisonMode === 'draw-down') {
    const drawDownInputs: DrawDownInvestmentInputs = {
      initialInvestment: mortgageInputs.loanAmount,
      monthlyWithdrawal: monthlyPayment,
      annualReturnRate: investmentReturnRate,
      investmentTermYears: mortgageInputs.loanTermYears
    };
    investmentResults = calculateDrawDownInvestment(drawDownInputs);
  } else {
    const standardInputs = comparisonMode === 'lump-sum'
      ? {
          initialInvestment: mortgageInputs.loanAmount,
          monthlyContribution: 0,
          annualReturnRate: investmentReturnRate,
          investmentTermYears: mortgageInputs.loanTermYears
        }
      : {
          initialInvestment: 0,
          monthlyContribution: monthlyPayment,
          annualReturnRate: investmentReturnRate,
          investmentTermYears: mortgageInputs.loanTermYears
        };
    validation = validateInvestmentInputs(standardInputs);
    investmentResults = calculateInvestmentGrowth(standardInputs);
  }

  // Sample data for chart (reduce points for long schedules)
  const sampledMortgageSchedule = sampleScheduleForChart(mortgageSchedule, 120);

  // Sample investment schedule manually to match
  const sampleInvestmentSchedule = (schedule: any[], maxPoints: number) => {
    if (schedule.length <= maxPoints) return schedule;
    const interval = Math.floor(schedule.length / maxPoints);
    const sampled = [];
    for (let i = 0; i < schedule.length; i += interval) {
      sampled.push(schedule[i]);
    }
    if (sampled[sampled.length - 1] !== schedule[schedule.length - 1]) {
      sampled.push(schedule[schedule.length - 1]);
    }
    return sampled;
  };

  const sampledInvestmentSchedule = sampleInvestmentSchedule(
    investmentResults.monthlyGrowthSchedule,
    120
  );

  // Transform data for chart
  const chartData = sampledMortgageSchedule.map((payment, idx) => {
    const investmentData = sampledInvestmentSchedule[idx];
    const mortgageCost = payment.cumulativePrincipal + payment.cumulativeInterest;
    const investmentValue = investmentData?.totalValue || 0;
    const netDifference = investmentValue - mortgageCost;

    return {
      month: payment.month,
      label: formatMonthLabel(payment),
      mortgageCost,
      investmentValue,
      netDifference,
      // For filling: when investment > mortgage, show the profit area
      profitArea: netDifference > 0 ? investmentValue : mortgageCost
    };
  });

  // Calculate final totals for summary
  const finalMortgageCost = mortgageSchedule[mortgageSchedule.length - 1].cumulativeTotal;
  const finalInvestmentValue = investmentResults.finalValue;
  const netDifference = finalInvestmentValue - finalMortgageCost;
  const percentageDifference = ((netDifference / finalMortgageCost) * 100).toFixed(1);

  // Calculate breakeven rate for draw-down mode
  const breakevenRate = comparisonMode === 'draw-down'
    ? calculateBreakevenRate(
        mortgageInputs.loanAmount,
        monthlyPayment,
        finalMortgageCost,
        mortgageInputs.loanTermYears
      )
    : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length >= 2) {
      const mortgageCost = payload[0].value;
      const investmentValue = payload[1].value;
      const difference = investmentValue - mortgageCost;

      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-400">
          <p className="font-bold text-blue-700 mb-2">{payload[0].payload.label}</p>
          <div className="space-y-1">
            <p className="text-slate-700">
              <span className="font-semibold text-red-600">Mortgage Cost:</span>{' '}
              {formatCurrency(mortgageCost)}
            </p>
            <p className="text-slate-700">
              <span className="font-semibold text-green-600">Investment Value:</span>{' '}
              {formatCurrency(investmentValue)}
            </p>
            <p className={`text-slate-700 font-bold border-t pt-1 mt-1 ${difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              <span>Difference:</span> {formatCurrency(Math.abs(difference))} {difference >= 0 ? '(gain)' : '(loss)'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate tick interval for X-axis
  const tickInterval = Math.max(1, Math.floor(sampledMortgageSchedule.length / 20));

  return (
    <div className="w-full">
      <div className="mb-3">
        <h4 className="text-lg font-bold text-slate-800">Investment vs Mortgage Comparison</h4>
        <p className="text-sm text-slate-600">
          {comparisonMode === 'lump-sum'
            ? `Compare investing ${formatCurrency(mortgageInputs.loanAmount)} upfront vs paying a mortgage`
            : comparisonMode === 'monthly-payment'
            ? `Compare investing ${formatCurrency(monthlyPayment)}/month vs making mortgage payments`
            : `Start with ${formatCurrency(mortgageInputs.loanAmount)} and make ${formatCurrency(monthlyPayment)} mortgage payments while earning returns`}
        </p>
      </div>

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            {validation.warnings.map((warning, idx) => (
              <p key={idx}>{warning}</p>
            ))}
          </div>
        </div>
      )}

      {/* Breakeven Rate Info (Draw-Down Mode Only) */}
      {comparisonMode === 'draw-down' && breakevenRate !== null && (
        <div className="mb-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Breakeven Rate Analysis</p>
            <p>
              <strong>Breakeven Rate: {breakevenRate.toFixed(3)}%</strong>
            </p>
            <p className="text-xs mt-1">
              At this return rate, your investment value would exactly equal the total mortgage cost
              ({formatCurrency(finalMortgageCost)}) at the end of {mortgageInputs.loanTermYears} years.
              {investmentReturnRate > breakevenRate
                ? ` Your current rate (${investmentReturnRate.toFixed(2)}%) is above breakeven, so you profit.`
                : investmentReturnRate < breakevenRate
                ? ` Your current rate (${investmentReturnRate.toFixed(2)}%) is below breakeven, so you'd be better off paying cash.`
                : ` Your current rate (${investmentReturnRate.toFixed(2)}%) matches the breakeven rate.`}
            </p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="bg-red-50 p-3 rounded-lg border-2 border-red-200">
          <p className="text-xs font-semibold text-red-700 mb-1">Total Mortgage Cost</p>
          <p className="text-lg font-bold text-red-800">{formatCurrency(finalMortgageCost)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border-2 border-green-200">
          <p className="text-xs font-semibold text-green-700 mb-1">Investment Final Value</p>
          <p className="text-lg font-bold text-green-800">{formatCurrency(finalInvestmentValue)}</p>
        </div>
        <div className={`p-3 rounded-lg border-2 ${netDifference >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-xs font-semibold mb-1 ${netDifference >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            Net Difference
          </p>
          <p className={`text-lg font-bold ${netDifference >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            {netDifference >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netDifference))}
            <span className="text-sm ml-1">({netDifference >= 0 ? '+' : ''}{percentageDifference}%)</span>
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="mortgageGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
            </linearGradient>
            <linearGradient id="investmentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#67e8f9" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="month"
            interval={tickInterval}
            tickFormatter={(month) => {
              const payment = sampledMortgageSchedule.find(p => p.month === month);
              return payment ? `Y${Math.floor((payment.month - 1) / 12) + 1}` : '';
            }}
            label={{ value: 'Years', position: 'insideBottom', offset: -10 }}
            stroke="#64748b"
          />

          <YAxis
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            label={{ value: 'Value ($)', angle: -90, position: 'insideLeft' }}
            stroke="#64748b"
          />

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => {
              if (value === 'mortgageCost') return 'Mortgage Cost (Principal + Interest)';
              if (value === 'investmentValue') return 'Investment Portfolio Value';
              return value;
            }}
          />

          <Area
            type="monotone"
            dataKey="mortgageCost"
            stroke="#ef4444"
            strokeWidth={2}
            fill="url(#mortgageGradient)"
            name="mortgageCost"
          />

          <Area
            type="monotone"
            dataKey="profitArea"
            stroke="none"
            fill="url(#investmentGradient)"
            fillOpacity={0.6}
          />

          <Line
            type="monotone"
            dataKey="investmentValue"
            stroke="#06b6d4"
            strokeWidth={3}
            dot={false}
            name="investmentValue"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Educational Panel */}
      <div className="mt-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
        <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle size={16} />
          Understanding This Comparison
        </h5>
        <div className="text-sm text-blue-800 space-y-2">
          {comparisonMode === 'lump-sum' ? (
            <p>
              This shows what {formatCurrency(mortgageInputs.loanAmount)} invested at {investmentReturnRate.toFixed(2)}%
              would grow to over {mortgageInputs.loanTermYears} years, compared to the total cost of the mortgage
              (principal + interest paid).
            </p>
          ) : comparisonMode === 'monthly-payment' ? (
            <p>
              This shows what investing {formatCurrency(monthlyPayment)}/month at {investmentReturnRate.toFixed(2)}%
              would accumulate over {mortgageInputs.loanTermYears} years, compared to making mortgage payments
              of the same amount.
            </p>
          ) : (
            <p>
              This shows starting with {formatCurrency(mortgageInputs.loanAmount)} and making
              monthly mortgage payments of {formatCurrency(monthlyPayment)} from this investment,
              while earning {investmentReturnRate.toFixed(2)}% returns on the remaining balance.
              {investmentResults.finalValue > 0
                ? ` After ${mortgageInputs.loanTermYears} years, ${formatCurrency(investmentResults.finalValue)} remains.`
                : ' The investment depletes before the mortgage term ends.'}
              {' '}<strong>Key insight:</strong> If the return rate equals the mortgage rate ({mortgageInputs.interestRate.toFixed(2)}%),
              the result is equivalent to paying cash. Returns above {mortgageInputs.interestRate.toFixed(2)}% mean you profit
              by investing instead of paying cash; returns below mean you would have been better off paying cash.
            </p>
          )}
          <p className="text-xs text-blue-700 pt-2 border-t border-blue-200">
            <strong>Important:</strong> This comparison does not account for: home equity buildup, tax benefits
            (mortgage interest deduction), rental costs if not buying, inflation, market volatility, or transaction costs.
            The actual financial decision involves many more factors.
          </p>
        </div>
      </div>
    </div>
  );
}
