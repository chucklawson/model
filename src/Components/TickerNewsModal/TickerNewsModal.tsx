import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { useNewsData } from '../../hooks/useNewsData';
import type { NewsArticle } from '../../types/news';

interface TickerNewsModalProps {
  onClose: () => void;
  onFetchComplete: (articles: NewsArticle[]) => void;
  tickerList: string[];
}

export default function TickerNewsModal({ onClose, onFetchComplete, tickerList }: TickerNewsModalProps) {
  const [manualTicker, setManualTicker] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fetchEnabled, setFetchEnabled] = useState(false);

  // Use the custom hook for fetching news
  const { articles, loading, error } = useNewsData({
    symbol: selectedTicker || manualTicker,
    startDate,
    endDate,
    enabled: fetchEnabled
  });

  // When articles are successfully fetched, pass to parent and close
  useEffect(() => {
    if (articles.length > 0 && !loading && !error) {
      onFetchComplete(articles);
      onClose();
    }
  }, [articles, loading, error, onFetchComplete, onClose]);

  // Form validation
  const isFormValid = () => {
    const hasTickerSelection = manualTicker.trim() !== '' || selectedTicker !== '';
    const hasDates = startDate !== '' && endDate !== '';
    const validDateRange = startDate <= endDate;
    return hasTickerSelection && hasDates && validDateRange;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      return;
    }

    // Trigger the API fetch
    setFetchEnabled(true);
  };

  const handleManualTickerChange = (value: string) => {
    setManualTicker(value.toUpperCase());
    // Clear dropdown selection when typing manually
    if (value) {
      setSelectedTicker('');
    }
    // Reset fetch to require new submission
    setFetchEnabled(false);
  };

  const handleDropdownChange = (value: string) => {
    setSelectedTicker(value);
    // Clear manual input when selecting from dropdown
    if (value) {
      setManualTicker('');
    }
    // Reset fetch to require new submission
    setFetchEnabled(false);
  };

  const handleDateChange = () => {
    // Reset fetch to require new submission when dates change
    setFetchEnabled(false);
  };

  const handleTodaysNews = () => {
    // Get today's date in local timezone (YYYY-MM-DD format)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;

    setStartDate(localDate);
    setEndDate(localDate);

    // If ticker is already selected, trigger fetch automatically
    if (manualTicker.trim() !== '' || selectedTicker !== '') {
      setFetchEnabled(true);
    }
  };

  const hasTickerError = manualTicker === '' && selectedTicker === '';
  const hasDateError = (startDate && endDate) && startDate > endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Search size={28} />
              Stock-Specific News
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">Search news articles for a specific ticker and date range</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Manual Ticker Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Manual Ticker Entry
                </label>
                <input
                  type="text"
                  value={manualTicker}
                  onChange={(e) => handleManualTickerChange(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg font-bold uppercase ${
                    hasTickerError && !manualTicker
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                  placeholder="AAPL"
                />
              </div>

              {/* Ticker Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Or Select from Portfolio
                </label>
                <select
                  value={selectedTicker}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none text-lg ${
                    hasTickerError && !selectedTicker
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                >
                  <option value="">-- Select Ticker --</option>
                  {tickerList.map(ticker => (
                    <option key={ticker} value={ticker}>{ticker}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date Range Row */}
            <div className="flex items-end gap-4 mb-6">
              {/* Start Date */}
              <div className="w-36">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    handleDateChange();
                  }}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${
                    !startDate || hasDateError
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* End Date */}
              <div className="w-36">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    handleDateChange();
                  }}
                  className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none text-sm ${
                    !endDate || hasDateError
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-300 focus:border-blue-500'
                  }`}
                />
              </div>

              {/* Today's News Button */}
              <button
                type="button"
                onClick={handleTodaysNews}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
              >
                <Calendar size={18} />
                Today's News
              </button>
            </div>

            {/* Validation Messages */}
            {hasTickerError && (
              <p className="text-sm text-red-600 mb-4">
                Please enter a ticker symbol or select one from the dropdown
              </p>
            )}
            {hasDateError && (
              <p className="text-sm text-red-600 mb-4">
                End date must be after start date
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600 mb-4">
                Error: {error.message}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Search size={20} />
                {loading ? 'Fetching News...' : 'Fetch News'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
