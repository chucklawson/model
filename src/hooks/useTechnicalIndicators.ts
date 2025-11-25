import { useState, useEffect } from 'react';
import type HistoricalPriceFull_V3 from '../Lib/HistoricalPriceFull_V3';
import type AnalysisKeyMetricsItem_V3 from '../Lib/AnalysisKeyMetricsItem_V3';
import type StandardCharData from '../Lib/ChartData/StandardChartData';
import type RSIChartData from '../Lib/ChartData/RSIChartData';
import type StochasticChartData from '../Lib/ChartData/StochasticChartData';
import type StatementAnalysisKeyMetricsData from '../Lib/ChartData/StatementAnalysisKeyMetricsData';
import { CalculateAverages } from '../Lib/CalculateAverages/CalculateAverages';

interface UseTechnicalIndicatorsParams {
  timeSeries: HistoricalPriceFull_V3[];
  adjustedTimeSeries: HistoricalPriceFull_V3[];
  statmentAnalysisKeyMetrics: AnalysisKeyMetricsItem_V3[];
  bollingerChecked: boolean;
  rsiChecked: boolean;
  stochasticChecked: boolean;
  priceEquityChecked: boolean;
}

interface UseTechnicalIndicatorsResult {
  graphData: StandardCharData[];
  rsiData: RSIChartData[];
  stochasticData: StochasticChartData[];
  priceEarningsData: StatementAnalysisKeyMetricsData[];
  slope: number;
}

export function useTechnicalIndicators({
  timeSeries,
  adjustedTimeSeries,
  statmentAnalysisKeyMetrics,
  bollingerChecked,
  rsiChecked,
  stochasticChecked,
  priceEquityChecked
}: UseTechnicalIndicatorsParams): UseTechnicalIndicatorsResult {
  const [graphData, setGraphData] = useState<StandardCharData[]>([]);
  const [rsiData, setRsiData] = useState<RSIChartData[]>([]);
  const [stochasticData, setStochasticData] = useState<StochasticChartData[]>([]);
  const [priceEarningsData, setPriceEarningsData] = useState<StatementAnalysisKeyMetricsData[]>([]);
  const [slope, setSlope] = useState(0.0);

  useEffect(() => {
    if (timeSeries[0] !== undefined && timeSeries.length > 1) {
      const calculateAverages: CalculateAverages = new CalculateAverages();
      let newData = null;

      // Check if timeSeries needs to be reversed
      if (new Date(timeSeries[timeSeries.length - 1].date) < new Date(timeSeries[timeSeries.length - 2].date)) {
        newData = calculateAverages.dailyValues(timeSeries.reverse(), adjustedTimeSeries.reverse());
      } else {
        newData = calculateAverages.dailyValues(timeSeries, adjustedTimeSeries);
      }

      // Add Bollinger Bands if checked
      if (bollingerChecked) {
        newData = calculateAverages.bollingerBands(timeSeries, adjustedTimeSeries, newData!);
      }

      // Calculate RSI if checked
      if (rsiChecked) {
        setRsiData(calculateAverages.getRsiChartData(timeSeries, adjustedTimeSeries)!);
      }

      // Calculate Stochastic if checked
      if (stochasticChecked) {
        setStochasticData(calculateAverages.getStochasticChartData(timeSeries, adjustedTimeSeries)!);
      }

      // Calculate Price to Earnings if checked
      if (priceEquityChecked) {
        setPriceEarningsData(calculateAverages.getPriceToEarningsChartData(statmentAnalysisKeyMetrics)!);
      }

      setGraphData(newData!);
    }
  }, [timeSeries, adjustedTimeSeries, statmentAnalysisKeyMetrics, bollingerChecked, rsiChecked, stochasticChecked, priceEquityChecked]);

  // Calculate slope from graph data
  useEffect(() => {
    if (graphData.length !== undefined && graphData.length > 1) {
      const Y1forSlope: number = graphData[graphData.length - 1].expMovingAverage;
      const Y2forSlope: number = graphData[graphData.length - 2].expMovingAverage;
      const tempSlope = Y1forSlope - Y2forSlope;
      setSlope(Number(tempSlope.toFixed(2)));
    }
  }, [graphData]);

  return {
    graphData,
    rsiData,
    stochasticData,
    priceEarningsData,
    slope
  };
}
