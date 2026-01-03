import React, { useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import StatementAnalysisKeyMetricsData from '../../Lib/StatementsData/StatementAnalysisKeyMetricsData'
import { useKeyMetrics } from '../../hooks/useKeyMetrics';
import logger from '../../utils/logger';

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
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quote, keyMetrics, loading, props.onSetCurrentQuote]);

    // Handle error state
    if (error) {
      logger.error({ error, ticker: props.stockSymbol, period: props.period }, 'Key metrics fetch error in component');
      return <React.Fragment/>;
    }

    // Handle loading or no data state
    if (loading || !quote) {
      return <React.Fragment/>;
    }

    return <React.Fragment/>   
};

export default StatementKeyMetrics;