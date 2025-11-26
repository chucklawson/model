
import StandardChartData from '../ChartData/StandardChartData'
import StandardMovingAverage from '../ChartData/StandardMovingAverage'
import ExponentialMovingAverage from '../ChartData/ExponentialMovingAverage';
import BollingerBands from '../ChartData/BollingerBands';
import RSIChartEntries from '../ChartData/RSIChartEntries';
import LWChartEntries from '../ChartData/LWChartEntries'
import StochasticChartEntries from '../ChartData/StochasticChartEntries'
import StatementAnalysisKeyMetricsData from '../ChartData/StatementAnalysisKeyMetricsData'
import type HistoricalPriceFull_V3 from '../HistoricalPriceFull_V3.ts';
import type AnalysisKeyMetricsItem_V3 from "../AnalysisKeyMetricsItem_V3.ts";
import type LWChartData from "../ChartData/LWChartData.ts";
import RSIChartData from "../ChartData/RSIChartData.ts";

export class CalculateAverages {

  constructor() {
  }


  dailyValues(standardValuesIn:HistoricalPriceFull_V3[], adjustedToContainFullYearOfDataValuesIn:HistoricalPriceFull_V3[]) {
    //console.log("got into dailyValues: ")
    //console.log("valuesIn.length: " + standardValuesIn.length)
    //console.log("adjustedValuesIn.length: " + adjustedToContainFullYearOfDataValuesIn.length)
    if (standardValuesIn.length === undefined) {
      console.log("valuesIn.length === undefined")
      return null;
    }
    let accumulatedChartData = [];
    for (let i = 0; i < standardValuesIn.length; ++i) {
      const chartDataEntry = new StandardChartData(standardValuesIn[i].date, standardValuesIn[i].close, null, null, null, null, null, null, null)
      //console.log("chartDataEntry using toString: " + chartDataEntry.toString())
      accumulatedChartData.push(chartDataEntry);
    }
    /*
    for(let j=0;j<accumulatedChartData.length;++j)
    {
        console.log('accumulatedChartData[ '+j + ' ]: '+ accumulatedChartData[j].toString())
    }
    */

    //console.log("accumulatedChartData.length: " + accumulatedChartData.length)
    // modified 083123 from 33 to 100, then back again
    let numberOfDaysToLookBack = 33;
    //console.log("calling StandardMovingAverage where numberOfDaysToLookBack: " + numberOfDaysToLookBack)
    const standardAverages = new StandardMovingAverage(adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBack);
    accumulatedChartData = standardAverages.generateTheAverages(accumulatedChartData)
    //console.log("Got past accumulatedChartData")

    const numberOfDaysToLookBackExponentially = 10;
    const exponentialMovingAverages = new ExponentialMovingAverage(adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBackExponentially);
    accumulatedChartData = exponentialMovingAverages.generateTheAverages(accumulatedChartData)


    // Only calculate 200-day moving average if we have enough data for the entire period
    numberOfDaysToLookBack = 200;
    // We need enough data to calculate the average for ALL dates in the selected period
    // That means: adjustedData >= selectedPeriod + lookbackPeriod
    if (adjustedToContainFullYearOfDataValuesIn.length >= (standardValuesIn.length + numberOfDaysToLookBack)) {
      //console.log('numberOfDaysToLookBack: '+ numberOfDaysToLookBack)
      let twoHundredDayChartData = [];
      const twoHundredDayMoveingAverage = new StandardMovingAverage(adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBack);
      twoHundredDayChartData = twoHundredDayMoveingAverage.generateTheAverages(accumulatedChartData)
      //console.log('twoHundredDayChartData: '+ twoHundredDayChartData)
      for (let j = 0; j < accumulatedChartData.length; ++j) {
        accumulatedChartData[j].twoHundredDayMovingAverage = twoHundredDayChartData[j].simpleMovingAverage
        //console.log('twoHundredDayMovingAverage Entry: ' + accumulatedChartData[j].twoHundredDayMovingAverage)
      }
    } else {
      console.log('Insufficient data for 200-day moving average. Need at least ' + (standardValuesIn.length + numberOfDaysToLookBack) + ' days, have: ' + adjustedToContainFullYearOfDataValuesIn.length)
    }

    // Only calculate 50-day moving average if we have enough data for the entire period
    numberOfDaysToLookBack = 50;
    // We need enough data to calculate the average for ALL dates in the selected period
    // That means: adjustedData >= selectedPeriod + lookbackPeriod
    if (adjustedToContainFullYearOfDataValuesIn.length >= (standardValuesIn.length + numberOfDaysToLookBack)) {
      let fiftyDayChartData = [];
      const fiftyDayMoveingAverage = new StandardMovingAverage(adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBack);
      fiftyDayChartData = fiftyDayMoveingAverage.generateTheAverages(accumulatedChartData)
      //console.log('fiftyDayChartData: '+ fiftyDayChartData)
      for (let j = 0; j < accumulatedChartData.length; ++j) {
        accumulatedChartData[j].fiftyDayMovingAverage = fiftyDayChartData[j].simpleMovingAverage
        //console.log('fiftyDayMovingAverage Entry: ' + accumulatedChartData[j].fiftyDayMovingAverage)
      }
    } else {
      console.log('Insufficient data for 50-day moving average. Need at least ' + (standardValuesIn.length + numberOfDaysToLookBack) + ' days, have: ' + adjustedToContainFullYearOfDataValuesIn.length)
    }


    /*
    numberOfDaysToLookBack=200;
    let twoHundredDayMovingAverages = new StandardMovingAverage(adjustedToContainFullYearOfDataValuesIn,numberOfDaysToLookBack);
    accumulatedChartData=standardAverages.generateThetwoAverages(accumulatedChartData)
    */


    //console.log("standardAverages: " + standardAverages.toString())

    return accumulatedChartData;
  }

// standardValuesIn are those from the rest endpoint for the time period selected
// adjustedToContainFullYearOfDataValuesIn are those from the rest endpoint for the time period selected + a year
// accumulatedChartDataIn contains the chart data excluding bollingerBands... so add them and give it back

