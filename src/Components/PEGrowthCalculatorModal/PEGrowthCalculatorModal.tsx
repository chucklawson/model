import { useState, useEffect } from 'react';
import { Calculator, X, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import type Quote_V3 from '../../Lib/Quote_V3';
import type AnalystEstimate_V3 from '../../Lib/AnalystEstimate_V3';
import type AnnualProjection from '../../Lib/AnnualProjection';
import AnnualProjectionTable from '../AnnualProjectionTable/AnnualProjectionTable';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { callFmpApi } from '../../utils/fmpApiClient';

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
  analystEstimatesUsed?: boolean;
  estimatedYears?: number;
  impliedGrowthRate?: number;
  annualProjections?: AnnualProjection[];
}

interface CompanyProfile {
  symbol: string;
  sector: string;
  industry: string;
}

interface SectorPESnapshot {
  date: string;
  sector: string;
  exchange: string;
  pe: number;
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

  // Analyst estimates state
  const [useAnalystEstimates, setUseAnalystEstimates] = useState(false);
  const [analystData, setAnalystData] = useState<AnalystEstimate_V3[]>([]);
  const [fetchingEstimates, setFetchingEstimates] = useState(false);
  const [estimatesError, setEstimatesError] = useState<string | null>(null);

  // EPS override state
  const [epsOverride, setEpsOverride] = useState<string>('');
  const [useEpsOverride, setUseEpsOverride] = useState(false);

