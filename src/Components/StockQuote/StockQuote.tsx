import React, { useState, useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import type AnalysisKeyMetricsItem_V3 from '../../Lib/AnalysisKeyMetricsItem_V3.ts'
import type HistoricalPriceFull_V3 from '../../Lib/HistoricalPriceFull_V3.ts';


interface  StockQuoteProps{
  stockSymbol: string;
  onSetCurrentQuote(currentQuoteIn: Quote_V3, timeSeriesIn:HistoricalPriceFull_V3[], adjustedTimeSeriesIn:HistoricalPriceFull_V3[], statmentAnalysisKeyMetrics:AnalysisKeyMetricsItem_V3[] ):void;
  latestStartDate: string;
  latestEndDate: string;
  adjustedStartDate: string;
}

const StockQuote = (props:StockQuoteProps) => {

    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    const currentInfo= `https://financialmodelingprep.com/api/v3/quote/${props.stockSymbol}?apikey=${apiKey}`;
    const timeSeries = `https://financialmodelingprep.com/api/v3/historical-price-full/${props.stockSymbol}?from=${props.latestStartDate}&to=${props.latestEndDate}&apikey=${apiKey}`
    const adjustedTimeSeries = `https://financialmodelingprep.com/api/v3/historical-price-full/${props.stockSymbol}?from=${props.adjustedStartDate}&to=${props.latestEndDate}&apikey=${apiKey}`
    const statementAnalysisKeyMetrics = `https://financialmodelingprep.com/api/v3/key-metrics/${props.stockSymbol}?period=quarter&apikey=${apiKey}`
    //let williams =`https://financialmodelingprep.com/api/v3/technical_indicator/1day/${props.stockSymbol}?type=williams&period=10&apikey=${apiKey}`

    //console.log('currentInfo:  ' + currentInfo)
    //console.log('thetimeSeriesQuote:  ' + timeSeries)
    //console.log('props.stockSymbol: ' + props.stockSymbol)

/*
    const [currentQuote, setCurrentQuote] = useState <Quote_V3>(
      {
        symbol: "",
      name: "",
      price: 0,
      changePercentage: 0,
      change: 0,
      dayLow: 0,
      dayHigh: 0,
      yearHigh: 0,
      yearLow: 0,
      marketCap: 0,
      priceAvg50: 0,
      priceAvg200: 0,
      exchange: "",
      volume: 0,
      avgVolume: 0,
      open: 0,
      previousClose: 0,
      eps: 0,
      pe: 0,
      earningsAnnouncement:"",
      sharesOutstanding: 0,
      timestamp: 0});
*/
    const [currentQuote, setCurrentQuote] = useState <Quote_V3>();
    const [timeSeriesEntries, setTimeSeriesEntries] = useState<HistoricalPriceFull_V3[]>([]);
    const [adjustedTimeSeriesEntries, setAdjustedTimeSeriesEntries] = useState<HistoricalPriceFull_V3[]>([]);
    const [statementAnalysisKeyMetricsEntries,setStatementAnalysisKeyMetricsEntries]= useState<AnalysisKeyMetricsItem_V3[]>([]);
    //const [larryWilliamsEntries,setLarryWilliamsEntries]= useState({});

  // This is to get rid of errors
  useEffect(() => {
    setTimeSeriesEntries(timeSeriesEntries);
    setAdjustedTimeSeriesEntries(adjustedTimeSeriesEntries);
    setStatementAnalysisKeyMetricsEntries(statementAnalysisKeyMetricsEntries);
  },[])


    useEffect(() => { 
      if(props.stockSymbol.length<1)
      {
        return;
      }     
      //console.log("props startDate: " + props.latestStartDate)
      //console.log("props endDate: " + props.latestEndDate)
      //console.log("props adjustedStartDate: " + props.adjustedStartDate)
      if(props.latestStartDate.length > 0)
      {
      Promise.all([
        fetch(currentInfo),
        fetch(timeSeries),
        fetch(adjustedTimeSeries),
        fetch(statementAnalysisKeyMetrics)//,
        //fetch(williams)
      ]).then(function (responses) {
        // Get a JSON object from each of the responses
        return Promise.all(responses.map(function (response) {
          return response.json();
        }));
      }).then(function (data) {
        // Could Log the data to the console
        // You would do something with both sets of data here       
        //console.log("The data: " + data);
        if(data[0][0].symbol !== undefined){

          // currently sets the quote data
          //setDataObject(data[0][0],data[1].historical,data[2].historical,data[3],data[4])
          //setDataObject(data[0][0],data[1].historical,data[2].historical,data[3])
          //sets Quote_V3
          //console.log('The object: '+ JSON.stringify(data[0]))
          const parsedQuoteData: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
          const aQuote: Quote_V3 = parsedQuoteData[0];
          //console.log('myItem ' + aQuote.symbol);

          //sets timeSeries
          const parsedTimeSeries: HistoricalPriceFull_V3[] = JSON.parse(JSON.stringify(data[1].historical));
          const aTimeSeries: HistoricalPriceFull_V3[] = parsedTimeSeries;
          //console.log('aTimeSeries adjClose: ' + aTimeSeries[0].adjClose);

          //sets sdjusted timeSeries
          const parsedAdjustedTimeSeries: HistoricalPriceFull_V3[] = JSON.parse(JSON.stringify(data[2].historical));
          const aAdjustedTimeSeries: HistoricalPriceFull_V3[] = parsedAdjustedTimeSeries;
          //console.log('aAdjustedTimeSeries adjClose: ' + aAdjustedTimeSeries[0].adjClose);

          const parsedStatmentAnalysiss: AnalysisKeyMetricsItem_V3[] = JSON.parse(JSON.stringify(data[3]));
          const aStatementAnalysis: AnalysisKeyMetricsItem_V3[] = parsedStatmentAnalysiss;
          //console.log('aStatementAnalysis averageReceivables: ' + aStatementAnalysis[0].averageReceivables);

          setDataObject(aQuote,aTimeSeries,aAdjustedTimeSeries,aStatementAnalysis)


          //console.log('The Second object: '+ JSON.stringify(data[1]))
          //console.log('Histoical symbol: '+ data[1].symbol)
          //console.log('Historical date at address zero: '+ data[1].historical[0].date)

          //console.log('The THIRD object: '+ JSON.stringify(data[2]))
          //console.log('Second Histoical symbol: '+ data[2].symbol)
          //console.log('Second set of Historical date at address zero: '+ data[2].historical[0].date)

          //console.log('Second Histoical symbol: '+ data[2].symbol)
          //console.log('Second set of Historical date at address zero: '+ data[2].historical[0].date)

          //console.log('The FOURTH object: '+ JSON.stringify(data[3][0]))
          //console.log('The FOURTH object length: '+ data[3].length)

        } 
      }).catch(function (error) {
        // if there's an error, log it
        //console.log('Logging Error')
        console.log(error);
      })
      }
    //},[currentInfo,timeSeries,adjustedTimeSeries,statementAnalysisKeyMetrics,williams])
      },[currentInfo,timeSeries,adjustedTimeSeries,statementAnalysisKeyMetrics])


    //const setDataObject = (theQuote,timeSeries,adjustedTimeSeries,statmentAnalysis,larryWilliams)=>{
    const setDataObject = (theQuote:Quote_V3,timeSeries:HistoricalPriceFull_V3[],adjustedTimeSeries:HistoricalPriceFull_V3[],statmentAnalysis:AnalysisKeyMetricsItem_V3[])=>{

        setTimeSeriesEntries(timeSeries);
        setAdjustedTimeSeriesEntries(adjustedTimeSeries);
        setStatementAnalysisKeyMetricsEntries(statmentAnalysis);
        //console.log("theQuote: " + theQuote.open)
        setCurrentQuote(theQuote)
        //setLarryWilliamsEntries(larryWilliams);
        //props.onSetCurrentQuote(theQuote,timeSeries,adjustedTimeSeries,statmentAnalysis,larryWilliams);
        props.onSetCurrentQuote(theQuote,timeSeries,adjustedTimeSeries,statmentAnalysis);
    }
    /*
  const [currentQuote, setCurrentQuote] = useState({});
  const [timeSeriesEntries, setTimeSeriesEntries] = useState({});
  const [adjustedTimeSeriesEntries, setAdjustedTimeSeriesEntries] = useState({});
  const [statementAnalysisKeyMetricsEntries,setStatementAnalysisKeyMetricsEntries]= useState({});
  const [larryWilliamsEntries,setLarryWilliamsEntries]= useState({});
*/
    useEffect (() => {
        //console.log('currentQuote: ' + currentQuote.symbol)
    },
    //[currentQuote,timeSeriesEntries,adjustedTimeSeriesEntries,statementAnalysisKeyMetricsEntries])
      [currentQuote])

    if(currentQuote === undefined)
    return(
        <React.Fragment/>
    )

    //console.log("startDate: " + props.latestStartDate)
    //console.log("endDate: " + props.latestEndDate)


    return <React.Fragment/>   
};

export default StockQuote;