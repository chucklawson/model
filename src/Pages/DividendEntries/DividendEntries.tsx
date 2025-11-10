import { useState, useEffect } from 'react';
import upGreenRight from '../../srcImages/UpGreenRight.png'
import downRedRight from '../../srcImages/DownRedRight.png'
import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'
import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"
import {calculateProjectedYield} from '../../Lib/ProfitLoss/CalculateOverallProfitLoss'

const tickersToEvaluate:TickersToEvaluate[] =
  [
    {
      ticker: "ENB",
      costBasis: '38.86',
      unitsOnHand: 110,
      calculateAccumulatedProfitLoss: true,
      baseYield: '5.56',
    },
    {
      ticker: "NLY",
      costBasis: '20.20',
      unitsOnHand: 400,
      calculateAccumulatedProfitLoss: true,
      baseYield: '13.86',
    },
    {
      ticker: "O",
      costBasis: '59.07',
      unitsOnHand: 30,
      calculateAccumulatedProfitLoss: true,
      baseYield: '5.46',
    },
    {
      ticker: "USA",
      costBasis: '7.06',
      unitsOnHand: 355,
      calculateAccumulatedProfitLoss: true,
      baseYield: '9.64',
    }

  ];


const DividendEntries=()=> {

  const [stockSymbolToFetch,setStockSymbolToFetch] = useState('AAPL')
  const [headerValue,setHeaderValue] = useState('Dividend Entries')
  const [todaysPercentageChange, setTodaysPercentageChange] = useState(0.0);
  const [isTodaysChangePositive, setIsTodaysChangePositive] = useState(true);
  const [slope, setSlope] = useState(0.0)
  const [currentHoldings,setCurrentHoldings]=useState(tickersToEvaluate);
  const [accumulatedValues,setAccumulatedValues]=useState(calculateProjectedYield(tickersToEvaluate))

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
    setTodaysPercentageChange(Number(percentageChange.toFixed(2)));
    setIsTodaysChangePositive(isChnagePositive);
  }

  const onSetSlope = (slopeIn:number) => {
    setSlope(slopeIn)
  }

  useEffect(() => {
    document.title = "Dividend Entries"

    // the following set functions are just to get rid of not use errors
    setCurrentHoldings(currentHoldings);
    setAccumulatedValues(accumulatedValues);
 }, []);

  useEffect(() => {  
    //console.log("Running useEffect for: stockSymbolToFetch: " +stockSymbolToFetch)
}, [stockSymbolToFetch,headerValue,slope]);

  return (
    <div className="text-center">
    <header className="bg-teal-100 text-teal-600 text-3xl font-bold h-30 justify-items-center">
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
