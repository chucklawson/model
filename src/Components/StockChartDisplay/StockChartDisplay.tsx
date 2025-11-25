import React, { memo } from 'react';
import InvestmentComposedChar from '../../InvestmentCharts/InvestmentComposedChart';
import RelativeStrengthIndexChart from '../../InvestmentCharts/RelativeStrengthIndexChart';
import StochasitcOscillatorChart from '../../InvestmentCharts/StochasticOscillatorChart';
import TradingMetrics from '../TradingMetrics/TradingMetrics';
import type Quote_V3 from '../../Lib/Quote_V3';
import type StandardCharData from '../../Lib/ChartData/StandardChartData';
import type RSIChartData from '../../Lib/ChartData/RSIChartData';
import type StochasticChartData from '../../Lib/ChartData/StochasticChartData';

interface StockChartDisplayProps {
  currentQuote: Quote_V3;
  graphWidth: number;
  graphData: StandardCharData[];
  rsiData: RSIChartData[];
  stochasticData: StochasticChartData[];
  bollingerChecked: boolean;
  rsiChecked: boolean;
  stochasticChecked: boolean;
  widthOfStroke: number;
  chartMargin: { top: number; right: number; left: number; bottom: number };
  tickerToGet: string;
  totalCost: number;
  profitLossOneEntry: number;
  percentGainLoss: number;
  todaysGain: number;
  todaysPercentageGain: number;
  gainIsPositive: boolean;
  slope: number;
}

const StockChartDisplay = (props: StockChartDisplayProps) => {
  return (
    <div className='justify-self-auto'>
      <div className="text-1xl text-green-600 font-bold underline h-5">
        OPEN ${props.currentQuote.open}, HIGH ${props.currentQuote.dayHigh}, LOW ${props.currentQuote.dayLow}, LAST ${props.currentQuote.price}
      </div>

      <div className='ml-20 mt-5'>
        <InvestmentComposedChar
          width={props.graphWidth}
          height={275}
          data={props.graphData}
          margin={props.chartMargin}
          lineWidth={props.widthOfStroke}
          showBollingerbands={props.bollingerChecked}
          showMean={props.bollingerChecked}
        />
      </div>

      {props.rsiChecked === true && props.rsiData.length !== undefined ? (
        <div className='ml-20 mt-5'>
          <div className="text-1xl text-green-600 font-bold underline h-5">
            RSI Measures - Speed and Magnitude of Price Change Momentum
          </div>
          <RelativeStrengthIndexChart
            width={props.graphWidth}
            height={175}
            data={props.rsiData}
            margin={props.chartMargin}
            lineWidth={props.widthOfStroke}
            overBought={70}
            overSold={30}
          />
        </div>
      ) : <React.Fragment />}

      {props.stochasticChecked === true && props.stochasticData.length !== undefined ? (
        <div className='ml-20 mt-5'>
          <div className="text-1xl text-green-600 font-bold underline h-5">
            Stochastic Measures - Closing Price Momentum
          </div>
          <StochasitcOscillatorChart
            width={props.graphWidth}
            height={175}
            data={props.stochasticData}
            margin={props.chartMargin}
            lineWidth={props.widthOfStroke}
            overBought={80}
            overSold={20}
          />
        </div>
      ) : <React.Fragment />}

      <div className="text-1xl text-green-600 font-bold underline h-5">
        Selected account: {props.tickerToGet}
      </div>
      <div className="text-1xl text-green-600 font-bold underline h-5">
        Closed at: ${props.currentQuote.price}
      </div>
      <div className="text-1xl text-green-600 font-bold underline h-5">
        Total cost: ${props.totalCost}
      </div>

      <TradingMetrics
        profitLossOneEntry={props.profitLossOneEntry}
        percentGainLoss={props.percentGainLoss}
        todaysGain={props.todaysGain}
        todaysPercentageGain={props.todaysPercentageGain}
        gainIsPositive={props.gainIsPositive}
        slope={props.slope}
      />
    </div>
  );
};

export default memo(StockChartDisplay);
