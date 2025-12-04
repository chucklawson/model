import RSIChartData from "./RSIChartData.ts"
import type HistoricalPriceFull_V3 from "../HistoricalPriceFull_V3";

export default class RSIChartEntries {
  standardValues;
  fullYearOfDataValues;
  numberOfDaysToLookBack;
    constructor(standardValuesIn:HistoricalPriceFull_V3[],fullYearOfDataValuesIn:HistoricalPriceFull_V3[],numberOfDaysToLookBackIn:number) {
        this.standardValues = standardValuesIn;
        this.fullYearOfDataValues = fullYearOfDataValuesIn;
        this.numberOfDaysToLookBack=numberOfDaysToLookBackIn;
        //console.log("adjustedToContainFullYearOfDataValuesIn: "+ JSON.stringify(adjustedToContainFullYearOfDataValuesIn))

        //console.log("BollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("BollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)
        //console.log("BollingerBands numberOfDaystoLookBack: " + this.numberOfDaystoLookBack)
      }

    generateRsiValues()
    {
        //console.log("generateBollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("generateBollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)        
        //console.log('Range: ' + this.standardValues[0].date + ', through: ' + this.standardValues[(this.standardValues.length-1)].date)
        
        if(this.standardValues.length === undefined)
        {
            console.log("valuesIn.length === undefined")
            return null;
        }

        const tempRSIData:RSIChartData[] = [];

        //console.log('subsetOfData: ' + JSON.stringify(this.fullYearOfDataValues))

        const lastClose=this.fullYearOfDataValues[0].close;
        const firstRsiDataPoint:RSIChartData=this.generateFirstRSIvalue(this.fullYearOfDataValues,lastClose)!
        tempRSIData.push(firstRsiDataPoint)

        //console.log('firstRsiDataPoint as object within RSIData: ' + JSON.stringify(tempRSIData[(tempRSIData.length-1)]))

        /*
        for(let endAddress=((this.numberOfDaysToLookBack+1)), standardValuesAddress=0;
                             endAddress < (dataToEvaluate.length+1);
                             ++endAddress, ++standardValuesAddress)
        {
          let subsetOfData=this.colllectSubsetOfDateToEvaluate(endAddress,dataToEvaluate)
          //console.log('subsetOfData[(subsetOfData.length-1)].date: ' + subsetOfData[(subsetOfData.length-1)].date)
          
          let nextRSIValue=this.generateASucessiveRSIvalue(RSIData[(RSIData.length-1)].rsiValue,
          subsetOfData[(subsetOfData.length-1)],this.numberOfDaysToLookBack)
          RSIData.push(nextRSIValue)
          console.log('nextRSIValue: ' + nextRSIValue)
        }
        */
        //console.log('dataToEvaluate length:' + this.fullYearOfDataValues.length)
        //console.log(' dataToEvaluate[(dataToEvaluate.length-1)]: ' + JSON.stringify( dataToEvaluate[0]))
        // console.log('date this.fullYearOfDataValues last date:' +  this.fullYearOfDataValues[(this.fullYearOfDataValues.length-1)].date)

        for(let i=(this.numberOfDaysToLookBack + 1); i < this.fullYearOfDataValues.length;++i)
        {

          //console.log('i: ' + i +'this.fullYearOfDataValues[i].date: ' + this.fullYearOfDataValues[i].date)

          //console.log('RSIData[(RSIData.length-1)].rsiValue: ' + RSIData[(RSIData.length-1)].rsiValue)

          const nextRSIValue=this.generateASucessiveRSIvalue(tempRSIData[(tempRSIData.length-1)],
            this.fullYearOfDataValues[i],this.numberOfDaysToLookBack)
            tempRSIData.push(nextRSIValue)
            //console.log('nextRSIValue: ' + nextRSIValue)
        }

        //console.log('last RSIValue: ' + tempRSIData[(tempRSIData.length-1)])

        const refAddressToStartFrom= this.findStartAddressBasedOnDate(tempRSIData,this.standardValues[0].date)

        //console.log('refAddressToStartFrom: ' + refAddressToStartFrom + ', (tempRSIData.length-1):' + (tempRSIData.length-1))

        // Check if the start address was found
        if(refAddressToStartFrom === -1)
        {
            console.log('Insufficient data for RSI calculation. Could not find starting date: ' + this.standardValues[0].date)
            return null;
        }

        const RSIData = [];
        for(let i=refAddressToStartFrom;i<(tempRSIData.length);++i)
        {
          const aRSIChartDataEntry= new  RSIChartData(tempRSIData[i].dateOfClose,
            tempRSIData[i].close,
            tempRSIData[i].upwardMean,
            tempRSIData[i].downwardMean,
            tempRSIData[i].rsiValue)
            RSIData.push(aRSIChartDataEntry)
        }
        //console.log('RSIData: ' + JSON.stringify(RSIData))
        return RSIData;
      }

