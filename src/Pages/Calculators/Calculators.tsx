import { useState, useEffect } from 'react';
import { Calculator, Sparkles } from 'lucide-react';
import PEGrowthCalculatorModal from '../../Components/PEGrowthCalculatorModal/PEGrowthCalculatorModal';
import RuleOf72CalculatorModal from '../../Components/RuleOf72CalculatorModal/RuleOf72CalculatorModal';

function Calculators() {
  const [showPEGrowthModal, setShowPEGrowthModal] = useState(false);
  const [showRuleOf72Modal, setShowRuleOf72Modal] = useState(false);

  useEffect(() => {
    document.title = "Calculators";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Header Section */}
      <header className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-purple-700 flex items-center gap-3">
          <Calculator size={32} />
          Investment Calculators
        </h1>
        <p className="text-slate-600 mt-2">
          Financial tools to help you analyze investments and make informed decisions
        </p>
      </header>

      {/* Calculator Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">

        {/* P/E Growth Calculator Card */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-transparent hover:border-purple-500">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Calculator className="text-purple-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">P/E Growth Calculator</h3>
              <span className="text-xs text-purple-600 font-semibold">VALUATION TOOL</span>
            </div>
          </div>

          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            Calculate future P/E ratios based on earnings growth, or determine how long
            it takes to reach a target P/E. Includes stock price projections.
          </p>

          <ul className="text-xs text-slate-500 mb-6 space-y-1">
            <li>• Auto-fetch current P/E ratio</li>
            <li>• Two calculation modes</li>
            <li>• Price projection estimates</li>
            <li>• No data storage needed</li>
          </ul>

          <button
            onClick={() => setShowPEGrowthModal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white
                       rounded-lg font-bold hover:from-purple-700 hover:to-pink-700
                       transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Calculator size={20} />
            Launch Calculator
          </button>
        </div>

        {/* Rule of 72 Calculator Card */}
        <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border-2 border-transparent hover:border-green-500">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Sparkles className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Rule of 72 Calculator</h3>
              <span className="text-xs text-green-600 font-semibold">LEARNING TOOL</span>
            </div>
          </div>

          <p className="text-slate-600 mb-4 text-sm leading-relaxed">
            Learn how fast your money can double! Discover the magic of compound interest
            with fun, interactive calculations and colorful charts.
          </p>

          <ul className="text-xs text-slate-500 mb-6 space-y-1">
            <li>• Calculate years to double your money</li>
            <li>• Find the interest rate you need</li>
            <li>• Compare different scenarios</li>
            <li>• Watch your investment grow over time</li>
          </ul>

          <button
            onClick={() => setShowRuleOf72Modal(true)}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white
                       rounded-lg font-bold hover:from-green-700 hover:to-emerald-700
                       transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Sparkles size={20} />
            Start Learning!
          </button>
        </div>

        {/* Placeholder for Future Calculators */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-lg p-6
                        border-2 border-dashed border-slate-400 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <Calculator size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-semibold">More calculators coming soon!</p>
            <p className="text-xs mt-1">Dividend yield, ROI, compound growth, etc.</p>
          </div>
        </div>

      </div>

      {/* Modals */}
      {showPEGrowthModal && (
        <PEGrowthCalculatorModal onClose={() => setShowPEGrowthModal(false)} />
      )}

      {showRuleOf72Modal && (
        <RuleOf72CalculatorModal onClose={() => setShowRuleOf72Modal(false)} />
      )}
    </div>
  );
}

export default Calculators;
