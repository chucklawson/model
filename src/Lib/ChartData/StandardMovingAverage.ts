import DataPoint from "./DataPoint"
import StandardChartData from './StandardChartData';
import type HistoricalPriceFull_V3 from "../HistoricalPriceFull_V3";

export default class StandardMovingAverage {
  oneYearOfData;
  numberOfDaystoLookBack;

  //accumulatedChartData:StandardChartData[]=[new StandardChartData('',0,0,0,0,0,0,0,0)];
  accumulatedChartData:StandardChartData[]=[];



    constructor(oneYearOfDataIn:HistoricalPriceFull_V3[],numberOfDaystoLookBackIn:number) {
      this.oneYearOfData = oneYearOfDataIn;
      this.numberOfDaystoLookBack=numberOfDaystoLookBackIn;
    }

    generateTheAverages(accumulatedChartDataIn:StandardChartData[])
    {
      this.accumulatedChartData=accumulatedChartDataIn;
      //console.log("calling this.generateTheDataPointsSimpleMovingAverage, this.numberOfDaystoLookBack: " + this.numberOfDaystoLookBack + ', this.oneYearOfData.length: ' + this.oneYearOfData.length)
      const datapoints=this.generateTheDataPointsSimpleMovingAverage( this.numberOfDaystoLookBack,this.oneYearOfData)!

      //console.log('datapoints returned: ' + datapoints.length)
      //console.log('this.numberOfDaystoLookBack = ' +this.numberOfDaystoLookBack)
      //console.log('this.accumulatedChartData.length: ' + this.accumulatedChartData.length)
      //console.log('accumulatedChartData: ' + JSON.stringify(this.accumulatedChartData))
      //console.log('accumulatedChartData to match up against: ' + this.accumulatedChartData.length)
      //console.log('starting date = ' +this.accumulatedChartData[0].dateOfClose)

      
      let commonStartAddress=0;
      for(let i=0;i<datapoints.length;++i)
      {
        if(datapoints[i].date===this.accumulatedChartData[0].dateOfClose)
        {
          commonStartAddress=i;
          //console.log('Setting commonStartAddress to: ' + commonStartAddress + ', the selected date: ' + this.accumulatedChartData[0].dateOfClose)
        }
      }


      const adjustedChartData = [];
      let k=commonStartAddress;

      let dataPointsToResolve = this.accumulatedChartData.length;
      //console.log('dataPointsToResolve: ' + dataPointsToResolve)
      //console.log('this.numberOfDaystoLookBack: ' + this.numberOfDaystoLookBack)
      //console.log('datapoints.length: ' + datapoints.length)
      if(dataPointsToResolve >= (datapoints.length-this.numberOfDaystoLookBack))
      {
        dataPointsToResolve=((datapoints.length-this.numberOfDaystoLookBack)-1);
      }

      //console.log('dataPointsToResolve: ' + dataPointsToResolve)
      //for(let j=0; j < dataPointsToResolve;)
      for(let j=0; j < this.accumulatedChartData.length;)
      {

        //console.log('j: ' + j + ', k: ' +k)
        //console.log('this.accumulatedChartData[j].simpleMovingAverage: ' + this.accumulatedChartData[j].simpleMovingAverage.toString())
        //console.log('datapoints[k].calculatedValue: ' + datapoints[k].calculatedValue.toString())

        //console.log('this.accumulatedChartData[j].dateOfClose: ' + this.accumulatedChartData[j].dateOfClose)
        //console.log('this.accumulatedChartData[j].dailyClosingPrice: ' + this.accumulatedChartData[j].dailyClosingPrice)

        const adjustedChartDataEntry = new StandardChartData(this.accumulatedChartData[j].dateOfClose,this.accumulatedChartData[j].dailyClosingPrice,datapoints[k].calculatedValue,0.0,0.0,0.0,0.0,0.0,0.0)
        //console.log('adjustedChartDataEntry: ' + adjustedChartDataEntry.toString())
        adjustedChartData.push(adjustedChartDataEntry)
        ++j; ++k;
      }
      return adjustedChartData;
    }

    generateTheDataPointsSimpleMovingAverage( numberOfDaystoLookBack:number,eodResponseInfo:HistoricalPriceFull_V3[]):DataPoint[] | null
    {
      //console.log('eodResponseInfo: ' + JSON.stringify(eodResponseInfo))    
      //console.log('generateTheDataPointsSimpleMovingAverage eodResponseInfo.length: ' + eodResponseInfo.length + ', numberOfDaystoLookBack: ' + numberOfDaystoLookBack)
      if (eodResponseInfo.length < numberOfDaystoLookBack)
      {
        console.log('Returning: eodResponseInfo.length < numberOfDaystoLookBack')
        return null;
      }

      const dataPoints = [];

        // this generates an up to the date average

        for (let i = numberOfDaystoLookBack; i < eodResponseInfo.length; ++i)
        {
          const tempDouble = this.generateOneDataPoint(i, numberOfDaystoLookBack, eodResponseInfo);
          const aDataPoint = new DataPoint(eodResponseInfo[i].date, tempDouble);
          dataPoints.push(aDataPoint);
          //console.log("Added aDataPoint:", aDataPoint.toString());
        }
        //console.log('dataPoints.length: ' + dataPoints.length)
        return dataPoints;
    }

     // this geneates a simple moving average value for one datapoint
     generateOneDataPoint(startAddress:number,numberOfDaystoLookBack:number,eodResponseInfo:HistoricalPriceFull_V3[])
     {
       //console.log('generateOneDataPoint eodResponseInfo.Length: ' + eodResponseInfo.Length + ', numberOfDaystoLookBack: ' + numberOfDaystoLookBack + ', startAddress: '+startAddress)
       if (numberOfDaystoLookBack <= 0)
       {
         console.log('Returning: numberOfDaystoLookBack <= 0')
         return 0.0;
       }
 
       if (startAddress < numberOfDaystoLookBack)
       {
         console.log('Returning: startAddress < numberOfDaystoLookBack')
         return 0.0;
       }
 
       //let theSizeOfTheVector = eodResponseInfo.Length;
 
       // collect values up to the day you are evaluating
       let summedCloses = 0.0;
       for (let i = startAddress + 1 - numberOfDaystoLookBack; i < startAddress + 1; ++i)
       {
         //summedCloses += parseFloat(eodResponseInfo[i].close);
         summedCloses += eodResponseInfo[i].close;
       }
 
       const devisor = numberOfDaystoLookBack;
       return summedCloses / devisor;
     }

    // generates datapoints as a simpleMoving average for the entire set of data less the number of days to look back.

    generateTheUnrestrictedAverages()
    {
      console.log("calling this.generateTheUnrestrictedAverages, this.numberOfDaystoLookBack: " + this.numberOfDaystoLookBack
       + ', this.oneYearOfData.length: ' + this.oneYearOfData.length)

      const datapoints=this.generateTheDataPointsSimpleMovingAverage( this.numberOfDaystoLookBack,this.oneYearOfData)

      //console.log('datapoints returned: ' + datapoints.length)
      //console.log("datapoints:" + JSON.stringify(datapoints))

      return datapoints;
    }
    
    toString() {
        return "StandardMovingAverage, length: " + this.oneYearOfData.length + ', this.numberOfDaystoLookBack: ' + this.numberOfDaystoLookBack;
      }
}