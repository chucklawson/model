import React, { useEffect } from 'react';
import type Quote_V3 from "../../Lib/Quote_V3.ts"
import type AnalysisKeyMetricsItem_V3 from '../../Lib/AnalysisKeyMetricsItem_V3.ts'
import type HistoricalPriceFull_V3 from '../../Lib/HistoricalPriceFull_V3.ts';
import { useStockQuote } from '../../hooks/useStockQuote';


interface  StockQuoteProps{
  stockSymbol: string;
  onSetCurrentQuote(currentQuoteIn: Quote_V3, timeSeriesIn:HistoricalPriceFull_V3[], adjustedTimeSeriesIn:HistoricalPriceFull_V3[], statementAnalysisKeyMetrics:AnalysisKeyMetricsItem_V3[] ):void;
  latestStartDate: string;
  latestEndDate: string;
  adjustedStartDate: string;
}

const StockQuote = (props:StockQuoteProps) => {

    // Use the custom hook to fetch stock data
    const { quote, timeSeries, adjustedTimeSeries, keyMetrics, loading, error } = useStockQuote({
      stockSymbol: props.stockSymbol,
      latestStartDate: props.latestStartDate,
      latestEndDate: props.latestEndDate,
      adjustedStartDate: props.adjustedStartDate
    });

    // Call parent callback when data is ready (only after loading completes)
    useEffect(() => {
      if (quote && !loading) {
        props.onSetCurrentQuote(quote, timeSeries, adjustedTimeSeries, keyMetrics);
      }
    }, [quote, timeSeries, adjustedTimeSeries, keyMetrics, loading, props.onSetCurrentQuote]);

    // Handle error state
    if (error) {
      console.error('Stock quote fetch error:', error);
      return <React.Fragment/>;
    }

    // Handle loading or no data state
    if (loading || !quote) {
      return <React.Fragment/>;
    }

    return <React.Fragment/>   
};

export default StockQuote;