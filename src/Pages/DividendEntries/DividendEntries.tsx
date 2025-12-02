import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import upGreenRight from '../../Images/UpGreenRight.png'
import downRedRight from '../../Images/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import type {PortfoliosToInclude} from "../../Lib/TickersToEvaluate/TickersToEvaluate"
import type { TickerLot, Ticker } from '../../types';
import { calculateCurrentHoldings } from '../../utils/currentHoldingsCalculations';
import {calculateProjectedYield} from '../../Lib/ProfitLoss/CalculateOverallProfitLoss'

const portfoliosToInclude:PortfoliosToInclude[]=
  [
    {portfolio: "Dividends"},
  ];


const DividendEntries=()=> {
  const client = generateClient<Schema>();

  // Database state
  const [lots, setLots] = useState<TickerLot[]>([]);
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('AAPL')
  const [headerValue,setHeaderValue] = useState('Dividend Entries')
  const [todaysPercentageChange, setTodaysPercentageChange] = useState(0.0);
  const [isTodaysChangePositive, setIsTodaysChangePositive] = useState(true);
  const [slope, setSlope] = useState(0.0)

  // Calculate current holdings from database
  const portfolioNames = portfoliosToInclude.map(p => p.portfolio);
  const currentHoldings = calculateCurrentHoldings(lots, tickers, portfolioNames);
  const accumulatedValues = calculateProjectedYield(currentHoldings);

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
    document.title = "Dividend Entries"
 }, []);

  useEffect(() => {
    //console.log("Running useEffect for: stockSymbolToFetch: " +stockSymbolToFetch)
}, [stockSymbolToFetch,headerValue,slope]);

  // Loading and error states
  if (loading) {
    return (
      <div className="text-center p-10">
        <div className="text-2xl text-teal-600">Loading holdings...</div>
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
        <div className="text-2xl text-teal-600">No holdings found in selected portfolios</div>
      </div>
    );
  }

  return (
    <div className="text-center overflow-x-visible min-w-[1400px]">
    <header className="bg-teal-100 text-teal-600 text-3xl font-bold h-30 justify-items-center min-w-[1400px]">
      <div>
        {headerValue}
      </div>
      <div className='text-black text-3xl font-bold'>
                Today's Change: <span className={isTodaysChangePositive ? 'text-green-600' : 'text-red-600'}>
                    {todaysPercentageChange} %
                </span>
      </div>     
      <div>
        {slope >= 0.0 ?
          <div className='text-green-600 text-3xl font-bold'>            
                {/*Exponential change: {slope}  */}              
                <img className="inline-block w-10 h-8 ml-7 " src={upGreenRight} alt=""></img>                           
          </div> :
          <div className='text-red-600 text-3xl font-bold'>
                {/*} Exponential change: {slope} */} 
                  <img className="inline-block w-12 h-10 ml-7" src={downRedRight} alt=""></img> 
          </div>
          
          }
        <div className='text-green-600 text-3xl font-bold mt-3 mb-3'>
            Projected Div's: ${accumulatedValues.totalProjectedGain}/Yield: {accumulatedValues.percentageGainLoss}%                       
        </div>
          
      </div>          
    </header>
    <div className='mt-10 mb-5'>
      <BasicTickerEvaluation onSelectTickerButtonHandler = {onSelectTickerButtonHandler} onSetHeader = {onSetHeader} baseHeader='Dividend Entries'
       onSetTodaysPercentageChange={onSetTodaysPercentageChange}
                            onSetSlope = {onSetSlope} tickerEntries={currentHoldings} backgroundLeft='bg-teal-100'
                            buttonBackgroundColor='bg-teal-400'/>
    </div>
    {/*<StockQuote stockSymbol={stockSymbolToFetch}/>*/}
    </div>
  );
}

export default DividendEntries;
