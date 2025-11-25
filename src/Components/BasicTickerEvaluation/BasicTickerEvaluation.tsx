
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type {TickersToEvaluate} from "../../Lib/TickersToEvaluate/TickersToEvaluate"
import type Quote_V3 from "../../Lib/Quote_V3"
import type AnalysisKeyMetricsItem_V3 from "../../Lib/AnalysisKeyMetricsItem_V3";
import type HistoricalPriceFull_V3 from '../../Lib/HistoricalPriceFull_V3';
import TickerInput from '../TickerInput/TickerInput.jsx';
import SimpleButton from '../SimpleButton/SimpleButton'
import {GetValuesBasedOnDate} from '../../Lib/GetValuesBasedOnDate'
import StockQuote from '../StockQuote/StockQuote.tsx';
import {calculateOverallProfitAndLoss} from '../../Lib/ProfitLoss/CalculateOverallProfitLoss'
import {GetBuyPoints}  from '../../Lib/ProfitLoss/GetBuyPoints'
import type {BuyPoints} from '../../Lib/ProfitLoss/GetBuyPoints'
import TickerSidebar from '../TickerSidebar/TickerSidebar';
import ChartControls from '../ChartControls/ChartControls';
import StockChartDisplay from '../StockChartDisplay/StockChartDisplay';
import TradingRangeSidebar from '../TradingRangeSidebar/TradingRangeSidebar';
import { useTechnicalIndicators } from '../../hooks/useTechnicalIndicators';


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
  onSetTodaysPercentageChange(percentageChange:number, isChangePositive:boolean):void
  onSetSlope(slopeIn:number):void
  tickerEntries:TickersToEvaluate[];
  backgroundLeft:string;
  buttonBackgroundColor:string;
}


const GRAPH_SIZE_FACTOR = .48

