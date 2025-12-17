import { memo } from 'react';

interface ChartControlsProps {
  bollingerChecked: boolean;
  rsiChecked: boolean;
  stochasticChecked: boolean;
  priceEquityChecked: boolean;
  buysChecked: boolean;
  onBollingerChange: () => void;
  onRsiChange: () => void;
  onStochasticChange: () => void;
  onPriceEquityChange: () => void;
  onBuysChange: () => void;
}

const ChartControls = (props: ChartControlsProps) => {
  return (
    <div className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3'>
      <label className='pl-2 pr-2'>
        <input
          type="checkbox"
          checked={props.bollingerChecked}
          onChange={props.onBollingerChange}
        />
        Bollinger Bands
      </label>

      <label className='pl-2 pr-2'>
        <input
          type="checkbox"
          checked={props.rsiChecked}
          onChange={props.onRsiChange}
        />
        RSI Oscillator
      </label>

      <label className='pl-2 pr-2'>
        <input
          type="checkbox"
          checked={props.stochasticChecked}
          onChange={props.onStochasticChange}
        />
        Stochastic Oscillator
      </label>

      <label className='pl-2 pr-2'>
        <input
          type="checkbox"
          checked={props.priceEquityChecked}
          onChange={props.onPriceEquityChange}
        />
        Price to Earnings
      </label>

      <label className='pl-2 pr-2'>
        <input
          type="checkbox"
          checked={props.buysChecked}
          onChange={props.onBuysChange}
        />
        Purchase Indicators
      </label>
    </div>
  );
};

export default memo(ChartControls);
