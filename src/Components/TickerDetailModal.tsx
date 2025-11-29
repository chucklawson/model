// ============================================
// FILE: src/components/TickerDetailModal.tsx
// ============================================
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Save,
  TrendingUp,
  Trash2,
  DollarSign,
  Package,
  BarChart3,
  Settings
} from 'lucide-react';
import type { TickerLot, LotFormData, Portfolio, Ticker } from '../types';
import { getLotsForTicker } from '../utils/tickerCalculations';
import TickerLotSpreadsheet from './TickerLotSpreadsheet';

interface Props {
  ticker: string;
  allLots: TickerLot[];
  portfolios: Portfolio[];
  tickers: Ticker[];
  onClose: () => void;
  onSaveLot: (lotData: LotFormData, lotId?: string) => Promise<void>;
  onDeleteLot: (id: string) => Promise<void>;
  onDeleteSelected: (ids: string[]) => Promise<void>;
  onUpdateTicker: (ticker: Ticker) => Promise<void>;
}

export default function TickerDetailModal({
                                            ticker,
                                            allLots,
                                            portfolios,
                                            tickers,
                                            onClose,
                                            onSaveLot,
                                            onDeleteLot,
                                            onDeleteSelected,
                                            onUpdateTicker,
                                          }: Props) {
  const [lots, setLots] = useState<TickerLot[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingLot, setEditingLot] = useState<TickerLot | null>(null);
  const [formData, setFormData] = useState<LotFormData>({
    ticker,
    shares: 0,
    costPerShare: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    portfolios: portfolios.length > 0 ? [portfolios[0].name] : [],
    calculateAccumulatedProfitLoss: true,
    notes: '',
  });

  // Ticker-level settings (applied to all lots of this ticker)
  const [tickerSettings, setTickerSettings] = useState({
    companyName: '',
    baseYield: 0,
  });

  useEffect(() => {
    const tickerLots = getLotsForTicker(allLots, ticker);
    setLots(tickerLots);

    // Initialize ticker settings from Ticker model
    const tickerData = tickers.find(t => t.symbol === ticker);
    if (tickerData) {
      setTickerSettings({
        companyName: tickerData.companyName ?? '',
        baseYield: tickerData.baseYield ?? 0,
      });
    } else {
      setTickerSettings({
        companyName: '',
        baseYield: 0,
      });
    }
  }, [allLots, ticker, tickers]);

  const totalShares = lots.reduce((sum, lot) => sum + lot.shares, 0);
  const totalCost = lots.reduce((sum, lot) => sum + lot.totalCost, 0);
  const avgCost = totalShares > 0 ? totalCost / totalShares : 0;

  const handleEdit = (lot: TickerLot) => {
    setEditingLot(lot);
    setFormData({
      ticker: lot.ticker,
      shares: lot.shares,
      costPerShare: lot.costPerShare,
      purchaseDate: lot.purchaseDate,
      portfolios: lot.portfolios,
      calculateAccumulatedProfitLoss: lot.calculateAccumulatedProfitLoss ?? true,
      notes: lot.notes || '',
    });
    setIsFormVisible(true);
  };

  const handleAddNew = () => {
    setEditingLot(null);
    setFormData({
      ticker,
      shares: 0,
      costPerShare: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      portfolios: portfolios.length > 0 ? [portfolios[0].name] : [],
      calculateAccumulatedProfitLoss: true,
      notes: '',
    });
    setIsFormVisible(true);
  };

  const handleSave = async () => {
    if (!formData.ticker || formData.shares <= 0 || formData.costPerShare <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    if (formData.portfolios.length === 0) {
      alert('Please select at least one portfolio');
      return;
    }

    await onSaveLot(formData, editingLot?.id);
    setIsFormVisible(false);
    setEditingLot(null);
  };

  const handleUpdateTickerSettings = async () => {
    try {
      const updatedTicker: Ticker = {
        id: '', // Will be set by handleUpdateTicker
        symbol: ticker,
        companyName: tickerSettings.companyName,
        baseYield: tickerSettings.baseYield,
      };

      await onUpdateTicker(updatedTicker);

      alert(`Updated ticker settings for ${ticker}`);
    } catch (err) {
      console.error('Error updating ticker settings:', err);
      alert('Failed to update ticker settings');
    }
  };

  const handleToggleRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedRows.size === lots.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(lots.map(l => l.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!confirm(`Delete ${selectedRows.size} selected lots?`)) return;

    await onDeleteSelected(Array.from(selectedRows));
    setSelectedRows(new Set());
  };

  const formTotalCost = formData.shares * formData.costPerShare;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp size={32} />
                {ticker} - Lot Details
              </h2>
              <p className="text-blue-100 mt-1">Manage all purchase lots for this ticker</p>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
            >
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold">Total Shares</p>
                <p className="text-2xl font-bold text-slate-800">{totalShares.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold">Total Investment</p>
                <p className="text-2xl font-bold text-green-600">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BarChart3 className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold">Avg Cost/Share</p>
                <p className="text-2xl font-bold text-purple-600">${avgCost.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md border-2 border-orange-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600 font-semibold">Total Lots</p>
                <p className="text-2xl font-bold text-orange-600">{lots.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker Settings */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 border-b border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="text-orange-600" size={24} />
            <h3 className="text-lg font-bold text-slate-800">Ticker Settings</h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={tickerSettings.companyName}
                onChange={(e) => setTickerSettings({
                  ...tickerSettings,
                  companyName: e.target.value
                })}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
                placeholder="Apple Inc."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Base Yield
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tickerSettings.baseYield}
                  onChange={(e) => setTickerSettings({
                    ...tickerSettings,
                    baseYield: parseFloat(e.target.value) || 0
                  })}
                  className="w-full pr-8 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="5.25"
                />
                <span className="absolute right-4 top-3 text-slate-500 text-lg font-bold">%</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={handleUpdateTickerSettings}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
            >
              <Save size={20} />
              Save Ticker Settings
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-3">
            These settings apply to {ticker} across all portfolios and lots.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-3">
              <button
                onClick={handleAddNew}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Plus size={20} />
                Add New Lot
              </button>

              {selectedRows.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg"
                >
                  <Trash2 size={20} />
                  Delete {selectedRows.size} Selected
                </button>
              )}
            </div>
          </div>

          {/* Form */}
          {isFormVisible && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 mb-6 shadow-lg">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Save size={24} className="text-blue-600" />
                {editingLot ? 'Edit Lot' : 'Add New Lot'}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Ticker Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.ticker}
                    disabled
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg bg-slate-100 text-slate-600 font-bold text-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Portfolios * (Select one or more)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {portfolios.map((portfolio) => {
                      const isChecked = formData.portfolios.includes(portfolio.name);

                      return (
                        <label
                          key={portfolio.id}
                          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newPortfolios = e.target.checked
                                ? [...formData.portfolios, portfolio.name]
                                : formData.portfolios.filter(p => p !== portfolio.name);
                              setFormData({ ...formData, portfolios: newPortfolios });
                            }}
                            className="w-5 h-5 text-blue-600 rounded"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-slate-800">{portfolio.name}</span>
                            {portfolio.description && (
                              <p className="text-xs text-slate-600">{portfolio.description}</p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {formData.portfolios.length > 0 && (
                    <p className="text-xs text-slate-600 mt-2">
                      Selected: {formData.portfolios.join(', ')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Number of Shares *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={formData.shares}
                    onChange={(e) => setFormData({ ...formData, shares: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Cost Per Share *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-500 text-lg font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.costPerShare}
                      onChange={(e) => setFormData({ ...formData, costPerShare: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="150.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Calculate Accumulated P/L *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="lotCalculateAccumulatedProfitLoss"
                      checked={formData.calculateAccumulatedProfitLoss === true}
                      onChange={() => setFormData({ ...formData, calculateAccumulatedProfitLoss: true })}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-semibold">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="lotCalculateAccumulatedProfitLoss"
                      checked={formData.calculateAccumulatedProfitLoss === false}
                      onChange={() => setFormData({ ...formData, calculateAccumulatedProfitLoss: false })}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 font-semibold">No</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                  rows={2}
                  placeholder="Additional notes about this lot..."
                />
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-green-300 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-700">Lot Total Cost:</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${isNaN(formTotalCost) ? '0.00' : formTotalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsFormVisible(false);
                    setEditingLot(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Save size={20} />
                  {editingLot ? 'Update Lot' : 'Save Lot'}
                </button>
              </div>
            </div>
          )}

          {/* Spreadsheet */}
          <TickerLotSpreadsheet
            lots={lots}
            onEdit={handleEdit}
            onDelete={onDeleteLot}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
            onToggleAll={handleToggleAll}
          />
        </div>
      </div>
    </div>
  );
}
