import { useState, useEffect } from 'react';
import upGreenRight from '../../Images/UpGreenRight.png'
import downRedRight from '../../Images/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"

const tickersToEvaluate:TickersToEvaluate[] =
  [
    {
      ticker: "DIA",
      costBasis: '0.0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "VOO",
      costBasis: '0.0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "QQQ",
      costBasis: '0.0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "ADC",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "ADBE",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "AXP",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "BKE",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "CAT",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "CRWV",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "CVS",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "DOV",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "ETN",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "ET",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "GLD",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "HD",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "HPQ",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "INTC",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "INTU",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "JPM",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "MDB",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "MO",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "MPLX",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "NOW",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "NUE",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "NXT",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "ORCL",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "SPG",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "TGT",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "TSM",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "UBER",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "UTG",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "VICI",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "VOOG",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "WMT",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "WPC",
      costBasis: '0',
      unitsOnHand: 0, 
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    }
    

  ];


function WatchList() {

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('AAPL')
  const [headerValue,setHeaderValue] = useState('Watch List')
  const [todaysPercentageChange, setTodaysPercentageChange] = useState(0.0);
  const [isTodaysChangePositive, setIsTodaysChangePositive] = useState(true);
  const [slope, setSlope] = useState(0.0)
  const [currentHoldings,setCurrentHoldings]=useState(tickersToEvaluate);

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

  useEffect(() => {
    document.title = "Watch List"

    setCurrentHoldings(currentHoldings);
 }, []);

  useEffect(() => {  
    //console.log("Running useEffect for: stockSymbolToFetch: " +stockSymbolToFetch)
}, [stockSymbolToFetch,headerValue,slope]);

  return (
    <div className="text-center overflow-x-visible min-w-[1400px]">
    <header className="bg-emerald-100 text-sky-600 text-3xl font-bold h-30 justify-items-center min-w-[1400px]">
      <div>
        {headerValue}
      </div>   
      <div>
                {isTodaysChangePositive === true ?
                    <div className='text-green-600 text-3xl font-bold'>
                        Today's Change: {todaysPercentageChange} %
                    </div> :
                    <div className='text-red-600 text-3xl font-bold'>
                        Today's Change: {todaysPercentageChange} %
                    </div>
                    }
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
      </div>          
    </header>
    <div className="mt-0 mb-5">
        <BasicTickerEvaluation onSelectTickerButtonHandler = {onSelectTickerButtonHandler} onSetHeader = {onSetHeader} baseHeader='Watch List'
         onSetTodaysPercentageChange={onSetTodaysPercentageChange}
                              onSetSlope = {onSetSlope} tickerEntries={currentHoldings} backgroundLeft='bg-emerald-100'
                              buttonBackgroundColor='bg-emerald-400'/>
    </div>
    {/*<StockQuote stockSymbol={stockSymbolToFetch}/>*/}
    </div>
  );
}

export default WatchList;
