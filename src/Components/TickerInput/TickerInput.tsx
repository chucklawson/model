import React, {useState, useEffect, type ChangeEvent} from 'react';
import { getAHistoricDateBySubtractingFromNow,convertDateForDateInputPicker,getDate_2017,getDate_2021,getDate_2025 } from '../../lib/GetValuesBasedOnDate'
//import BasicTickerEvaluation from '../../Components/BasicTickerEvaluation/BasicTickerEvaluation'

/*
 <TickerInput  onTickerValue={onTickerChangeHandler} currentTicker={tickerToGet} startDate={startDate} endDate={endDate}
            containerBackGround= {props.buttonBackgroundColor}></TickerInput>
 */
interface TickerInputProps{
  onTickerValue(tickerValue:string,startDate:string,endDate:string,adjustedStartDate:string):void
  currentTicker:string;
  startDate:string;
  endDate:string;
  containerBackGround:string;
}

const TickerInput =( props:TickerInputProps )=> {
  const [enteredValue, setEnteredValue] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [startDateIsValid, setStartDateIsValid] = useState(true);
    const [endDate, setEndDate] = useState('');
    const [endDateIsValid, setEndDateIsValid] = useState(true);
    const [containerClassValues,setContainerClassValues] = useState('');
    const [oneYearHistoryChecked, setOneYearHistoryChecked] = React.useState(false);
    const [tFirstTermChecked, settFirstTermChecked] = React.useState(false);
    const [bidenTermChecked, setBidenTermChecked] = React.useState(false);


    useEffect (() => {
      setEnteredValue('DIA');
      initializeStartAndEndDates()
      setContainerClassValues(props.containerBackGround + ' mt-5 flex p-5 justify-center items-center rounded')
  },
  [oneYearHistoryChecked,tFirstTermChecked,bidenTermChecked])

    useEffect (() => {
      
      //console.log('useEffect on TickerInput: ' + isValid)
  },
  [isValid,startDateIsValid,endDateIsValid])

    const tickerInputChangeHandler = (event:ChangeEvent<HTMLInputElement> )=> {
       // event.preventDefault();
    if(event.target.value.trim() !== undefined)
    {
      setIsValid(true);      
      setEnteredValue(event.target.value);
    }
  };

  const formSubmitHandler = (event:React.FormEvent )=> {
    event.preventDefault();
    if((enteredValue.trim().length===0) ||
    (startDate.length===0)||
    (endDate.length===0))
    {
      if(enteredValue.trim().length===0)
      {
        //console.log('Setting IsValid False')
        setIsValid(false);
      }
      if(startDate.length===0)
      {
        //console.log('Setting startdate False')
        setStartDateIsValid(false);
      }
      if(endDate.length===0)
      {
        //console.log('Setting enddate False')
        setEndDateIsValid(false);
      }
      return <React.Fragment/>
    }
    else{
      // reduce start date by one year..
      
      //console.log('startDate before returning: ' + startDate)
      const year = parseInt(startDate.substring(0,startDate.indexOf('-')))
     //console.log('year by itself: ' + year)
      const adjustedYear=year - 1;
      //console.log('adjustedYear: ' + adjustedYear)
      const adjustedStartDate= adjustedYear+startDate.substring(startDate.indexOf('-'))
      //console.log('adjustedStartDate: ' + adjustedStartDate)
      
      

      //console.log("Entered value are all true:" + enteredValue);
      props.onTickerValue(enteredValue, startDate,endDate,adjustedStartDate);
    }
  };

  const initializeStartAndEndDates = ()=>
  {
    if((tFirstTermChecked===false)&&(bidenTermChecked===false))
    {
      let tempDate=getAHistoricDateBySubtractingFromNow(60,oneYearHistoryChecked);
      
      //console.log('tempDate: ' + tempDate)
      tempDate.setHours(0)
      tempDate.setMinutes(0)
      tempDate.setSeconds(0)
      setStartDate(convertDateForDateInputPicker(tempDate));

      //  Originally set end date to today
      tempDate=new Date();
      tempDate.setHours(0)
      tempDate.setMinutes(0)
      tempDate.setSeconds(0)
      setEndDate(convertDateForDateInputPicker(tempDate));
    }

    if(tFirstTermChecked)
    {
      let tempDate=getDate_2017();
      tempDate.setHours(0);
      tempDate.setMinutes(0);
      tempDate.setSeconds(0);
      setStartDate(convertDateForDateInputPicker(tempDate));

      tempDate=getDate_2021();
      tempDate.setHours(0);
      tempDate.setMinutes(0);
      tempDate.setSeconds(0);
      setEndDate(convertDateForDateInputPicker(tempDate));
    }

    if(bidenTermChecked)
      {
        let tempDate=getDate_2021();
        tempDate.setHours(0);
        tempDate.setMinutes(0);
        tempDate.setSeconds(0);
        setStartDate(convertDateForDateInputPicker(tempDate));
  
        tempDate=getDate_2025();
        tempDate.setHours(0);
        tempDate.setMinutes(0);
        tempDate.setSeconds(0);
        setEndDate(convertDateForDateInputPicker(tempDate));
      }

    //setStartDateIsValid(true); 
    //setEndDateIsValid(true);    
  }

    const startDateChangeHandler = (event:ChangeEvent<HTMLInputElement>) => {
      setStartDate(event.target.value);
      if(event.target.value.length>0)
      {
        //console.log('Setting startdate Valid true')        
        setStartDateIsValid(true);        
      }
    };

    const endDateChangeHandler = (event:ChangeEvent<HTMLInputElement>) => {
      setEndDate(event.target.value);
      if(event.target.value.length>0)
      {
        //console.log('Setting endDate Valid true')
        setEndDateIsValid(true);        
      }
    };    

    const tFirstTermChangeHandler = () => {      
      settFirstTermChecked(!tFirstTermChecked);
      setOneYearHistoryChecked(false);
      setBidenTermChecked(false);
    };

    const oneYearHistoryChangeHandler = () => {
      settFirstTermChecked(false);
      setOneYearHistoryChecked(!oneYearHistoryChecked);
      setBidenTermChecked(false);
    };

    const bidenTermChangeHandler = () => {
      
      settFirstTermChecked(false);
      setOneYearHistoryChecked(false);      
      setBidenTermChecked(!bidenTermChecked);
    };

    return (
      <div className='col-start-3 col-span-5 p-10 m-8'>

      <div className={containerClassValues}>

      <form className='w-full max-w-lg' onSubmit={formSubmitHandler}> 
      <label className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3 pl-2 pr-2'>
                <input
                type="checkbox"
                checked={tFirstTermChecked}
                onChange={tFirstTermChangeHandler}
                />
                2017-2020
            </label>
            <label className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3 pl-2 pr-2'>
                <input
                type="checkbox"
                checked={oneYearHistoryChecked}
                onChange={oneYearHistoryChangeHandler}
                />
                Go Back One Year
            </label>
            <label className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3 pl-2 pr-2'>
                <input
                type="checkbox"
                checked={bidenTermChecked}
                onChange={bidenTermChangeHandler}
                />
                2021-2024
            </label>
            
            
        <div className='flex flex-wrap md:flex-nowrap'>      
            
          <div className='w-full md:w-1/2 px-3 mb-6 md:mb-0 ml-1'>
            { isValid === true ?
              <label className='block uppercase text-xs text-gray-700 font-bold mb-2 tracking-wider'> Ticker {/*{enteredValue}*/}</label>:
              <label className='block uppercase text-xs text-gray-200 font-bold mb-2 tracking-wider bg-red-700 rounded'> Ticker {/*{enteredValue}*/}</label>
            }
            {/*placeholder='AAPL'*/}
              <input className='block py-1 px-2 rounded text-gray-700 w-full border border-green-500 bg-emerald-50' type="text" onChange={tickerInputChangeHandler}
                                   style={{ width: '70px'}} value = {enteredValue}/>     
          </div>     

          <div className='w-full md:w-1/2 px-3 mb-6 md:mb-0'>
              { startDateIsValid === true ?
                <label className='block uppercase text-xs text-gray-700 font-bold mb-2 tracking-wider'> Startdate {/*{startDate}*/}</label>:
                <label className='block uppercase text-xs text-gray-200 font-bold mb-2 tracking-wider bg-red-700 rounded'> Startdate {/*{startDate}*/}</label>
              }
              <input className='block py-1 px-2 rounded w-full border border-green-500 bg-emerald-50'
                                 type='date' min='2017-01-01' max='2030-12-31' value={startDate}
                                  onChange={startDateChangeHandler}  style={{ width: '130px'}}/>     
          </div>

          <div className='w-full md:w-1/2 px-3 mb-6 md:mb-0'>
            {endDateIsValid === true ?
              <label className='block uppercase text-xs text-gray-700 font-bold mb-2 tracking-wider'> Enddate {/*{endDate}*/}</label>:
              <label className='block uppercase text-xs text-gray-200 font-bold mb-2 tracking-wider bg-red-700 rounded'> Enddate {/*{endDate}*/}</label>
            }
              <input className='block py-1 px-2 rounded w-full border border-green-500 bg-emerald-50'
                     type='date' min='2019-01-01' max='2099-12-31' value={endDate}
                      onChange={endDateChangeHandler} style={{ width: '130px'}} />     
          </div>

          <div className='w-full md:w-1/2 px-3 mb-6 md:mb-0'>
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

export default TickerInput;