  // Company profile and sector P/E state
  const [profileData, setProfileData] = useState<CompanyProfile | null>(null);
  const [sectorPEData, setSectorPEData] = useState<SectorPESnapshot[]>([]);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  // Fetch P/E data from API
  const fetchPEData = async (ticker: string) => {
    if (!ticker || ticker.length < 1) return;

    setFetchingQuote(true);
    setError(null);

    try {
      const data = await callFmpApi({
        endpoint: `/api/v3/quote/${ticker}`
      });

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

  // Fetch company profile data
  const fetchCompanyProfile = async (ticker: string) => {
    if (!ticker || ticker.length < 1) return;

    setFetchingProfile(true);

    try {
      const data = await callFmpApi({
        endpoint: `/api/v3/profile/${ticker}`
      });

      if (data && data.length > 0 && data[0].sector && data[0].industry) {
        const profile: CompanyProfile = {
          symbol: data[0].symbol,
          sector: data[0].sector,
          industry: data[0].industry
        };
        setProfileData(profile);

        // Immediately fetch sector P/E data using the sector
        fetchSectorPE(data[0].sector);
      } else {
        setProfileData(null);
      }
    } catch (err) {
      console.error('Failed to fetch company profile:', err);
      setProfileData(null);
    } finally {
      setFetchingProfile(false);
    }
  };

  // Fetch sector P/E snapshot data
  const fetchSectorPE = async (sector: string) => {
    if (!sector || sector.trim() === '') return;

    try {
      // Use current date in YYYY-MM-DD format
      const currentDate = new Date().toISOString().split('T')[0];
      const data = await callFmpApi({
        endpoint: '/stable/sector-pe-snapshot',
        queryParams: { date: currentDate }
      });

      if (data && Array.isArray(data)) {
        setSectorPEData(data);
      } else {
        setSectorPEData([]);
      }
    } catch (err) {
      console.error('Failed to fetch sector P/E data:', err);
      setSectorPEData([]);
    }
  };

  // Fetch analyst estimates from API
  const fetchAnalystEstimates = async (ticker: string) => {
    if (!ticker || ticker.length < 1) return;

    setFetchingEstimates(true);
    setEstimatesError(null);

    try {
      const data = await callFmpApi({
        endpoint: '/stable/analyst-estimates',
        queryParams: {
          symbol: ticker,
          period: 'annual',
          page: '0',
          limit: '10'
        }
      });

      if (data && Array.isArray(data) && data.length > 0) {
        // Filter for future estimates only (date > today)
        const today = new Date();
        const futureEstimates = data.filter((est: AnalystEstimate_V3) => {
          return new Date(est.date) > today;
        });

        if (futureEstimates.length > 0) {
          // Sort by date ascending (earliest year first)
          const sortedEstimates = futureEstimates.sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });

          setAnalystData(sortedEstimates);

          // Auto-set years based on furthest estimate
          const years = sortedEstimates.length;
          setFormData(prev => ({ ...prev, years }));
        } else {
          setEstimatesError('No future analyst estimates available');
          setAnalystData([]);
        }
      } else {
        setEstimatesError('No analyst estimates available for this ticker');
        setAnalystData([]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch analyst estimates';
      setEstimatesError(errorMsg);
      setAnalystData([]);
    } finally {
      setFetchingEstimates(false);
    }
  };

  // Calculate implied annual growth rate from analyst estimates
  const calculateImpliedGrowth = (currentEPS: number, estimates: AnalystEstimate_V3[]): number => {
    if (estimates.length === 0 || currentEPS <= 0) return 0;

    const finalEPS = estimates[estimates.length - 1]?.epsAvg;
    if (!finalEPS || finalEPS <= 0) return 0;

    const years = estimates.length;

    // CAGR formula: (finalValue / initialValue)^(1/years) - 1
    const growthRate = Math.pow(finalEPS / currentEPS, 1 / years) - 1;
    return growthRate * 100; // Convert to percentage
  };

  // Calculate P/E ratio for a specific year using linear interpolation
  const calculateInterpolatedPE = (
    currentPE: number,
    targetPE: number,
    currentYear: number,
    totalYears: number
  ): number => {
    if (totalYears === 0) return targetPE;
    const progression = currentYear / totalYears;
    return currentPE + (targetPE - currentPE) * progression;
  };

  // Generate annual projection data
  const generateAnnualProjections = (
    currentPrice: number,
    currentEPS: number,
    currentPE: number,
    targetPE: number,
    years: number,
    growthRate: number,
    useAnalystEstimates: boolean,
    analystData: AnalystEstimate_V3[]
  ): AnnualProjection[] => {
    const projections: AnnualProjection[] = [];
    const currentYear = new Date().getFullYear();

    for (let year = 1; year <= years; year++) {
      // Calculate EPS for this year
      let eps: number;
      if (useAnalystEstimates && analystData.length >= year) {
        eps = analystData[year - 1].epsAvg;
      } else {
        eps = currentEPS * Math.pow(1 + growthRate, year);
      }

      // Calculate interpolated P/E
      const peRatio = calculateInterpolatedPE(currentPE, targetPE, year, years);

      // Calculate stock price
      const stockPrice = eps * peRatio;

      // Calculate annual growth (year-over-year)
      const previousPrice = year === 1 ? currentPrice : projections[year - 2].stockPrice;
      const annualGrowth = ((stockPrice - previousPrice) / previousPrice) * 100;

      // Calculate cumulative return
      const cumulativeReturn = ((stockPrice - currentPrice) / currentPrice) * 100;

      projections.push({
        year,
        calendarYear: currentYear + year,
        eps,
        peRatio,
        stockPrice,
        annualGrowth,
        cumulativeReturn
      });
    }

    return projections;
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
        const upperTicker = formData.ticker.toUpperCase();
        fetchPEData(upperTicker);
        fetchCompanyProfile(upperTicker);
      }, 800);

      return () => clearTimeout(timer);
    } else {
      setQuoteData(null);
      setError(null);
      setProfileData(null);
      setSectorPEData([]);
    }
  }, [formData.ticker]);

  // Fetch analyst estimates when toggle is enabled
  useEffect(() => {
    if (useAnalystEstimates && formData.ticker.length >= 1) {
      fetchAnalystEstimates(formData.ticker.toUpperCase());
    }
  }, [useAnalystEstimates, formData.ticker]);

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


  // Get effective EPS (override or API value)
  const getEffectiveEPS = (): number | null => {
    if (useEpsOverride && epsOverride) {
      const override = parseFloat(epsOverride);
      return override > 0 ? override : null;
    }
    return quoteData?.eps || null;
  };

  // Get effective P/E (calculated from override or API value)
  const getEffectivePE = (): number | null => {
    if (!quoteData?.price) return null;
    const eps = getEffectiveEPS();
    if (!eps || eps <= 0) return null;
    return quoteData.price / eps;
  };

  // Get sector P/E ratio for the company's sector
  const getSectorPE = (): number | null => {
    if (!profileData?.sector || sectorPEData.length === 0) return null;

    // Find matching sector in the PE data (case-insensitive)
    const matchingSector = sectorPEData.find(
      item => item.sector.toLowerCase() === profileData.sector.toLowerCase()
    );

    return matchingSector?.pe || null;
  };

  // Calculate and set results
  const handleCalculate = () => {
    if (!quoteData || !quoteData.price) {
      setError('Missing required data. Please enter a valid ticker.');
      return;
    }

    const currentEPS = getEffectiveEPS();
    const currentPE = getEffectivePE();

    if (!currentEPS || currentEPS <= 0) {
      setError('Cannot calculate with negative or zero EPS');
      return;
    }

    if (!currentPE || currentPE <= 0) {
      setError('Cannot calculate with negative or zero P/E');
      return;
    }

    try {
      const growthRate = formData.earningsGrowthRate / 100;
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

        let futureEPS: number;
        let impliedGrowth: number | undefined;

        if (useAnalystEstimates && analystData.length > 0) {
          // Use analyst estimate for target year
          const targetYear = Math.min(formData.years, analystData.length);
          const estimatedEPS = analystData[targetYear - 1]?.epsAvg;

          if (!estimatedEPS || estimatedEPS <= 0) {
            setError('Invalid analyst estimate data. Please use manual growth rate.');
            return;
          }

          futureEPS = estimatedEPS;
          impliedGrowth = calculateImpliedGrowth(currentEPS, analystData.slice(0, targetYear));
        } else {
          // Use manual growth rate (existing logic)
          futureEPS = currentEPS * Math.pow(1 + growthRate, formData.years);
        }

        const futurePrice = futureEPS * formData.futurePEInput;
        const priceAppreciation = ((futurePrice - currentPrice) / currentPrice) * 100;

        if (priceAppreciation > 1000) {
          setError('Warning: This projection seems very optimistic (>1000% return)');
        }

        // Generate annual projections
        const projections = generateAnnualProjections(
          currentPrice,
          currentEPS,
          currentPE,
          formData.futurePEInput,
          formData.years,
          growthRate,
          useAnalystEstimates,
          analystData
        );

        setResults({
          currentPE,
          currentEPS,
          currentPrice,
          futureEPS,
          futurePE: formData.futurePEInput,
          projectedPrice: futurePrice,
          priceAppreciation,
          totalReturn: priceAppreciation,
          analystEstimatesUsed: useAnalystEstimates,
          estimatedYears: formData.years,
          impliedGrowthRate: impliedGrowth,
          annualProjections: projections
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

          {/* Data Source Toggle - Only show in futureRatio mode */}
          {formData.mode === 'futureRatio' && (
            <div className="bg-slate-100 p-4 rounded-lg">
              <label className="block text-sm font-bold text-slate-700 mb-3">
                EPS Growth Data Source
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setUseAnalystEstimates(false);
                    setResults(null);
                  }}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    !useAnalystEstimates
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-slate-700 hover:bg-blue-100'
                  }`}
                >
                  Manual Growth Rate
                </button>
                <button
                  onClick={() => {
                    setUseAnalystEstimates(true);
                    setResults(null);
                    if (formData.ticker.length >= 1) {
                      fetchAnalystEstimates(formData.ticker.toUpperCase());
                    }
                  }}
                  disabled={!quoteData}
                  className={`p-3 rounded-lg font-semibold transition-all ${
                    useAnalystEstimates
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-slate-700 hover:bg-blue-100'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Use Analyst Estimates
                </button>
              </div>
              {fetchingEstimates && (
                <p className="text-sm text-blue-600 mt-2">Loading analyst estimates...</p>
              )}
            </div>
          )}

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

                {/* First Row: Existing 4 columns */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-600">Current Price</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${quoteData.price ? quoteData.price.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">EPS (TTM) {useEpsOverride && <span className="text-orange-600">Override</span>}</p>
                    <p className={`text-lg font-bold ${useEpsOverride ? 'text-orange-600' : 'text-blue-600'}`}>
                      ${getEffectiveEPS()?.toFixed(2) || 'N/A'}
                    </p>
                    {useEpsOverride && quoteData.eps && (
                      <p className="text-xs text-slate-500">
                        API: ${quoteData.eps.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Current P/E {useEpsOverride && <span className="text-orange-600">Calc</span>}</p>
                    <p className={`text-lg font-bold ${useEpsOverride ? 'text-orange-600' : 'text-blue-600'}`}>
                      {getEffectivePE()?.toFixed(2) || 'N/A'}
                    </p>
                    {useEpsOverride && quoteData.pe && (
                      <p className="text-xs text-slate-500">
                        API: {quoteData.pe.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Override EPS</p>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.01"
                        value={epsOverride}
                        onChange={(e) => {
                          setEpsOverride(e.target.value);
                          setUseEpsOverride(e.target.value.length > 0);
                          setResults(null);
                        }}
                        placeholder={quoteData.eps?.toFixed(2) || '0.00'}
                        className="w-full px-2 py-1 text-sm border-2 border-slate-300 rounded focus:border-orange-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {useEpsOverride && (
                        <button
                          onClick={() => {
                            setEpsOverride('');
                            setUseEpsOverride(false);
                            setResults(null);
                          }}
                          className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                          title="Clear override"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Second Row: New Industry/Sector Data - 3 columns */}
                {profileData && (
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-blue-200">
                    <div>
                      <p className="text-xs text-slate-600">Industry</p>
                      <p className="text-lg font-bold text-purple-600">
                        {profileData.industry || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Sector</p>
                      <p className="text-lg font-bold text-purple-600">
                        {profileData.sector || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Sector P/E</p>
                      <p className="text-lg font-bold text-purple-600">
                        {getSectorPE()?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading state for profile */}
                {fetchingProfile && !profileData && (
                  <div className="pt-4 border-t-2 border-blue-200">
                    <p className="text-sm text-blue-600">Loading industry data...</p>
                  </div>
                )}
              </div>
            )}

            {/* Analyst Estimates Display */}
            {useAnalystEstimates && analystData.length > 0 && (
              <div className="col-span-3 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-300">
                <h3 className="font-bold text-slate-700 mb-3">Analyst EPS Estimates (Annual)</h3>
                <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                  {analystData.map((estimate, index) => (
                    <div key={estimate.date} className="bg-white p-3 rounded-lg grid grid-cols-4 gap-2 items-center">
                      <div>
                        <p className="text-xs text-slate-600">Year {index + 1}</p>
                        <p className="text-sm font-bold text-slate-800">
                          {new Date(estimate.date).getFullYear()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">EPS Range</p>
                        <p className="text-sm font-bold text-blue-600">
                          ${estimate.epsLow?.toFixed(2) || 'N/A'} - ${estimate.epsHigh?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">EPS Avg</p>
                        <p className="text-sm font-bold text-green-600">
                          ${estimate.epsAvg?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600">Analysts</p>
                        <p className="text-sm font-bold text-slate-700">
                          {estimate.numAnalystsEps || 0}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {quoteData && getEffectiveEPS() && (
                  <p className="text-xs text-slate-500 mt-2">
                    Implied Annual Growth: {calculateImpliedGrowth(getEffectiveEPS()!, analystData).toFixed(2)}%
                    {useEpsOverride && <span className="text-orange-600 ml-1">(using override EPS)</span>}
                  </p>
                )}
              </div>
            )}

            {/* Analyst Estimates Error Display */}
            {useAnalystEstimates && estimatesError && (
              <div className="col-span-3 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <p className="text-yellow-700 font-semibold">{estimatesError}</p>
                <p className="text-xs text-yellow-600 mt-1">
                  Switch to "Manual Growth Rate" to enter estimates manually
                </p>
              </div>
            )}

            {/* Earnings Growth Rate */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Annual Earnings Growth Rate (%)
                {useAnalystEstimates && analystData.length > 0 && (
                  <span className="text-xs text-green-600 ml-2">(Calculated from Estimates)</span>
                )}
              </label>
              <input
                type="number"
                min="-50"
                max="100"
                step="0.1"
                value={
                  useAnalystEstimates && analystData.length > 0 && getEffectiveEPS()
                    ? calculateImpliedGrowth(getEffectiveEPS()!, analystData).toFixed(2)
                    : formData.earningsGrowthRate
                }
                onChange={(e) => {
                  if (!useAnalystEstimates) {
                    setFormData({ ...formData, earningsGrowthRate: parseFloat(e.target.value) || 0 });
                    setResults(null);
                  }
                }}
                disabled={useAnalystEstimates && analystData.length > 0}
                className={`w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  useAnalystEstimates && analystData.length > 0 ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
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
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="20"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Number of Years
                    {useAnalystEstimates && analystData.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">(Max: {analystData.length})</span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={useAnalystEstimates && analystData.length > 0 ? analystData.length : 30}
                    step="1"
                    value={formData.years}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        setFormData({ ...formData, years: 1 });
                      } else {
                        const years = parseInt(value);
                        if (!isNaN(years)) {
                          const maxYears = useAnalystEstimates && analystData.length > 0 ? analystData.length : 30;
                          setFormData({ ...formData, years: Math.min(Math.max(1, years), maxYears) });
                        }
                      }
                      setResults(null);
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="5"
                  />
                  {useAnalystEstimates && analystData.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Limited to {analystData.length} years (available estimates)
                    </p>
                  )}
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
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-purple-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            <div className="space-y-4">
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
                  {results.analystEstimatesUsed ? (
                    <>
                      <li>EPS projections based on analyst estimates (average of {
                        analystData[0]?.numAnalystsEps || 'N/A'
                      } analysts)</li>
                      <li>Implied annual growth rate: {results.impliedGrowthRate?.toFixed(2)}%</li>
                    </>
                  ) : (
                    <li>Earnings grow at constant annual rate of {formData.earningsGrowthRate}%</li>
                  )}
                  <li>P/E ratio {formData.mode === 'yearsToTarget' ? `reaches ${formData.targetPE}` : `becomes ${formData.futurePEInput.toFixed(2)}`}</li>
                  <li>No dividends or special events considered</li>
                  <li>Current EPS: ${results.currentEPS.toFixed(2)} | Current P/E: {results.currentPE.toFixed(2)}</li>
                </ul>
              </div>
            </div>

            {/* Annual Projection Table - Only in futureRatio mode */}
            {formData.mode === 'futureRatio' && results.annualProjections && (
              <AnnualProjectionTable
                projections={results.annualProjections}
                currentPrice={results.currentPrice}
              />
            )}
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
