import { useState } from 'react';
import {
  TrendingDown,
  X,
  DollarSign,
  Calendar,
  BarChart3,
  Plus,
  Trash2,
  AlertCircle,
  Calculator
} from 'lucide-react';
import type {
  DrawdownInputs,
  DrawdownResults,
  VariableDrawdown
} from '../../Lib/DrawdownCalculation';
import {
  calculateDrawdown,
  validateInputs
} from '../../Lib/DrawdownCalculation';
import {
  DRAWDOWN_PRESETS,
  COMMON_RETURN_RATES,
  DURATION_PRESETS
} from '../../Lib/DrawdownScenario';
import { formatMonthLabel } from '../../Lib/DrawdownSchedule';
import BalanceOverTimeChart from '../DrawdownCharts/BalanceOverTimeChart';
import InterestVsDrawdownsChart from '../DrawdownCharts/InterestVsDrawdownsChart';
import CumulativeWithdrawalsChart from '../DrawdownCharts/CumulativeWithdrawalsChart';
import DepletionScenariosChart from '../DrawdownCharts/DepletionScenariosChart';

type ChartTab = 'balance' | 'interest-vs-drawdown' | 'cumulative' | 'depletion';

export default function DrawdownCalculatorModal({ onClose }: { onClose: () => void }) {
  // Get current date
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // State management
  const [inputs, setInputs] = useState<DrawdownInputs>({
    beginningBalance: 500000,
    annualInterestRate: 5.0,
    fixedMonthlyDrawdown: 3000,
    startDate: { month: currentMonth, year: currentYear },
    endDate: { month: currentMonth, year: currentYear + 10 },
    durationYears: 10
  });

  const [variableDrawdowns, setVariableDrawdowns] = useState<VariableDrawdown[]>([]);
  const [results, setResults] = useState<DrawdownResults | null>(null);
  const [activeChart, setActiveChart] = useState<ChartTab>('balance');
  const [showVariableDrawdowns, setShowVariableDrawdowns] = useState(false);
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

  // Calculate duration from dates
  const calculateDuration = (start: { month: number; year: number }, end: { month: number; year: number }): number => {
    const months = (end.year - start.year) * 12 + (end.month - start.month);
    return Math.round(months / 12 * 10) / 10; // Round to 1 decimal
  };

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
    const calculatedResults = calculateDrawdown(inputs, variableDrawdowns);
    setResults(calculatedResults);
  };

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const preset = DRAWDOWN_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setInputs(preset.inputs);
      setVariableDrawdowns([]);
      setResults(null);
      setError(null);
    }
  };

  // Handle input changes
  const updateInput = (field: keyof DrawdownInputs, value: number | { month: number; year: number }) => {
    setInputs(prev => ({ ...prev, [field]: value }));
    setResults(null); // Clear results when inputs change
  };

  // Update duration and sync end date
  const updateDuration = (years: number) => {
    const newEndMonth = inputs.startDate.month;
    const newEndYear = inputs.startDate.year + years;
    setInputs(prev => ({
      ...prev,
      durationYears: years,
      endDate: { month: newEndMonth, year: newEndYear }
    }));
    setResults(null);
  };

  // Update end date and sync duration
  const updateEndDate = (field: 'month' | 'year', value: number) => {
    const newEndDate = { ...inputs.endDate, [field]: value };
    const newDuration = calculateDuration(inputs.startDate, newEndDate);
    setInputs(prev => ({
      ...prev,
      endDate: newEndDate,
      durationYears: newDuration
    }));
    setResults(null);
  };

  // Variable drawdown management
  const addVariableDrawdown = () => {
    const newDrawdown: VariableDrawdown = {
      id: Date.now().toString(),
      type: 'recurring-monthly',
      amount: 500,
      startMonth: 1
    };
    setVariableDrawdowns(prev => [...prev, newDrawdown]);
    setResults(null);
  };

  const removeVariableDrawdown = (id: string) => {
    setVariableDrawdowns(prev => prev.filter(d => d.id !== id));
    setResults(null);
  };

  const updateVariableDrawdown = (id: string, field: keyof VariableDrawdown, value: string | number) => {
    setVariableDrawdowns(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: value } : d))
    );
    setResults(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown size={32} />
                <h2 className="text-3xl font-bold">Drawdown Calculator</h2>
              </div>
              <p className="text-teal-50 text-sm">
                Model withdrawals from your investment portfolio while tracking balance depletion
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Start Scenarios */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <BarChart3 size={20} className="text-teal-600" />
              Quick Start Scenarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DRAWDOWN_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className="p-4 border-2 border-slate-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition text-left"
                >
                  <div className="font-semibold text-slate-800">{preset.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{preset.description}</div>
                  <div className="text-xs text-teal-600 mt-2">
                    {formatCurrency(preset.inputs.beginningBalance)} @ {preset.inputs.annualInterestRate}%
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Investment Basics */}
          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-teal-600" />
              Investment Basics
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Beginning Balance */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Beginning Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-0">$</span>
                  <input
                    type="number"
                    value={inputs.beginningBalance || ''}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      updateInput('beginningBalance', isNaN(num) ? 0 : num);
                    }}
                    className="relative z-10 w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="any"
                  />
                </div>
              </div>

              {/* Annual Interest Rate */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Annual Interest Rate
                </label>
                <div className="relative mb-2">
                  <input
                    type="number"
                    value={inputs.annualInterestRate || ''}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      updateInput('annualInterestRate', isNaN(num) ? 0 : num);
                    }}
                    className="relative z-10 w-full pr-10 pl-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="any"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-0">%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_RETURN_RATES.slice(0, 6).map(rate => (
                    <button
                      key={rate}
                      onClick={() => updateInput('annualInterestRate', rate)}
                      className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-teal-100 hover:border-teal-500"
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed Monthly Drawdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fixed Monthly Drawdown
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-0">$</span>
                  <input
                    type="number"
                    value={inputs.fixedMonthlyDrawdown || ''}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      updateInput('fixedMonthlyDrawdown', isNaN(num) ? 0 : num);
                    }}
                    className="relative z-10 w-full pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    step="any"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Duration (Years)
                </label>
                <div className="flex gap-2 mb-2">
                  {DURATION_PRESETS.map(preset => (
                    <button
                      key={preset.years}
                      onClick={() => updateDuration(preset.years)}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition ${
                        inputs.durationYears === preset.years
                          ? 'bg-teal-600 text-white'
                          : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-teal-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={inputs.durationYears || ''}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    updateDuration(isNaN(num) ? 0 : num);
                  }}
                  className="w-full px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-teal-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  step="1"
                  min="1"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              Timeline
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={inputs.startDate.month}
                    onChange={(e) => {
                      const newStartDate = { ...inputs.startDate, month: parseInt(e.target.value) };
                      const newDuration = calculateDuration(newStartDate, inputs.endDate);
                      setInputs(prev => ({
                        ...prev,
                        startDate: newStartDate,
                        durationYears: newDuration
                      }));
                      setResults(null);
                    }}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                      <option key={idx + 1} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={inputs.startDate.year}
                    onChange={(e) => {
                      const newStartDate = { ...inputs.startDate, year: parseInt(e.target.value) || currentYear };
                      const newDuration = calculateDuration(newStartDate, inputs.endDate);
                      setInputs(prev => ({
                        ...prev,
                        startDate: newStartDate,
                        durationYears: newDuration
                      }));
                      setResults(null);
                    }}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={inputs.endDate.month}
                    onChange={(e) => updateEndDate('month', parseInt(e.target.value))}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none"
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => (
                      <option key={idx + 1} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={inputs.endDate.year}
                    onChange={(e) => updateEndDate('year', parseInt(e.target.value) || currentYear + 10)}
                    className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-emerald-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm text-slate-600">
              Duration: <span className="font-semibold text-emerald-600">{inputs.durationYears} years</span>
            </div>
          </div>

          {/* Variable Drawdowns */}
          <div className="bg-white border-2 border-slate-200 p-6 rounded-xl">
            <button
              onClick={() => setShowVariableDrawdowns(!showVariableDrawdowns)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingDown size={20} className="text-teal-600" />
                Variable Drawdowns (Optional)
              </h3>
              <span className="text-slate-400">{showVariableDrawdowns ? '▼' : '▶'}</span>
            </button>

            {showVariableDrawdowns && (
              <div className="mt-4 space-y-3">
                {variableDrawdowns.map(vd => (
                  <div key={vd.id} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                    <select
                      value={vd.type}
                      onChange={(e) => updateVariableDrawdown(vd.id, 'type', e.target.value)}
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      <option value="one-time">One-Time</option>
                      <option value="recurring-monthly">Monthly</option>
                      <option value="recurring-yearly">Yearly</option>
                    </select>

                    <div className="relative flex-1">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none z-0">$</span>
                      <input
                        type="number"
                        value={vd.amount || ''}
                        onChange={(e) => {
                          const num = parseFloat(e.target.value);
                          updateVariableDrawdown(vd.id, 'amount', isNaN(num) ? 0 : num);
                        }}
                        className="relative z-10 w-full pl-8 pr-2 py-1 border border-slate-300 rounded text-sm bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Amount"
                      />
                    </div>

                    <input
                      type="number"
                      value={vd.startMonth}
                      onChange={(e) => updateVariableDrawdown(vd.id, 'startMonth', parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Month"
                      min="1"
                    />

                    <button
                      onClick={() => removeVariableDrawdown(vd.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addVariableDrawdown}
                  className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-teal-500 hover:text-teal-600 transition flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  Add Variable Drawdown
                </button>
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            className="w-full py-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-teal-700 hover:to-emerald-700 transition shadow-lg flex items-center justify-center gap-3"
          >
            <Calculator size={24} />
            Calculate Drawdown Plan
          </button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Results Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Final Balance */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="text-green-100 text-sm font-semibold mb-2">Final Balance</div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(results.finalBalance)}</div>
                  <div className="text-green-100 text-xs">
                    {results.depletionMonth ? 'Depleted' : `After ${inputs.durationYears} years`}
                  </div>
                </div>

                {/* Total Withdrawn */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="text-blue-100 text-sm font-semibold mb-2">Total Withdrawn</div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(results.totalDrawdowns)}</div>
                  <div className="text-blue-100 text-xs">
                    Avg: {formatCurrency(results.averageMonthlyDrawdown)}/mo
                  </div>
                </div>

                {/* Interest Earned */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
                  <div className="text-purple-100 text-sm font-semibold mb-2">Interest Earned</div>
                  <div className="text-3xl font-bold mb-1">{formatCurrency(results.totalInterestEarned)}</div>
                  <div className="text-purple-100 text-xs">
                    {inputs.annualInterestRate}% annual rate
                  </div>
                </div>

                {/* Depletion Status */}
                <div className={`bg-gradient-to-br ${
                  results.depletionMonth
                    ? 'from-orange-500 to-red-600'
                    : 'from-green-500 to-green-600'
                } text-white p-6 rounded-xl shadow-lg`}>
                  <div className={`${
                    results.depletionMonth ? 'text-orange-100' : 'text-green-100'
                  } text-sm font-semibold mb-2`}>
                    Depletion Status
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {results.depletionMonth ? `Month ${results.depletionMonth}` : 'Sustainable ✓'}
                  </div>
                  <div className={`${
                    results.depletionMonth ? 'text-orange-100' : 'text-green-100'
                  } text-xs`}>
                    {results.depletionMonth
                      ? `${results.yearsUntilDepletion?.toFixed(1)} years`
                      : 'Balance remains positive'}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div>
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  <button
                    onClick={() => setActiveChart('balance')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                      activeChart === 'balance'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Balance Over Time
                  </button>
                  <button
                    onClick={() => setActiveChart('interest-vs-drawdown')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                      activeChart === 'interest-vs-drawdown'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Interest vs Drawdowns
                  </button>
                  <button
                    onClick={() => setActiveChart('cumulative')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                      activeChart === 'cumulative'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cumulative Withdrawals
                  </button>
                  <button
                    onClick={() => setActiveChart('depletion')}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap ${
                      activeChart === 'depletion'
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Depletion Scenarios
                  </button>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-xl p-6">
                  {activeChart === 'balance' && <BalanceOverTimeChart schedule={results.schedule} beginningBalance={inputs.beginningBalance} />}
                  {activeChart === 'interest-vs-drawdown' && <InterestVsDrawdownsChart schedule={results.schedule} />}
                  {activeChart === 'cumulative' && <CumulativeWithdrawalsChart schedule={results.schedule} beginningBalance={inputs.beginningBalance} />}
                  {activeChart === 'depletion' && (
                    <DepletionScenariosChart
                      beginningBalance={inputs.beginningBalance}
                      annualRate={inputs.annualInterestRate}
                      durationYears={inputs.durationYears}
                    />
                  )}
                </div>
              </div>

              {/* Schedule Table */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Monthly Schedule</h3>
                <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Month</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-700">Date</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Beginning Balance</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Interest Earned</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Fixed Drawdown</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Variable Drawdown</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Total Drawdown</th>
                          <th className="px-4 py-2 text-right font-semibold text-slate-700">Ending Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.schedule.map((entry) => (
                          <tr
                            key={entry.month}
                            className={`border-t border-slate-200 ${
                              entry.isDepleted ? 'bg-red-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-2">{entry.month}</td>
                            <td className="px-4 py-2">{formatMonthLabel(entry)}</td>
                            <td className="px-4 py-2 text-right text-blue-600">{formatCurrency(entry.beginningBalance)}</td>
                            <td className="px-4 py-2 text-right text-green-600">{formatCurrency(entry.interestEarned)}</td>
                            <td className="px-4 py-2 text-right text-red-600">{formatCurrency(entry.fixedDrawdown)}</td>
                            <td className="px-4 py-2 text-right text-red-600">{formatCurrency(entry.variableDrawdown)}</td>
                            <td className="px-4 py-2 text-right text-red-700 font-semibold">{formatCurrency(entry.totalDrawdown)}</td>
                            <td className="px-4 py-2 text-right text-blue-700 font-semibold">{formatCurrency(entry.endingBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
