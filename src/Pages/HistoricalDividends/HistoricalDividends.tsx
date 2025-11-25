
import {useEffect, useState } from "react";
import SpreadSheet from 'react-spreadsheet'
import StatementInput from '../../Components/SatementInput/StatementInput.jsx';
import HistoricalDividendQuote from '../../Components/ApiCalls/HistoricalDividendQuote.jsx';
import {loadHistoricalMetricsData,buildColumnTitles,buildRowTitles,buildHstoricalDataToShow,calculateYield} from '../../Lib/DividendData/CollectHistoricalDividendData'
import type HistoricalDividendData from "../../Lib/DividendData/HistoricalDividendData.tsx";
import type Quote_V3 from "../../Lib/Quote_V3.ts";

interface rowValues{
  value: string|number;
}

const HistoricalDividends = () =>{

  
    const [tickerToGet, setTickerToGet] = useState('');
    const [updateTickerValue, setUpdateTickerValue] = useState(false);
    const [buttonBackgroundColor,setbuttonBackgroundColor]= useState('bg-lime-400');
    const [classValuesLeft,setClassValuesLeft]=useState('')
    const [currentQuote, setcurrentQuote] = useState <Quote_V3>( {
      symbol: "",
      name: "",
      price: 0,
      changesPercentage: 0,
      change: 0,
      dayLow: 0,
      dayHigh: 0,
      yearHigh: 0,
      yearLow: 0,
      marketCap: 0,
      priceAvg50: 0,
      priceAvg200: 0,
      exchange:"",
      volume: 0,
      avgVolume: 0,
      open: 0,
      previousClose: 0,
      eps:0,
      pe: 0,
      earningsAnnouncement: "",
      sharesOutstanding: 0,
      timestamp: 0});
    const [dividendData,setDividendData] = useState<HistoricalDividendData[]>([]);
    const [periodsToShow, setPeriodsToShow] = useState(8);
    const [period,setPeriod] = useState('quarter')
    const [currentYield,setCurrentYield] = useState(0)


    const [data, setData]=useState<rowValues[][]>([])
  
    const [col,setCol]=useState<string[]>([])
    const [row,setRow]=useState<string[]>([])


    const [headerValue,setHeaderValue] = useState("Dividends")

    useEffect(() => {
        document.title = "Dividends";
        setbuttonBackgroundColor('bg-lime-400');
        setUpdateTickerValue(updateTickerValue);
        setHeaderValue(headerValue);
        setClassValuesLeft(classValuesLeft);
        setPeriod(period);
     }, []);

    
        
    const onTickerChangeHandler = (tickerValue:string) => {
      if (tickerValue.trim().length > 0)       {
          // looks like a couple of guys that need a reducer
          //console.log('tickerValue: ' + tickerValue)
          setTickerToGet(tickerValue.trim());                   

          setUpdateTickerValue(true);

          
          //props.onSetHeader( props.baseHeader + " - " + tickerValue.trim());
          //console.log("tickerValue: " + tickerValue); 
          
          
      }
   }

   const onPeriodsChangeHandler = (periodsToUse:string) => {
    if (periodsToUse.trim().length > 0)       {
        // looks like a couple of guys that need a reducer
        //console.log('periodsToUse: ' + periodsToUse)
        setPeriodsToShow(Number(periodsToUse.trim()));

        setUpdateTickerValue(true);

        
        //props.onSetHeader( props.baseHeader + " - " + tickerValue.trim());
        //console.log("periodsToShow: " + periodsToShow); 
        
        
    }
   }

   const onSetCurrentQuote=(currentQuoteIn:Quote_V3,dividendDataIn:HistoricalDividendData[])=>
    {
        //console.log("currentQuoteIn: " + JSON.stringify(currentQuoteIn));
        //console.log("dividendDataIn: " + JSON.stringify(dividendDataIn));
        //console.log("onSetCurrentQuote, dividendDataIn.length: " + dividendDataIn.length);
        setcurrentQuote(currentQuoteIn);       
        setDividendData(dividendDataIn);
    }
/*
    const [annualChecked, setAnnualChecked] = React.useState(false);

    const annualChangeHandler = () => {
      setAnnualChecked(!annualChecked);
      if(!annualChecked === true)
      {
        setPeriod('annual')
      }
      else
      {
        setPeriod('quarter')
        //console.log("setting period: quarter");
      }
    };
*/
    useEffect(() => {  
      //console.log("calling load the dividend data into the spreadsheet")

      //console.log("dividendData: " + JSON.stringify(dividendData));
      //console.log("dividendData.length: " + dividendData.length);

      if((dividendData!==undefined)&&(dividendData.length>0))
      {        
        const historicalDividendData  = loadHistoricalMetricsData(dividendData);

              //console.log("calling setCol")
              setCol(buildColumnTitles())

              //console.log("calling buildRowTitles")
              setRow(buildRowTitles(historicalDividendData,periodsToShow))

              //console.log("calling buildHstoricalDataToShow")
              setData(buildHstoricalDataToShow(historicalDividendData,periodsToShow))

              //console.log("calling calculateYield")
              setCurrentYield(calculateYield(historicalDividendData,currentQuote))
          
      }
      else{
        setData([])
        setCol([])
        setRow([])
        setCurrentYield(0.0)
      }
  }, [currentQuote, dividendData,periodsToShow]);


return (
    

    <div className='bg-gray-100 grid grid-cols-12 gap-4'>
      <div className={classValuesLeft}>
    </div>

    <div className='col-start-1 col-span-12'>
            <header className="bg-lime-100 text-lime-600 text-3xl font-bold h-18 justify-items-center p-1">
                <div>
                    {headerValue}
                </div>
                <div className='text-green-600 text-3xl font-bold'>
                    Yield: {currentYield} %
                </div>
            </header>        
    </div>

      <div className='col-start-5 col-span-4'>

          <StatementInput  onTickerValue={onTickerChangeHandler} onPeriodsValue={onPeriodsChangeHandler} currentTicker={tickerToGet}
              containerBackGround= {buttonBackgroundColor} runningStatement={false}></StatementInput> 
          <HistoricalDividendQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote}/>
               
      </div>

      <div className='col-start-1 col-span-12 justify-items-center p-1'>

          <SpreadSheet data={data} columnLabels={col} rowLabels={row} />
        
      </div>    

    </div>

    )
}
export default HistoricalDividends;