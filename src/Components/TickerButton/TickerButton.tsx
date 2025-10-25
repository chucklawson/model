import  { useState, useEffect } from 'react';


/*
  <TickerButton key={tickerEntry.ticker} ticker={tickerEntry.ticker}
                costBasis={tickerEntry.costBasis} currentQuantityOnHand={tickerEntry.unitsOnHand}
                selectTickerButtonHandler={selectTickerButtonHandler} backgroundColor={props.buttonBackgroundColor}/>
*/

interface TickerButtonProps{
  //tickerEntry:Quote_V3;
  ticker:string;
  costBasis:number;
  currentQuantityOnHand:number;
  selectTickerButtonHandler(tickerIn:string, currentQuantityOnHandIn:number, totalCostIn:number):void;
  backgroundColor:string;
}

const TickerButton = (props:TickerButtonProps) => {



 const [buttonClassValues,setButtonClassValues] = useState('')
  
 const onSelectHandler = (event)=> {
     {/*props.selectTickerButtonHandler(event.target.innerText);*/}
     let totalCost=props.currentQuantityOnHand*props.costBasis
     
     props.selectTickerButtonHandler(props.ticker,      
      props.currentQuantityOnHand.toFixed(3),
      totalCost.toFixed(2)
      )
  };

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

export default TickerButton;