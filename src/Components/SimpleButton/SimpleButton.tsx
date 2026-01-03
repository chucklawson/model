/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';


/*
<SimpleButton
 calculateProfitLossButtonHandler={calculateProfitLossButtonHandler}
 backgroundColor={props.buttonBackgroundColor}
  buttonCaption='cumulative profit/loss'/>
{calculatedTotalProfitLoss}
*/

interface SimpleButtonProps{
  calculateProfitLossButtonHandler():void;
  backgroundColor:string;
  buttonCaption:string;
}
const SimpleButton = (props:SimpleButtonProps) => {


 const [buttonClassValues,setButtonClassValues] = useState('')
  
 const onSelectHandler = ()=> {
     {/*props.selectTickerButtonHandler(event.target.innerText);*/}
     
      props.calculateProfitLossButtonHandler( )
  };


  //hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded
  useEffect(() => {  
    setButtonClassValues(props.backgroundColor +' p-1 rounded-md ml-2 mr-2 mt-1 text-white hover:text-black transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 hover:bg-stone-200 duration-300')    
}, []);

    if(buttonClassValues.length<1)
    {
      return<>
      </>
    }

    return (
        < button className={buttonClassValues}  onClick={onSelectHandler}>
          <div>
            {props.buttonCaption}
          </div>
        </button>
  );
};

export default SimpleButton;