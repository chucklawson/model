import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { LineChart as LineChartIcon, X, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTreasuryYieldsData } from '../../hooks/useTreasuryYieldsData';
import type { MaturityOption, TimePeriodOption, TreasuryYieldData } from '../../types/treasury';

interface TreasuryYieldsModalProps {
  onClose: () => void;
}

const MATURITY_OPTIONS: MaturityOption[] = ['1M', '3M', '6M', '1Y', '2Y', '3Y', '5Y', '7Y', '10Y', '20Y', '30Y'];

const MATURITY_FIELD_MAP: Record<MaturityOption, keyof TreasuryYieldData> = {
  '1M': 'month1',
  '3M': 'month3',
  '6M': 'month6',
  '1Y': 'year1',
  '2Y': 'year2',
  '3Y': 'year3',
  '5Y': 'year5',
  '7Y': 'year7',
  '10Y': 'year10',
  '20Y': 'year20',
  '30Y': 'year30',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function TreasuryYieldsModal({ onClose }: TreasuryYieldsModalProps) {
  const [selectedMaturities, setSelectedMaturities] = useState<MaturityOption[]>(['10Y']);
  const [timePeriod, setTimePeriod] = useState<TimePeriodOption>('3M');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fetchEnabled, setFetchEnabled] = useState(false);

  // Use the custom hook for fetching treasury yields
  const { data, loading, error } = useTreasuryYieldsData({
    startDate,
    endDate,
    enabled: fetchEnabled
  });

  // Initialize with default 3-month range
  useEffect(() => {
    calculateAndSetDateRange('3M');
  }, []);

  const calculateAndSetDateRange = (period: TimePeriodOption) => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '2Y':
        start.setFullYear(start.getFullYear() - 2);
        break;
      case '5Y':
        start.setFullYear(start.getFullYear() - 5);
        break;
      case '10Y':
        start.setFullYear(start.getFullYear() - 10);
        break;
      case 'ALL':
        start.setDate(start.getDate() - 90); // API limit
        break;
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleTimePeriodClick = (period: TimePeriodOption) => {
    setTimePeriod(period);
    if (period !== 'custom') {
      calculateAndSetDateRange(period);
    }
    setFetchEnabled(false);
  };

  const handleMaturityToggle = (maturity: MaturityOption) => {
    setSelectedMaturities(prev => {
      if (prev.includes(maturity)) {
        return prev.filter(m => m !== maturity);
      } else if (prev.length < 5) {
        return [...prev, maturity];
      }
      return prev;
    });
    setFetchEnabled(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      return;
    }

    // Trigger the API fetch
    setFetchEnabled(true);
  };

  const isFormValid = () => {
    const hasMaturities = selectedMaturities.length > 0;
    const hasDates = startDate !== '' && endDate !== '';
    const validDateRange = startDate <= endDate;
    return hasMaturities && hasDates && validDateRange;
  };

  // Transform data for Recharts
  const transformedData = data.map(d => {
    const transformed: any = { date: d.date };
    selectedMaturities.forEach(maturity => {
      const field = MATURITY_FIELD_MAP[maturity];
      transformed[maturity] = d[field];
    });
    return transformed;
  });

  const hasMaturityError = selectedMaturities.length === 0;
  const hasDateError = startDate && endDate && startDate > endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <LineChartIcon size={28} />
              Treasury Yields Comparison
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-2">Compare treasury yield curves across different maturities and time periods</p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit}>
            {/* Maturity Selection */}
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Select Maturities to Compare (1-5)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MATURITY_OPTIONS.map(maturity => (
                  <label key={maturity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMaturities.includes(maturity)}
                      onChange={() => handleMaturityToggle(maturity)}
                      disabled={!selectedMaturities.includes(maturity) && selectedMaturities.length >= 5}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{maturity}</span>
                  </label>
                ))}
              </div>
              {hasMaturityError && (
                <p className="text-sm text-red-600 mt-2">Please select at least one maturity</p>
              )}
              {selectedMaturities.length >= 5 && (
                <p className="text-sm text-purple-600 mt-2">Maximum 5 maturities selected</p>
              )}
            </div>

            {/* Time Period Selection */}
            <div className="bg-slate-100 p-4 rounded-lg mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Time Period
              </label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-4">
                {(['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', 'ALL'] as TimePeriodOption[]).map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => handleTimePeriodClick(period)}
                    className={`px-3 py-2 rounded-lg font-semibold transition-all ${
                      timePeriod === period
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-slate-700 hover:bg-purple-100'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setTimePeriod('custom');
                      setFetchEnabled(false);
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                      !startDate || hasDateError
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 focus:border-purple-500'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setTimePeriod('custom');
                      setFetchEnabled(false);
                    }}
                    className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none ${
                      !endDate || hasDateError
                        ? 'border-red-500 bg-red-50'
                        : 'border-slate-300 focus:border-purple-500'
                    }`}
                  />
                </div>
              </div>
              {hasDateError && (
                <p className="text-sm text-red-600 mt-2">End date must be after start date</p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-600">Error: {error.message}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-100 transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <TrendingUp size={20} />
                {loading ? 'Fetching Data...' : 'Fetch Treasury Yields'}
              </button>
            </div>
          </form>

          {/* Chart Display */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-slate-600 font-semibold">Loading treasury yields...</p>
              </div>
            </div>
          )}

          {data.length > 0 && !loading && (
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 flex-wrap">
                <TrendingUp size={20} className="text-purple-600" />
                <span>Treasury Yield Comparison ({startDate} to {endDate})</span>
                {data.length > 0 && (
                  <span className="text-purple-600 font-semibold ml-2">
                    | {endDate}: {selectedMaturities.map(m => {
                      const field = MATURITY_FIELD_MAP[m];
                      const value = data[data.length - 1][field];
                      return `${m}: ${typeof value === 'number' ? value.toFixed(2) : value}%`;
                    }).join(', ')}
                  </span>
                )}
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={transformedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Yield (%)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #9333ea',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => `${value?.toFixed(2)}%`}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  {selectedMaturities.map((maturity, index) => (
                    <Line
                      key={maturity}
                      type="monotone"
                      dataKey={maturity}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                      name={`${maturity} Treasury`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.length === 0 && !loading && fetchEnabled && !error && (
            <div className="bg-slate-100 p-8 rounded-lg text-center">
              <p className="text-slate-600">No treasury yield data available for the selected date range.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
