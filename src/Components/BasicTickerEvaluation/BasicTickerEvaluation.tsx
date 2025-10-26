
import  { useState, useEffect } from 'react';
import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"
//import type Quote_V3 from "../../Lib/Quote_V3.ts"
//import type KeyMetrics_V3 from '../../Lib/KeyMetrics_V3.ts';
//import type HistoricalPriceFull_V3 from '../../Lib/HistoricalPriceFull_V3.ts';
//import TickerInput from '../TickerInput/TickerInput.jsx';
import TickerButton from '../TickerButton/TickerButton';
//import SimpleButton from '../SimpleButton/SimpleButton.jsx'
//import TradingRangeIndicator from '../TradingRangeIndicator/TradingRangeIndicator.jsx';
//import InvestmentComposedChar from '../InvestmentCharts/InvestmentComposedChart.jsx';
//import StockQuote from '../StockQuote/StockQuote.tsx';
//import BatchQuote from '../ApiCalls/BatchQutoe.jsx'
//import {dailyValues, bollingerBands,getRsiChartData,getStochasticChartData,getLwChartData,getPriceToEarningsChartData} from '../../lib/CalculateAverages.jsx'
//import upGreenRight from '../../srcImages/UpGreenRight.png'
//import downRedRight from '../../srcImages/DownRedRight.png'
//import RelativeStrengthIndexChart from '../InvestmentCharts/RelativeStrengthIndexChart/RelativeStrengthIndexChart.jsx';
//import StochasitcOscillatorChart from '../InvestmentCharts/StochasticOscillatorChart.jsx'


//import { goBackSpecificNumberOfDays, findTheHighValueBasedOnDate, getAHistoricDateBySubtractingFromNow, findTheLowValueBasedOnDate, convertDateForDateInputPicker } from '../../lib/GetValuesBasedOnDate.jsx'
//import LarryWilliamsChart from '../InvestmentCharts/LarryWilliamsChart.jsx';
//import PriceEarningsChart from '../InvestmentCharts/PriceEarningsChart.jsx';
//import {calculateOverallProfitAndLoss} from '../../lib/ProfitLoss/CalculateOverallProfitLoss.jsx'
//import {calculateBuyPoints} from '../../lib/ProfitLoss/CalculateBuyPoints.jsx'


/*
use this to define an interface for props in
<BasicTickerEvaluation onSelectTickerButtonHandler = {onSelectTickerButtonHandler} onSetHeader = {onSetHeader} baseHeader='Current'
                       onSetTodaysPercentageChange={onSetTodaysPercentageChange}
                       onSetSlope = {onSetSlope} tickerEntries={currentHoldings} backgroundLeft='bg-indigo-100'
                       buttonBackgroundColor='bg-indigo-400'/>
*/


interface  BasicTickerEvaluationProps{
  onSelectTickerButtonHandler(tickerToEvaluate:string):void;
  onSetHeader(headerValueIn:string):void;
  baseHeader:string;
  onSetTodaysPercentageChange(percentageChange:number, isChnagePositive:boolean):void
  onSetSlope(slopeIn:number):void
  tickerEntries:TickersToEvaluate[];
  buttonBackgroundColor:string;
}


