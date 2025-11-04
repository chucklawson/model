import StochasticChartData from "./StochasticChartData"
//import StandardMovingAverage from './StandardMovingAverage.ts'
//import DataPoint from "./DataPoint";
import type HistoricalPriceFull_V3 from "../HistoricalPriceFull_V3";

interface StochasticEntry {
  stochasticValue: number;
  dateOfClose: Date;
}
interface DataPointToEvaluate {
  close: number;
  dateOfClose: Date;
}
export default class StochasticChartEntries {

  standardValues
  fullYearOfDataValues
  slowInidcatorDaysToLookBack
  fastInidcatorDaysToLookBack

    constructor(standardValuesIn:HistoricalPriceFull_V3[],fullYearOfDataValuesIn:HistoricalPriceFull_V3[],slowInidcatorDaysToLookBackIn:number,fastInidcatorDaysToLookBackIn:number) {
        this.standardValues = standardValuesIn;
        this.fullYearOfDataValues = fullYearOfDataValuesIn;
        this.slowInidcatorDaysToLookBack=slowInidcatorDaysToLookBackIn;
        this.fastInidcatorDaysToLookBack=fastInidcatorDaysToLookBackIn;
        //console.log("adjustedToContainFullYearOfDataValuesIn: "+ JSON.stringify(adjustedToContainFullYearOfDataValuesIn))

        //console.log("BollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("BollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)
        //console.log("BollingerBands numberOfDaystoLookBack: " + this.numberOfDaystoLookBack)
      }

    generateStochasticValues()
    {
        const fastStochasticValues=this.generateFastStochasticValues(this.fastInidcatorDaysToLookBack)
        //console.log('fastStochasticValues: ' + JSON.stringify(fastStochasticValues))

        const slowStochasticValues=this.generateSlowStochasticValues(fastStochasticValues,this.slowInidcatorDaysToLookBack)

        const stochasticData=this.loadChartData(fastStochasticValues,slowStochasticValues)

       //console.log('slowStochasticValues: ' + JSON.stringify(slowStochasticValues))
        //let stochasticData=[]
        return stochasticData;
    }

    loadChartData(fastStochasticValues:StochasticEntry[]|void,slowStochasticValues:StochasticEntry[]|void):StochasticChartData[]|void
    {
      if((!fastStochasticValues)||(!slowStochasticValues))
      {
        return;
      }
        const stochasticChartData=[]
        //console.log('fastStochasticValues: ' + JSON.stringify(fastStochasticValues))
        const startingAddressFastValues = this.findStartAddressBasedOnDate(fastStochasticValues,new Date(this.standardValues[0].date))

        //console.log('date to locate: ' + this.standardValues[0].date + ', Entries to search: ' + slowStochasticValues.length)
        //console.log('slowStochasticValues: ' + JSON.stringify(slowStochasticValues))

        const startingAddressSlowValues = this.findStartAddressBasedOnDate(slowStochasticValues,new Date(this.standardValues[0].date))
        //console.log('startingAddressFastValues: ' + startingAddressFastValues)

        //console.log('startingAddressSlowValues: ' + startingAddressSlowValues + ',total entries: ' + slowStochasticValues.length)
        
        for(let i=startingAddressFastValues,j=startingAddressSlowValues;i<fastStochasticValues.length;++i,++j)
        {
            const aStochasticChartDataEntry=new StochasticChartData(fastStochasticValues[i].dateOfClose,fastStochasticValues[i].stochasticValue,slowStochasticValues[j].stochasticValue)
            stochasticChartData.push(aStochasticChartDataEntry)
        }
        
        return stochasticChartData
    }

    generateSlowStochasticValues(fastStochasticValues:StochasticEntry[]|void,numberOfDaysToLookBack:number):StochasticEntry[]|void
    {
      const dataPontsToEvaluate:DataPointToEvaluate[]=[]
      if(!fastStochasticValues){
        return;
      }
      for(let i=0;i<fastStochasticValues.length;++i)
        {
            const aDataPointToEvaluate ={
                close: fastStochasticValues[i].stochasticValue,
                dateOfClose: new Date(fastStochasticValues[i].dateOfClose)
            }
            dataPontsToEvaluate.push(aDataPointToEvaluate)
        }
        const movingAverage=this.generateTheDataPointsSimpleMovingAverage(numberOfDaysToLookBack,dataPontsToEvaluate)
        return movingAverage
    }

    generateTheDataPointsSimpleMovingAverage( numberOfDaystoLookBack:number,dataPontsToEvaluate:DataPointToEvaluate[]):StochasticEntry[]|void
    {
      //console.log('dataPontsToEvaluate: ' + JSON.stringify(dataPontsToEvaluate))    
      //console.log('generateTheDataPointsSimpleMovingAverage eodResponseInfo.length: ' + eodResponseInfo.length + ', numberOfDaystoLookBack: ' + numberOfDaystoLookBack)
      if (dataPontsToEvaluate.length < numberOfDaystoLookBack)
      {
        console.log('Returning: dataPontsToEvaluate.length < numberOfDaystoLookBack')
        return;
      }

      const dataPoints:StochasticEntry[] = [];

        // this generates an up to the date average

        for (let i = numberOfDaystoLookBack; i < dataPontsToEvaluate.length; ++i)
        {
          const tempDouble = this.generateOneDataPoint(i, numberOfDaystoLookBack, dataPontsToEvaluate);

          const slowStochasticEntry ={
            stochasticValue: tempDouble,
            dateOfClose: new Date(dataPontsToEvaluate[i].dateOfClose)
        }

          //let aDataPoint = new StochasticChartData(dataPontsToEvaluate[i].dateOfClose, 0.0,tempDouble);
          dataPoints.push(slowStochasticEntry);
        }
        //console.log('dataPoints.length: ' + dataPoints.length)
        return dataPoints;
    }

