// ============================================
// FILE: src/Components/YTDPerformanceModal/YTDPerformanceModal.tsx
// Main YTD Performance Modal Component
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, BarChart3, PieChart, Layers, Filter } from 'lucide-react';
import type { TickerLot } from '../../types';
import { useYTDData } from '../../hooks/useYTDData';
import YTDLineChart from './YTDLineChart';
import YTDBarChart from './YTDBarChart';
import YTDAllocationPieChart from './YTDAllocationPieChart';
import YTDStackedAreaChart from './YTDStackedAreaChart';

type ChartTab = 'line' | 'bar' | 'pie' | 'area';

interface YTDPerformanceModalProps {
  lots: TickerLot[];
  selectedPortfolios: string[];
  currentPrices: { [ticker: string]: number };
  onClose: () => void;
  onTickerClick?: (ticker: string) => void;
}

export default function YTDPerformanceModal({
  lots,
  selectedPortfolios: initialSelectedPortfolios,
  currentPrices,
  onClose,
  onTickerClick
}: YTDPerformanceModalProps) {
  const [activeChart, setActiveChart] = useState<ChartTab>('line');
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>(initialSelectedPortfolios);
  const [showPortfolioSelector, setShowPortfolioSelector] = useState(true);

  // Get unique portfolios from all lots
  const availablePortfolios = useMemo(() => {
    const portfolioSet = new Set<string>();
    lots.forEach(lot => {
      lot.portfolios.forEach(p => portfolioSet.add(p));
    });
    return Array.from(portfolioSet).sort();
  }, [lots]);

  // Initialize selected portfolios if empty (means "All")
  useEffect(() => {
    if (selectedPortfolios.length === 0 && availablePortfolios.length > 0) {
      setSelectedPortfolios(availablePortfolios);
    }
  }, [availablePortfolios]);

  // Fetch YTD data using custom hook with locally selected portfolios
  const { ytdData, loading, error } = useYTDData({
    lots,
    selectedPortfolios,
    currentPrices,
    enabled: true
  });

  const handlePortfolioToggle = (portfolio: string) => {
    setSelectedPortfolios(prev => {
      if (prev.includes(portfolio)) {
        // Don't allow deselecting all
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== portfolio);
      } else {
        return [...prev, portfolio];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedPortfolios(availablePortfolios);
  };

  const handleDeselectAll = () => {
    // Keep at least one selected
    if (availablePortfolios.length > 0) {
      setSelectedPortfolios([availablePortfolios[0]]);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Chart tabs
  const chartTabs: { id: ChartTab; label: string; icon: any }[] = [
    { id: 'line', label: 'Portfolio Growth', icon: TrendingUp },
    { id: 'bar', label: 'Top Performers', icon: BarChart3 },
    { id: 'pie', label: 'Allocation', icon: PieChart },
    { id: 'area', label: 'Breakdown', icon: Layers }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp size={28} />
                Year-to-Date Performance 2025
              </h2>
              <p className="text-emerald-100 text-sm mt-2">
                Track your portfolio growth from January 1 to today
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

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Portfolio Selector */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-600" />
                <h3 className="font-bold text-slate-800">Portfolio Filter</h3>
              </div>
              <button
                onClick={() => setShowPortfolioSelector(!showPortfolioSelector)}
                className="text-sm text-emerald-600 font-semibold hover:text-emerald-700"
              >
                {showPortfolioSelector ? 'Hide' : 'Show'} Selector
              </button>
            </div>

            <div className="text-sm text-slate-600">
              <strong>Selected:</strong> {selectedPortfolios.length === availablePortfolios.length
                ? 'All Portfolios'
                : selectedPortfolios.join(', ')}
              {' '}({selectedPortfolios.length} of {availablePortfolios.length})
            </div>

            {showPortfolioSelector && (
              <div className="mt-4 space-y-3">
                {/* Select All / Deselect All */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-all"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-all"
                  >
                    Deselect All
                  </button>
                </div>

                {/* Portfolio Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {availablePortfolios.map(portfolio => (
                    <label
                      key={portfolio}
                      className="flex items-center gap-2 p-2 bg-white border-2 border-slate-200 rounded-lg hover:border-emerald-400 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPortfolios.includes(portfolio)}
                        onChange={() => handlePortfolioToggle(portfolio)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm font-semibold text-slate-700">{portfolio}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-semibold">Calculating YTD performance...</p>
                <p className="text-sm text-slate-500 mt-2">Fetching historical prices and analyzing your portfolio</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
              <p className="text-red-600 font-semibold">Error calculating performance</p>
              <p className="text-sm text-red-600 mt-1">{error.message}</p>
            </div>
          )}

          {/* Stats Cards */}
          {ytdData && !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total YTD Gain ($) */}
                <div className={`p-4 rounded-lg border-2 ${
                  ytdData.totalYTDGainDollar >= 0
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <p className="text-sm font-semibold text-slate-600">Total YTD Gain</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    ytdData.totalYTDGainDollar >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(ytdData.totalYTDGainDollar)}
                  </p>
                </div>

                {/* Total YTD Gain (%) */}
                <div className={`p-4 rounded-lg border-2 ${
                  ytdData.totalYTDGainPercent >= 0
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <p className="text-sm font-semibold text-slate-600">YTD Return</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    ytdData.totalYTDGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(ytdData.totalYTDGainPercent)}
                  </p>
                </div>

                {/* Current Portfolio Value */}
                <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600">Current Value</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(ytdData.totalCurrentValue)}
                  </p>
                </div>

                {/* Jan 1 Starting Value */}
                <div className="bg-slate-100 border-2 border-slate-300 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600">Jan 1 Value</p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">
                    {formatCurrency(ytdData.totalBaselineValue)}
                  </p>
                </div>
              </div>

              {/* Chart Tabs */}
              <div className="border-b-2 border-slate-200">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {chartTabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveChart(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-semibold whitespace-nowrap transition-all ${
                          activeChart === tab.id
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Icon size={18} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart Display */}
              <div className="mt-6">
                {activeChart === 'line' && <YTDLineChart ytdData={ytdData} />}
                {activeChart === 'bar' && (
                  <YTDBarChart ytdData={ytdData} onTickerClick={onTickerClick} />
                )}
                {activeChart === 'pie' && (
                  <YTDAllocationPieChart ytdData={ytdData} onTickerClick={onTickerClick} />
                )}
                {activeChart === 'area' && <YTDStackedAreaChart ytdData={ytdData} />}
              </div>

              {/* Data Quality Warnings */}
              {ytdData.tickers.some(t => t.hasWarning) && (
                <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">Data Quality Notes:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {ytdData.tickers
                      .filter(t => t.hasWarning)
                      .map(t => (
                        <li key={t.ticker}>
                          • {t.ticker}: {t.warningMessage}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Summary Info */}
              <div className="bg-slate-100 rounded-lg p-4">
                <p className="text-sm text-slate-600">
                  <strong>Date Range:</strong> {ytdData.startDate} to {ytdData.endDate}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Tickers Analyzed:</strong> {ytdData.tickers.length} (dividend lots excluded)
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Portfolios:</strong> {selectedPortfolios.length === availablePortfolios.length
                    ? 'All portfolios'
                    : selectedPortfolios.join(', ')}
                </p>
              </div>
            </>
          )}

          {/* No Data State */}
          {ytdData && ytdData.tickers.length === 0 && !loading && (
            <div className="bg-slate-100 p-8 rounded-lg text-center">
              <p className="text-slate-600 font-semibold">No YTD data available</p>
              <p className="text-sm text-slate-500 mt-2">
                No non-dividend lots found for the selected portfolios.
                Try selecting different portfolios or adding stock positions.
              </p>
            </div>
          )}
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
