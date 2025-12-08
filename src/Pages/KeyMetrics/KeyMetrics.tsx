import { useEffect, useState, useMemo } from "react";
import StatementKeyMetrics from '../../Components/ApiCalls/StatementKeyMetrics';
import KeyMetricsTable from '../../Components/KeyMetrics/KeyMetricsTable';
import CompanyInfoModal from '../../Components/CompanyInfoModal/CompanyInfoModal';
import { transformToTableData } from '../../Lib/KeyMetricsData/KeyMetricsDataTransformer';
import { loadStatmentMetricsData } from '../../Lib/StatementsData/CollectStatementData';
import { useCompanyProfile } from '../../hooks/useCompanyProfile';
import type Quote_V3 from "../../Lib/Quote_V3";
import StatementAnalysisKeyMetricsData from '../../Lib/StatementsData/StatementAnalysisKeyMetricsData';

const KeyMetrics = () => {
  // State for submitted values (triggers data fetch)
  const [tickerToGet, setTickerToGet] = useState('');
  const [periodsToShow, setPeriodsToShow] = useState(8);

  // Local state for input fields (not submitted yet)
  const [tickerInput, setTickerInput] = useState('');
  const [periodsInput, setPeriodsInput] = useState('8');

  const [period, setPeriod] = useState<'quarter' | 'annual'>('quarter');
  const [annualChecked, setAnnualChecked] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState<StatementAnalysisKeyMetricsData[]>([]);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

  // Fetch company profile when modal is opened
  const { profile, loading: profileLoading, error: profileError } = useCompanyProfile(
    showCompanyInfo ? tickerToGet : ''
  );

  useEffect(() => {
    document.title = "Key Metrics";
  }, []);

  const handleUpdateClick = () => {
    // Update the actual state when button is clicked
    if (tickerInput.trim().length > 0) {
      setTickerToGet(tickerInput.trim().toUpperCase());
      setPeriodsToShow(Number(periodsInput) || 8);
    }
  };

  const onSetCurrentQuote = (
    _currentQuoteIn: Quote_V3,
    keyMetricsIn: StatementAnalysisKeyMetricsData[]
  ) => {
    setKeyMetrics(keyMetricsIn);
  };

  const annualChangeHandler = () => {
    setAnnualChecked(!annualChecked);
    if (!annualChecked === true) {
      setPeriod('annual');
    } else {
      setPeriod('quarter');
    }
  };

  // Transform data for table display
  const tableData = useMemo(() => {
    if (keyMetrics && keyMetrics.length > 0) {
      // Process the data to construct xAxisDataKey and other derived fields
      const processedData = loadStatmentMetricsData(keyMetrics);
      return transformToTableData(processedData, periodsToShow);
    }
    return { columns: [], rows: [] };
  }, [keyMetrics, periodsToShow]);

  return (
    <div className="text-center overflow-x-auto w-full">

      <header className="bg-gradient-to-r from-emerald-100 to-sky-100 rounded-lg shadow-md p-4 mb-3">
        <h1 className="text-2xl font-bold text-sky-700">
          Key Metrics - Financial Analysis
        </h1>
      </header>

      <div className="flex justify-center mb-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 max-w-2xl">

          {/* Checkbox for Annual vs Quarterly */}
          <div className="mb-6 flex justify-center">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={annualChecked}
                onChange={annualChangeHandler}
                className="w-4 h-4"
              />
              Use Annual Periods vs. Quarterly
            </label>
          </div>

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); }} className="w-full">
            <div className="flex flex-wrap gap-4 items-end justify-center">

              {/* Ticker Input */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ticker Symbol
                </label>
                <input
                  className="px-4 py-3 rounded-lg font-bold text-lg uppercase transition-all w-24
                             border-2 border-slate-300 focus:border-blue-500 bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-200"
                  type="text"
                  onChange={(e) => setTickerInput(e.target.value)}
                  value={tickerInput}
                  placeholder="AAPL"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateClick();
                    }
                  }}
                />
              </div>

              {/* Periods Input */}
              <div className="flex-shrink-0">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Periods to Show
                </label>
                <input
                  className="px-4 py-3 rounded-lg font-bold text-lg transition-all w-20
                             border-2 border-slate-300 focus:border-blue-500 bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-200"
                  type="number"
                  onChange={(e) => setPeriodsInput(e.target.value)}
                  value={periodsInput}
                  min="1"
                  max="20"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateClick();
                    }
                  }}
                />
              </div>

              {/* Update Button */}
              <div className="flex-shrink-0">
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                             hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
                  type="button"
                  onClick={handleUpdateClick}
                >
                  Update Data
                </button>
              </div>

              {/* Company Information Button */}
              <div className="flex-shrink-0">
                <button
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold
                             hover:bg-purple-700 transition-all shadow-md hover:shadow-lg
                             disabled:bg-slate-400 disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => setShowCompanyInfo(true)}
                  disabled={!tickerToGet}
                  title={!tickerToGet ? 'Enter a ticker first' : 'View company information'}
                >
                  Company Information
                </button>
              </div>
            </div>
          </form>

          {/* Hidden component for data fetching */}
          <div className="hidden">
            <StatementKeyMetrics
              stockSymbol={tickerToGet}
              period={period}
              onSetCurrentQuote={onSetCurrentQuote}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-7xl">
          <KeyMetricsTable columns={tableData.columns} rows={tableData.rows} />
        </div>
      </div>

      {/* Company Information Modal */}
      {showCompanyInfo && (
        <CompanyInfoModal
          profile={profile}
          loading={profileLoading}
          error={profileError}
          onClose={() => setShowCompanyInfo(false)}
        />
      )}

    </div>
  );
};

export default KeyMetrics;