const BasicTickerEvaluaton = (props:BasicTickerEvaluationProps) => {

    const [tickerToGet, setTickerToGet] = useState('');
    const [totalCost, setTotalCost]=useState(0.0);
    const [currentQuantityOnHand,setCurrentQuantityOnHand]=useState(0.0);
    const [profitLossOneEntry,setProfitLossOneEntry]=useState(0.0);
    const [percentGainLoss,setPercentGainLoss]=useState(0.0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [adjustedStartDate,setAdjustedStartDate]= useState('');
    const [updateTickerValue, setUpdateTickerValue] = useState(false);
    const [showChart, setShowChart] = useState(false);

    const [larryWilliamsData, setLarryWilliamsData] = useState({});

    const widthOfStroke = 2;
    const [rangeValue, setRangeValue] = useState("50.0");
    const [lowRangeValue, setLowRangeValue] = useState("1.00");
    const [highRangeValue, setHighRangeValue] = useState("100");
    const [rangeValueOneYear, setRangeValueOneYear] = useState("50.0");
    const [lowRangeValueOneYear, setLowRangeValueOneYear] = useState("1.00");
    const [highRangeValueOneYear, setHighRangeValueOneYear] = useState("100");
    const [firstReferenceClosingPrice, setFirstReferenceClosingPrice] = useState("");
    const [lastReferenceClosingPrice, setLastReferenceClosingPrice] = useState("");
    const [todaysGain, setTodaysGain] = useState(0.0);
    const [todaysPercentageGain, setTodaysPercentageGain] = useState(0.0);
    const [percentageChangeAcrossRange, setPercentageChangeAcrossRange] = useState(0.0);
    const [percentageChangeFromTwelveMonthHigh,setPercentageChangeFromTwelveMonthHigh] = useState(0.0);
    /*
    //By using the question mark when defining the interface for BuyPoints I am able to get away with setting this up
    //as an empty object as shown below
    const [buyPoints, setBuyPoints] = useState<BuyPoints>({ downFivePercent:"",
      downTenPercent:"",
      downFifteenPercent:"",
      downTwentyPercent:"",
      downTwentyFivePercent:"",
      downThirtyPercent:"",
      downThirtyFivePercent:"",
      downFortyPercent:"",
      downFortyFivePercent:"",
      downFiftyPercent:"",
      downFiftyFivePercent:"",
      downSixtyPercent:""});
*/
  const [buyPoints, setBuyPoints] = useState<BuyPoints>({});
    
    const [updateRangeValues, setUpdateRangeValues] = useState(false);
    const [gainIsPositive, setGainIsPositive] = useState(false);
    const [currentQuote, setCurrentQuote] = useState <Quote_V3>({           symbol: "",
                                                                            name: "",
                                                                            price: 0,
                                                                            changesPercentage: 0,
                                                                            change: 0,
                                                                            dayLow: 0,
                                                                            dayHigh: 0,
                                                                            yearHigh: 0,
                                                                            yearLow: 0,
                                                                            marketCap: 0,
                                                                            priceAvg50: 0,
                                                                            priceAvg200: 0,
                                                                            exchange: "",
                                                                            volume: 0,
                                                                              avgVolume: 0,
                                                                              open: 0,
                                                                              previousClose: 0,
                                                                              eps: 0,
                                                                              pe: 0,
                                                                              earningsAnnouncement:"",
                                                                              sharesOutstanding: 0,
                                                                              timestamp: 0});
    const [timeSeries,setTimeSeries]  = useState<HistoricalPriceFull_V3[]>([{date: "",
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      adjClose: 0,
      volume: 0,
      unadjustedVolume: 0,
      change: 0,
      changePercent: 0,
      vwap: 0,
      label: "",
      changeOverTime: 0}]);

    const [adjustedTimeSeries,setAdjustedTimeSeries] = useState<HistoricalPriceFull_V3[]>([{date: "",
      open: 0,
      high: 0,
      low: 0,
      close: 0,
      adjClose: 0,
      volume: 0,
      unadjustedVolume: 0,
      change: 0,
      changePercent: 0,
      vwap: 0,
      label: "",
      changeOverTime: 0}]);

    const [statementAnalysisKeyMetrics,setStatmentAnalysisKeyMetrics] = useState<AnalysisKeyMetricsItem_V3[]>([{symbol: "",
      date:"",
      calendarYear: "",
      period: "",
      revenuePerShare:0,
      netIncomePerShare: 0,
      operatingCashFlowPerShare: 0,
      freeCashFlowPerShare: 0,
      cashPerShare:0,
      bookValuePerShare: 0,
      tangibleBookValuePerShare: 0,
      shareholdersEquityPerShare:0,
      interestDebtPerShare: 0,
      marketCap:0,
      enterpriseValue: 0,
      peRatio: 0,
      priceToSalesRatio: 0,
      pocfratio: 0,
      pfcfRatio: 0,
      pbRatio: 0,
      ptbRatio:0,
      evToSales: 0,
      enterpriseValueOverEBITDA: 0,
      evToOperatingCashFlow: 0,
      evToFreeCashFlow:0,
      earningsYield: 0,
      freeCashFlowYield: 0,
      debtToEquity:0,
      debtToAssets:0,
      netDebtToEBITDA: 0,
      currentRatio:0,
      interestCoverage: 0,
      incomeQuality: 0,
      dividendYield: 0,
      payoutRatio: 0,
      salesGeneralAndAdministrativeToRevenue: 0,
      researchAndDevelopmentToRevenue: 0,
      intangiblesToTotalAssets: 0,
      capexToOperatingCashFlow: 0,
      capexToRevenue: 0,
      capexToDepreciation:0,
      stockBasedCompensationToRevenue: 0,
      grahamNumber: 0,
      roic: 0,
      returnOnTangibleAssets: 0,
      grahamNetNet: 0,
      workingCapital: 0,
      tangibleAssetValue: 0,
      netCurrentAssetValue: 0,
      investedCapital: 0,
      averageReceivables: 0,
      averagePayables: 0,
      averageInventory: 0,
      daysSalesOutstanding: 0,
      daysPayablesOutstanding: 0,
      daysOfInventoryOnHand: 0,
      receivablesTurnover: 0,
      payablesTurnover: 0,
      inventoryTurnover: 0,
      roe:0,
      capexPerShare: 0,}]);

    const [calculatedTotalProfitLoss, setCalculatedTotalProfitLoss] = useState<string>('$ Unknown');
    const [graphWidth, setGraphWidth]=useState(Math.round(window.innerWidth * GRAPH_SIZE_FACTOR));

    const getValuesBasedOnDate=new GetValuesBasedOnDate();

    // To reduce warnings/errors
  useEffect(() => {
    setCurrentQuantityOnHand(currentQuantityOnHand);
    let tempString:string = startDate;
    tempString = endDate;
    tempString = adjustedStartDate;
    setStartDate(tempString);
    setRangeValue(rangeValue);
    setLowRangeValue(lowRangeValue);
    setHighRangeValue(highRangeValue);
    setRangeValueOneYear(rangeValueOneYear);
    setLowRangeValueOneYear(lowRangeValueOneYear);
    setHighRangeValueOneYear(highRangeValueOneYear);
    setFirstReferenceClosingPrice("");
    setTodaysGain(todaysGain);
    setTodaysPercentageGain(todaysPercentageGain);
    setPercentageChangeAcrossRange(percentageChangeAcrossRange);
    setPercentageChangeFromTwelveMonthHigh(percentageChangeFromTwelveMonthHigh);
    setBuyPoints(buyPoints);
    setAdjustedTimeSeries(adjustedTimeSeries);
    setGainIsPositive(gainIsPositive);
    setCurrentQuote(currentQuote);
    setUpdateRangeValues(updateRangeValues);
    setTimeSeries(timeSeries);
    setLastReferenceClosingPrice(lastReferenceClosingPrice);
    setStatmentAnalysisKeyMetrics(statementAnalysisKeyMetrics);
    setProfitLossOneEntry(profitLossOneEntry);
    setPercentGainLoss(percentGainLoss);
    setLarryWilliamsData(larryWilliamsData);
    setLarryWilliamsChecked(larryWilliamsChecked);

  }, []);




    useEffect(()=>{
        let tempDate=getValuesBasedOnDate.getAHistoricDateBySubtractingFromNow(60,false);
    tempDate.setHours(0)
    tempDate.setMinutes(0)
    tempDate.setSeconds(0)
    setStartDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));

    tempDate=new Date();
    tempDate.setHours(0)
    tempDate.setMinutes(0)
    tempDate.setSeconds(0)
    setEndDate(getValuesBasedOnDate.convertDateForDateInputPicker(tempDate));
        //setStartDate('2023-02-03');
        //setEndDate('2023-03-09');
    },[])

    // request ticker data
    useEffect(() => {

        if (updateTickerValue === true) {
            //console.log('Sending ticker to Get: ' + tickerToGet);           

            setUpdateTickerValueToFalse();
            // to get rid of warning
            setTotalCost(totalCost);
            
            setShowChart(true);
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
    const handleResize = () => {
      setGraphWidth(Math.round(window.innerWidth * GRAPH_SIZE_FACTOR));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

    useEffect(()=>{
        //console.log("currentQuote.change: " +currentQuote.change)
        //const todaysChange=Number(parseFloat(Number(currentQuote.change).toFixed(2)));

      const todaysChange=currentQuote.change;

      //console.log("todaysChange: " +todaysChange)

      //console.log("currentQuote.changePercentage: " +currentQuote.changesPercentage)

      //console.log("Setting percentage gain to): " + parseFloat(currentQuote.changesPercentage).toFixed(2))

        let tempGain = false;
        setTodaysGain(Number(todaysChange.toFixed(2)));
        setTodaysPercentageGain(Number(currentQuote.changesPercentage.toFixed(2)));

        if ( Number(todaysChange) >= 0.0) {
            setGainIsPositive(true);
            tempGain = true;
        }
        else {
            setGainIsPositive(false);
        }
        setRangeValues(currentQuote);
        props.onSetTodaysPercentageChange(currentQuote.changesPercentage, tempGain);

    },[currentQuote]);
    

    // Memoize margin object to prevent unnecessary chart re-renders
    const chartMargin = useMemo(() => ({
        top: 5,
        right: 5,
        left: 5,
        bottom: 5
    }), []);

    const setUpdateTickerValueToFalse = () => {
        setUpdateTickerValue(false);
    }
/*
    const setupdateRangeValuesToFalse = () => {
        setUpdateRangeValues(false);
    }
*/
    const onTickerChangeHandler = useCallback((tickerValue:string,startDate:string,endDate:string,adjustedStartDate:string) => {
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
    }, [props.onSetHeader, props.baseHeader])

    useEffect(() => {  
            //console.log("Reset startDate to: " +startDate)
            //console.log("Reset endDate to: " + endDate)
            //console.log("From use effect, currentQuote: symbol, " +currentQuote.symbol + ", name: " + currentQuote.name);
    }, [startDate, endDate,adjustedStartDate,currentQuote]);

    const setRangeValues = (theCurrentQuote:Quote_V3) => {
        //console.log('setRangeValues, theCurrentQuote.dayLow: ' + theCurrentQuote.dayLow)
        if(theCurrentQuote.dayLow === undefined)
        {
            return;
        }
        //if(theCurrentQuote.dayLow !== undefined)
        //{
            setLowRangeValue(parseFloat(theCurrentQuote.dayLow.toString()).toFixed(2));
            setHighRangeValue(parseFloat(theCurrentQuote.dayHigh.toString()).toFixed(2));
        //}
        const lowValue = parseFloat(theCurrentQuote.dayLow.toString());
        const highValue = parseFloat(theCurrentQuote.dayHigh.toString());
        const lastValue = parseFloat(theCurrentQuote.price.toString());
        //console.log('theCurrentQuote.price: ' + theCurrentQuote.price)
        const currentRange = highValue - lowValue;
        const currentDistanceFromLow = lastValue - lowValue;
        if (currentRange !== 0.0) {
            const percentage = ((currentDistanceFromLow / currentRange)*100.0);
            setRangeValue(percentage.toString());
        }

        const firstReferencePrice = parseFloat(firstReferenceClosingPrice);
        //let lastReferencePrice = parseFloat(lastReferenceClosingPrice);
        //let todaysChange = theCurrentQuote.change;
        //let tempGain = false;
        
        
        //props.onSetTodaysPercentageChange(todaysPercentageGain, tempGain);

        const changeAcrossRange = lastValue - firstReferencePrice;
        let percentageChangeFullRange = 0.0;

        //console.log('lastValue: ' + lastValue + ', firstReferencePrice: ' + firstReferencePrice +', changeAcrossRange: ' + changeAcrossRange + ', firstReferencePrice: ' + firstReferencePrice )

        if (firstReferencePrice !== 0.0) {
            percentageChangeFullRange = Number(((changeAcrossRange / firstReferencePrice)*100.0).toFixed(2));
        }
        setPercentageChangeAcrossRange(percentageChangeFullRange);

        // Full year starts here
        //const fullYearStartingValue = getValuesBasedOnDate.goBackSpecificNumberOfDays(adjustedTimeSeries,365)
            //console.log('fullYearStartingValue: ' + fullYearStartingValue)
        

        const lowValueOneYear = getValuesBasedOnDate.findTheLowValueBasedOnDate(getValuesBasedOnDate.getAHistoricDateBySubtractingFromNow(365,true),adjustedTimeSeries)
        const highValueOneYear = getValuesBasedOnDate.findTheHighValueBasedOnDate(getValuesBasedOnDate.getAHistoricDateBySubtractingFromNow(365,true),adjustedTimeSeries)

        setLowRangeValueOneYear(lowValueOneYear.toFixed(2))
        setHighRangeValueOneYear(highValueOneYear.toFixed(2))
        const currentRangeOneYear = highValueOneYear - lowValueOneYear;
        const currentDistanceFromLowOneYear = lastValue - lowValueOneYear;

        //console.log('currentRangeOneYear: ' + currentRangeOneYear + ', lowValueOneYear: ' + lowValueOneYear + ', highValueOneYear' + highValueOneYear)


        if (currentRangeOneYear !== 0.0) {
            const percentage = ((currentDistanceFromLowOneYear / currentRangeOneYear)*100.0);
            setRangeValueOneYear(percentage.toFixed(2).toString());
            const distanceFromHigh=theCurrentQuote.price-highValueOneYear;
            setPercentageChangeFromTwelveMonthHigh(  Number( ((distanceFromHigh/highValueOneYear)*100.0).toFixed(2).toString() ) );
            //function setTheBuyPoints(buyPointsIn:BuyPoints) {
           //   setBuyPoints(buyPointsIn);
            //}
          const getBuyPoints= new GetBuyPoints();
          getBuyPoints.CalculateBuyPoints(highValueOneYear,setBuyPoints);

            //console.log('highValueOneYear:' + highValueOneYear + ', theCurrentQuote.price: ' + theCurrentQuote.price + ', distanceFromHigh: ' + distanceFromHigh);

            //console.log('lastValue: ' + lastValue + ', lowValueOneYear: ' + lowValueOneYear +', currentRangeOneYear: ' + currentRangeOneYear + ', currentDistanceFromLowOneYear: ' + currentDistanceFromLowOneYear )

        }
    };

    const selectTickerButtonHandler = useCallback((tickerIn:string, currentQuantityOnHandIn:number, totalCostIn:number):void => {
        setTickerToGet(tickerIn);
        setUpdateTickerValue(true);
        setCurrentQuantityOnHand(currentQuantityOnHandIn)
        setTotalCost(totalCostIn)
        props.onSetHeader(props.baseHeader + " - " + tickerIn);
        props.onSelectTickerButtonHandler(tickerIn)
        //console.log("selectTickerButtonHandler tickerIn: " + tickerIn);
    }, [props.onSetHeader, props.baseHeader, props.onSelectTickerButtonHandler])

    const calculateProfitLossButtonHandler = useCallback(() =>
    {
      // need to add this back in
      // return a string and be done with it

      //setCalculatedTotalProfitLoss(calculateOverallProfitAndLoss(props.tickerEntries));
      calculateOverallProfitAndLoss(props.tickerEntries,setCalculatedTotalProfitLoss);
    }, [props.tickerEntries])

    const setProfitLoss = useCallback((currentQuoteIn:Quote_V3)=> {
      //console.log("setProfitLoss" );
      let profitLoss = 0.0;
      if (currentQuantityOnHand !== 0) {
        profitLoss = ((currentQuoteIn.price * currentQuantityOnHand) - totalCost)
      }
      setProfitLossOneEntry(Number(profitLoss.toFixed(2)))
      let percentGainLoss = 0.0;
      if (totalCost !== 0.0) {
        percentGainLoss = (profitLoss / totalCost) * 100.0;
      }
      if ((!isNaN(percentGainLoss)) && (percentGainLoss !== 0.0)) {
        setPercentGainLoss(Number(percentGainLoss.toFixed(2)))
      } else {
        setPercentGainLoss(0)
      }
    }, [currentQuantityOnHand, totalCost])

    //const onSetCurrentQuote=(currentQuoteIn,timeSeriesIn,adjustedTimeSeriesIn,statementAnalysisKeyMetrics,larryWilliams)=>
    const onSetCurrentQuote=useCallback((currentQuoteIn:Quote_V3,timeSeriesIn:HistoricalPriceFull_V3[],adjustedTimeSeriesIn:HistoricalPriceFull_V3[],statementAnalysisKeyMetrics:AnalysisKeyMetricsItem_V3[]):void=>
    {
        //console.log("onSetCurrentQuote" );
        //console.log("currentQuoteIn" + currentQuoteIn);
        setCurrentQuote(currentQuoteIn);
        setTimeSeries(timeSeriesIn);
        setAdjustedTimeSeries(adjustedTimeSeriesIn);
        setProfitLoss(currentQuoteIn)
        //console.log("statementAnalysisKeyMetrics" + statementAnalysisKeyMetrics);
        setStatmentAnalysisKeyMetrics(statementAnalysisKeyMetrics)
        //setLarryWilliams(larryWilliams)

        //console.log("currentQuote symbol: " + currentQuote.symbol + ", name: " + currentQuote.name);





        if(timeSeriesIn.length>0)
        {
            setLastReferenceClosingPrice(timeSeriesIn[0].close.toFixed(2))
            setFirstReferenceClosingPrice(timeSeriesIn[timeSeriesIn.length-1].close.toFixed(2))
            setUpdateRangeValues(true);

            //console.log('timeSeriesIn[0].close: ' + timeSeriesIn[0].close + ', timeSeriesIn[timeSeriesIn.length-1].close: '+timeSeriesIn[timeSeriesIn.length-1].close)
        }

    }, [setProfitLoss])

    const [bollingerChecked, setBollingerChecked] = React.useState(false);

    const bollingerChangeHandler = useCallback(() => {
        setBollingerChecked(!bollingerChecked);
    }, [bollingerChecked]);

    const [larryWilliamsChecked, setLarryWilliamsChecked] = React.useState(false);

    //const lwChangeHandler = () => {
    //    setLarryWilliamsChecked(!larryWilliamsChecked);
    //};

    const [rsiChecked, setRsiChecked] = React.useState(false);

    const rsiChangeHandler = useCallback(() => {
        setRsiChecked(!rsiChecked);
    }, [rsiChecked]);

    const [stochasticChecked, setStochasticChecked] = React.useState(false);
    const stochasticChangeHandler = useCallback(() => {
        setStochasticChecked(!stochasticChecked);
    }, [stochasticChecked]);

    const [priceEquityChecked, setPriceEquityChecked] = React.useState(false);
    const priceEquityChangeHandler = useCallback(() => {
        setPriceEquityChecked(!priceEquityChecked);
    }, [priceEquityChecked]);

    // Use technical indicators hook
    const { graphData, rsiData, stochasticData, priceEarningsData, slope } = useTechnicalIndicators({
        timeSeries,
        adjustedTimeSeries,
        statementAnalysisKeyMetrics,
        bollingerChecked,
        rsiChecked,
        stochasticChecked,
        priceEquityChecked
    });

    // Update parent with slope when it changes
    useEffect(() => {
        props.onSetSlope(slope);
    }, [slope, props.onSetSlope]);




    return <  div className='bg-gray-100 grid grid-cols-9 gap-4'>

        <TickerSidebar
            tickerEntries={props.tickerEntries}
            selectTickerButtonHandler={selectTickerButtonHandler}
            buttonBackgroundColor={props.buttonBackgroundColor}
            backgroundLeft={props.backgroundLeft}
        />

        <div className='col-start-3 col-span-7'>
        <ChartControls
            bollingerChecked={bollingerChecked}
            rsiChecked={rsiChecked}
            stochasticChecked={stochasticChecked}
            priceEquityChecked={priceEquityChecked}
            onBollingerChange={bollingerChangeHandler}
            onRsiChange={rsiChangeHandler}
            onStochasticChange={stochasticChangeHandler}
            onPriceEquityChange={priceEquityChangeHandler}
        />

        <div className='text-1xl text-gray-600 font-bold underline h-5 justify-start mt-3'>

        <SimpleButton calculateProfitLossButtonHandler={calculateProfitLossButtonHandler} backgroundColor={props.buttonBackgroundColor} buttonCaption='cumulative profit/loss'/>
          {calculatedTotalProfitLoss}


        </div>
          {/*Temporary div
        </div>
          */}
        <TickerInput  onTickerValue={onTickerChangeHandler} currentTicker={tickerToGet} startDate={startDate} endDate={endDate}
            containerBackGround= {props.buttonBackgroundColor}></TickerInput>

        <StockQuote stockSymbol={tickerToGet} onSetCurrentQuote={onSetCurrentQuote} latestStartDate={startDate} latestEndDate={endDate} adjustedStartDate={adjustedStartDate}/>


        {(showChart === true && graphData.length!==undefined) ?
            <StockChartDisplay
                currentQuote={currentQuote}
                graphWidth={graphWidth}
                graphData={graphData}
                rsiData={rsiData}
                stochasticData={stochasticData}
                bollingerChecked={bollingerChecked}
                rsiChecked={rsiChecked}
                stochasticChecked={stochasticChecked}
                widthOfStroke={widthOfStroke}
                chartMargin={chartMargin}
                tickerToGet={tickerToGet}
                totalCost={totalCost}
                profitLossOneEntry={profitLossOneEntry}
                percentGainLoss={percentGainLoss}
                todaysGain={todaysGain}
                todaysPercentageGain={todaysPercentageGain}
                gainIsPositive={gainIsPositive}
                slope={slope}
            /> :
                <React.Fragment />}
            
        </div>


        <TradingRangeSidebar
            lowRangeValueOneYear={lowRangeValueOneYear}
            rangeValueOneYear={rangeValueOneYear}
            highRangeValueOneYear={highRangeValueOneYear}
            percentageChangeFromTwelveMonthHigh={percentageChangeFromTwelveMonthHigh}
            buyPoints={buyPoints}
            lowRangeValue={lowRangeValue}
            rangeValue={rangeValue}
            highRangeValue={highRangeValue}
            currentQuote={currentQuote}
            showChart={showChart}
            priceEarningsData={priceEarningsData}
            priceEquityChecked={priceEquityChecked}
            widthOfStroke={widthOfStroke}
            todaysGain={todaysGain}
            todaysPercentageGain={todaysPercentageGain}
            gainIsPositive={gainIsPositive}
            percentageChangeAcrossRange={percentageChangeAcrossRange}
        />


    </div>
};

export default BasicTickerEvaluaton;