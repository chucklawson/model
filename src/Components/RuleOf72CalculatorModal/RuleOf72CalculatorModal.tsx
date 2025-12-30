import { useState } from 'react';
import {
  Calculator, X, Clock, TrendingUp, BarChart3, Sparkles,
  Lightbulb, DollarSign, PiggyBank
} from 'lucide-react';
import GrowthVisualizationChart from '../GrowthVisualizationChart/GrowthVisualizationChart';
import type RuleOf72Projection from '../../Lib/RuleOf72Projection';

type CalculatorMode = 'yearsToDouble' | 'requiredRate' | 'comparison' | 'projection';

interface FormData {
  mode: CalculatorMode;
  principal: number;
  rate: number;
  years: number;
  monthlyContribution: number;
  comparisonRates: number[];
}

interface YearsToDoubleResult {
  ruleOf72Years: number;
  exactYears: number;
  accuracy: number;
  futureValue: number;
}

interface RequiredRateResult {
  requiredRate: number;
  context: string;
  futureValue: number;
}

interface ScenarioResult {
  rate: number;
  yearsToDouble: number;
  speedRating: 'slow' | 'medium' | 'fast';
}

interface ProjectionResult {
  projections: RuleOf72Projection[];
  doublingEvents: RuleOf72Projection[];
  finalValue: number;
  totalReturn: number;
  totalContributed: number;
  totalInterest: number;
}

interface Results {
  yearsToDouble?: YearsToDoubleResult;
  requiredRate?: RequiredRateResult;
  scenarios?: ScenarioResult[];
  projection?: ProjectionResult;
}

