import React, {useState, useEffect, type ChangeEvent} from 'react';
//import { getAHistoricDateBySubtractingFromNow,convertDateForDateInputPicker,getDate_2017,getDate_2021,getDate_2025 } from '../../lib/GetValuesBasedOnDate'
import {GetValuesBasedOnDate} from '../../Lib/GetValuesBasedOnDate.ts'
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
    const getValuesBasedOnDate = new GetValuesBasedOnDate();


    useEffect (() => {
      setEnteredValue('DIA');
      initializeStartAndEndDates()
      setContainerClassValues('bg-white rounded-lg shadow-md p-6 mb-4')
  },
  [oneYearHistoryChecked,tFirstTermChecked,bidenTermChecked])

    useEffect (() => {

      //console.log('useEffect on TickerInput: ' + isValid)
  },
  [isValid,startDateIsValid,endDateIsValid])

    // Auto-submit when checkbox changes dates
    useEffect(() => {
      // Wait for dates to be updated after checkbox change
      const timer = setTimeout(() => {
        if (startDate && endDate && enteredValue && (tFirstTermChecked || oneYearHistoryChecked || bidenTermChecked)) {
          const year = parseInt(startDate.substring(0, startDate.indexOf('-')));
          const adjustedYear = year - 1;
          const adjustedStartDate = adjustedYear + startDate.substring(startDate.indexOf('-'));
          props.onTickerValue(enteredValue, startDate, endDate, adjustedStartDate);
        }
      }, 100); // Small delay to let dates update first

      return () => clearTimeout(timer);
    }, [tFirstTermChecked, oneYearHistoryChecked, bidenTermChecked])

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
      let tempDate=getValuesBasedOnDate.getAHistoricDateBySubtractingFromNow(60,oneYearHistoryChecked);
      
      //console.log('tempDate: ' + tempDate)
      tempDate.setHours(0)
      tempDate.setMinutes(0)
      tempDate.setSeconds(0)
      setStartDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));

      //  Originally set end date to today
      tempDate=new Date();
      tempDate.setHours(0)
      tempDate.setMinutes(0)
      tempDate.setSeconds(0)
      setEndDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));
    }

    if(tFirstTermChecked)
    {
      let tempDate=getValuesBasedOnDate.getDate_2017();
      tempDate.setHours(0);
      tempDate.setMinutes(0);
      tempDate.setSeconds(0);
      setStartDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));

      tempDate=getValuesBasedOnDate.getDate_2021();
      tempDate.setHours(0);
      tempDate.setMinutes(0);
      tempDate.setSeconds(0);
      setEndDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));
    }

    if(bidenTermChecked)
      {
        let tempDate=getValuesBasedOnDate.getDate_2021();
        tempDate.setHours(0);
        tempDate.setMinutes(0);
        tempDate.setSeconds(0);
        setStartDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));
  
        tempDate=getValuesBasedOnDate.getDate_2025();
        tempDate.setHours(0);
        tempDate.setMinutes(0);
        tempDate.setSeconds(0);
        setEndDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));
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

      <form className='w-full' onSubmit={formSubmitHandler}>
      <div className="mb-6 flex flex-col items-center">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Preset Date Ranges
        </label>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={tFirstTermChangeHandler}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              tFirstTermChecked
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50'
            }`}
          >
            2017-2020
          </button>
          <button
            type="button"
            onClick={oneYearHistoryChangeHandler}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              oneYearHistoryChecked
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Go Back One Year
          </button>
          <button
            type="button"
            onClick={bidenTermChangeHandler}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              bidenTermChecked
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-slate-700 border-2 border-slate-300 hover:bg-slate-50'
            }`}
          >
            2021-2024
          </button>
        </div>
      </div>


        <div className='flex flex-wrap gap-4 items-end justify-center'>
          <div className='flex-shrink-0'>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Ticker Symbol
            </label>
            <input
              className={`px-4 py-3 rounded-lg font-bold text-lg uppercase transition-all w-24 ${
                isValid
                  ? 'border-2 border-slate-300 focus:border-blue-500 bg-white'
                  : 'border-2 border-red-500 bg-red-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              type="text"
              onChange={tickerInputChangeHandler}
              value={enteredValue}
            />
            {!isValid && (
              <p className="text-xs text-red-600 mt-1">Please enter a valid ticker</p>
            )}
          </div>

          <div className='flex-shrink-0'>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Start Date
            </label>
            <input
              className={`px-4 py-3 rounded-lg transition-all w-36 ${
                startDateIsValid
                  ? 'border-2 border-slate-300 focus:border-blue-500 bg-white'
                  : 'border-2 border-red-500 bg-red-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              type='date'
              min='2017-01-01'
              max='2030-12-31'
              value={startDate}
              onChange={startDateChangeHandler}
            />
            {!startDateIsValid && (
              <p className="text-xs text-red-600 mt-1">Please select a start date</p>
            )}
          </div>

          <div className='flex-shrink-0'>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              End Date
            </label>
            <input
              className={`px-4 py-3 rounded-lg transition-all w-36 ${
                endDateIsValid
                  ? 'border-2 border-slate-300 focus:border-blue-500 bg-white'
                  : 'border-2 border-red-500 bg-red-50'
              } focus:outline-none focus:ring-2 focus:ring-blue-200`}
              type='date'
              min='2019-01-01'
              max='2099-12-31'
              value={endDate}
              onChange={endDateChangeHandler}
            />
            {!endDateIsValid && (
              <p className="text-xs text-red-600 mt-1">Please select an end date</p>
            )}
          </div>

          <div className='flex-shrink-0'>
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold
                         hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
              type='submit'
            >
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
