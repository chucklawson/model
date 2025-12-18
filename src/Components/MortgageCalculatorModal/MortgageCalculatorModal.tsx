import { useState, useMemo } from 'react';
import {
  Home,
  X,
  DollarSign,
  Calendar,
  TrendingUp,
  PieChart,
  TrendingDown,
  BarChart3,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  Info
} from 'lucide-react';
import type {
  MortgageInputs,
  MortgageResults,
  ExtraPayment
} from '../../Lib/MortgageCalculation';
import {
  calculateMortgage,
  validateInputs,
  calculateDownPaymentAmount
} from '../../Lib/MortgageCalculation';
import { MORTGAGE_PRESETS, COMMON_INTEREST_RATES, LOAN_TERMS } from '../../Lib/MortgageScenario';
import { formatMonthLabel } from '../../Lib/AmortizationSchedule';
import PrincipalVsInterestChart from '../MortgageCharts/PrincipalVsInterestChart';
import RemainingBalanceChart from '../MortgageCharts/RemainingBalanceChart';
import TotalInterestComparisonChart from '../MortgageCharts/TotalInterestComparisonChart';
import CumulativePaymentsChart from '../MortgageCharts/CumulativePaymentsChart';

type ChartTab = 'principal-interest' | 'balance' | 'comparison' | 'cumulative';

