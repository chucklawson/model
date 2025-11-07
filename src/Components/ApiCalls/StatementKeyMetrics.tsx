import React, { useState, useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import StatementAnalysisKeyMetricsData from '../../Lib/StatementsData/StatementAnalysisKeyMetricsData'

/*
<StatementKeyMetrics stockSymbol={tickerToGet} period={period} onSetCurrentQuote={onSetCurrentQuote}/>
*/

interface  StatementKeyMetricsProps{
  stockSymbol: string;
  period: string;
  onSetCurrentQuote(currentQuoteIn:Quote_V3, statmentAnalysisKeyMetrics:StatementAnalysisKeyMetricsData):void;
}

const StatementKeyMetrics = (props:StatementKeyMetricsProps)=> {
  
    const uniqueValue = '25a5fa6deb331d46e42609787aa281fe';    
    const currentInfo= `https://financialmodelingprep.com/api/v3/quote/${props.stockSymbol}?apikey=${uniqueValue}`;
    const statementAnalysisKeyMetrics = `https://financialmodelingprep.com/api/v3/key-metrics/${props.stockSymbol}?period=${props.period}&apikey=${uniqueValue}`
    
    //console.log('currentInfo:  ' + currentInfo)
    //console.log('thetimeSeriesQuote:  ' + timeSeries)
    //console.log('props.stockSymbol: ' + props.stockSymbol)
    //console.log('props.period: ' + props.period)


    const [currentQuote, setcurrentQuote] = useState({});
    //const [timeSeriesEntries, setTimeSeriesEntries] = useState({});
    //const [adjustedTimeSeriesEntries, setAdjustedTimeSeriesEntries] = useState({});
    //const [statementAnalysisKeyMetricsEntries,setStatementAnalysisKeyMetricsEntries]= useState({});
    //const [larryWilliamsEntries,setLarryWilliamsEntries]= useState({});


    useEffect(() => { 
      if(props.stockSymbol.length<1)
      {
        return;
      }     
      //console.log("props startDate: " + props.latestStartDate)
      //console.log("props endDate: " + props.latestEndDate)
      //console.log("props adjustedStartDate: " + props.adjustedStartDate)
      //if(props.latestStartDate.length > 0)
      //{
      Promise.all([
        fetch(currentInfo),
        fetch(statementAnalysisKeyMetrics)
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
          setDatObjet(data[0][0],data[1])

          //console.log('The object being set at data[0][0]: '+ JSON.stringify(data[0][0]))
          //console.log('The object being set at data[1]: '+ JSON.stringify(data[1]))


          //console.log('The object: '+ JSON.stringify(data[0]))
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

          //console.log('The Second object: '+ JSON.stringify(data[1]))
          //console.log('The Second object length: '+ data[1].length)
        } 
      }).catch(function (error) {
        // if there's an error, log it
        console.log(error);
      })
     // }
    },[currentInfo,statementAnalysisKeyMetrics])


    const setDatObjet = (theQuote:Quote_V3,statmentAnalysis:StatementAnalysisKeyMetricsData)=>{
       // console.log("setting data symbol as: " + data.symbol)
        setcurrentQuote(theQuote)        
        
        //setStatementAnalysisKeyMetricsEntries(statementAnalysisKeyMetrics);
        props.onSetCurrentQuote(theQuote,statmentAnalysis);
    }

    useEffect (() => {
        //console.log('currentQuote: ' + currentQuote.symbol)
    },
    [currentQuote])

    if(currentQuote === undefined)
    return(
        <React.Fragment/>
    )

    //console.log("startDate: " + props.latestStartDate)
    //console.log("endDate: " + props.latestEndDate)


    return <React.Fragment/>   
};

export default StatementKeyMetrics;