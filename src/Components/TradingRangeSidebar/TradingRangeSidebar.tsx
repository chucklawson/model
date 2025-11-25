import { memo } from 'react';
import TradingRangeIndicator from '../TradingRangeIndicator/TradingRangeIndicator';
import PriceEarningsChart from '../../InvestmentCharts/PriceEarningsChart';
import type Quote_V3 from '../../Lib/Quote_V3';
import type { BuyPoints } from '../../Lib/ProfitLoss/GetBuyPoints';
import type StatementAnalysisKeyMetricsData from '../../Lib/ChartData/StatementAnalysisKeyMetricsData';

interface TradingRangeSidebarProps {
  lowRangeValueOneYear: string;
  rangeValueOneYear: string;
  highRangeValueOneYear: string;
  percentageChangeFromTwelveMonthHigh: number;
  buyPoints: BuyPoints;
  lowRangeValue: string;
  rangeValue: string;
  highRangeValue: string;
  currentQuote: Quote_V3;
  showChart: boolean;
  priceEarningsData: StatementAnalysisKeyMetricsData[];
  priceEquityChecked: boolean;
  widthOfStroke: number;
  todaysGain: number;
  todaysPercentageGain: number;
  gainIsPositive: boolean;
  percentageChangeAcrossRange: number;
}

const TradingRangeSidebar = (props: TradingRangeSidebarProps) => {
  return (
    <div className='col-start-10 col-span-2'>
      <div className='block mb-10'>
        <TradingRangeIndicator
          heading="Last 12 Months"
          lowRangeValue={props.lowRangeValueOneYear}
          rangeValue={props.rangeValueOneYear}
          highRangeValue={props.highRangeValueOneYear}
          currentQuote={props.currentQuote}
          currentValues={false}
        />

        <div className='p-4 mt-6 mb-10'>
          <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
            Current Price vs. 12 Month High: {props.percentageChangeFromTwelveMonthHigh} %
          </div>

          {Object.keys(props.buyPoints).length > 0 ? (
            <div>
              <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                Down 5%: {props.buyPoints.downFivePercent}, 10%: {props.buyPoints.downTenPercent}
              </div>
              <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                Down 15%: {props.buyPoints.downFifteenPercent}, 20%: {props.buyPoints.downTwentyPercent}
              </div>
              <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                Down 25%: {props.buyPoints.downTwentyFivePercent}, 30%: {props.buyPoints.downThirtyPercent}
              </div>
              <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                Down 35%: {props.buyPoints.downThirtyFivePercent}, 40%: {props.buyPoints.downFortyPercent}
              </div>
              <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                Down 50%: {props.buyPoints.downFiftyPercent}, 60%: {props.buyPoints.downSixtyPercent}
              </div>
            </div>
          ) : ''}
        </div>
      </div>

      <div className='block mb-40'>
        <TradingRangeIndicator
          heading="Today's Range"
          lowRangeValue={props.lowRangeValue}
          rangeValue={props.rangeValue}
          highRangeValue={props.highRangeValue}
          currentQuote={props.currentQuote}
          currentValues={true}
        />
      </div>

      <div className='p-4 mt-6 mb-10'>
        {props.showChart === true ? (
          <div className='justify-items-start'>
            {props.priceEarningsData.length > 0 && props.priceEquityChecked === true ? (
              <div className='ml-1 mt-1'>
                <PriceEarningsChart
                  width={250}
                  height={125}
                  data={props.priceEarningsData}
                  margin={{
                    top: 5,
                    right: 5,
                    left: 5,
                    bottom: 5
                  }}
                  lineWidth={props.widthOfStroke}
                />
              </div>
            ) : <></>}

            {props.gainIsPositive === true ? (
              <div>
                <div className="text-1xl text-green-600 font-bold underline h-5 justify-items-start">
                  Today's Gain: ${props.todaysGain}
                </div>
                <div className="text-1xl text-green-600 font-bold underline h-5">
                  Today's % Gain: {props.todaysPercentageGain} %
                </div>
              </div>
            ) : (
              <div>
                <div className="text-1xl text-red-600 font-bold underline h-5 justify-items-start">
                  Today's Gain: ${props.todaysGain}
                </div>
                <div className="text-1xl text-red-600 font-bold underline h-5">
                  Today's % Gain: {props.todaysPercentageGain} %
                </div>
              </div>
            )}

            {props.percentageChangeAcrossRange >= 0.0 ? (
              <div className="text-1xl text-green-600 font-bold underline h-1">
                Rng chg % Gain: {props.percentageChangeAcrossRange} %
              </div>
            ) : (
              <div className="text-1xl text-red-600 font-bold underline h-1">
                Rng chg % Gain: {props.percentageChangeAcrossRange} %
              </div>
            )}
          </div>
        ) : <></>}
      </div>
    </div>
  );
};

export default memo(TradingRangeSidebar);
