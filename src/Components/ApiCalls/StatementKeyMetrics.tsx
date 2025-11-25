import React, { useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import StatementAnalysisKeyMetricsData from '../../Lib/StatementsData/StatementAnalysisKeyMetricsData'
import { useKeyMetrics } from '../../hooks/useKeyMetrics';

/*
<StatementKeyMetrics stockSymbol={tickerToGet} period={period} onSetCurrentQuote={onSetCurrentQuote}/>
*/

interface  StatementKeyMetricsProps{
  stockSymbol: string;
  period: string;
  onSetCurrentQuote(currentQuoteIn:Quote_V3,statementAnalysisKeyMetrics:StatementAnalysisKeyMetricsData[]):void;
}

const StatementKeyMetrics = (props:StatementKeyMetricsProps)=> {

    // Use the custom hook to fetch key metrics
    const { quote, keyMetrics, loading, error } = useKeyMetrics({
      stockSymbol: props.stockSymbol,
      period: props.period
    });

    // Call parent callback when data is ready (only after loading completes)
    useEffect(() => {
      if (quote && !loading) {
        props.onSetCurrentQuote(quote, keyMetrics);
      }
    }, [quote, keyMetrics, loading, props.onSetCurrentQuote]);

    // Handle error state
    if (error) {
      console.error('Key metrics fetch error:', error);
      return <React.Fragment/>;
    }

    // Handle loading or no data state
    if (loading || !quote) {
      return <React.Fragment/>;
    }

    return <React.Fragment/>   
};

export default StatementKeyMetrics;