export default function RuleOf72CalculatorModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState<FormData>({
    mode: 'yearsToDouble',
    principal: 1000,
    rate: 8,
    years: 9,
    monthlyContribution: 0,
    comparisonRates: [3, 6, 9, 12]
  });

  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEducationalTip, setShowEducationalTip] = useState(true);
  const [achievedMilestones, setAchievedMilestones] = useState<string[]>([]);

  // Educational content for each mode
  const educationalContent: Record<CalculatorMode, { tip: string; example: string }> = {
    yearsToDouble: {
      tip: "The Rule of 72 is a simple trick to figure out how long it takes for your money to double! Just divide 72 by your interest rate.",
      example: "At 8% interest: 72 ÷ 8 = 9 years to double your money!"
    },
    requiredRate: {
      tip: "Want your money to double in a certain number of years? The Rule of 72 can tell you what interest rate you need!",
      example: "Double in 6 years? You need: 72 ÷ 6 = 12% interest rate"
    },
    comparison: {
      tip: "Compare different interest rates side by side to see which one grows your money fastest!",
      example: "At 12%, your money doubles 2x faster than at 6%!"
    },
    projection: {
      tip: "Watch your money grow year by year! This shows the magic of compound interest - earning interest on your interest!",
      example: "At 10% for 30 years, $1,000 becomes over $17,000!"
    }
  };

  // Example scenarios
  const exampleScenarios = [
    { name: "Piggy Bank", principal: 100, rate: 3, emoji: "🐷", icon: PiggyBank },
    { name: "Savings Account", principal: 500, rate: 5, emoji: "🏦", icon: DollarSign },
    { name: "Stock Investment", principal: 1000, rate: 10, emoji: "📈", icon: TrendingUp },
    { name: "Super Growth!", principal: 1000, rate: 15, emoji: "🚀", icon: Sparkles }
  ];

  // Core calculation functions
  const yearsToDouble = (rate: number): number => {
    return 72 / rate;
  };

  const exactYearsToDouble = (rate: number): number => {
    return Math.log(2) / Math.log(1 + rate / 100);
  };

  const requiredRate = (years: number): number => {
    return 72 / years;
  };

  const futureValueWithContributions = (
    principal: number,
    rate: number,
    years: number,
    monthlyContribution: number
  ): number => {
    const monthlyRate = rate / 100 / 12;
    const months = years * 12;

    const principalGrowth = principal * Math.pow(1 + rate / 100, years);

    if (monthlyContribution === 0) {
      return principalGrowth;
    }

    const contributionsGrowth = monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    return principalGrowth + contributionsGrowth;
  };

  const generateProjection = (
    principal: number,
    rate: number,
    years: number,
    monthlyContribution: number = 0
  ): RuleOf72Projection[] => {
    const projections: RuleOf72Projection[] = [];
    let previousDoubleThreshold = principal;
    let nextDoubleThreshold = principal * 2;

    for (let year = 1; year <= years; year++) {
      const value = futureValueWithContributions(principal, rate, year, monthlyContribution);
      const growth = value - principal;
      const totalContributions = monthlyContribution * 12 * year;
      const interestEarned = value - principal - totalContributions;

      let isDoublingYear = false;
      if (value >= nextDoubleThreshold) {
        isDoublingYear = true;
        previousDoubleThreshold = nextDoubleThreshold;
        nextDoubleThreshold = previousDoubleThreshold * 2;
      }

      projections.push({
        year,
        value,
        growth,
        totalContributions,
        interestEarned,
        isDoublingYear
      });
    }

    return projections;
  };

  const getRateContext = (rate: number): string => {
    if (rate < 2) return "Very low - like a basic savings account";
    if (rate < 5) return "Low - similar to high-yield savings";
    if (rate < 8) return "Moderate - like bonds or conservative investments";
    if (rate < 12) return "Good - similar to stock market averages";
    if (rate < 20) return "Great - above-average stock returns";
    return "Excellent - very high growth!";
  };

  const getSpeedRating = (years: number): 'slow' | 'medium' | 'fast' => {
    if (years > 15) return 'slow';
    if (years > 8) return 'medium';
    return 'fast';
  };

  const getEmojiFeedback = (years: number): string => {
    if (years < 5) return "🚀 Super fast!";
    if (years < 10) return "⭐ Great speed!";
    if (years < 20) return "✨ Nice and steady!";
    return "🐢 Slow but steady!";
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatLargeNumber = (value: number): string => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return formatCurrency(value);
  };

  const validateInputs = (): string | null => {
    const { mode, principal, rate, years, monthlyContribution } = formData;

    if (principal < 1 || principal > 10000000) {
      return "Amount must be between $1 and $10 million";
    }

    if (mode !== 'requiredRate') {
      if (rate < 0.1 || rate > 100) {
        return "Interest rate must be between 0.1% and 100%";
      }
    }

    if (mode === 'requiredRate' || mode === 'projection') {
      if (years < 1 || years > 100) {
        return "Years must be between 1 and 100";
      }
    }

    if (mode === 'projection' && monthlyContribution < 0) {
      return "Monthly contribution cannot be negative";
    }

    return null;
  };

  const handleCalculate = () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    const { mode, principal, rate, years, monthlyContribution, comparisonRates } = formData;

    switch (mode) {
      case 'yearsToDouble': {
        const ruleOf72Years = yearsToDouble(rate);
        const exactYears = exactYearsToDouble(rate);
        const accuracy = ((ruleOf72Years - exactYears) / exactYears) * 100;

        setResults({
          yearsToDouble: {
            ruleOf72Years,
            exactYears,
            accuracy,
            futureValue: principal * 2
          }
        });

        // Achievement
        if (!achievedMilestones.includes('first_calc')) {
          setAchievedMilestones([...achievedMilestones, 'first_calc']);
        }
        break;
      }

      case 'requiredRate': {
        const rateNeeded = requiredRate(years);
        const context = getRateContext(rateNeeded);

        setResults({
          requiredRate: {
            requiredRate: rateNeeded,
            context,
            futureValue: principal * 2
          }
        });
        break;
      }

      case 'comparison': {
        const scenarios = comparisonRates.map(r => ({
          rate: r,
          yearsToDouble: yearsToDouble(r),
          speedRating: getSpeedRating(yearsToDouble(r))
        }));

        setResults({ scenarios });

        if (comparisonRates.length >= 3 && !achievedMilestones.includes('compare_3')) {
          setAchievedMilestones([...achievedMilestones, 'compare_3']);
        }
        break;
      }

      case 'projection': {
        const projections = generateProjection(principal, rate, years, monthlyContribution);
        const doublingEvents = projections.filter(p => p.isDoublingYear);
        const finalValue = projections[projections.length - 1].value;
        const totalReturn = ((finalValue - principal) / principal) * 100;
        const totalContributed = monthlyContribution * 12 * years;
        const totalInterest = projections[projections.length - 1].interestEarned;

        setResults({
          projection: {
            projections,
            doublingEvents,
            finalValue,
            totalReturn,
            totalContributed,
            totalInterest
          }
        });

        if (years >= 20 && !achievedMilestones.includes('long_term')) {
          setAchievedMilestones([...achievedMilestones, 'long_term']);
        }

        if (principal >= 10000 && !achievedMilestones.includes('big_number')) {
          setAchievedMilestones([...achievedMilestones, 'big_number']);
        }
        break;
      }
    }
  };

  const fillExample = (scenario: typeof exampleScenarios[0]) => {
    setFormData({
      ...formData,
      principal: scenario.principal,
      rate: scenario.rate
    });
  };

  const modes = [
    { id: 'yearsToDouble' as const, label: 'Years to Double', icon: Clock, color: 'blue' },
    { id: 'requiredRate' as const, label: 'Required Rate', icon: TrendingUp, color: 'green' },
    { id: 'comparison' as const, label: 'Compare', icon: BarChart3, color: 'purple' },
    { id: 'projection' as const, label: 'Watch It Grow!', icon: Sparkles, color: 'pink' }
  ];

  const achievements = [
    { id: 'first_calc', name: 'First Calculation', icon: '⭐' },
    { id: 'compare_3', name: 'Compared Scenarios', icon: '🏆' },
    { id: 'big_number', name: 'Big Money!', icon: '💰' },
    { id: 'long_term', name: 'Long-term Thinker', icon: '🔭' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Calculator size={32} />
              Rule of 72 Calculator
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="mt-2 text-green-50">
            Learn how fast your money can double with the magic of compound interest!
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Achievements */}
          {achievedMilestones.length > 0 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4">
              <h4 className="font-bold text-purple-900 mb-2">🎉 Your Achievements</h4>
              <div className="flex gap-2 flex-wrap">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`px-3 py-2 rounded-full text-sm font-semibold ${
                      achievedMilestones.includes(achievement.id)
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {achievement.icon} {achievement.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mode Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modes.map(mode => {
              const Icon = mode.icon;
              const isActive = formData.mode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => {
                    setFormData({ ...formData, mode: mode.id });
                    setResults(null);
                    setError(null);
                  }}
                  className={`p-4 rounded-xl font-bold transition-all transform ${
                    isActive
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white scale-105 shadow-lg'
                      : 'bg-white text-slate-700 border-2 border-slate-300 hover:scale-102 hover:border-green-400'
                  }`}
                >
                  <Icon size={24} className="mx-auto mb-2" />
                  <span className="text-sm">{mode.label}</span>
                </button>
              );
            })}
          </div>

          {/* Educational Tip */}
          {showEducationalTip && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Lightbulb className="text-yellow-600 flex-shrink-0" size={32} />
                <div className="flex-1">
                  <h4 className="text-lg font-black text-amber-900 mb-2">
                    💡 How It Works!
                  </h4>
                  <p className="text-amber-800 mb-3">
                    {educationalContent[formData.mode].tip}
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-yellow-300">
                    <p className="text-sm font-mono text-slate-700">
                      <strong>Example:</strong> {educationalContent[formData.mode].example}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEducationalTip(false)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Example Scenarios */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl p-4">
            <h4 className="font-bold text-blue-900 mb-3">🎯 Try an Example!</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {exampleScenarios.map((scenario, idx) => {
                const Icon = scenario.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => fillExample(scenario)}
                    className="p-3 bg-white rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <Icon size={20} className="text-blue-600 mb-1" />
                    <p className="font-semibold text-sm text-slate-800">{scenario.name}</p>
                    <p className="text-xs text-slate-600">
                      ${scenario.principal} @ {scenario.rate}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Forms - Different for each mode */}
          <div className="bg-slate-50 rounded-xl p-6 border-2 border-slate-200">
            {/* Mode 1: Years to Double */}
            {formData.mode === 'yearsToDouble' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Starting Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Interest Rate (%)
                  </label>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <input
                      type="number"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                      className="px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="8"
                      min="0.1"
                      max="100"
                      step="0.1"
                    />
                    <div className="col-span-2">
                      <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                        className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>0.1%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Required Rate */}
            {formData.mode === 'requiredRate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Starting Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Target Years to Double
                  </label>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <input
                      type="number"
                      value={formData.years}
                      onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                      className="px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="9"
                      min="1"
                      max="100"
                      step="1"
                    />
                    <div className="col-span-2">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={formData.years}
                        onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                        className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1 year</span>
                        <span>30 years</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Scenario Comparison */}
            {formData.mode === 'comparison' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Starting Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Interest Rates to Compare (%)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {formData.comparisonRates.map((rate, idx) => (
                      <input
                        key={idx}
                        type="number"
                        value={rate}
                        onChange={(e) => {
                          const newRates = [...formData.comparisonRates];
                          newRates[idx] = Number(e.target.value);
                          setFormData({ ...formData, comparisonRates: newRates });
                        }}
                        className="px-3 py-2 text-center border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 4: Investment Growth Projection */}
            {formData.mode === 'projection' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Starting Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.principal}
                    onChange={(e) => setFormData({ ...formData, principal: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Interest Rate (%)
                  </label>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <input
                      type="number"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                      className="px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="8"
                      min="0.1"
                      max="100"
                      step="0.1"
                    />
                    <div className="col-span-2">
                      <input
                        type="range"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={formData.rate}
                        onChange={(e) => setFormData({ ...formData, rate: Number(e.target.value) })}
                        className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>0.1%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Number of Years
                  </label>
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <input
                      type="number"
                      value={formData.years}
                      onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                      className="px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="9"
                      min="1"
                      max="100"
                      step="1"
                    />
                    <div className="col-span-2">
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={formData.years}
                        onChange={(e) => setFormData({ ...formData, years: Number(e.target.value) })}
                        className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>1 year</span>
                        <span>50 years</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Monthly Contribution ($) - Optional
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => setFormData({ ...formData, monthlyContribution: Number(e.target.value) })}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Calculator size={24} />
              Calculate!
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {results?.yearsToDouble && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 space-y-4">
              <h3 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                🎉 Your Money Will Double!
              </h3>

              <div className="bg-white rounded-xl p-6 border-2 border-green-400">
                <p className="text-sm text-slate-600 mb-2">Time to Double</p>
                <p className="text-6xl font-black text-green-600 mb-2">
                  {results.yearsToDouble.ruleOf72Years.toFixed(1)}
                </p>
                <p className="text-2xl font-bold text-slate-700">years</p>

                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-lg text-slate-700">
                    <strong>{formatCurrency(formData.principal)}</strong> becomes{' '}
                    <strong className="text-green-600">{formatCurrency(results.yearsToDouble.futureValue)}</strong>
                  </p>
                </div>
              </div>

              <div className="text-center text-2xl">
                {getEmojiFeedback(results.yearsToDouble.ruleOf72Years)}
              </div>

              <GrowthVisualizationChart
                projections={generateProjection(formData.principal, formData.rate, Math.ceil(results.yearsToDouble.ruleOf72Years))}
                principal={formData.principal}
              />

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Fun Fact:</strong> The exact time is {results.yearsToDouble.exactYears.toFixed(2)} years.
                  The Rule of 72 is {Math.abs(results.yearsToDouble.accuracy).toFixed(1)}% off - pretty close!
                </p>
              </div>
            </div>
          )}

          {results?.requiredRate && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 space-y-4">
              <h3 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                🎯 Interest Rate Needed
              </h3>

              <div className="bg-white rounded-xl p-6 border-2 border-green-400">
                <p className="text-sm text-slate-600 mb-2">Required Interest Rate</p>
                <p className="text-6xl font-black text-green-600 mb-2">
                  {results.requiredRate.requiredRate.toFixed(1)}%
                </p>

                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-lg text-slate-700">
                    To double <strong>{formatCurrency(formData.principal)}</strong> in{' '}
                    <strong>{formData.years} years</strong>, you need this interest rate!
                  </p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <p className="text-purple-800 font-semibold">
                  📊 What does this mean?
                </p>
                <p className="text-purple-700 mt-1">
                  {results.requiredRate.context}
                </p>
              </div>

              <GrowthVisualizationChart
                projections={generateProjection(formData.principal, results.requiredRate.requiredRate, formData.years)}
                principal={formData.principal}
              />
            </div>
          )}

          {results?.scenarios && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 space-y-4">
              <h3 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                📊 Scenario Comparison
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg overflow-hidden">
                  <thead className="bg-green-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Interest Rate</th>
                      <th className="px-4 py-3 text-left">Years to Double</th>
                      <th className="px-4 py-3 text-left">Speed</th>
                      <th className="px-4 py-3 text-left">Future Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.scenarios.map((scenario, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-green-50">
                        <td className="px-4 py-3 font-bold">{scenario.rate}%</td>
                        <td className="px-4 py-3">{scenario.yearsToDouble.toFixed(1)} years</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            scenario.speedRating === 'fast' ? 'bg-green-200 text-green-800' :
                            scenario.speedRating === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-orange-200 text-orange-800'
                          }`}>
                            {scenario.speedRating === 'fast' ? '🚀 Fast' :
                             scenario.speedRating === 'medium' ? '⭐ Medium' :
                             '🐢 Slow'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{formatCurrency(formData.principal * 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> Notice how higher interest rates double your money much faster!
                  At {Math.max(...formData.comparisonRates)}%, your money doubles{' '}
                  {(yearsToDouble(Math.min(...formData.comparisonRates)) / yearsToDouble(Math.max(...formData.comparisonRates))).toFixed(1)}x
                  faster than at {Math.min(...formData.comparisonRates)}%!
                </p>
              </div>
            </div>
          )}

          {results?.projection && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 space-y-4">
              <h3 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                🌱 Watch Your Money Grow!
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border-2 border-green-400">
                  <p className="text-sm text-slate-600">Final Value</p>
                  <p className="text-3xl font-black text-green-600">
                    {formatLargeNumber(results.projection.finalValue)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-blue-400">
                  <p className="text-sm text-slate-600">Total Return</p>
                  <p className="text-3xl font-black text-blue-600">
                    {results.projection.totalReturn.toFixed(0)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-purple-400">
                  <p className="text-sm text-slate-600">Times Doubled</p>
                  <p className="text-3xl font-black text-purple-600">
                    {results.projection.doublingEvents.length}x
                  </p>
                </div>
              </div>

              {results.projection.doublingEvents.length > 0 && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <p className="text-purple-800 font-semibold mb-2">
                    ⭐ Doubling Milestones:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {results.projection.doublingEvents.map((event, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm font-semibold">
                        Year {event.year}: {formatLargeNumber(event.value)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <GrowthVisualizationChart
                projections={results.projection.projections}
                principal={formData.principal}
              />

              <div className="overflow-x-auto max-h-96">
                <table className="w-full bg-white rounded-lg overflow-hidden text-sm">
                  <thead className="bg-green-600 text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Year</th>
                      <th className="px-3 py-2 text-right">Value</th>
                      <th className="px-3 py-2 text-right">Growth</th>
                      {formData.monthlyContribution > 0 && (
                        <>
                          <th className="px-3 py-2 text-right">Contributed</th>
                          <th className="px-3 py-2 text-right">Interest</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {results.projection.projections.map((proj) => (
                      <tr
                        key={proj.year}
                        className={`border-b border-slate-200 hover:bg-green-50 ${
                          proj.isDoublingYear ? 'bg-yellow-50 font-bold' : ''
                        }`}
                      >
                        <td className="px-3 py-2">
                          {proj.isDoublingYear ? '⭐ ' : ''}Year {proj.year}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">
                          {formatCurrency(proj.value)}
                        </td>
                        <td className="px-3 py-2 text-right text-green-600">
                          +{formatCurrency(proj.growth)}
                        </td>
                        {formData.monthlyContribution > 0 && (
                          <>
                            <td className="px-3 py-2 text-right text-blue-600">
                              {formatCurrency(proj.totalContributions)}
                            </td>
                            <td className="px-3 py-2 text-right text-purple-600">
                              {formatCurrency(proj.interestEarned)}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!showEducationalTip && (
            <button
              onClick={() => setShowEducationalTip(true)}
              className="text-yellow-600 hover:text-yellow-800 font-semibold flex items-center gap-2"
            >
              <Lightbulb size={20} />
              Show Tip Again
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
