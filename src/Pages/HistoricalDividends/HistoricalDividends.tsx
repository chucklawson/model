import {useEffect, useState } from "react";
import SpreadSheet from 'react-spreadsheet'
import HistoricalDividendQuote from '../../Components/ApiCalls/HistoricalDividendQuote.jsx';
import {loadHistoricalMetricsData,buildColumnTitles,buildRowTitles,buildHstoricalDataToShow,calculateYield} from '../../Lib/DividendData/CollectHistoricalDividendData'
import type HistoricalDividendData from "../../Lib/DividendData/HistoricalDividendData.tsx";
import type Quote_V3 from "../../Lib/Quote_V3.ts";

interface rowValues{
  value: string|number;
}

const HistoricalDividends = () =>{


    const [tickerToGet, setTickerToGet] = useState('');
    const [tickerInput, setTickerInput] = useState('');
    const [periodsInput, setPeriodsInput] = useState('8');
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

    const [headerValue,setHeaderValue] = useState("Historical Dividends")

    useEffect(() => {
        document.title = "Dividends";
        setbuttonBackgroundColor('bg-lime-400');
        setUpdateTickerValue(updateTickerValue);
        setHeaderValue(headerValue);
        setClassValuesLeft(classValuesLeft);
        setPeriod(period);
     }, []);

    const handleUpdateClick = () => {
      // Update the actual state when button is clicked
      if (tickerInput.trim().length > 0) {
        setTickerToGet(tickerInput.trim().toUpperCase());
        setPeriodsToShow(Number(periodsInput) || 8);
      }
    };

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
    <div className="text-center overflow-x-auto w-full">

      <header className="bg-gradient-to-r from-lime-100 to-emerald-100 rounded-lg shadow-md p-4 mb-3">
        <h1 className="text-2xl font-bold text-lime-700">
          {headerValue}
        </h1>
      </header>

      <div className="flex justify-center mb-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4 max-w-4xl w-full">

          {/* Current Yield Display */}
          {currentYield > 0 && (
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm p-4 border-2 border-green-200">
                <div className="text-sm font-semibold text-slate-600 mb-1">
                  Current Yield
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {currentYield.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={(e) => { e.preventDefault(); }} className="w-full mb-6">
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
            </div>
          </form>

          {/* Hidden component for data fetching */}
          <div className="hidden">
            <HistoricalDividendQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote}/>
          </div>

        </div>
      </div>

      <div className="flex justify-center px-4">
        <div className="w-full max-w-7xl">
          <div className="overflow-auto max-h-[calc(100vh-400px)] rounded-xl border border-slate-200 shadow-lg sticky-spreadsheet">
            <style>{`
              .sticky-spreadsheet table thead,
              .sticky-spreadsheet .Spreadsheet__table thead,
              .sticky-spreadsheet thead {
                position: sticky !important;
                top: 0 !important;
                z-index: 10 !important;
                background: linear-gradient(to right, rgb(243 244 246), rgb(226 232 240)) !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
              }
              .sticky-spreadsheet table thead th,
              .sticky-spreadsheet thead th,
              .sticky-spreadsheet table thead td,
              .sticky-spreadsheet thead td {
                position: sticky !important;
                top: 0 !important;
                background: linear-gradient(to right, rgb(243 244 246), rgb(226 232 240)) !important;
                z-index: 10 !important;
              }
              .sticky-spreadsheet table tr:first-child th,
              .sticky-spreadsheet table tr:first-child td {
                position: sticky !important;
                top: 0 !important;
                background: linear-gradient(to right, rgb(243 244 246), rgb(226 232 240)) !important;
                z-index: 10 !important;
              }
            `}</style>
            <SpreadSheet data={data} columnLabels={col} rowLabels={row} />
          </div>
        </div>
      </div>

    </div>
  )
}
export default HistoricalDividends;