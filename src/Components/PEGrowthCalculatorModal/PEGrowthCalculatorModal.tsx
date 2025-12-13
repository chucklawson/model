import { useState, useEffect } from 'react';
import { Calculator, X, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import type Quote_V3 from '../../Lib/Quote_V3';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

interface CalculatorFormData {
  ticker: string;
  mode: 'yearsToTarget' | 'futureRatio';
  earningsGrowthRate: number;
  targetPE: number;
  years: number;
  futurePEInput: number;
}

interface CalculationResults {
  currentPE: number;
  currentEPS: number;
  currentPrice: number;
  yearsToTarget?: number;
  futureEPS?: number;
  futurePE?: number;
  projectedPrice: number;
  priceAppreciation: number;
  totalReturn: number;
}

export default function PEGrowthCalculatorModal({ onClose }: { onClose: () => void }) {
  const client = generateClient<Schema>();

  const [formData, setFormData] = useState<CalculatorFormData>({
    ticker: '',
    mode: 'futureRatio',
    earningsGrowthRate: 10,
    targetPE: 20,
    years: 5,
    futurePEInput: 20,
  });

  const [quoteData, setQuoteData] = useState<Quote_V3 | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [fetchingQuote, setFetchingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch P/E data from API
  const fetchPEData = async (ticker: string) => {
    if (!ticker || ticker.length < 1) return;

    setFetchingQuote(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_FMP_API_KEY;
      const quoteUrl = `https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${apiKey}`;

      const response = await fetch(quoteUrl);
      const data = await response.json();

      if (data && data[0] && data[0].symbol) {
        const quote: Quote_V3 = data[0];
        setQuoteData(quote);

        // Auto-populate future P/E with current P/E
        if (quote.pe && quote.pe > 0) {
          setFormData(prev => ({ ...prev, futurePEInput: quote.pe }));
        }

        // Fetch ticker data from database to get expectedFiveYearGrowth
        try {
          const { data: tickerData } = await client.models.Ticker.list({
            filter: { symbol: { eq: ticker.toUpperCase() } }
          });

          if (tickerData && tickerData.length > 0) {
            // Check for expectedFiveYearGrowth (new field name) or expectedFiveYearReturn (old field name for backwards compatibility)
            const expectedGrowth = (tickerData[0] as any).expectedFiveYearGrowth || (tickerData[0] as any).expectedFiveYearReturn;
            if (expectedGrowth && expectedGrowth > 0) {
              setFormData(prev => ({ ...prev, earningsGrowthRate: expectedGrowth }));
            } else {
              // Reset to default if no growth rate is set
              setFormData(prev => ({ ...prev, earningsGrowthRate: 10 }));
            }
          } else {
            // Reset to default if ticker not found in database
            setFormData(prev => ({ ...prev, earningsGrowthRate: 10 }));
          }
        } catch (tickerErr) {
          console.log('Could not fetch ticker growth rate:', tickerErr);
          // Don't show error to user, just use default growth rate
        }

        if (!quote.pe || quote.pe <= 0) {
          setError('This stock has no P/E ratio (negative or zero earnings)');
        }
        if (!quote.eps || quote.eps <= 0) {
          setError('This stock has negative or zero EPS');
        }
      } else {
        throw new Error('Invalid ticker symbol or no data returned');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch stock data';
      setError(errorMsg);
      setQuoteData(null);
    } finally {
      setFetchingQuote(false);
    }
  };

  // Fetch all tickers with lots on component mount
  useEffect(() => {
    const fetchAvailableTickers = async () => {
      try {
        const { data: lots } = await client.models.TickerLot.list();
        if (lots) {
          // Extract unique ticker symbols and sort them
          const uniqueTickers = Array.from(new Set(lots.map(lot => lot.ticker))).sort();
          setAvailableTickers(uniqueTickers);
        }
      } catch (err) {
        console.error('Error fetching available tickers:', err);
      }
    };

    fetchAvailableTickers();
  }, []);

  // Auto-fetch when ticker changes (with debounce)
  useEffect(() => {
    if (formData.ticker.length >= 1) {
      const timer = setTimeout(() => {
        fetchPEData(formData.ticker.toUpperCase());
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setQuoteData(null);
      setError(null);
    }
  }, [formData.ticker]);

  // Calculate years to reach target P/E
  const calculateYearsToTarget = (
    currentPE: number,
    targetPE: number,
    growthRate: number
  ): number => {
    if (currentPE <= 0 || targetPE <= 0 || growthRate <= -1) {
      throw new Error('Invalid input values');
    }

    // If target is lower than current and growth is positive, it's impossible
    if (targetPE < currentPE && growthRate > 0) {
      // Calculate based on P/E compression (assumes P/E compresses as earnings grow)
      // This is a simplified model
      const years = Math.log(targetPE / currentPE) / Math.log(1 + growthRate);
      return Math.abs(years);
    }

    // If already at or past target
    if (currentPE >= targetPE && growthRate >= 0 && targetPE >= currentPE) {
      return 0;
    }

    // Calculate years needed
    const years = Math.log(targetPE / currentPE) / Math.log(1 + growthRate);
    return years;
  };

  // Calculate future P/E and price after X years
  const calculateFuturePEAndPrice = (
    currentEPS: number,
    years: number,
    growthRate: number,
    futurePE: number
  ): { futureEPS: number; futurePE: number; futurePrice: number } => {
    if (currentEPS <= 0 || years < 0 || growthRate <= -1 || futurePE <= 0) {
      throw new Error('Invalid input values');
    }

    // Calculate future EPS
    const futureEPS = currentEPS * Math.pow(1 + growthRate, years);

    // Use the user-specified future P/E
    const futurePrice = futureEPS * futurePE;

    return { futureEPS, futurePE, futurePrice };
  };

  // Calculate and set results
  const handleCalculate = () => {
    if (!quoteData || !quoteData.pe || !quoteData.eps || !quoteData.price) {
      setError('Missing required data. Please enter a valid ticker.');
      return;
    }

    if (quoteData.pe <= 0 || quoteData.eps <= 0) {
      setError('Cannot calculate with negative or zero P/E or EPS');
      return;
    }

    try {
      const growthRate = formData.earningsGrowthRate / 100;
      const currentPE = quoteData.pe;
      const currentEPS = quoteData.eps;
      const currentPrice = quoteData.price;

      if (formData.mode === 'yearsToTarget') {
        // Mode 1: Years to reach target P/E
        const years = calculateYearsToTarget(currentPE, formData.targetPE, growthRate);

        if (years < 0) {
          setError('Target P/E is lower than current - this scenario requires earnings decline');
          return;
        }

        if (years > 100) {
          setError('This target may be unrealistic (>100 years)');
          return;
        }

        const futureEPS = currentEPS * Math.pow(1 + growthRate, years);
        const projectedPrice = futureEPS * formData.targetPE;
        const priceAppreciation = ((projectedPrice - currentPrice) / currentPrice) * 100;

        setResults({
          currentPE,
          currentEPS,
          currentPrice,
          yearsToTarget: years,
          projectedPrice,
          priceAppreciation,
          totalReturn: priceAppreciation,
        });
        setError(null);
      } else {
        // Mode 2: Future P/E after X years
        if (formData.futurePEInput <= 0) {
          setError('Future P/E must be greater than 0');
          return;
        }

        const { futureEPS, futurePE, futurePrice } = calculateFuturePEAndPrice(
          currentEPS,
          formData.years,
          growthRate,
          formData.futurePEInput
        );

        const priceAppreciation = ((futurePrice - currentPrice) / currentPrice) * 100;

        if (priceAppreciation > 1000) {
          setError('Warning: This projection seems very optimistic (>1000% return)');
        }

        setResults({
          currentPE,
          currentEPS,
          currentPrice,
          futureEPS,
          futurePE,
          projectedPrice: futurePrice,
          priceAppreciation,
          totalReturn: priceAppreciation,
        });
        setError(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Calculation error';
      setError(errorMsg);
      setResults(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calculator size={28} />
              P/E Growth Calculator
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <p className="text-purple-100 text-sm mt-2">
            Calculate P/E projections based on earnings growth
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

          {/* Mode Toggle */}
          <div className="bg-slate-100 p-4 rounded-lg">
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Calculation Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setFormData({ ...formData, mode: 'futureRatio' });
                  setResults(null);
                }}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  formData.mode === 'futureRatio'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-purple-100'
                }`}
              >
                Future Return After X Years
              </button>
              <button
                onClick={() => {
                  setFormData({ ...formData, mode: 'yearsToTarget' });
                  setResults(null);
                }}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  formData.mode === 'yearsToTarget'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-700 hover:bg-purple-100'
                }`}
              >
                Years to Target P/E
              </button>
            </div>
          </div>

          {/* Input Section */}
          <div className={`grid ${formData.mode === 'futureRatio' ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}>
            <div className={formData.mode === 'futureRatio' ? 'col-span-3' : 'col-span-2'}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Ticker Symbol *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => {
                    setFormData({ ...formData, ticker: e.target.value.toUpperCase() });
                    setResults(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg
                             focus:border-purple-500 focus:outline-none text-lg font-bold uppercase"
                  placeholder="AAPL"
                  autoFocus
                />
                {showDropdown && availableTickers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-purple-500 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {availableTickers
                      .filter(ticker => ticker.includes(formData.ticker))
                      .map(ticker => (
                        <div
                          key={ticker}
                          onClick={() => {
                            setFormData({ ...formData, ticker });
                            setResults(null);
                            setShowDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-purple-100 cursor-pointer text-lg font-bold"
                        >
                          {ticker}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              {fetchingQuote && (
                <p className="text-sm text-blue-600 mt-2">Fetching data...</p>
              )}
            </div>

            {/* Current Data Display */}
            {quoteData && (
              <div className={`${formData.mode === 'futureRatio' ? 'col-span-3' : 'col-span-2'} bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-300`}>
                <h3 className="font-bold text-slate-700 mb-3">Current Stock Data</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-600">Current P/E</p>
                    <p className="text-lg font-bold text-blue-600">
                      {quoteData.pe ? quoteData.pe.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">EPS (TTM)</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${quoteData.eps ? quoteData.eps.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Current Price</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${quoteData.price ? quoteData.price.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Earnings Growth Rate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Annual Earnings Growth Rate (%)
              </label>
              <input
                type="number"
                min="-50"
                max="100"
                step="0.1"
                value={formData.earningsGrowthRate}
                onChange={(e) => {
                  setFormData({ ...formData, earningsGrowthRate: parseFloat(e.target.value) || 0 });
                  setResults(null);
                }}
                className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="10"
              />
            </div>

            {/* Conditional Input: Target P/E or Years + Future P/E */}
            {formData.mode === 'yearsToTarget' ? (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Target P/E Ratio
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="0.1"
                  value={formData.targetPE}
                  onChange={(e) => {
                    setFormData({ ...formData, targetPE: parseFloat(e.target.value) || 0 });
                    setResults(null);
                  }}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  placeholder="20"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Number of Years
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="1"
                    value={formData.years}
                    onChange={(e) => {
                      setFormData({ ...formData, years: parseInt(e.target.value) || 1 });
                      setResults(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Future P/E Ratio
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="0.1"
                    value={formData.futurePEInput}
                    onChange={(e) => {
                      setFormData({ ...formData, futurePEInput: parseFloat(e.target.value) || 0 });
                      setResults(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none"
                    placeholder={quoteData?.pe?.toFixed(2) || "20"}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Defaults to current P/E ({quoteData?.pe?.toFixed(2) || 'N/A'})
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {/* Calculate Button */}
          <button
            onClick={handleCalculate}
            disabled={!quoteData || fetchingQuote || !quoteData.pe || !quoteData.eps}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white
                       rounded-lg font-bold hover:from-purple-700 hover:to-pink-700
                       transition-all shadow-lg flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator size={20} />
            Calculate
          </button>

          {/* Results Display */}
          {results && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp size={24} className="text-green-600" />
                Calculation Results
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {formData.mode === 'yearsToTarget' ? (
                  <>
                    <div className="col-span-2 bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Years to Reach Target P/E of {formData.targetPE}</p>
                      <p className="text-3xl font-bold text-purple-600 flex items-center gap-2">
                        <Calendar size={28} />
                        {results.yearsToTarget?.toFixed(1)} years
                      </p>
                    </div>

                    {/* Investment Summary Box */}
                    <div className="col-span-2 bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-lg border-2 border-blue-400">
                      <p className="text-sm font-bold text-slate-700 mb-3">Investment Summary</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-600">Original Investment</p>
                          <p className="text-xl font-bold text-slate-800">${results.currentPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Value at Target P/E</p>
                          <p className="text-xl font-bold text-green-600">${results.projectedPrice.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Future EPS (Year {formData.years})</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${results.futureEPS?.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-sm text-slate-600">Future P/E</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {results.futurePE?.toFixed(2)}
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">
                    {formData.mode === 'yearsToTarget' ? 'Stock Price at Target P/E' : 'Projected Stock Price'}
                  </p>
                  <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <DollarSign size={24} />
                    ${results.projectedPrice.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-slate-600">Total Return on Investment</p>
                  <p className={`text-2xl font-bold ${results.priceAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {results.priceAppreciation >= 0 ? '+' : ''}{results.priceAppreciation.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500 mt-4 bg-white p-3 rounded">
                <p><strong>Assumptions:</strong></p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Earnings grow at constant annual rate of {formData.earningsGrowthRate}%</li>
                  <li>P/E ratio {formData.mode === 'yearsToTarget' ? `reaches ${formData.targetPE}` : `becomes ${formData.futurePEInput.toFixed(2)}`}</li>
                  <li>No dividends or special events considered</li>
                  <li>Current EPS: ${results.currentEPS.toFixed(2)} | Current P/E: {results.currentPE.toFixed(2)}</li>
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg
                         hover:bg-slate-100 transition-all font-bold"
            >
              Close
            </button>
            {results && (
              <button
                onClick={() => setResults(null)}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 transition-all font-bold"
              >
                Recalculate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
