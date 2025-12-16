import { useState, useEffect, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import upGreenRight from '../../Images/UpGreenRight.png'
import downRedRight from '../../Images/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import PortfolioFilter from '../../Components/PortfolioFilter';
import type { TickerLot, Ticker, Portfolio } from '../../types';
import { calculateCurrentHoldings } from '../../utils/currentHoldingsCalculations';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { STORAGE_KEYS, STORAGE_VERSIONS } from '../../utils/localStorage';

function FlexiblePortfolio() {
  const client = generateClient<Schema>();

  // Database state
  const [lots, setLots] = useState<TickerLot[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Portfolio filter state (persists to localStorage)
  const [selectedPortfolios, setSelectedPortfolios] = useLocalStorage<string[]>(
    STORAGE_KEYS.FLEXIBLE_PORTFOLIO_FILTER,
    STORAGE_VERSIONS.FLEXIBLE_PORTFOLIO_FILTER,
    [], // Default to "All Portfolios"
    true // Auto-save on change
  );

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('AAPL')
  const [headerValue,setHeaderValue] = useState('Portfolios ')
  const [todaysPercentageChange, setTodaysPercentageChange] = useState(0.0);
  const [isTodaysChangePositive, setIsTodaysChangePositive] = useState(true);
  const [slope, setSlope] = useState(0.0)

  // Filter lots based on selected portfolios
  const filteredLots = useMemo(() => {
    // Empty array means "All" - show everything
    if (selectedPortfolios.length === 0) return lots;

    // Filter to lots that have at least one matching portfolio
    return lots.filter(lot =>
      lot.portfolios.some(p => selectedPortfolios.includes(p))
    );
  }, [lots, selectedPortfolios]);

  // Calculate current holdings from filtered lots
  const portfolioNames = selectedPortfolios.length === 0
    ? portfolios.map(p => p.name) // All portfolios
    : selectedPortfolios;          // Selected only

  const currentHoldings = calculateCurrentHoldings(filteredLots, tickers, portfolioNames);

  const onSelectTickerButtonHandler=(tickerToEvaluate:string)=>
  {
    setStockSymbolToFetch(tickerToEvaluate)
  }

  const onSetHeader=(headerValueIn:string)=>
  {
    setHeaderValue(headerValueIn)
  }

  const onSetTodaysPercentageChange = (percentageChange:number, isChangePositive:boolean) => {
    setTodaysPercentageChange(Number(percentageChange.toFixed(2)));
    setIsTodaysChangePositive(isChangePositive);
  }

  const onSetSlope = (slopeIn:number) => {
    setSlope(slopeIn)
  }

  // Load ticker lots, tickers, and portfolios from database with real-time subscriptions
  useEffect(() => {
    // Subscribe to TickerLot changes
    const lotSub = client.models.TickerLot.observeQuery().subscribe({
      next: ({ items }) => {
        const tickerLots: TickerLot[] = items
          .filter((item) => item !== null)
          .map((item) => ({
            id: item.id,
            ticker: item.ticker,
            shares: item.shares,
            costPerShare: item.costPerShare,
            purchaseDate: item.purchaseDate,
            portfolios: (item.portfolios ?? ['Default']).filter((p: string | null): p is string => p !== null),
            calculateAccumulatedProfitLoss: item.calculateAccumulatedProfitLoss ?? true,
            baseYield: item.baseYield ?? 0,
            notes: item.notes ?? '',
            totalCost: item.totalCost ?? item.shares * item.costPerShare,
            createdAt: item.createdAt ?? undefined,
            updatedAt: item.updatedAt ?? undefined,
            owner: item.owner ?? undefined,
          }));
        setLots(tickerLots);
        setLoading(false);
      },
      error: (err: Error) => {
        console.error('Subscription error:', err);
        setError('Failed to load ticker lots');
        setLoading(false);
      },
    });

    // Subscribe to Ticker changes
    const tickerSub = client.models.Ticker.observeQuery().subscribe({
      next: ({ items }) => {
        const tickerList: Ticker[] = items
          .filter(item => item !== null)
          .map((item) => ({
            id: item.id,
            symbol: item.symbol,
            companyName: item.companyName ?? '',
            baseYield: item.baseYield ?? 0,
            expectedFiveYearGrowth: item.expectedFiveYearGrowth ?? 0,
            createdAt: item.createdAt ?? undefined,
            updatedAt: item.updatedAt ?? undefined,
            owner: item.owner ?? undefined,
          }));
        setTickers(tickerList);
      },
      error: (err: Error) => console.error('Ticker subscription error:', err),
    });

    // Subscribe to Portfolio changes
    const portfolioSub = client.models.Portfolio.observeQuery().subscribe({
      next: ({ items }) => {
        const portfolioList: Portfolio[] = items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description ?? '',
          createdAt: item.createdAt ?? undefined,
          updatedAt: item.updatedAt ?? undefined,
          owner: item.owner ?? undefined,
        }));
        setPortfolios(portfolioList);
      },
      error: (err: Error) => console.error('Portfolio subscription error:', err),
    });

    return () => {
      lotSub.unsubscribe();
      tickerSub.unsubscribe();
      portfolioSub.unsubscribe();
    };
  }, []);

  // Clean up selected portfolios if they've been deleted
  useEffect(() => {
    if (portfolios.length === 0 || selectedPortfolios.length === 0) return;

    const validNames = new Set(portfolios.map(p => p.name));
    const cleaned = selectedPortfolios.filter(p => validNames.has(p));

    if (cleaned.length !== selectedPortfolios.length) {
      setSelectedPortfolios(cleaned);
    }
  }, [portfolios, selectedPortfolios, setSelectedPortfolios]);

  useEffect(() => {
    document.title = "Portfolios"
    setStockSymbolToFetch('AAPL');
    setHeaderValue('Portfolios');
    setTodaysPercentageChange(0.0);
    setIsTodaysChangePositive(true);
    setSlope(0.0);
 }, []);

  useEffect(() => {
    // This can be used for debugging if needed
  }, [stockSymbolToFetch, headerValue, slope]);

  // Loading and error states
  if (loading) {
    return (
      <div className="text-center p-10">
        <div className="text-2xl text-gray-600">Loading holdings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10">
        <div className="text-2xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="text-center overflow-x-auto w-full">

    <header className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg shadow-md p-2 mb-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-amber-700">
          {headerValue}
        </h1>
        <div className="bg-white rounded-md shadow-sm p-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Today's Change:
            </span>
            <span className={`text-sm font-bold ${
              isTodaysChangePositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isTodaysChangePositive ? '+' : ''}{todaysPercentageChange}%
            </span>
            {slope >= 0.0 ? (
              <img className="w-4 h-4" src={upGreenRight} alt="Upward trend" />
            ) : (
              <img className="w-4 h-4" src={downRedRight} alt="Downward trend" />
            )}
          </div>
        </div>
      </div>
    </header>

    <div className="mb-3">
      <PortfolioFilter
        portfolios={portfolios}
        selectedPortfolios={selectedPortfolios}
        onChange={setSelectedPortfolios}
      />
    </div>

    {currentHoldings.length === 0 ? (
      <div className="text-center p-10">
        <div className="text-2xl text-gray-600">No holdings found in selected portfolios</div>
      </div>
    ) : (
      <BasicTickerEvaluation
        onSelectTickerButtonHandler={onSelectTickerButtonHandler}
        onSetHeader={onSetHeader}
        baseHeader='Portfolios'
        onSetTodaysPercentageChange={onSetTodaysPercentageChange}
        onSetSlope={onSetSlope}
        tickerEntries={currentHoldings}
        backgroundLeft='bg-amber-100'
        buttonBackgroundColor='bg-amber-400'
      />
    )}

    </div>
  );
}

export default FlexiblePortfolio;
