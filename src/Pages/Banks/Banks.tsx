import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import upGreenRight from '../../Images/UpGreenRight.png'
import downRedRight from '../../Images/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import type {PortfoliosToInclude} from "../../Lib/TickersToEvaluate/TickersToEvaluate"
import type { TickerLot, Ticker } from '../../types';
import { calculateCurrentHoldings } from '../../utils/currentHoldingsCalculations';

const portfoliosToInclude:PortfoliosToInclude[]=
  [
    {portfolio: "Financial"},
  ];


const Banks=()=> {
  const client = generateClient<Schema>();

  // Database state
  const [lots, setLots] = useState<TickerLot[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('DIA')
  const [headerValue,setHeaderValue] = useState('Financial')
  const [todaysPercentageChange, setTodaysPercentageChange] = useState(0.0);
  const [isTodaysChangePositive, setIsTodaysChangePositive] = useState(true);
  const [slope, setSlope] = useState(0.0)

  // Calculate current holdings from database
  const portfolioNames = portfoliosToInclude.map(p => p.portfolio);
  const currentHoldings = calculateCurrentHoldings(lots, tickers, portfolioNames);

  const onSelectTickerButtonHandler=(tickerToEvaluate:string)=>
  {
    setStockSymbolToFetch(tickerToEvaluate)
    //console.log("Setting stockSymbolToFetch: " +stockSymbolToFetch)
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

  // Load ticker lots and tickers from database with real-time subscriptions
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

    return () => {
      lotSub.unsubscribe();
      tickerSub.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.title = "Banks"
 }, []);

  useEffect(() => {
    //console.log("Running useEffect for: stockSymbolToFetch: " +stockSymbolToFetch)
}, [stockSymbolToFetch,headerValue,slope]);

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

  if (currentHoldings.length === 0) {
    return (
      <div className="text-center p-10">
        <div className="text-2xl text-gray-600">No holdings found in selected portfolios</div>
      </div>
    );
  }

  return (
    <div className="text-center overflow-x-auto w-full">
    <header className="bg-gradient-to-r from-gray-100 to-slate-200 rounded-lg shadow-md p-4 mb-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-700">
          {headerValue}
        </h1>
        <div className="bg-white rounded-md shadow-sm p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Today's Change:
            </span>
            <span className={`text-lg font-bold ${
              isTodaysChangePositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isTodaysChangePositive ? '+' : ''}{todaysPercentageChange}%
            </span>
            {slope >= 0.0 ? (
              <img className="w-5 h-5" src={upGreenRight} alt="Upward trend" />
            ) : (
              <img className="w-5 h-5" src={downRedRight} alt="Downward trend" />
            )}
          </div>
        </div>
      </div>
    </header>
    <div className='mt-0 mb-5'>
        <BasicTickerEvaluation onSelectTickerButtonHandler = {onSelectTickerButtonHandler} onSetHeader = {onSetHeader} baseHeader='Financial'
         onSetTodaysPercentageChange={onSetTodaysPercentageChange}
                              onSetSlope = {onSetSlope} tickerEntries={currentHoldings} backgroundLeft='bg-gray-100'
                              buttonBackgroundColor='bg-gray-400'/>
    </div>
    {/*<StockQuote stockSymbol={stockSymbolToFetch}/>*/}
    </div>
  );
}

export default Banks;