const GRAPH_SIZE_FACTOR = .48
const BasicTickerEvaluaton = (props:BasicTickerEvaluationProps) => {

    const [tickerToGet, setTickerToGet] = useState('');
    const [totalCost, setTotalCost]=useState(0.0);
    const [currentQuantityOnHand,setCurrentQuantitOnHand]=useState(0.0);
    const [profitLossOneEntry,setProfitLossOneEntry]=useState(0.0);
    const [percentGainLoss,setPercentGainLoss]=useState(0.0);
    //const [startDate, setStartDate] = useState('');
    //const [endDate, setEndDate] = useState('');
    //const [adjustedStartDate,setAdjustedStartDate]= useState('');
    const [updateTickerValue, setUpdateTickerValue] = useState(false);
    //const [showChart, setShowChart] = useState(false);

    //const [graphData, setGraphData] = useState({});
    //const [rsiData, setRsiData] = useState({});
    //const [lwData, setLwData] = useState({});
    //const [priceEarningsData, setPriceEarningsData]= useState({});
    
    //const [stochasticData, setStochasticData] = useState({});

    //const widthOfStroke = 2;
    //const [rangeValue, setRangeValue] = useState("50.0");
    //const [lowRangeValue, setLowRangeValue] = useState("1.00");
    //const [highRangeValue, setHighRangeValue] = useState("100");
    //const [rangeValueOneYear, setRangeValueOneYear] = useState("50.0");
    //const [lowRangeValueOneYear, setLowRangeValueOneYear] = useState("1.00");
    //const [highRangeValueOneYear, setHighRangeValueOneYear] = useState("100");
    const [firstReferenceClosingPrice, setFirstReferenceClosingPrice] = useState("");
    const [lastReferenceClosingPrice, setLastReferenceClosingPrice] = useState("");
    //const [todaysGain, setTodaysGain] = useState(0.0);
    //const [todaysPercentageGain, setTodaysPercentageGain] = useState(0.0);
    //const [percentageChangeAcrossRange, setPercentageChangeAcrossRange] = useState(0.0);
    //const [percentageChangeFromTwelveMonthHigh,setPercentageChangeFromTwelveMonthHigh] = useState(0.0);
    //const [buyPoints, setBuyPoints] = useState({});
    
    const [updateRangeValues, setUpdateRangeValues] = useState(false);
    //const [gainIsPositive, setGainIsPositive] = useState(false);
    const [currentQuote, setcurrentQuote] = useState({});
    const [timeSeries,setTimeSeries]  = useState({});
    const [adjustedTimeSeries,setAdjustedTimeSeries] = useState({});

    const [statmentAnalysisKeyMetrics,setStatmentAnalysisKeyMetrics] = useState({});
    
    //const [slope,setSlope]=useState(0.0);
    const [classValuesLeft,setClassValuesLeft]=useState('');
    //const [calculatedTotalProfitLoss,setCalculatedTotalProfitLoss] = useState('$ Unknown');
    const [windowWidth, setWindowWidth]=useState(window.innerWidth);
    const [graphWidth, setGraphWidth]=useState(Math.round(window.innerWidth * GRAPH_SIZE_FACTOR));

  /*
    useEffect(()=>{
        let tempDate=getAHistoricDateBySubtractingFromNow(60,false);
    tempDate.setHours(0)
    tempDate.setMinutes(0)
    tempDate.setSeconds(0)
    setStartDate(convertDateForDateInputPicker(tempDate));

    tempDate=new Date();
    tempDate.setHours(0)
    tempDate.setMinutes(0)
    tempDate.setSeconds(0)
    setEndDate(convertDateForDateInputPicker(tempDate)); 
        //setStartDate('2023-02-03');
        //setEndDate('2023-03-09');
        setClassValuesLeft('col-start-1 col-span-2 m-5 rounded-md' + props.backgroundLeft)
    },[])
    */
    // request ticker data
    useEffect(() => {

        if (updateTickerValue === true) {
            //console.log('Sending ticker to Get: ' + tickerToGet);           

            setUpdateTickerValueToFalse();
            // to get rid of warning
            setTotalCost(totalCost);
            
            //setShowChart(true);
        }
        else {
            //console.log('Reset: updateTickerValue to false: ' + updateTickerValue);
        }
    }, [tickerToGet, updateTickerValue]);

    /*
    useEffect(() => {  
        if ((typeof currentQuote.close !== 'undefined') && (updateRangeValues ===true)) {

        }
    }, [updateRangeValues]);
*/
  useEffect(() => {
    const handleResize=() =>
      setWindowWidth(window.innerWidth);
      setGraphWidth(Math.round(window.innerWidth * GRAPH_SIZE_FACTOR));
      //console.log("windowWidth = " + windowWidth)
      //console.log("graphWidth = " + graphWidth)
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, [windowWidth,graphWidth]);
/*
    useEffect(()=>{
        let todaysChange=parseFloat(currentQuote.change).toFixed(2);
        let tempGain = false;
        setTodaysGain(todaysChange);
        setTodaysPercentageGain(parseFloat(currentQuote.changesPercentage).toFixed(2));

        if (todaysChange >= 0.0) {
            setGainIsPositive(true);
            tempGain = true;
        }
        else {
            setGainIsPositive(false);
        }
        setRangeValues(currentQuote);
        props.onSetTodaysPercentageChange(currentQuote.changesPercentage, tempGain);

    },[currentQuote]);
    

*/
    const setUpdateTickerValueToFalse = () => {
        setUpdateTickerValue(false);
    }
/*
    const setupdateRangeValuesToFalse = () => {
        setUpdateRangeValues(false);
    }

    const onTickerChangeHandler = (tickerValue,startDate,endDate,adjustedStartDate) => {
        if ((tickerValue.trim().length > 0)&&
            (startDate.trim().length > 0) &&
            (endDate.trim().length > 0))        {
            // looks like a couple of guys that need a reducer
            
            setTickerToGet(tickerValue.trim());
            setStartDate(startDate.trim());
            setEndDate(endDate.trim());
            setAdjustedStartDate(adjustedStartDate.trim());

            

            setUpdateTickerValue(true);

            
            props.onSetHeader( props.baseHeader + " - " + tickerValue.trim());
            //console.log("tickerValue: " + tickerValue + ", startDate: " + startDate + ", endDate: " + endDate); 
            
            
        }
    }

    useEffect(() => {  
            //console.log("Reset startDate to: " +startDate)
            //console.log("Reset endDate to: " + endDate)
    }, [startDate, endDate,adjustedStartDate]);

    const setRangeValues = (theCurrentQuote) => {
        //console.log('setRangeValues, theCurrentQuote.dayLow: ' + theCurrentQuote.dayLow)
        if(theCurrentQuote.dayLow === undefined)
        {
            return;
        }
        //if(theCurrentQuote.dayLow !== undefined)
        //{
            setLowRangeValue(parseFloat(theCurrentQuote.dayLow).toFixed(2));
            setHighRangeValue(parseFloat(theCurrentQuote.dayHigh).toFixed(2));
        //}
        let lowValue = parseFloat(theCurrentQuote.dayLow);
        let highValue = parseFloat(theCurrentQuote.dayHigh);
        let lastValue = parseFloat(theCurrentQuote.price);
        //console.log('theCurrentQuote.price: ' + theCurrentQuote.price)
        let currentRange = highValue - lowValue;
        let currentDistanceFromLow = lastValue - lowValue;
        if (currentRange !== 0.0) {
            let percentage = ((currentDistanceFromLow / currentRange)*100.0);
            setRangeValue(percentage.toString());
        }

        let firstReferencePrice = parseFloat(firstReferenceClosingPrice);
        //let lastReferencePrice = parseFloat(lastReferenceClosingPrice);
        //let todaysChange = theCurrentQuote.change;
        //let tempGain = false;
        
        
        //props.onSetTodaysPercentageChange(todaysPercentageGain, tempGain);

        let changeAcrossRange = lastValue - firstReferencePrice;
        let percentageChangeFullRange = 0.0;

        //console.log('lastValue: ' + lastValue + ', firstReferencePrice: ' + firstReferencePrice +', changeAcrossRange: ' + changeAcrossRange + ', firstReferencePrice: ' + firstReferencePrice )

        if (firstReferencePrice !== 0.0) {
            percentageChangeFullRange = ((changeAcrossRange / firstReferencePrice)*100.0).toFixed(2);
        }
        setPercentageChangeAcrossRange(percentageChangeFullRange);

        // Full year starts here
        let fullYearStartingValue = goBackSpecificNumberOfDays(adjustedTimeSeries,365)
            //console.log('fullYearStartingValue: ' + fullYearStartingValue)
        

        let lowValueOneYear = findTheLowValueBasedOnDate(getAHistoricDateBySubtractingFromNow(365),adjustedTimeSeries)
        let highValueOneYear = findTheHighValueBasedOnDate(getAHistoricDateBySubtractingFromNow(365),adjustedTimeSeries)

        setLowRangeValueOneYear(lowValueOneYear.toFixed(2))
        setHighRangeValueOneYear(highValueOneYear.toFixed(2))
        let currentRangeOneYear = highValueOneYear - lowValueOneYear;
        let currentDistanceFromLowOneYear = lastValue - lowValueOneYear;

        //console.log('currentRangeOneYear: ' + currentRangeOneYear + ', lowValueOneYear: ' + lowValueOneYear + ', highValueOneYear' + highValueOneYear)


        if (currentRangeOneYear !== 0.0) {
            let percentage = ((currentDistanceFromLowOneYear / currentRangeOneYear)*100.0);
            setRangeValueOneYear(percentage.toFixed(2).toString());
            let distanceFromHigh=theCurrentQuote.price-highValueOneYear;
            setPercentageChangeFromTwelveMonthHigh(((distanceFromHigh/highValueOneYear)*100.0).toFixed(2).toString());

            calculateBuyPoints(highValueOneYear,setBuyPoints);

            //console.log('highValueOneYear:' + highValueOneYear + ', theCurrentQuote.price: ' + theCurrentQuote.price + ', distanceFromHigh: ' + distanceFromHigh);

            //console.log('lastValue: ' + lastValue + ', lowValueOneYear: ' + lowValueOneYear +', currentRangeOneYear: ' + currentRangeOneYear + ', currentDistanceFromLowOneYear: ' + currentDistanceFromLowOneYear )

        }
    };
*/
    const selectTickerButtonHandler = (tickerIn:string, currentQuantityOnHandIn:number, totalCostIn:number):void => {
        setTickerToGet(tickerIn);
        setUpdateTickerValue(true);
        setCurrentQuantitOnHand(currentQuantityOnHandIn)
        setTotalCost(totalCostIn)
        props.onSetHeader(props.baseHeader + " - " + tickerIn);
        props.onSelectTickerButtonHandler(tickerIn)
        //console.log("selectTickerButtonHandler tickerIn: " + tickerIn);
    }
/*
    const calculateProfitLossButtonHandler = () =>
    {
        calculateOverallProfitAndLoss(props.tickerEntries,setCalculatedTotalProfitLoss);
    }
*/

  /*
    //const onSetCurrentQuote=(currentQuoteIn,timeSeriesIn,adjustedTimeSeriesIn,statmentAnalysisKeyMetrics,larryWilliams)=>
    const onSetCurrentQuote=(currentQuoteIn:Quote_V3,timeSeriesIn:HistoricalPriceFull_V3[],adjustedTimeSeriesIn:HistoricalPriceFull_V3,statmentAnalysisKeyMetrics:KeyMetrics_V3):void=>
    {
        //console.log("onSetCurrentQuote" );
        //console.log("currentQuoteIn" + currentQuoteIn);
        setcurrentQuote(currentQuoteIn);
        setTimeSeries(timeSeriesIn); 
        setAdjustedTimeSeries(adjustedTimeSeriesIn) 
        setProfitLoss(currentQuoteIn)
        //console.log("statmentAnalysisKeyMetrics" + statmentAnalysisKeyMetrics);
        setStatmentAnalysisKeyMetrics(statmentAnalysisKeyMetrics)
        //setLarryWilliams(larryWilliams)
        
        if(timeSeriesIn.length>0)
        {
            setLastReferenceClosingPrice(timeSeriesIn[0].close.toFixed(2))
            setFirstReferenceClosingPrice(timeSeriesIn[timeSeriesIn.length-1].close.toFixed(2))
            setUpdateRangeValues(true);

            //console.log('timeSeriesIn[0].close: ' + timeSeriesIn[0].close + ', timeSeriesIn[timeSeriesIn.length-1].close: '+timeSeriesIn[timeSeriesIn.length-1].close)
        }

    }

    const setProfitLoss = (currentQuoteIn:Quote_V3)=>
    {
        //console.log("setProfitLoss" );
        let profitLoss = 0.0;
        if(currentQuantityOnHand!==0)
        {
            profitLoss=((currentQuoteIn.price*currentQuantityOnHand)-totalCost)
        }   
        setProfitLossOneEntry( Number(profitLoss.toFixed(2)) )
        let percentGainLoss= 0.0;
        if(totalCost!==0.0)
        {
            percentGainLoss=(profitLoss/totalCost)*100.0;
        }
        if((!isNaN(percentGainLoss))&&(percentGainLoss!==0.0))
        {
            setPercentGainLoss(Number(percentGainLoss.toFixed(2)))
        }
        else
        {
            setPercentGainLoss(0)
        }
    */
/*
    const [bollingerChecked, setBollingerChecked] = React.useState(false);

    const bollingerChangeHandler = () => {
        setBollingerChecked(!bollingerChecked);
    };
    
    const [lwChecked, setLwChecked] = React.useState(false);

    const lwChangeHandler = () => {
        setLwChecked(!lwChecked);
    };

    const [rsiChecked, setRsiChecked] = React.useState(false);

    const rsiChangeHandler = () => {
        setRsiChecked(!rsiChecked);
    };

    const [stochasticChecked, setStochasticChecked] = React.useState(false);
    const stochasticChangeHandler = () => {
        setStochasticChecked(!stochasticChecked);
    };

    const [priceEquityChecked, setPriceEquityChecked] = React.useState(false);
    const priceEquityChangeHandler = () => {
        setPriceEquityChecked(!priceEquityChecked);
    };
    
    */
/*
    useEffect(() => {  
        //console.log("calling dailyValues, timeSeries[0]" + timeSeries[0])
        if(timeSeries[0]!==undefined)
        {
            //console.log("Running if(timeSeries[0]!==undefined)")
            let newData=null
            if(timeSeries[timeSeries.length-1].date < timeSeries[timeSeries.length-2].date)
            {
                newData=dailyValues(timeSeries.reverse(),adjustedTimeSeries.reverse());
                //console.log("Reversed timeSeries")
            }
            else{
                newData=dailyValues(timeSeries,adjustedTimeSeries);                
                //console.log("Did not reverse timeSeries")
            }
            
            if(bollingerChecked)
            {
                //console.log("Generating bollinger bands")
                newData=bollingerBands(timeSeries,adjustedTimeSeries,newData)
            }

            //newData=twoHundredDayMovingAverage(timeSeries,adjustedTimeSeries,newData)

            if(rsiChecked)
            {
                //console.log("Generating RSI")
                setRsiData(getRsiChartData(timeSeries,adjustedTimeSeries))                
            }

            if(lwChecked)
            {
                //console.log("Generating LW")
                setLwData(getLwChartData(larryWilliams,startDate,endDate)) 
            }

            if(stochasticChecked)
            {
                //console.log("Generating Stochastic")
                setStochasticData(getStochasticChartData(timeSeries,adjustedTimeSeries))                
            }

            if(priceEquityChecked)
            {
                //console.log("Generating Price to Equity")
                setPriceEarningsData(getPriceToEarningsChartData(statmentAnalysisKeyMetrics))                
            }
            //console.log("Calling setGraphData")
            setGraphData( newData )  
        }
    }, [currentQuote, timeSeries, bollingerChecked,lwChecked,rsiChecked,stochasticChecked,priceEquityChecked]);
*/
    
/*
    useEffect( ()=>{
      if(graphData.length!==undefined)
      {
        //console.log("trying to stringify graphData")
        //console.log(JSON.stringify(graphData))
        //console.log('graphData.length: ' + graphData.length)
      }
    
        if((graphData.length!==undefined) && (graphData.length>1)){
            const Y1forSlope=graphData[graphData.length-1].expMovingAverage;
            //console.log('Y1forSlope: ' + Y1forSlope)
            const Y2forSlope=graphData[graphData.length-2].expMovingAverage;
            //console.log('Y2forSlope: ' + Y2forSlope)
            const tempSlope=(parseFloat(Y1forSlope)-parseFloat(Y2forSlope))
            //console.log('tempSlope: ' + tempSlope)
            props.onSetSlope(tempSlope.toFixed(2))
            setSlope(tempSlope.toFixed(2))
        }
    },[graphData]);

    */


    return <div className='bg-gray-100 grid grid-cols-9 gap-4'>

        <div className={classValuesLeft}>
       
        {/* not really using key but defining it anyway */}
        {props.tickerEntries.map( (tickerEntry)=> (            
            <TickerButton key={tickerEntry.ticker} ticker={tickerEntry.ticker}
            costBasis={tickerEntry.costBasis} currentQuantityOnHand={tickerEntry.unitsOnHand}
             selectTickerButtonHandler={selectTickerButtonHandler} backgroundColor={props.buttonBackgroundColor}/>
        ))}

        </div>

      {/*
        <div className='col-start-3 col-span-7'>
        <div className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3'>
            <label className='pl-2 pr-2'>
                <input
                type="checkbox"
                checked={bollingerChecked}
                onChange={bollingerChangeHandler}
                />
                Bollinger Bands
            </label>

            <label className='pl-2 pr-2'>
                <input
                type="checkbox"
                checked={rsiChecked}
                onChange={rsiChangeHandler}
                />
                RSI Oscillator
            </label>


            <label className='pl-2 pr-2'>
                <input
                type="checkbox"
                checked={stochasticChecked}
                onChange={stochasticChangeHandler}
                />
                Stochastic Oscillator
            </label>

            <label className='pl-2 pr-2'>
                <input
                type="checkbox"
                checked={priceEquityChecked}
                onChange={priceEquityChangeHandler}
                />
                Price to Earnings
            </label>

        </div>

        <div className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3'>

        <SimpleButton calculateProfitLossButtonHandler={calculateProfitLossButtonHandler} backgroundColor={props.buttonBackgroundColor} buttonCaption='cumulative profit/loss'/>
        {calculatedTotalProfitLoss}
        
        
        </div>


        <TickerInput  onTickerValue={onTickerChangeHandler} currentTicker={tickerToGet} startDate={startDate} endDate={endDate}
            containerBackGround= {props.buttonBackgroundColor}></TickerInput>
        <StockQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote} latestStartDate={startDate} latestEndDate={endDate} adjustedStartDate={adjustedStartDate}/>
        
        {(showChart === true && graphData.length!==undefined) ?
            <div className='justify-self-auto'>
                <div className="text-1xl text-green-600 font-bold underline h-5">
                    OPEN ${currentQuote.open},   HIGH ${currentQuote.dayHigh},   LOW ${currentQuote.dayLow},   LAST ${currentQuote.price}
                </div>

                <div className='ml-20 mt-5'>
                    <InvestmentComposedChar
                            width={graphWidth}
                            height={275}
                            data={graphData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: 5,
                                bottom: 5
                            }}
                            lineWidth={widthOfStroke}
                            showBollingerbands={bollingerChecked}
                            showMean={bollingerChecked}>

                    </InvestmentComposedChar>
                </div>

                
                
                        

                {(rsiChecked === true && rsiData.length !== undefined)?
                
                <div className='ml-20 mt-5'>
                    <div className="text-1xl text-green-600 font-bold underline h-5">
                        RSI Measures - Speed and Magnitude of Price Change Momentum
                    </div>
                    <RelativeStrengthIndexChart
                            width={graphWidth}
                            height={175}
                            data={rsiData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: 5,
                                bottom: 5
                            }}
                            lineWidth={widthOfStroke}
                            overBought={70}
                            overSold={30}>

                    </RelativeStrengthIndexChart>
                </div>:
                <React.Fragment />}

                {(lwData)&&(lwChecked === true) ?
                <div className='ml-20 mt-5'>
                    <LarryWilliamsChart
                            width={graphWidth}
                            height={175}
                            data={lwData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: 5,
                                bottom: 5
                            }}
                            lineWidth={widthOfStroke}
                            overBought={-20}
                            overSold={-80}>

                    </LarryWilliamsChart>
                </div>:
                <React.Fragment />}
                

                {(stochasticChecked === true && stochasticData.length !== undefined)?
                
                <div className='ml-20 mt-5'>
                    <div className="text-1xl text-green-600 font-bold underline h-5">
                        Stochastic Measures  - Closing Price Momentum
                    </div>
                    <StochasitcOscillatorChart
                            width={graphWidth}
                            height={175}
                            data={stochasticData}
                            margin={{
                                top: 5,
                                right: 5,
                                left: 5,
                                bottom: 5
                            }}
                            lineWidth={widthOfStroke}
                            overBought={80}
                            overSold={20}>

                    </StochasitcOscillatorChart>
                </div>:
                <React.Fragment />}

                <div className="text-1xl text-green-600 font-bold underline h-5">
                    Selected account: {tickerToGet}                      
                </div>
                <div className="text-1xl text-green-600 font-bold underline h-5">
                    Closed at: ${currentQuote.price}
                </div>
                <div className="text-1xl text-green-600 font-bold underline h-5">
                    Total cost: ${totalCost}
                </div>
                {profitLossOneEntry>=0.0 ?
                    <div className="text-1xl text-green-600 font-bold underline h-5 mt-2 my-3">
                        Profit/Loss: ${profitLossOneEntry}  ..   or  ..  {percentGainLoss} %
                    </div>:
                    <div className="text-1xl text-red-600 font-bold underline h-5 mt-2 my-3">
                        Profit/Loss: ${profitLossOneEntry}  ..   or  ..  {percentGainLoss} %
                    </div>
                }
                

                { gainIsPositive === true ?
                    <div>
                        <div className="text-1xl text-green-600 font-bold underline h-5 justify-items-start">
                            Today's Gain: ${todaysGain}
                        </div>                        
                            <div className="text-1xl text-green-600 font-bold underline h-5">
                                Today's % Gain: {todaysPercentageGain} %
                            </div>
                        </div> :
                        <div>
                            <div className="text-1xl text-red-600 font-bold underline h-5 justify-items-start">
                                Today's Gain: ${todaysGain}
                            </div>  
                            <div className="text-1xl text-red-600 font-bold underline h-5">
                                Today's % Gain: {todaysPercentageGain} %
                            </div>                            
                    </div>
                }

                
                {slope >= 0.0 ?
                    <div className='text-green-600 text-3xl font-bold'> 
                            <img className="inline-block w-10 h-8 ml-7 " src={upGreenRight} alt=""></img>                           
                    </div> :
                    <div className='text-red-600 text-3xl font-bold'>
                            <img className="inline-block w-12 h-10 ml-7" src={downRedRight} alt=""></img> 
                    </div>
                }
                

            </div> :
                <React.Fragment />}
            
        </div>
*/}
      {/*
        <div className='col-start-10 col-span-2'>
            
            <div className='block mb-10'>
                <TradingRangeIndicator className = 'mb-40' heading="Last 12 Months" lowRangeValue={lowRangeValueOneYear} rangeValue={rangeValueOneYear} highRangeValue={highRangeValueOneYear} currentQuote={currentQuote} currentValues={false}/>                
                
                <div className='p-4 mt-6 mb-10'>                    
                    <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                    Current Price vs. 12 Month High: {percentageChangeFromTwelveMonthHigh} %
                    </div>

                    
                    
                    {(Object.keys(buyPoints).length > 0) ?
                    <div>
                        <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                        Down 5%: {buyPoints.downFivePercent}, 10%: {buyPoints.downTenPercent}                                  
                        </div>
                        <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                        Down 15%: {buyPoints.downFifteenPercent}, 20%: {buyPoints.downTwentyPercent}                                      
                        </div>
                        <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                        Down 25%: {buyPoints.downTwentyFivePercent}, 30%: {buyPoints.downThirtyPercent}                                      
                        </div>
                        <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                        Down 35%: {buyPoints.downThirtyFivePercent}, 40%: {buyPoints.downFortyPercent}                                    
                        </div>
                        <div className="text-gray-600 font-normal text-xs mt-3 mb-5">
                                        Down 50%: {buyPoints.downFiftyPercent}, 60%: {buyPoints.downSixtyPercent}                                    
                        </div>
                    </div>
                    :''}
            </div >
            </div >
            

            <div className='block mb-40'>
                <TradingRangeIndicator heading="Today's Range" lowRangeValue={lowRangeValue} rangeValue={rangeValue} highRangeValue={highRangeValue} currentQuote={currentQuote} currentValues={true} />
            </div>
            <div className='p-4 mt-6 mb-10'>


            {showChart === true ?
                    <div className='justify-items-start'> 

                        { (priceEarningsData.length>0) && (priceEquityChecked === true) ?
                            <div className='ml-1 mt-1'>
                                <PriceEarningsChart
                                        width={250}
                                        height={125}
                                        data={priceEarningsData}
                                        margin={{
                                            top: 5,
                                            right: 5,
                                            left: 5,
                                            bottom: 5
                                        }}
                                        lineWidth={widthOfStroke}
                                        >

                                </PriceEarningsChart>
                            </div>:
                        <React.Fragment />}    

                        { gainIsPositive === true ?
                            <div>
                                <div className="text-1xl text-green-600 font-bold underline h-5 justify-items-start">
                                    Today's Gain: ${todaysGain}
                                </div>                        
                                <div className="text-1xl text-green-600 font-bold underline h-5">
                                    Today's % Gain: {todaysPercentageGain} %
                                </div>
                            </div> :
                            <div>
                                <div className="text-1xl text-red-600 font-bold underline h-5 justify-items-start">
                                Today's Gain: ${todaysGain}
                                </div>  
                                <div className="text-1xl text-red-600 font-bold underline h-5">
                                    Today's % Gain: {todaysPercentageGain} %
                                </div>
                           </div>}
                        {percentageChangeAcrossRange >= 0.0 ?
                            <div className="text-1xl text-green-600 font-bold underline h-1">
                                Rng chg % Gain: {percentageChangeAcrossRange} %
                            </div> :
                            <div className="text-1xl text-red-600 font-bold underline h-1">
                                Rng chg % Gain: {percentageChangeAcrossRange} %
                            </div>
                        }
                </div> :
                    <React.Fragment />}

                
                    
            </div>

         </div>
      */}
        
    </div>
};

    

    

export default BasicTickerEvaluaton;