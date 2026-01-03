import { useState, useMemo, useEffect } from 'react';
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
import { calculateInvestmentGrowth, calculateDrawDownInvestment } from '../../Lib/InvestmentCalculation';
import type { DrawDownInvestmentInputs } from '../../Lib/InvestmentCalculation';
import PrincipalVsInterestChart from '../MortgageCharts/PrincipalVsInterestChart';
import RemainingBalanceChart from '../MortgageCharts/RemainingBalanceChart';
import TotalInterestComparisonChart from '../MortgageCharts/TotalInterestComparisonChart';
import CumulativePaymentsChart from '../MortgageCharts/CumulativePaymentsChart';
import InvestmentComparisonChart from '../MortgageCharts/InvestmentComparisonChart';

type ChartTab = 'principal-interest' | 'balance' | 'comparison' | 'cumulative' | 'investment';

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
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number>(inputs.interestRate);
  const [investmentComparisonMode, setInvestmentComparisonMode] = useState<'lump-sum' | 'monthly-payment' | 'draw-down'>('lump-sum');

  // Sync investment rate with mortgage rate when it changes
  useEffect(() => {
    setInvestmentReturnRate(inputs.interestRate);
  }, [inputs.interestRate]);

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

  const updateExtraPayment = (id: string, field: keyof ExtraPayment, value: string | number) => {
    setExtraPayments(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
    setResults(null);
  };

  // Chart tabs
  const chartTabs: { id: ChartTab; label: string; icon: React.ElementType }[] = [
    { id: 'principal-interest', label: 'Principal vs Interest', icon: PieChart },
    { id: 'balance', label: 'Remaining Balance', icon: TrendingDown },
    { id: 'comparison', label: 'Loan Term Comparison', icon: BarChart3 },
    { id: 'cumulative', label: 'Total Cost Breakdown', icon: Layers },
    { id: 'investment', label: 'Investment Comparison', icon: TrendingUp }
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
                    step="any"
                    value={inputs.loanAmount || ''}
                    onChange={e => {
                      const num = parseFloat(e.target.value);
                      updateInput('loanAmount', isNaN(num) ? 0 : num);
                    }}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        step="any"
                        value={inputs.downPayment || ''}
                        onChange={e => {
                          const num = parseFloat(e.target.value);
                          updateDownPaymentPercent(isNaN(num) ? 0 : num);
                        }}
                        className="w-full pr-8 pl-4 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    </div>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                      <input
                        type="number"
                        step="any"
                        value={downPaymentAmount || ''}
                        onChange={e => {
                          const num = parseFloat(e.target.value);
                          updateDownPaymentDollar(isNaN(num) ? 0 : num);
                        }}
                        className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      step="any"
                      value={inputs.interestRate || ''}
                      onChange={e => {
                        const num = parseFloat(e.target.value);
                        updateInput('interestRate', isNaN(num) ? 0 : num);
                      }}
                      className="w-full pr-8 pl-4 py-2 border-2 border-slate-300 rounded-lg
                                 focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                  type="text"
                  value={inputs.loanTermYears}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    const num = parseInt(val);
                    if (!isNaN(num) || val === '') {
                      updateInput('loanTermYears', isNaN(num) ? 30 : num);
                    }
                  }}
                  placeholder="Custom years"
                  className="mt-2 w-full px-4 py-2 border-2 border-slate-300 rounded-lg
                             focus:border-blue-500 focus:outline-none"
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
                    step="any"
                    value={inputs.propertyTax || ''}
                    onChange={e => {
                      const num = parseFloat(e.target.value);
                      updateInput('propertyTax', isNaN(num) ? 0 : num);
                    }}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    step="any"
                    value={inputs.homeInsurance || ''}
                    onChange={e => {
                      const num = parseFloat(e.target.value);
                      updateInput('homeInsurance', isNaN(num) ? 0 : num);
                    }}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    step="any"
                    value={inputs.hoaFees || ''}
                    onChange={e => {
                      const num = parseFloat(e.target.value);
                      updateInput('hoaFees', isNaN(num) ? 0 : num);
                    }}
                    className="w-full pl-8 pr-4 py-2 border-2 border-slate-300 rounded-lg
                               focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                          step="any"
                          value={payment.amount || ''}
                          onChange={e => {
                            const num = parseFloat(e.target.value);
                            updateExtraPayment(payment.id, 'amount', isNaN(num) ? 0 : num);
                          }}
                          className="w-full pl-6 pr-2 py-2 border-2 border-slate-300 rounded-lg
                                     focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="Amount"
                        />
                      </div>

                      <input
                        type="text"
                        value={payment.startMonth}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const num = parseInt(val);
                          if (!isNaN(num) || val === '') {
                            updateExtraPayment(payment.id, 'startMonth', isNaN(num) ? 1 : num);
                          }
                        }}
                        className="px-3 py-2 border-2 border-slate-300 rounded-lg
                                   focus:border-blue-500 focus:outline-none"
                        placeholder="Start month"
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

          {/* Investment Comparison Settings */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp size={20} className="text-green-600" />
              Investment Comparison Settings
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                  Expected Return Rate:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={investmentReturnRate || ''}
                    onChange={e => {
                      const num = parseFloat(e.target.value);
                      setInvestmentReturnRate(isNaN(num) ? 0 : num);
                    }}
                    className="w-20 pr-6 pl-3 py-2 border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setInvestmentReturnRate(inputs.interestRate)}
                  className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors whitespace-nowrap"
                >
                  Match Mortgage ({inputs.interestRate.toFixed(2)}%)
                </button>
                <button
                  onClick={() => setInvestmentReturnRate(4)}
                  className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Conservative (4%)
                </button>
                <button
                  onClick={() => setInvestmentReturnRate(7)}
                  className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  S&P 500 Avg (7%)
                </button>
                <button
                  onClick={() => setInvestmentReturnRate(10)}
                  className="text-xs px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Aggressive (10%)
                </button>
              </div>
            </div>
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
                  {activeChart === 'investment' && (
                    <>
                      <div className="mb-4 flex gap-3 items-center justify-center">
                        <label className="text-sm font-semibold text-slate-700">Comparison Mode:</label>
                        <select
                          value={investmentComparisonMode}
                          onChange={e => setInvestmentComparisonMode(e.target.value as 'lump-sum' | 'monthly-payment' | 'draw-down')}
                          className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm bg-white"
                        >
                          <option value="lump-sum">Lump Sum Investment</option>
                          <option value="monthly-payment">Monthly Payment Investment</option>
                          <option value="draw-down">Draw-Down Investment</option>
                        </select>
                      </div>
                      <InvestmentComparisonChart
                        mortgageSchedule={results.amortizationSchedule}
                        mortgageInputs={inputs}
                        investmentReturnRate={investmentReturnRate}
                        comparisonMode={investmentComparisonMode}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Amortization Schedule Table */}
              <div className="bg-white p-6 rounded-xl border-2 border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">
                  Amortization Schedule
                  {activeChart === 'investment' && (
                    <span className="ml-2 text-sm font-normal text-green-600">with Investment Comparison</span>
                  )}
                </h3>
                <div className="overflow-x-auto overflow-y-auto max-h-96" style={{ overflowX: 'scroll' }}>
                  <table className="w-full text-sm" style={{ minWidth: activeChart === 'investment' ? '1200px' : '800px' }}>
                    <thead className="sticky top-0 bg-slate-100">
                      <tr className="border-b-2 border-slate-300">
                        <th className="text-left p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '50px' } : {}}>Month</th>
                        <th className="text-left p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '70px' } : {}}>Date</th>
                        <th className="text-right p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '100px' } : {}}>Principal</th>
                        <th className="text-right p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '80px' } : {}}>Interest</th>
                        {activeChart === 'investment' && <th className="text-right p-2 whitespace-nowrap text-red-700" style={{ width: '95px' }}>Accum. Interest</th>}
                        {activeChart !== 'investment' && <th className="text-right p-2 whitespace-nowrap">Extra</th>}
                        <th className="text-right p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '100px' } : {}}>Balance</th>
                        {activeChart === 'investment' && (
                          <>
                            <th className="text-right p-2 whitespace-nowrap text-green-700" style={{ width: '90px' }}>Monthly Return</th>
                            <th className="text-right p-2 whitespace-nowrap text-green-700" style={{ width: '90px' }}>Accum. Return</th>
                            <th className="text-right p-2 whitespace-nowrap text-green-700" style={{ width: '100px' }}>Investment Value</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Calculate investment data once if on investment tab
                        let investmentSchedule = null;
                        if (activeChart === 'investment') {
                          const monthlyPayment = results.monthlyPrincipalAndInterest;

                          let investmentResults;
                          if (investmentComparisonMode === 'draw-down') {
                            const drawDownInputs: DrawDownInvestmentInputs = {
                              initialInvestment: inputs.loanAmount,
                              monthlyWithdrawal: monthlyPayment,
                              annualReturnRate: investmentReturnRate,
                              investmentTermYears: inputs.loanTermYears
                            };
                            investmentResults = calculateDrawDownInvestment(drawDownInputs);
                          } else {
                            const standardInputs = investmentComparisonMode === 'lump-sum'
                              ? {
                                  initialInvestment: inputs.loanAmount,
                                  monthlyContribution: 0,
                                  annualReturnRate: investmentReturnRate,
                                  investmentTermYears: inputs.loanTermYears
                                }
                              : {
                                  initialInvestment: 0,
                                  monthlyContribution: monthlyPayment,
                                  annualReturnRate: investmentReturnRate,
                                  investmentTermYears: inputs.loanTermYears
                                };
                            investmentResults = calculateInvestmentGrowth(standardInputs);
                          }
                          investmentSchedule = investmentResults.monthlyGrowthSchedule;
                        }

                        return results.amortizationSchedule.map((payment, idx) => {
                          const investmentData = investmentSchedule ? investmentSchedule[idx] : null;

                        return (
                          <tr key={payment.month} className="border-b border-slate-200 hover:bg-slate-50">
                            <td className="p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '50px' } : {}}>{payment.month}</td>
                            <td className="p-2 whitespace-nowrap" style={activeChart === 'investment' ? { width: '70px' } : {}}>{formatMonthLabel(payment)}</td>
                            <td className="text-right p-2 text-blue-600 font-semibold whitespace-nowrap" style={activeChart === 'investment' ? { width: '100px' } : {}}>
                              {formatCurrency(payment.principalPaid)}
                            </td>
                            <td className="text-right p-2 text-red-600 whitespace-nowrap" style={activeChart === 'investment' ? { width: '80px' } : {}}>
                              {formatCurrency(payment.interestPaid)}
                            </td>
                            {activeChart === 'investment' && (
                              <td className="text-right p-2 text-red-700 font-semibold whitespace-nowrap" style={{ width: '95px' }}>
                                {formatCurrency(payment.cumulativeInterest)}
                              </td>
                            )}
                            {activeChart !== 'investment' && (
                              <td className="text-right p-2 text-green-600 whitespace-nowrap">
                                {payment.extraPrincipalPaid > 0 ? formatCurrency(payment.extraPrincipalPaid) : '-'}
                              </td>
                            )}
                            <td className="text-right p-2 font-semibold whitespace-nowrap" style={activeChart === 'investment' ? { width: '100px' } : {}}>
                              {formatCurrency(payment.remainingBalance)}
                            </td>
                            {activeChart === 'investment' && investmentData && (
                              <>
                                <td className="text-right p-2 text-green-600 font-semibold whitespace-nowrap" style={{ width: '90px' }}>
                                  {formatCurrency(investmentData.interestEarned)}
                                </td>
                                <td className="text-right p-2 text-green-700 font-bold whitespace-nowrap" style={{ width: '90px' }}>
                                  {formatCurrency(investmentData.cumulativeInterest)}
                                </td>
                                <td className="text-right p-2 text-green-700 font-bold whitespace-nowrap" style={{ width: '100px' }}>
                                  {formatCurrency(investmentData.totalValue)}
                                </td>
                              </>
                            )}
                          </tr>
                        );
                        });
                      })()}
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
