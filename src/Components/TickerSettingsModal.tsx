import { useState, useEffect } from 'react';
import { Settings, X, Save } from 'lucide-react';
import type { Ticker } from '../types';

interface TickerSettingsModalProps {
  ticker: string;
  tickerData: Ticker | undefined;
  onClose: () => void;
  onSave: (updatedTicker: Ticker) => Promise<void>;
}

export default function TickerSettingsModal({
  ticker,
  tickerData,
  onClose,
  onSave,
}: TickerSettingsModalProps) {
  const [tickerSettings, setTickerSettings] = useState({
    companyName: tickerData?.companyName ?? '',
    baseYield: tickerData?.baseYield ?? 0,
    expectedFiveYearGrowth: tickerData?.expectedFiveYearGrowth ?? 0,
  });

  const [saving, setSaving] = useState(false);

  // Update settings when tickerData changes
  useEffect(() => {
    setTickerSettings({
      companyName: tickerData?.companyName ?? '',
      baseYield: tickerData?.baseYield ?? 0,
      expectedFiveYearGrowth: tickerData?.expectedFiveYearGrowth ?? 0,
    });
  }, [tickerData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedTicker: Ticker = {
        id: '',
        symbol: ticker,
        companyName: tickerSettings.companyName,
        baseYield: tickerSettings.baseYield,
        expectedFiveYearGrowth: tickerSettings.expectedFiveYearGrowth,
      };

      await onSave(updatedTicker);
      alert(`Updated ticker settings for ${ticker}`);
      onClose();
    } catch (err) {
      console.error('Error updating ticker settings:', err);
      alert('Failed to update ticker settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Settings size={28} />
              Ticker Settings: {ticker}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-orange-100 text-sm mt-2">
            Configure settings that apply to all lots of this ticker
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Input Fields */}
          <div className="grid grid-cols-3 gap-4">
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

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Expected 5-Year Growth
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tickerSettings.expectedFiveYearGrowth}
                  onChange={(e) => setTickerSettings({
                    ...tickerSettings,
                    expectedFiveYearGrowth: parseFloat(e.target.value) || 0
                  })}
                  className="w-full pr-8 pl-4 py-3 border-2 border-slate-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  placeholder="8.50"
                />
                <span className="absolute right-4 top-3 text-slate-500 text-lg font-bold">%</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> These settings apply to all lots for ticker <strong>{ticker}</strong> across all portfolios.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-all font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg hover:from-orange-700 hover:to-amber-700 transition-all font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