     // this geneates a simple moving average value for one datapoint
     generateOneDataPoint(startAddress:number,numberOfDaystoLookBack:number,dataPontsToEvaluate:DataPointToEvaluate[]):number
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
         //summedCloses += parseFloat(dataPontsToEvaluate[i].close);
         summedCloses += dataPontsToEvaluate[i].close;
       }
 
       const devisor = numberOfDaystoLookBack;
       return summedCloses / devisor;
     }

    generateFastStochasticValues(numberOfDaysToLookBack:number):StochasticEntry[]|void
    {
        //console.log("generateBollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("generateBollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)        
        //console.log('Range: ' + this.standardValues[0].date + ', through: ' + this.standardValues[(this.standardValues.length-1)].date)
        const fastStochasticData:StochasticEntry[]=[]
        if(this.standardValues.length === undefined)
        {
            console.log("valuesIn.length === undefined")
            return;
        }

        //console.log('this.fullYearOfDataValues[0]:' + JSON.stringify(this.fullYearOfDataValues[0]))
        for(let i=0,endAddress=numberOfDaysToLookBack;i<((this.fullYearOfDataValues.length - numberOfDaysToLookBack)+1);++i,++endAddress)
        {
            const dataToEvaluate=this.colllectSubsetOfDateToEvaluate(endAddress,numberOfDaysToLookBack,this.fullYearOfDataValues)
            //console.log('dataToEvaluate: ' + dataToEvaluate[(dataToEvaluate.length-1)].date)
            const lowTradingPrice = this.obtainLowTradingPrice(dataToEvaluate)
            const highTradingPrice = this.obtainHignTradingPrice(dataToEvaluate)
            const lastClosingPrice = dataToEvaluate[(dataToEvaluate.length-1)].close
            const stochisticValue = this.calculateStochistic(lowTradingPrice,highTradingPrice,lastClosingPrice)
            
            const fastStochasticEntry ={
                stochasticValue: stochisticValue,
                dateOfClose: new Date (dataToEvaluate[(dataToEvaluate.length-1)].date)
            }
            //console.log( 'lowTradingPrice: ' + lowTradingPrice + ', highTradingPrice: ' + highTradingPrice + ', lastClosingPrice: ' + lastClosingPrice)
            //console.log( 'stochisticValue: ' + stochisticValue)
            fastStochasticData.push(fastStochasticEntry)
        }
        //console.log('RSIData: ' + JSON.stringify(RSIData))
        return fastStochasticData;
      }

      calculateStochistic(lowTradingPrice:number,highTradingPrice:number,lastClosingPrice:number)
      {
        if((highTradingPrice-lowTradingPrice)===0.0)
        {
            return 0.0;
        }
        const stochistic = (((lastClosingPrice-lowTradingPrice)/(highTradingPrice-lowTradingPrice))*100.0)

        return stochistic
      }

      obtainLowTradingPrice(dataToEvaluate:HistoricalPriceFull_V3[])
      {
        let lowTradingPrice=10000000000.0
        for(let i=0;i<dataToEvaluate.length;++i)
        {
            if(dataToEvaluate[i].low < lowTradingPrice)
            {
                lowTradingPrice=dataToEvaluate[i].low;
            }
        }
        return lowTradingPrice
      }

      obtainHignTradingPrice(dataToEvaluate:HistoricalPriceFull_V3[])
      {
        let highTradingPrice=-1.0
        for(let i=0;i<dataToEvaluate.length;++i)
        {
            if(dataToEvaluate[i].high > highTradingPrice)
            {
                highTradingPrice=dataToEvaluate[i].high;
            }
        }
        return highTradingPrice
      }

      colllectSubsetOfDateToEvaluate(endAddress:number,numberOfDaysToLookBack:number,dataToEvaluate:HistoricalPriceFull_V3[])
      {
        const subSetOfData=[];
        //console.log('endAddress-this.numberOfDaysToLookBack: ' + (endAddress-this.numberOfDaysToLookBack))
        for(let i=(endAddress-numberOfDaysToLookBack);i<endAddress;++i)
        {
            //console.log('i: ' + i)
            subSetOfData.push(dataToEvaluate[i])
            //console.log('subsetOfData entry: ' + JSON.stringify(dataToEvaluate[i]))
        }
        return subSetOfData;
      }

      findStartAddressBasedOnDate(dataToEvaluate:StochasticEntry[],dateToFind:Date)
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
