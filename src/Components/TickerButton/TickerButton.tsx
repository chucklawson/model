/* eslint-disable react-hooks/exhaustive-deps */
import  { useState, useEffect, useCallback, memo } from 'react';
//import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"


/*
  <TickerButton key={tickerEntry.ticker} ticker={tickerEntry.ticker}
                costBasis={tickerEntry.costBasis} currentQuantityOnHand={tickerEntry.unitsOnHand}
                selectTickerButtonHandler={selectTickerButtonHandler} backgroundColor={props.buttonBackgroundColor}/>
*/

interface TickerButtonProps{
  key:string;
  ticker:string;
  costBasis:string;
  currentQuantityOnHand:number;
  selectTickerButtonHandler(tickerIn:string, currentQuantityOnHandIn:number, totalCostIn:number):void;
  backgroundColor:string;
  isLoading?:boolean;
}

const TickerButton = (props:TickerButtonProps) => {



 const [buttonClassValues,setButtonClassValues] = useState('')

 const onSelectHandler = useCallback(()=> {
     {/*props.selectTickerButtonHandler(event.target.innerText);*/}
     const totalCost=props.currentQuantityOnHand*Number(props.costBasis)

     props.selectTickerButtonHandler(props.ticker,
      Number(props.currentQuantityOnHand.toFixed(3)),
      Number(totalCost.toFixed(2))
      )
  }, [props.selectTickerButtonHandler, props.ticker, props.currentQuantityOnHand, props.costBasis]);

  useEffect(() => {
    setButtonClassValues(props.backgroundColor+' p-1 rounded-md ml-2 mr-2 mt-1 text-white hover:text-black transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 hover:bg-stone-200 duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:bg-transparent')
}, []);

    if(buttonClassValues.length<1)
    {
      return<>
      </>
    }

    return (
        <button className={buttonClassValues} style={{ width: '140px' }} onClick={onSelectHandler} disabled={props.isLoading}>
          <div className="flex items-center justify-center gap-1">
            {props.isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            )}
            {props.costBasis === ('0.0') ? (
              <span>{props.ticker} Unk, {props.currentQuantityOnHand}</span>
            ) : (
              <span>{props.ticker} {props.costBasis}, {props.currentQuantityOnHand}</span>
            )}
          </div>
        </button>
  );
};

export default memo(TickerButton);