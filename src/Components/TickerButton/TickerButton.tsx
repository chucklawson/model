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
    setButtonClassValues(props.backgroundColor+' p-1 rounded-md ml-2 mr-2 mt-1 text-white hover:text-black transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 hover:bg-stone-200 duration-300')
}, []);

    if(buttonClassValues.length<1)
    {
      return<>
      </>
    }

    return (
        < button className={buttonClassValues} style={{ width: '140px' }} onClick={onSelectHandler}>
          <div>
             {props.costBasis === ('0.0') ?
              <div>
                 {props.ticker}  Unk, {props.currentQuantityOnHand}
              </div>:
              <div>
                  {props.ticker} {props.costBasis}, {props.currentQuantityOnHand}
              </div>
            }
          </div>
        </button>
  );
};

export default memo(TickerButton);