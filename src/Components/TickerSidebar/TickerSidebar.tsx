import { memo } from 'react';
import TickerButton from '../TickerButton/TickerButton';
import type { TickersToEvaluate } from '../../Lib/TickersToEvaluate/TickersToEvaluate';

interface TickerSidebarProps {
  tickerEntries: TickersToEvaluate[];
  selectTickerButtonHandler: (tickerIn: string, currentQuantityOnHandIn: number, totalCostIn: number) => void;
  buttonBackgroundColor: string;
  backgroundLeft: string;
  isLoading?: boolean;
  currentTicker?: string;
}

const TickerSidebar = (props: TickerSidebarProps) => {
  const classValues = `col-start-1 col-span-2 m-5 rounded-md ${props.backgroundLeft}`;

  return (
    <div className={classValues}>
      {props.tickerEntries.map((tickerEntry) => (
        <TickerButton
          key={tickerEntry.ticker}
          ticker={tickerEntry.ticker}
          costBasis={tickerEntry.costBasis}
          currentQuantityOnHand={tickerEntry.unitsOnHand}
          selectTickerButtonHandler={props.selectTickerButtonHandler}
          backgroundColor={props.buttonBackgroundColor}
          isLoading={props.isLoading && props.currentTicker === tickerEntry.ticker}
        />
      ))}
    </div>
  );
};

export default memo(TickerSidebar);
