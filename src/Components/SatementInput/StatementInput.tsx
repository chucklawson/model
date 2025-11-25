import React, {useState, useEffect, type ChangeEvent} from 'react';

/*
<StatementInput onTickerValue={onTickerChangeHandler} onPeriodsValue={onPeriodsChangeHandler} currentTicker={tickerToGet}
                 containerBackGround= {buttonBackgroundColor} runningStatement={true}></StatementInput>
*/
interface StatementInputProps{
  onTickerValue(tickerValue:string):void;
  onPeriodsValue(periodsToUse:string):void;
  currentTicker:string;
  containerBackGround:string;
  runningStatement:boolean;
}
const StatementInput = (props:StatementInputProps) => {
    const [enteredValue, setEnteredValue] = useState('');
    const [periodsToUse, setPeriodsToUse] = useState('8');
    const [isValid, setIsValid] = useState(true);    
    const [periodIsValid, setPeriodIsValid] = useState(true);    
    const [containerClassValues,setContainerClassValues] = useState('');

    useEffect (() => {
      if(props.runningStatement===false)
      {
        setEnteredValue('O');
      }
      else{
        setEnteredValue('AAPL');
      }
      setContainerClassValues(props.containerBackGround + ' mt-5 flex p-5 justify-center items-center rounded')
  },
  [])

    useEffect (() => {
      
      //console.log('useEffect on TickerInput: ' + isValid)
  },
  [isValid])

    const tickerInputChangeHandler = (event:ChangeEvent<HTMLInputElement> ) => {
       // event.preventDefault();
    if(event.target.value.trim() !== undefined)
    {
      setIsValid(true);      
      setEnteredValue(event.target.value);
    }
  };

  const periodsInputChangeHandler = (event:ChangeEvent<HTMLInputElement> ) => {
    // event.preventDefault();
    if(event.target.value.trim() !== undefined)
    {
        setPeriodIsValid(true);      
        setPeriodsToUse(event.target.value);
    }
  };

  const formSubmitHandler = (event:React.FormEvent ) => {
    event.preventDefault();
    if((enteredValue.trim().length===0)||(periodsToUse.trim().length===0))
    {
      if(enteredValue.trim().length===0)
      {
        //console.log('Setting IsValid False')
        setIsValid(false);
      }
      if(periodsToUse.trim().length===0)
      {
        setPeriodIsValid(false);
      }
      return <React.Fragment/>
    }
    else{
      props.onTickerValue(enteredValue);
      props.onPeriodsValue(periodsToUse);
    }
  };  

    return (
      <div className='col-start-3 col-span-3 p-1 m-1'>

      <div className={containerClassValues}>

      <form className='w-full max-w-lg' onSubmit={formSubmitHandler}> 

        <div className='flex flex-wrap md:flex-nowrap'>
          <div className='w-full md:w-1/2 px-2 mb-6 md:mb-0 ml-2'>
         
            { isValid === true ?
              <label className='block uppercase text-xs text-gray-700 font-bold mb-2 tracking-wider'>Ticker</label>:
              <label className='block uppercase text-xs text-gray-200 font-bold mb-2 tracking-wider bg-red-700 rounded'>Ticker</label>
            }
    
            {/*placeholder='AAPL'*/}
            <input className='py-1 px-2 rounded text-gray-700 w-full border border-green-500 bg-emerald-50' type="text" onChange={tickerInputChangeHandler}
                                   style={{ width: '70px'}} value = {enteredValue}/>    
          </div>

          <div className='w-full md:w-1/2 px-2 mb-6 md:mb-0 ml-2'>         
          
            { periodIsValid === true ?
              <label className='block uppercase text-xs text-gray-700 font-bold mb-2 tracking-wider'>Periods</label>:
              <label className='block uppercase text-xs text-gray-200 font-bold mb-2 tracking-wider bg-red-700 rounded'>Periods</label>
            }
    
            {/*placeholder='8'*/}
            <input className='py-1 px-2 rounded text-gray-700 w-full border border-green-500 bg-emerald-50' type="text" onChange={periodsInputChangeHandler}
                                   style={{ width: '70px'}} value = {periodsToUse}/>    
          </div>

          <div className='w-full md:w-1/2 px-3 ml-3 mb-6 md:mb-0'>
            < button className='block uppercase text-xs bg-stone-500 p-1 rounded-md ml-2 mr-2 mt-5 text-white font-semibold hover:text-black transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 hover:bg-stone-200 duration-300' style={{ width: '75px' }} type='submit'>
                                    Update Chart
            </button>
          </div>
        </div>

      </form>
            {/*div that contains the form*/}
    </div>
            {/* outer div */}
  </div>
  );
};

export default StatementInput;
