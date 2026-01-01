import  React, { useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import type HistoricalDividendData from "../../Lib/DividendData/HistoricalDividendData.tsx";
import { useDividendData } from '../../hooks/useDividendData';
import logger from '../../utils/logger';

/*
<HistoricalDividendQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote}/>
*/

 interface  HistoricalDividendQuoteProps{
   stockSymbol: string;
   onSetCurrentQuote(currentQuoteIn:Quote_V3,dividendDataIn:HistoricalDividendData[]):void;
 }
const HistoricalDividendQuote = (props:HistoricalDividendQuoteProps) => {

    // Use the custom hook to fetch dividend data
    const { quote, dividendData, loading, error } = useDividendData({
      stockSymbol: props.stockSymbol
    });

    // Call parent callback when data is ready (only after loading completes)
    useEffect(() => {
      if (quote && !loading) {
        props.onSetCurrentQuote(quote, dividendData);
      }
    }, [quote, dividendData, loading, props.onSetCurrentQuote]);

    // Handle error state
    if (error) {
      logger.error({ error, ticker: props.stockSymbol }, 'Dividend data fetch error in component');
      return <React.Fragment/>;
    }

    // Handle loading or no data state
    if (loading || !quote) {
      return <React.Fragment/>;
    }

    return <React.Fragment/>   
};

export default HistoricalDividendQuote;