      generateASucessiveRSIvalue(lastRSIChartValue:RSIChartData,dataToEavaluate:HistoricalPriceFull_V3,numberOfDaysToLookBack:number):RSIChartData
      {
        //console.log('lastRSIChartValue: ' + JSON.stringify(lastRSIChartValue))
        //console.log('generateASucessiveRSIvalue dataToEavaluate: ' + JSON.stringify(dataToEavaluate))

        //const meanMultiplier = parseFloat((numberOfDaysToLookBack-1))
        const meanMultiplier = (numberOfDaysToLookBack-1)
        //console.log('meanMultiplier: ' + meanMultiplier)

        let currentSummedUpwardMean = (lastRSIChartValue.upwardMean*meanMultiplier);
        let currentSummedDownardMean = (lastRSIChartValue.downwardMean*meanMultiplier);

        if(dataToEavaluate.close>lastRSIChartValue.close){
          currentSummedUpwardMean+= (dataToEavaluate.close-lastRSIChartValue.close)
        }
        //const newUpwardMean=currentSummedUpwardMean/parseFloat(numberOfDaysToLookBack)
        const newUpwardMean=currentSummedUpwardMean/numberOfDaysToLookBack

        if(dataToEavaluate.close<lastRSIChartValue.close){
          currentSummedDownardMean+= (lastRSIChartValue.close-dataToEavaluate.close)
        }
        //const newDownwardMean=currentSummedDownardMean/parseFloat(numberOfDaysToLookBack)
        const newDownwardMean=currentSummedDownardMean/numberOfDaysToLookBack
        let RS= 0.0
        if(newDownwardMean!== 0.0)
        {
          RS=(newUpwardMean/newDownwardMean)
        }
        
        const RSI = 100 - (100/(1+RS))

        
        const calculatedRSIChartDataEntry = new RSIChartData(dataToEavaluate.date,
          dataToEavaluate.close,
          newUpwardMean,
          newDownwardMean,
          RSI)

          //console.log('calculatedRSIChartDataEntry: ' + calculatedRSIChartDataEntry)

          return calculatedRSIChartDataEntry

      }

      generateFirstRSIvalue(dataToEvaluate:HistoricalPriceFull_V3[],lastClose:number):RSIChartData
      {
        //console.log('dataToEvaluate.length: ' + dataToEvaluate.length + ', lastClose: ' + lastClose)
        if(dataToEvaluate.length<1)
        {
            return  new RSIChartData("unknown",
              0,
              0,
              0,
              0)
        }
        const endAddress=(this.numberOfDaysToLookBack)
        //console.log('endAddress: ' + endAddress)
        const subsetOfData=this.colllectSubsetOfDateToEvaluate(endAddress,dataToEvaluate)
        //console.log('subsetOfData.length: ' + subsetOfData.length)
        const upwardMean=this.calculateMeanForUpwardMovements(subsetOfData,lastClose)
        const downwardMean=this.calculateMeanForDownwardMovements(subsetOfData,lastClose)
        //console.log('upwardMean: ' + upwardMean)
        //console.log('downwardMean: ' + downwardMean)
        let tempRsiValue=0.0;

        if(downwardMean>0.0)
        {
          tempRsiValue=(upwardMean/downwardMean)
        }
        const firstRsiValue = (100.0-(100.0/(1.0+tempRsiValue)))

        //console.log("date of lastEntry: " + subsetOfData[(subsetOfData.length-1)].date)

        const aRSIChartDataValue= new RSIChartData(subsetOfData[(subsetOfData.length-1)].date,
          subsetOfData[(subsetOfData.length-1)].close,
          upwardMean,
          downwardMean,
          firstRsiValue)
        return aRSIChartDataValue
      }

      calculateMeanForUpwardMovements(dataToEvaluate:HistoricalPriceFull_V3[],lastClose:number)
      {
        let total=0.0;
        //const meanCounter=parseFloat(dataToEvaluate.length)
        const meanCounter=dataToEvaluate.length
        let currentRefClosingPrice=lastClose;
        for(let i=0;i<dataToEvaluate.length;++i)
        {
          if(dataToEvaluate[i].close>currentRefClosingPrice)
          {
            total+=(dataToEvaluate[i].close-currentRefClosingPrice)            
          }
          currentRefClosingPrice=dataToEvaluate[i].close
        }
        if(meanCounter>=1.0)
        {
            return (total/meanCounter)
        }
        else{
        return 0.0
        }
      }

      calculateMeanForDownwardMovements(dataToEvaluate:HistoricalPriceFull_V3[],lastClose:number)
      {
        let total=0.0;
        //let meanCounter=parseFloat(dataToEvaluate.length)
        const meanCounter=dataToEvaluate.length
        let currentRefClosingPrice=lastClose;
        for(let i=0;i<dataToEvaluate.length;++i)
        {
          if(dataToEvaluate[i].close<currentRefClosingPrice)
          {
            total+=(currentRefClosingPrice-dataToEvaluate[i].close)
            
          }
          currentRefClosingPrice=dataToEvaluate[i].close
        }
        if(meanCounter>=1.0)
        {
          //console.log('meanCounter: ' + meanCounter)
          return (total/meanCounter)
        }
        else{
        return 0.0
        }
      }


      colllectSubsetOfDateToEvaluate(endAddress:number,dataToEvaluate:HistoricalPriceFull_V3[])
      {
        const subSetOfData:HistoricalPriceFull_V3[]=[];
        //console.log('endAddress-this.numberOfDaysToLookBack: ' + (endAddress-this.numberOfDaysToLookBack))
        for(let i=(endAddress-this.numberOfDaysToLookBack);i<endAddress;++i)
        {
            //console.log('i: ' + i)
            subSetOfData.push(dataToEvaluate[i])
        }
        return subSetOfData;
      }

      findStartAddressBasedOnDate(dataToEvaluate:RSIChartData[],dateToFind:string)
      {
        //console.log('dataToEvaluate: ' + JSON.stringify(dataToEvaluate))
        //console.log('dateToFind: ' + JSON.stringify(dateToFind))
        let address=-1;
        for(let i=0;i<dataToEvaluate.length;++i)
        {
            if(dataToEvaluate[i].dateOfClose===dateToFind)
            {
                //console.log('located ' + dateToFind + ' at address: ' + i + ' where the date is: ' + dataToEvaluate[i].date)
                address=i;
                break;
            }
        }
        return address;
      }

}
