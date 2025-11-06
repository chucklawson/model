import { useState, useEffect } from 'react';
import upGreenRight from '../../srcImages/UpGreenRight.png'
import downRedRight from '../../srcImages/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"

const tickersToEvaluate:TickersToEvaluate[] =
  [
    {
      ticker: "DIA",
      costBasis: '0',
      unitsOnHand: 0,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "VOO",
      costBasis: '439.06',
      unitsOnHand: 46,

      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "QQQ",
      costBasis: '596.99',
      unitsOnHand: 4,
      calculateAccumulatedProfitLoss: false,
      baseYield: '',
    },
    {
      ticker: "AAPL",
      costBasis: '209.83',
      unitsOnHand: 20,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "AEM",
      costBasis: '162.50',
      unitsOnHand: 9,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
    ticker: "AMD",
    costBasis: '177.62',
    unitsOnHand: 25,
    calculateAccumulatedProfitLoss: true,
      baseYield: '',
  },
    {
      ticker: "AMZN",
      costBasis: '162.46',
      unitsOnHand: 85,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "AVGO",
      costBasis: '269.99',
      unitsOnHand: 54,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "BA",
      costBasis: '222.20',
      unitsOnHand: 25,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "COF",
      //costBasis: '167.90',
      //unitsOnHand: 217,
      costBasis: '129.45',
      unitsOnHand: 541,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "COST",
      costBasis: '968.48',
      unitsOnHand: 7,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "CRWD",
      costBasis: '359.77',
      unitsOnHand: 55,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "ENB",
      costBasis: '38.86',
      unitsOnHand: 110,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "GEV",
      costBasis: '478.18',
      unitsOnHand: 16,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "GLD",
      costBasis: '389.16',
      unitsOnHand: 4,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "GOOGL",
      costBasis: '202.89',
      unitsOnHand: 25,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "GS",
      costBasis: '600.54',
      unitsOnHand: 7,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "HON",
      costBasis: '226.37',
      unitsOnHand: 20,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "META",
      costBasis: '676.79',
      unitsOnHand: 35,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "MSFT",
      costBasis: '411.36',
      unitsOnHand: 39,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "ORCL",
      costBasis: '303.61',
      unitsOnHand: 6,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "NEM",
      costBasis: '89.73',
      unitsOnHand: 25,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "NKE",
      costBasis: '66.55',
      unitsOnHand: 15,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "NLY",
      costBasis: '20.20',
      unitsOnHand: 400,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "NVDA",
      costBasis: '56.62',
      unitsOnHand: 300,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "O",
      costBasis: '59.07',
      unitsOnHand: 30,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "PANW",
      costBasis: '197.35',
      unitsOnHand: 25,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "SBUX",
      costBasis: '92.14',
      unitsOnHand: 30,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "USA",
      costBasis: '7.06',
      unitsOnHand: 355,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    },
    {
      ticker: "WFC",
      costBasis: '66.51',
      unitsOnHand: 200,
      calculateAccumulatedProfitLoss: true,
      baseYield: '',
    }

  ];


function CurrentHoldings() {

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('AAPL')
  const [headerValue,setHeaderValue] = useState('Current ')
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

  const onSetTodaysPercentageChange = (percentageChange:number, isChnagePositive:boolean) => {
    //console.log("Todays percentageChange: " + percentageChange +", isChnagePositive: " +isChnagePositive)
    setTodaysPercentageChange(percentageChange);
    setIsTodaysChangePositive(isChnagePositive);
  }

  const onSetSlope = (slopeIn:number) => {
    setSlope(slopeIn)
  }

  useEffect(() => {
    document.title = "Current Holdings"
    setStockSymbolToFetch('AAPL');
    setHeaderValue('Current');
    setTodaysPercentageChange(0.0);
    setIsTodaysChangePositive(true);
    setSlope(0.0);
    setCurrentHoldings(currentHoldings);
 }, []);


  useEffect(() => {  
    //console.log("Running useEffect for: stockSymbolToFetch: " +stockSymbolToFetch)
}, [stockSymbolToFetch,headerValue,slope]);

  return (
    <div className="text-center">      
      
    <header className="bg-indigo-100 text-purple-600 text-3xl font-bold h-30 justify-items-center">
      <div>
        {headerValue}
                {isTodaysChangePositive === true ?
                    <div className='text-green-600 text-3xl font-bold'>
                        Today's Change: {todaysPercentageChange} %
                    </div> :
                    <div className='text-red-600 text-3xl font-bold'>
                        Today's Change: {todaysPercentageChange} %
                    </div>
                    }
        {slope >= 0.0 ?
          <div className='text-green-600 text-3xl font-bold'>
                <img className="inline-block w-10 h-8 ml-7 " src={upGreenRight} alt=""></img>                           
          </div> :
          <div className='text-red-600 text-3xl font-bold'>

                  <img className="inline-block w-12 h-10 ml-7" src={downRedRight} alt=""></img> 
          </div>
          }
      </div>

    </header>

    <BasicTickerEvaluation onSelectTickerButtonHandler = {onSelectTickerButtonHandler} onSetHeader = {onSetHeader} baseHeader='Current'
     onSetTodaysPercentageChange={onSetTodaysPercentageChange}
                          onSetSlope = {onSetSlope} tickerEntries={currentHoldings} backgroundLeft='bg-indigo-100'
                          buttonBackgroundColor='bg-indigo-400'/>

    </div>
  );
}

export default CurrentHoldings;
