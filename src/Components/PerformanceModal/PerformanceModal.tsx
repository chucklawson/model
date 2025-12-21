// ============================================
// FILE: src/Components/PerformanceModal/PerformanceModal.tsx
// Performance Analytics Launcher Modal
// ============================================

import { useState } from 'react';
import { X, TrendingUp, BarChart3 } from 'lucide-react';
import type { TickerLot } from '../../types';
import YTDPerformanceModal from '../YTDPerformanceModal/YTDPerformanceModal';

type PerformanceTab = 'ytd' | null;

interface PerformanceModalProps {
  lots: TickerLot[];
  selectedPortfolios: string[];
  currentPrices: { [ticker: string]: number };
  onClose: () => void;
  onTickerClick?: (ticker: string) => void;
}

export default function PerformanceModal({
  lots,
  selectedPortfolios,
  currentPrices,
  onClose,
  onTickerClick
}: PerformanceModalProps) {
  const [activeTab, setActiveTab] = useState<PerformanceTab>(null);

  // If a specific performance view is active, render it
  if (activeTab === 'ytd') {
    return (
      <YTDPerformanceModal
        lots={lots}
        selectedPortfolios={selectedPortfolios}
        currentPrices={currentPrices}
        onClose={() => setActiveTab(null)}
        onTickerClick={onTickerClick}
      />
    );
  }

  // Main performance launcher modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <BarChart3 size={28} />
                Performance Analytics
              </h2>
              <p className="text-purple-100 text-sm mt-2">
                Analyze your portfolio performance with advanced metrics and visualizations
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body - Performance Options */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* YTD Performance Card */}
            <button
              onClick={() => setActiveTab('ytd')}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-6 text-left hover:shadow-lg hover:border-emerald-500 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="bg-emerald-500 p-3 rounded-lg group-hover:bg-emerald-600 transition-all">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Year-to-Date Performance
                  </h3>
                  <p className="text-sm text-slate-600">
                    Track portfolio growth from January 1 to today with interactive charts showing line growth, top performers, allocation, and ticker breakdown.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                    <span>View Analysis</span>
                    <TrendingUp size={16} />
                  </div>
                </div>
              </div>
            </button>

            {/* Placeholder for future performance features */}
            <div className="bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl p-6 text-left opacity-60">
              <div className="flex items-start gap-4">
                <div className="bg-slate-300 p-3 rounded-lg">
                  <BarChart3 size={24} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-600 mb-2">
                    More Coming Soon
                  </h3>
                  <p className="text-sm text-slate-500">
                    Additional performance analytics and metrics will be available here.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Portfolio Filter:</strong> {selectedPortfolios.length === 0
                ? 'Showing all portfolios'
                : `Filtered to ${selectedPortfolios.join(', ')}`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