  bollingerBands(standardValuesIn:HistoricalPriceFull_V3[], adjustedToContainFullYearOfDataValuesIn:HistoricalPriceFull_V3[], accumulatedChartDataIn:StandardChartData[]) {

    if (standardValuesIn.length === undefined) {
      console.log("standardValuesIn.length === undefined")
      return null;
    }

    // if decide to use standard use numberOfDaysToLookBack and adjust witn BollingerBands
    // otherwise, current set to do Exponential calcualtions
    // Make the adjustment around line 32 marked with 'Adjust here' within BollingerBands.js
    //let numberOfDaysToLookBack=33;
    //let numberOfDaysToLookBackExponentially=10;
    const numberOfDaysToLookBackNoRounding = 20;


    const bollingerBands = new BollingerBands(standardValuesIn, adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBackNoRounding)
    const bollingers = bollingerBands.generateBollingerBands()!

    const adjustedChartData = [];
    for (let j = 0; j < accumulatedChartDataIn.length; ++j) {
      const adjustedChartDataEntry = new StandardChartData( this.convertDateStringToYear_Month_DayOnly(new Date(accumulatedChartDataIn[j].dateOfClose)),
        accumulatedChartDataIn[j].dailyClosingPrice,
        accumulatedChartDataIn[j].simpleMovingAverage,
        accumulatedChartDataIn[j].expMovingAverage,
        accumulatedChartDataIn[j].twoHundredDayMovingAverage,
        accumulatedChartDataIn[j].fiftyDayMovingAverage,
        bollingers[j].lowerBandValue,
        bollingers[j].upperBandValue,
        bollingers[j].mean)
      //console.log('adjustedChartDataEntry: ' + adjustedChartDataEntry.toString())
      adjustedChartData.push(adjustedChartDataEntry)
    }
    return adjustedChartData;
  }

  getRsiChartData(standardValuesIn:HistoricalPriceFull_V3[], adjustedToContainFullYearOfDataValuesIn:HistoricalPriceFull_V3[]):RSIChartData[]|null {

    const numberOfDaysToLookBack = 14;

    const rSIChartEntries = new RSIChartEntries(standardValuesIn, adjustedToContainFullYearOfDataValuesIn, numberOfDaysToLookBack)
    const tempRsiData = rSIChartEntries.generateRsiValues()
    return tempRsiData;
  }

  getStochasticChartData(standardValuesIn:HistoricalPriceFull_V3[], adjustedToContainFullYearOfDataValuesIn:HistoricalPriceFull_V3[]) {
    const slowInidcatorDaysToLookBack = 3;
    const fastInidcatorDaysToLookBack = 14

    const stochasticChartEntries = new StochasticChartEntries(standardValuesIn, adjustedToContainFullYearOfDataValuesIn, slowInidcatorDaysToLookBack, fastInidcatorDaysToLookBack)
    const stochasticData = stochasticChartEntries.generateStochasticValues()
    //console.log('stochasticData from calculateAverages: ' + JSON.stringify(stochasticData))
    return stochasticData;
  }

  getLwChartData(larryWilliams:LWChartData[], startDate:string, endDate:string) {


    const lwChartEntries = new LWChartEntries(larryWilliams, startDate, endDate)
    const LWData = lwChartEntries.generateLWValues()

    //console.log("LWData:  " + LWData)

    return LWData;
  }

  getPriceToEarningsChartData(statmentAnalysisKeyMetrics:AnalysisKeyMetricsItem_V3[]):StatementAnalysisKeyMetricsData[] {
    const priceToEquityData = [];
    const entriesToCollect = 8;

    if ((statmentAnalysisKeyMetrics != null) && (statmentAnalysisKeyMetrics.length !== undefined) && (statmentAnalysisKeyMetrics.length > entriesToCollect)) {
      for (let i = 0; i < entriesToCollect; ++i) {
        const statementAnalysisKeyMetricsData = new StatementAnalysisKeyMetricsData(statmentAnalysisKeyMetrics[i])
        priceToEquityData.push(statementAnalysisKeyMetricsData);

      }
    }


    //console.log('priceToEquityData: ' + priceToEquityData)

    return priceToEquityData.reverse();
  }

  convertDateStringToYear_Month_DayOnly(dateIn:Date):string
  {
    const isoDate=dateIn.toISOString()
    return isoDate.substring(0,isoDate.indexOf('T'))
    //return convertedDate;
  }

}