export default function MortgageCalculatorModal({ onClose }: { onClose: () => void }) {
  // State management
  const [inputs, setInputs] = useState<MortgageInputs>({
    loanAmount: 300000,
    downPayment: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    propertyTax: 3600,
    homeInsurance: 1200,
    hoaFees: 0,
    pmiRate: 0.85
  });

  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([]);
  const [results, setResults] = useState<MortgageResults | null>(null);
  const [activeChart, setActiveChart] = useState<ChartTab>('principal-interest');
  const [showExtraPayments, setShowExtraPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculate home price based on loan amount and down payment
  const homePrice = useMemo(() => {
    return inputs.loanAmount / (1 - inputs.downPayment / 100);
  }, [inputs.loanAmount, inputs.downPayment]);

  const downPaymentAmount = useMemo(() => {
    return calculateDownPaymentAmount(inputs.loanAmount, inputs.downPayment).downPaymentAmount;
  }, [inputs.loanAmount, inputs.downPayment]);

  // Handle calculate
  const handleCalculate = () => {
    setError(null);

    // Validate inputs
    const validationError = validateInputs(inputs);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Calculate results
    const calculatedResults = calculateMortgage(inputs, extraPayments);
    setResults(calculatedResults);
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = MORTGAGE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setInputs(preset.inputs);
      setExtraPayments([]);
      setResults(null);
      setError(null);
    }
  };

  // Handle input changes
  const updateInput = (field: keyof MortgageInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setResults(null); // Clear results when inputs change
  };

  // Synchronize down payment % and $
  const updateDownPaymentPercent = (percent: number) => {
    updateInput('downPayment', percent);
  };

  const updateDownPaymentDollar = (dollars: number) => {
    const newHomePrice = inputs.loanAmount + dollars;
    const percent = (dollars / newHomePrice) * 100;
    updateInput('downPayment', percent);
  };

  // Extra payment management
  const addExtraPayment = () => {
    const newPayment: ExtraPayment = {
      id: Date.now().toString(),
      type: 'recurring-monthly',
      amount: 100,
      startMonth: 1
    };
    setExtraPayments(prev => [...prev, newPayment]);
    setResults(null);
  };

  const removeExtraPayment = (id: string) => {
    setExtraPayments(prev => prev.filter(p => p.id !== id));
    setResults(null);
  };

  const updateExtraPayment = (id: string, field: keyof ExtraPayment, value: any) => {
    setExtraPayments(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
    setResults(null);
  };

  // Chart tabs
  const chartTabs: { id: ChartTab; label: string; icon: any }[] = [
    { id: 'principal-interest', label: 'Principal vs Interest', icon: PieChart },
    { id: 'balance', label: 'Remaining Balance', icon: TrendingDown },
    { id: 'comparison', label: 'Loan Term Comparison', icon: BarChart3 },
    { id: 'cumulative', label: 'Total Cost Breakdown', icon: Layers }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 p-6 rounded-t-xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="text-white" size={32} />
              <div>
                <h2 className="text-2xl font-bold text-white">Mortgage Calculator</h2>
                <p className="text-blue-100 text-sm">Calculate payments with PMI, taxes, and insurance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Preset Scenarios */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              Quick Start Scenarios
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MORTGAGE_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500
                             hover:bg-blue-50 transition-all text-left"
                >
                  <div className="font-bold text-slate-800">{preset.name}</div>
                  <div className="text-xs text-slate-600 mt-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Loan Basics Section */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Loan Basics</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Loan Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={inputs.loanAmount}
                    onChange={e => updateInput('loanAmount', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none"
                    step="1000"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Home Price: {formatCurrency(homePrice)}
                </p>
              </div>

              {/* Down Payment % */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Down Payment {inputs.downPayment < 20 && (
                    <span className="text-orange-600 text-xs">(PMI Required)</span>
                  )}
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={inputs.downPayment.toFixed(1)}
                        onChange={e => updateDownPaymentPercent(parseFloat(e.target.value) || 0)}
                        className="w-full pr-8 pl-4 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none"
                        step="0.5"
                        min="0"
                        max="99"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        value={downPaymentAmount.toFixed(0)}
                        onChange={e => updateDownPaymentDollar(parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none"
                        step="1000"
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={inputs.downPayment}
                    onChange={e => updateDownPaymentPercent(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Interest Rate (Annual)
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={inputs.interestRate}
                      onChange={e => updateInput('interestRate', parseFloat(e.target.value) || 0)}
                      className="w-full pr-8 pl-4 py-2 border-2 border-slate-300 rounded-lg
                                 focus:border-blue-500 focus:outline-none"
                      step="0.1"
                      min="0"
                      max="20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {COMMON_INTEREST_RATES.slice(0, 6).map(rate => (
                      <button
                        key={rate}
                        onClick={() => updateInput('interestRate', rate)}
                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                          inputs.interestRate === rate
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-blue-300 text-blue-600 hover:border-blue-500'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Loan Term */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Loan Term
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {LOAN_TERMS.map(term => (
                    <button
                      key={term.years}
                      onClick={() => updateInput('loanTermYears', term.years)}
                      className={`p-3 rounded-lg font-bold transition-all ${
                        inputs.loanTermYears === term.years
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white scale-105'
                          : 'bg-white border-2 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={inputs.loanTermYears}
                  onChange={e => updateInput('loanTermYears', parseFloat(e.target.value) || 30)}
                  placeholder="Custom years"
                  className="mt-2 w-full px-4 py-2 border-2 border-slate-300 rounded-lg
                             focus:border-blue-500 focus:outline-none"
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Additional Costs Section */}
          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-6 rounded-xl border-2 border-cyan-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Additional Costs</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Property Tax */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Property Tax (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={inputs.propertyTax}
                    onChange={e => updateInput('propertyTax', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none"
                    step="100"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Monthly: {formatCurrency(inputs.propertyTax / 12)}
                </p>
              </div>

              {/* Home Insurance */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Home Insurance (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={inputs.homeInsurance}
                    onChange={e => updateInput('homeInsurance', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none"
                    step="100"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Monthly: {formatCurrency(inputs.homeInsurance / 12)}
                </p>
              </div>

              {/* HOA Fees */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  HOA Fees (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="number"
                    value={inputs.hoaFees}
                    onChange={e => updateInput('hoaFees', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none"
                    step="10"
                  />
                </div>
              </div>
            </div>

            {/* PMI Badge */}
            {inputs.downPayment < 20 && (
              <div className="mt-4 p-3 bg-orange-100 border-2 border-orange-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="text-orange-600" size={20} />
                  <div>
                    <p className="font-semibold text-orange-800">PMI Required</p>
                    <p className="text-sm text-orange-700">
                      Down payment &lt; 20% requires Private Mortgage Insurance ({inputs.pmiRate}% annually)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Extra Payments Section */}
          <div className="border-2 border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Extra Payments (Optional)</h3>
              <button
                onClick={() => setShowExtraPayments(!showExtraPayments)}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
              >
                {showExtraPayments ? 'Hide' : 'Show'}
              </button>
            </div>

            {showExtraPayments && (
              <div className="space-y-3">
                {extraPayments.map(payment => (
                  <div key={payment.id} className="flex gap-2 items-start bg-slate-50 p-3 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <select
                        value={payment.type}
                        onChange={e => updateExtraPayment(payment.id, 'type', e.target.value)}
                        className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      >
                        <option value="one-time">One-time</option>
                        <option value="recurring-monthly">Monthly</option>
                        <option value="recurring-yearly">Yearly</option>
                      </select>

                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          value={payment.amount}
                          onChange={e => updateExtraPayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-6 pr-2 py-2 border-2 border-slate-300 rounded-lg
                                     focus:border-blue-500 focus:outline-none"
                          placeholder="Amount"
                        />
                      </div>

                      <input
                        type="number"
                        value={payment.startMonth}
                        onChange={e => updateExtraPayment(payment.id, 'startMonth', parseInt(e.target.value) || 1)}
                        className="px-3 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none"
                        placeholder="Start month"
                        min="1"
                      />

                      <div className="text-xs text-slate-600 flex items-center">
                        Starting month {payment.startMonth}
                      </div>
                    </div>

                    <button
                      onClick={() => removeExtraPayment(payment.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addExtraPayment}
                  className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg
                             text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2
                             font-semibold"
                >
                  <Plus size={20} />
                  Add Extra Payment
                </button>
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white
                       rounded-xl font-bold text-lg hover:from-blue-700 hover:to-cyan-700
                       transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Calculator size={24} />
            Calculate Mortgage
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-100 border-2 border-red-300 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                <p className="font-semibold text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              {/* Result Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Monthly Payment */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={24} />
                    <h4 className="font-bold">Monthly P&I</h4>
                  </div>
                  <p className="text-4xl font-bold">{formatCurrency(results.monthlyPrincipalAndInterest)}</p>
                  <p className="text-sm text-blue-100 mt-2">
                    + {formatCurrency(results.monthlyPropertyTax + results.monthlyInsurance + results.monthlyPMI + results.monthlyHOA)} (TIHP)
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    Total: {formatCurrency(results.totalMonthlyPayment)}
                  </p>
                </div>

                {/* Total Interest */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={24} />
                    <h4 className="font-bold">Total Interest</h4>
                  </div>
                  <p className="text-4xl font-bold">{formatCurrency(results.totalInterest)}</p>
                  <p className="text-sm text-red-100 mt-2">
                    Over {Math.floor(results.payoffMonth / 12)} years, {results.payoffMonth % 12} months
                  </p>
                </div>

                {/* Total Cost */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Home size={24} />
                    <h4 className="font-bold">Total Cost</h4>
                  </div>
                  <p className="text-4xl font-bold">{formatCurrency(results.totalPaid)}</p>
                  <p className="text-sm text-purple-100 mt-2">
                    Principal + Interest
                  </p>
                </div>

                {/* Payoff Date */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={24} />
                    <h4 className="font-bold">Payoff Date</h4>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatMonthLabel(results.amortizationSchedule[results.amortizationSchedule.length - 1])}
                  </p>
                  <p className="text-sm text-green-100 mt-2">
                    {results.payoffMonth} monthly payments
                  </p>
                  {extraPayments.length > 0 && results.payoffMonth < inputs.loanTermYears * 12 && (
                    <p className="text-sm text-green-100 font-semibold mt-1">
                      {inputs.loanTermYears * 12 - results.payoffMonth} months early!
                    </p>
                  )}
                </div>
              </div>

              {/* Chart Tabs */}
              <div>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {chartTabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveChart(tab.id)}
                        className={`px-4 py-3 rounded-lg font-semibold whitespace-nowrap
                                   flex items-center gap-2 transition-all ${
                          activeChart === tab.id
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                            : 'bg-white border-2 border-slate-300 hover:border-blue-400'
                        }`}
                      >
                        <Icon size={20} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Active Chart */}
                <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
                  {activeChart === 'principal-interest' && (
                    <PrincipalVsInterestChart schedule={results.amortizationSchedule} />
                  )}
                  {activeChart === 'balance' && (
                    <RemainingBalanceChart
                      schedule={results.amortizationSchedule}
                      originalLoan={inputs.loanAmount}
                    />
                  )}
                  {activeChart === 'comparison' && (
                    <TotalInterestComparisonChart inputs={inputs} />
                  )}
                  {activeChart === 'cumulative' && (
                    <CumulativePaymentsChart schedule={results.amortizationSchedule} inputs={inputs} />
                  )}
                </div>
              </div>

              {/* Amortization Schedule Table */}
              <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Amortization Schedule</h3>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100">
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left p-2">Month</th>
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Principal</th>
                        <th className="text-right p-2">Interest</th>
                        <th className="text-right p-2">Extra</th>
                        <th className="text-right p-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.amortizationSchedule.map(payment => (
                        <tr key={payment.month} className="border-b border-slate-200 hover:bg-slate-50">
                          <td className="p-2">{payment.month}</td>
                          <td className="p-2">{formatMonthLabel(payment)}</td>
                          <td className="text-right p-2 text-blue-600 font-semibold">
                            {formatCurrency(payment.principalPaid)}
                          </td>
                          <td className="text-right p-2 text-red-600">
                            {formatCurrency(payment.interestPaid)}
                          </td>
                          <td className="text-right p-2 text-green-600">
                            {payment.extraPrincipalPaid > 0 ? formatCurrency(payment.extraPrincipalPaid) : '-'}
                          </td>
                          <td className="text-right p-2 font-semibold">
                            {formatCurrency(payment.remainingBalance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition-all"
          >
            Close
          </button>
          {results && (
            <button
              onClick={handleCalculate}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              Recalculate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for Calculator icon
function Calculator({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <rect x="8" y="6" width="8" height="4" rx="1" />
      <path d="M8 14h0M12 14h0M16 14h0M8 18h0M12 18h0M16 18h0" />
    </svg>
  );
}
