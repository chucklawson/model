// ============================================
// FILE: src/Components/CustomRangePerformanceModal/CustomRangePerformanceModal.tsx
// Main Custom Date Range Performance Modal Component
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, BarChart3, PieChart, Layers, Filter, Calendar } from 'lucide-react';
import type { TickerLot } from '../../types';
import { useCustomRangeData } from '../../hooks/useCustomRangeData';
import { formatDate } from '../../utils/dateRangeCalculations';
import CustomRangeLineChart from './CustomRangeLineChart';
import CustomRangeBarChart from './CustomRangeBarChart';
import CustomRangePieChart from './CustomRangePieChart';
import CustomRangeStackedAreaChart from './CustomRangeStackedAreaChart';

type ChartTab = 'line' | 'bar' | 'pie' | 'area';

interface CustomRangePerformanceModalProps {
  lots: TickerLot[];
  selectedPortfolios: string[];
  currentPrices: { [ticker: string]: number };
  onClose: () => void;
  onTickerClick?: (ticker: string) => void;
}

export default function CustomRangePerformanceModal({
  lots,
  selectedPortfolios: initialSelectedPortfolios,
  currentPrices,
  onClose,
  onTickerClick
}: CustomRangePerformanceModalProps) {
  // Helper function to get default date range (1 year ago to today)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      start: formatDate(start),
      end: formatDate(end)
    };
  };

  const defaultDates = getDefaultDateRange();
  const [startDate, setStartDate] = useState<string>(defaultDates.start);
  const [endDate, setEndDate] = useState<string>(defaultDates.end);

  // Preset date range handlers
  const applyPreset = (preset: 'ytd' | '1m' | '3m' | '6m' | '9m' | '1y' | 'max') => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
      case 'ytd':
        start.setMonth(0, 1); // January 1st of current year
        break;
      case '1m':
        start.setMonth(end.getMonth() - 1);
        break;
      case '3m':
        start.setMonth(end.getMonth() - 3);
        break;
      case '6m':
        start.setMonth(end.getMonth() - 6);
        break;
      case '9m':
        start.setMonth(end.getMonth() - 9);
        break;
      case '1y':
        start.setFullYear(end.getFullYear() - 1);
        break;
      case 'max': {
        // Find the earliest purchase date from all lots
        const earliestDate = lots.reduce((earliest, lot) => {
          const lotDate = new Date(lot.purchaseDate);
          return !earliest || lotDate < earliest ? lotDate : earliest;
        }, null as Date | null);
        if (earliestDate) {
          setStartDate(formatDate(earliestDate));
          setEndDate(formatDate(end));
          return;
        }
        // Fallback to 5 years ago if no lots
        start.setFullYear(end.getFullYear() - 5);
        break;
      }
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };
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

  // Fetch custom range data using custom hook
  const { customRangeData, loading, error, refetch } = useCustomRangeData({
    lots,
    selectedPortfolios,
    currentPrices,
    startDate,
    endDate,
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

  // Calculate days between dates
  const daysBetween = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [startDate, endDate]);

  // Validate date range
  const dateRangeValidation = useMemo(() => {
    if (!startDate || !endDate) {
      return { isValid: false, message: 'Please select both start and end dates' };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (start > end) {
      return { isValid: false, message: 'Start date must be before or equal to end date' };
    }
    if (end > today) {
      return { isValid: false, message: 'End date cannot be in the future' };
    }
    return { isValid: true, message: '' };
  }, [startDate, endDate]);

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
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <TrendingUp size={28} />
                Performance Analytics
              </h2>
              <p className="text-blue-100 text-sm mt-2">
                Analyze your portfolio performance for any time period
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
          {/* Date Range Selector */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar size={18} />
              Date Range Selection
            </h3>

            {/* Preset Buttons */}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => applyPreset('ytd')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
              >
                Year to Date
              </button>
              <button
                onClick={() => applyPreset('1m')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                1 Month
              </button>
              <button
                onClick={() => applyPreset('3m')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                3 Months
              </button>
              <button
                onClick={() => applyPreset('6m')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                6 Months
              </button>
              <button
                onClick={() => applyPreset('9m')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                9 Months
              </button>
              <button
                onClick={() => applyPreset('1y')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                1 Year
              </button>
              <button
                onClick={() => applyPreset('max')}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all"
              >
                All Time
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  max={formatDate(new Date())}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                {dateRangeValidation.isValid ? (
                  <p className="text-sm text-slate-600">
                    Showing {daysBetween} days of performance data
                  </p>
                ) : (
                  <p className="text-sm text-red-600 font-semibold">
                    ⚠️ {dateRangeValidation.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (dateRangeValidation.isValid && refetch) {
                    refetch();
                  }
                }}
                disabled={!dateRangeValidation.isValid || loading}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  dateRangeValidation.isValid && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Calculating...' : 'Recalculate'}
              </button>
            </div>
          </div>

          {/* Portfolio Selector */}
          <div className="bg-slate-50 border-2 border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-600" />
                <h3 className="font-bold text-slate-800">Portfolio Filter</h3>
              </div>
              <button
                onClick={() => setShowPortfolioSelector(!showPortfolioSelector)}
                className="text-sm text-blue-600 font-semibold hover:text-blue-700"
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
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
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
                      className="flex items-center gap-2 p-2 bg-white border-2 border-slate-200 rounded-lg hover:border-blue-400 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPortfolios.includes(portfolio)}
                        onChange={() => handlePortfolioToggle(portfolio)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-semibold">Calculating performance...</p>
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
          {customRangeData && !loading && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Current Portfolio Value */}
                <div className="bg-emerald-50 border-2 border-emerald-500 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600">Current Portfolio Value</p>
                  <p className="text-xs text-slate-500 mt-0.5">Market value today</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(customRangeData.totalCurrentValue)}
                  </p>
                </div>

                {/* Cost Basis */}
                <div className="bg-slate-100 border-2 border-slate-400 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600">Cost Basis</p>
                  <p className="text-xs text-slate-500 mt-0.5">What you originally paid</p>
                  <p className="text-2xl font-bold text-slate-700 mt-1">
                    {formatCurrency(customRangeData.totalCostBasis)}
                  </p>
                </div>

                {/* Range Start Value */}
                <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-slate-600">Range Start Value</p>
                  <p className="text-xs text-slate-500 mt-0.5">Start date value + new purchases</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {formatCurrency(customRangeData.totalBaselineValue)}
                  </p>
                </div>

                {/* All-Time Gain ($) */}
                <div className={`p-4 rounded-lg border-2 ${
                  customRangeData.totalAllTimeGainDollar >= 0
                    ? 'bg-purple-50 border-purple-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <p className="text-sm font-semibold text-slate-600">All-Time Gain</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total gain from cost basis</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    customRangeData.totalAllTimeGainDollar >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(customRangeData.totalAllTimeGainDollar)}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${
                    customRangeData.totalAllTimeGainPercent >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {formatPercent(customRangeData.totalAllTimeGainPercent)}
                  </p>
                </div>

                {/* Range Gain ($) */}
                <div className={`p-4 rounded-lg border-2 ${
                  customRangeData.totalRangeGainDollar >= 0
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}>
                  <p className="text-sm font-semibold text-slate-600">Range Gain</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dollar change from baseline</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    customRangeData.totalRangeGainDollar >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(customRangeData.totalRangeGainDollar)}
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${
                    customRangeData.totalRangeGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(customRangeData.totalRangeGainPercent)}
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
                            ? 'bg-blue-600 text-white shadow-lg'
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
                {activeChart === 'line' && <CustomRangeLineChart customRangeData={customRangeData} />}
                {activeChart === 'bar' && (
                  <CustomRangeBarChart customRangeData={customRangeData} onTickerClick={onTickerClick} />
                )}
                {activeChart === 'pie' && (
                  <CustomRangePieChart customRangeData={customRangeData} onTickerClick={onTickerClick} />
                )}
                {activeChart === 'area' && <CustomRangeStackedAreaChart customRangeData={customRangeData} />}
              </div>

              {/* Data Quality Warnings */}
              {customRangeData.tickers.some(t => t.hasWarning) && (
                <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                  <p className="text-yellow-800 font-semibold mb-2">Data Quality Notes:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {customRangeData.tickers
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
                  <strong>Date Range:</strong> {customRangeData.startDate} to {customRangeData.endDate}
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  <strong>Tickers Analyzed:</strong> {customRangeData.tickers.length} (dividend lots excluded)
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
          {customRangeData && customRangeData.tickers.length === 0 && !loading && (
            <div className="bg-slate-100 p-8 rounded-lg text-center">
              <p className="text-slate-600 font-semibold">No data available</p>
              <p className="text-sm text-slate-500 mt-2">
                No non-dividend lots found for the selected portfolios and date range.
                Try selecting different portfolios or adjusting the date range.
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
