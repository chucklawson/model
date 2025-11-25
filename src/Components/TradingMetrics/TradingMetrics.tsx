import { memo } from 'react';
import upGreenRight from '../../Images/UpGreenRight.png';
import downRedRight from '../../Images/DownRedRight.png';

interface TradingMetricsProps {
  profitLossOneEntry: number;
  percentGainLoss: number;
  todaysGain: number;
  todaysPercentageGain: number;
  gainIsPositive: boolean;
  slope: number;
}

const TradingMetrics = (props: TradingMetricsProps) => {
  return (
    <>
      {props.profitLossOneEntry >= 0.0 ? (
        <div className="text-1xl text-green-600 font-bold underline h-5 mt-2 my-3">
          Profit/Loss: ${props.profitLossOneEntry} .. or .. {props.percentGainLoss} %
        </div>
      ) : (
        <div className="text-1xl text-red-600 font-bold underline h-5 mt-2 my-3">
          Profit/Loss: ${props.profitLossOneEntry} .. or .. {props.percentGainLoss} %
        </div>
      )}

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

      {props.slope >= 0.0 ? (
        <div className='text-green-600 text-3xl font-bold'>
          <img className="inline-block w-10 h-8 ml-7" src={upGreenRight} alt=""></img>
        </div>
      ) : (
        <div className='text-red-600 text-3xl font-bold'>
          <img className="inline-block w-12 h-10 ml-7" src={downRedRight} alt=""></img>
        </div>
      )}
    </>
  );
};

export default memo(TradingMetrics);
