import  React, { useState, useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import type HistoricalDividendData from "../../Lib/DividendData/HistoricalDividendData.tsx";
//import type HistoricalPriceFull_V3 from "../../Lib/HistoricalPriceFull_V3.ts";
//import type AnalysisKeyMetricsItem_V3 from "../../Lib/AnalysisKeyMetricsItem_V3.ts";

/*
<HistoricalDividendQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote}/>
*/

 interface  HistoricalDividendQuoteProps{
   stockSymbol: string;
   onSetCurrentQuote(currentQuoteIn:Quote_V3,dividendDataIn:HistoricalDividendData[]):void;
 }
const HistoricalDividendQuote = (props:HistoricalDividendQuoteProps) => {

    const apiKey = import.meta.env.VITE_FMP_API_KEY;
    const currentInfo= `https://financialmodelingprep.com/api/v3/quote/${props.stockSymbol}?apikey=${apiKey}`;
    const dividendInfo = `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${props.stockSymbol}?apikey=${apiKey}`;

    //console.log('currentInfo:  ' + currentInfo)
    //console.log('dividendInfo:  ' + dividendInfo)


    const [currentQuote, setCurrentQuote] = useState({});
    const [dividentEntries,setDividendEntries]= useState({});

  useEffect(() => {
    setDividendEntries(dividentEntries);
    }, []);

    useEffect(() => { 
      if(props.stockSymbol.length<1)
      {
        return;
      }   
      //{
      Promise.all([
        fetch(currentInfo),
        fetch(dividendInfo)
      ]).then(function (responses) {
        // Get a JSON object from each of the responses
        return Promise.all(responses.map(function (response) {
          return response.json();
        }));
      }).then(function (data) {
        // Could Log the data to the console
        // You would do something with both sets of data here       
        //console.log("The data: " + data);

        if(data[0][0].symbol !== undefined) {

          // currently sets the quote data
          //setDataObject(data[0][0],data[1].historical,data[2].historical,data[3],data[4])
          //setDataObject(data[0][0],data[1].historical,data[2].historical,data[3])
          //sets Quote_V3
          //console.log('The object: '+ JSON.stringify(data[0]))
          const parsedQuoteData: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
          const aQuote: Quote_V3 = parsedQuoteData[0];

          const parsedStatmentAnalysiss: HistoricalDividendData[] = JSON.parse(JSON.stringify(data[1].historical));
          const aSetOfHistoricalDividendData: HistoricalDividendData[] = parsedStatmentAnalysiss;


          //console.log('aSetOfHistoricalDividendData.length: ' + aSetOfHistoricalDividendData.length);

          setDataObject(aQuote, aSetOfHistoricalDividendData)
          //setDataObject(aQuote,data[1])

          /*
          if(data[0][0].symbol !== undefined){
            // currently sets the quote data
            setDataObject(data[0][0],data[1])
            //console.log('The object: '+ JSON.stringify(data[0]))
            //console.log('The Second object length: '+ data[1].length)
            //console.log('The Second object: '+ JSON.stringify(data[1]))
            //console.log('Histoical symbol: '+ data[1].symbol)
            //console.log('Historical date at address zero: '+ data[1].historical[0].date)
          } */
        }
      }).catch(function (error) {
        // if there's an error, log it
        console.log(error);
      })
     // }
    },[currentInfo,dividendInfo])


    const setDataObject = (theQuote:Quote_V3,dividendData:HistoricalDividendData[])=>{
       // console.log("setting data symbol as: " + data.symbol)
        setCurrentQuote(theQuote)        
        setDividendEntries(dividendData);
        //console.log('setDataObject dividendData[0].dividend: ' + dividendData[0].dividend)
        //console.log('dividendData: ' + JSON.stringify(dividendData))

        props.onSetCurrentQuote(theQuote,dividendData);
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

export default HistoricalDividendQuote;