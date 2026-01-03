/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import {useEffect, useState } from "react";
import SpreadSheet from 'react-spreadsheet'
import StatementInput from '../../Components/SatementInput/StatementInput.jsx';
import StatementKeyMetrics from '../../Components/ApiCalls/StatementKeyMetrics';
import {loadStatmentMetricsData,buildColumnTitlesByPeriod,buildRowTitles,buildDataToShow} from '../../Lib/StatementsData/CollectStatementData'
import type Quote_V3 from "../../Lib/Quote_V3.ts";
import type StatementAnalysisKeyMetricsData from "../../Lib/StatementsData/StatementAnalysisKeyMetricsData.ts";


interface rowValues{
  value: string|number;
}

const SummarySpreadSheet = () =>{


  const [tickerToGet, setTickerToGet] = useState<string>('');
  const [updateTickerValue, setUpdateTickerValue] = useState(false);
  const [buttonBackgroundColor,setbuttonBackgroundColor]= useState('bg-lime-400');
  const [classValuesLeft,setClassValuesLeft]=useState('')
  const [currentQuote, setcurrentQuote] = useState({});
  const [statmentAnalysisKeyMetrics,setStatmentAnalysisKeyMetrics] = useState<StatementAnalysisKeyMetricsData[]>([]);
  const [periodsToShow, setPeriodsToShow] = useState(8);
  const [period,setPeriod] = useState('quarter')


  const [data, setData] = useState<rowValues[][]>([])

  const [col,setCol]=useState<string[]>([])
  const [row,setRow]=useState<string[]>([])


  const [headerValue,setHeaderValue] = useState("Key Metrics - Summary")

  useEffect(() => {
    document.title = "StatementSpreadSheet";
    setbuttonBackgroundColor('bg-lime-400');
    setUpdateTickerValue(updateTickerValue);
    setClassValuesLeft(classValuesLeft);
    setHeaderValue(headerValue);
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

    }
  }

  const onSetCurrentQuote=(currentQuoteIn:Quote_V3,statmentAnalysisKeyMetrics:StatementAnalysisKeyMetricsData[])=>
  {
    setcurrentQuote(currentQuoteIn);
    setStatmentAnalysisKeyMetrics(statmentAnalysisKeyMetrics)
  }

  const [annualChecked, setAnnualChecked] = React.useState(false);

  const annualChangeHandler = () => {
    setAnnualChecked(!annualChecked);
    if(!annualChecked === true)
    {
      setPeriod('annual')
      //console.log("setting period: annual");
    }
    else
    {
      setPeriod('quarter')
      //console.log("setting period: quarter");
    }
  };

  useEffect(() => {
    //console.log("calling dailyValues")
    if(statmentAnalysisKeyMetrics[0]!==undefined)
    {
      const statementData:StatementAnalysisKeyMetricsData[]= loadStatmentMetricsData(statmentAnalysisKeyMetrics);
      //console.log("statmentData length: " + statementData.length);
      //   console.log("statmentData: " + statementData);
      //console.log("Generating Price to Equity")
      //setPriceEarningsData(getPriceToEarningsChartData(statmentAnalysisKeyMetrics))
      //console.log("currentQuote: " + JSON.stringify(currentQuote));
      //console.log("statmentAnalysisKeyMetrics: " + JSON.stringify(statmentAnalysisKeyMetrics));

      setCol(buildColumnTitlesByPeriod(statementData,periodsToShow))

      setRow(buildRowTitles())

      setData(buildDataToShow(statementData,periodsToShow))

    }
  }, [currentQuote, statmentAnalysisKeyMetrics,periodsToShow,period]);


  return (

    <div className='bg-gray-100 min-w-[1200px]'>
    <div className='grid grid-cols-12 gap-4 w-[1200px] min-w-[1200px]'>
      <div className={classValuesLeft}>
      </div>

      <div className='col-start-1 col-span-12'>
        <header className="bg-lime-100 text-lime-600 text-3xl font-bold h-18 justify-items-center p-1">
          <div>
            {headerValue}
          </div>
        </header>
      </div>

      <div className='col-start-5 col-span-4'>
        <div className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3'>
          <label className='pl-2 pr-2'>
            <input
              type="checkbox"
              checked={annualChecked}
              onChange={annualChangeHandler}
            />
            Use Annual Periods vs. Quarterly
          </label>
        </div>
        <StatementInput  onTickerValue={onTickerChangeHandler} onPeriodsValue={onPeriodsChangeHandler} currentTicker={tickerToGet}
                         containerBackGround= {buttonBackgroundColor} runningStatement={true}></StatementInput>
        <StatementKeyMetrics stockSymbol={tickerToGet} period={period} onSetCurrentQuote={onSetCurrentQuote}/>

      </div>

      <div className='col-start-1 col-span-12 justify-items-center p-1'>

        <SpreadSheet data={data} columnLabels={col} rowLabels={row}/>

      </div>

    </div>
    </div>

  )
}
export default SummarySpreadSheet;