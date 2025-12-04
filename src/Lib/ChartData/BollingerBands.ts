import BollingerBandDataPoint from "./BollingerBandDataPoint"
import DataPoint from './DataPoint'
import type HistoricalPriceFull_V3 from "../HistoricalPriceFull_V3";

export default class BollingerBands {
  standardValues
  adjustedToContainFullYearOfDataValues
  numberOfDaysToLookBack
  mean
    constructor(standardValuesIn:HistoricalPriceFull_V3[],adjustedToContainFullYearOfDataValuesIn:HistoricalPriceFull_V3[],numberOfDaysToLookBackIn:number) {
        this.standardValues = standardValuesIn;
        this.adjustedToContainFullYearOfDataValues = adjustedToContainFullYearOfDataValuesIn;
        this.numberOfDaysToLookBack=numberOfDaysToLookBackIn;
        this.mean=0.0;
        //console.log("adjustedToContainFullYearOfDataValuesIn: "+ JSON.stringify(adjustedToContainFullYearOfDataValuesIn))

        //console.log("BollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("BollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)
        //console.log("BollingerBands numberOfDaystoLookBack: " + this.numberOfDaystoLookBack)
      }

    generateBollingerBands()
    {
        //console.log("generateBollingerBands valuesIn.length: " + this.standardValues.length)
        //console.log("generateBollingerBands adjustedValues.length: " + this.adjustedToContainFullYearOfDataValues.length)        
        //console.log('Range: ' + this.standardValues[0].date + ', through: ' + this.standardValues[(this.standardValues.length-1)].date)
        
        if(this.standardValues.length === undefined)
        {
            console.log("valuesIn.length === undefined")
            return null;
        }
        

        //console.log("this.numberOfDaysToLookBack: " + this.numberOfDaysToLookBack)

        /*
        // Adjust here to use standard moving average instead of exponential
        // if you want to wrap around the standard moving average, use this instead.
        let movingAverageToWrap = new StandardMovingAverage(this.adjustedToContainFullYearOfDataValues,this.numberOfDaysToLookBack);
        let movingAverage=standardMovingAverage.generateTheUnrestrictedAverages()
        



        //let movingAverageToWrap = new ExponentialMovingAverage(this.adjustedToContainFullYearOfDataValues,this.numberOfDaysToLookBack);
        //let movingAverage = movingAverageToWrap.generateTheUnrestrictedAverages()
        */
        const movingAverage = this.buildStandardChartDataFromEndPointData(this.adjustedToContainFullYearOfDataValues)


        //console.log('movingAverage.length: ' + movingAverage.length)
        //console.log("datapoints:" + JSON.stringify(simpleMovingAverage))

        // basically start with 292 datapoints and get back 259 which equals points in less days to look back of 33
        //datapoints:[{"date":"2022-03-07","calculatedValue":344.49060606060607},{"date":"2022-03-08","calculatedValue":343.7687878787879},

        
        //for(let i=0;i< simpleMovingAverage.length;++i)
        //{
           // console.log('simpleMovingAverage datapoint:' + simpleMovingAverage[i].date + ", $" + simpleMovingAverage[i].calculatedValue)
        //}

        

        const tempBollingerBands = [];

        //console.log('StndardValues: ' +JSON.stringify(this.standardValues))
        //console.log('StndardValues address 0: ' +JSON.stringify(this.standardValues[0]))
        //console.log('StndardValues address 0: ' + this.standardValues[0].adjClose)

        for(let endAddress=(this.numberOfDaysToLookBack), standardValuesAddress=0;
                             endAddress < (movingAverage.length+1);
                             ++endAddress, ++standardValuesAddress)
        {
            const subsetOfData=this.colllectSubsetOfDateToEvaluate(endAddress,movingAverage)
            //console.log('subsetOfData.length: ' + JSON.stringify(subsetOfData.length))
            //console.log('subsetOfData: ' + JSON.stringify(subsetOfData))
            const standardDeviation=this.generateOneSetOfDataPoints(subsetOfData)
            //console.log('standardDeviation:' + standardDeviation + " for: " + subsetOfData[subsetOfData.length-1].date)
            const aBollingerBandDataPoint = new BollingerBandDataPoint(subsetOfData[subsetOfData.length-1].date,
                                                                        //(subsetOfData[subsetOfData.length-1].calculatedValue-(standardDeviation*2.0)),
                                                                        //(subsetOfData[subsetOfData.length-1].calculatedValue+(standardDeviation*2.0)),
                                                                        (this.mean-(standardDeviation*2.0)),
                                                                        (this.mean+(standardDeviation*2.0)),
                                                                        0.0,
                                                                        subsetOfData[subsetOfData.length-1].calculatedValue,
                                                                        standardDeviation,
                                                                        this.mean);
                                                                        //console.log('this.mean: ' + this.mean)
            tempBollingerBands.push(aBollingerBandDataPoint)

            //console.log('aBollingerBandDataPoint: ' + aBollingerBandDataPoint.toString() + ', at address: ' + (tempBollingerBands.length-1))
        }

        const refBollingerBandAddress=this.findStartAddressBasedOnDate(tempBollingerBands,this.standardValues[0].date)


        //console.log('refBollingerBandAddress: ' + refBollingerBandAddress + ' from a possible: ' + tempBollingerBands.length)
        //console.log('Number of possible this.standardValues: ' + this.standardValues.length)
        //console.log('Date looking for: ' + this.standardValues[0].date)

        // Check if the start address was found
        if(refBollingerBandAddress === -1)
        {
            console.log('Insufficient data for Bollinger Bands calculation. Could not find starting date: ' + this.standardValues[0].date)
            return null;
        }

        const bollingerBands=[]

        for(let i=0,j=refBollingerBandAddress;i<this.standardValues.length;++i,++j)
        {
            //console.log('Setting aBollingerBandDataPoint date for: ' + tempBollingerBands[j].date)

            const aBollingerBandDataPoint = new BollingerBandDataPoint(tempBollingerBands[j].date,
                tempBollingerBands[j].lowerBandValue,
                tempBollingerBands[j].upperBandValue,
                this.standardValues[i].close,
                tempBollingerBands[j].movingAverage,
                tempBollingerBands[j].starndardDeviation,
                tempBollingerBands[j].mean)

                bollingerBands.push(aBollingerBandDataPoint)       
                                                            
        }

        return bollingerBands;
    }// end of get bollinger bands

      generateOneSetOfDataPoints(dataToEvaluate:DataPoint[])
      {
        //console.log("This is eodResponseInfo within BollingerBands.generateOneSetOfDataPoints:");
        //const keys = Object.keys(dataToEvaluate[0])
        //const values = keys.map(key => `${key}: ${Reflect.get(dataToEvaluate[0],key)}`)
        //console.log(values)

        this.mean = this.generateMean(dataToEvaluate)
        //console.log('mean:' + mean)
        const standardDeviation=this.calculateStdDeviation(this.mean,dataToEvaluate)
        return standardDeviation
      }

      generateMean(dataToEvaluate:DataPoint[])
      {
        if(dataToEvaluate.length<1)
        {
            return 0.0
        }
        let total=0.0;
        for(let i=0;i< dataToEvaluate.length;++i)
        {
            //total+=parseFloat(dataToEvaluate[i].calculatedValue)
            total+=dataToEvaluate[i].calculatedValue;
        }
        //return (total/parseFloat(dataToEvaluate.length))
        return (total/dataToEvaluate.length);
      }


      calculateStdDeviation(meanIn:number,dataToEvaluate:DataPoint[])
      {
        if(dataToEvaluate.length<1)
        {
            return 0.0
        }
        const mean=meanIn;
        let summedVariance=0.0;
        for(let i=0;i< dataToEvaluate.length;++i)
        {
            //let variance=parseFloat(dataToEvaluate[i].calculatedValue)-mean
            const variance=dataToEvaluate[i].calculatedValue-mean
            summedVariance += (variance*variance)
        }
        //console.log("summedVariance: " + summedVariance + ", dataToEvaluate.length: " + dataToEvaluate.length)
        //return Math.sqrt(summedVariance/parseFloat(dataToEvaluate.length))
        return Math.sqrt(summedVariance/dataToEvaluate.length)

      }

      colllectSubsetOfDateToEvaluate(endAddress:number,dataToEvaluate:DataPoint[])
      {
        const subSetOfData=[];
        //console.log('endAddress-this.numberOfDaysToLookBack: ' + (endAddress-this.numberOfDaysToLookBack))
        for(let i=(endAddress-this.numberOfDaysToLookBack);i<endAddress;++i)
        {
            //console.log('i: ' + i)
            subSetOfData.push(dataToEvaluate[i])
        }
        return subSetOfData;
      }

      findStartAddressBasedOnDate(dataToEvaluate:BollingerBandDataPoint[],dateToFind:string)
      {
        let address=-1;
        //console.log("findStartAddressBasedOnDate: dateToFind: " + dateToFind)

        for(let i=0;i<dataToEvaluate.length;++i)
        {
          //console.log("dataToEvaluate[i].date: " +dataToEvaluate[i].date.toISOString())
            //if(dataToEvaluate[i].date === dateToFind)
          if ( dateToFind === dataToEvaluate[i].date)
            {
               //console.log('located ' +dateToFind + ' at address: ' + i + ' where the date is: ' + dataToEvaluate[i].date)
                address=i;
                break;
            }
        }
        return address;
      }

      buildStandardChartDataFromEndPointData(endPointDataToConvert:HistoricalPriceFull_V3[])
      {
        const chartData=[];
        for(let i=0;i<endPointDataToConvert.length;++i)
        {
            const aDataPoint = new DataPoint(endPointDataToConvert[i].date, endPointDataToConvert[i].close);
            chartData.push(aDataPoint)
        }
        return chartData;
      }

      convertDateStringToYear_Month_DayOnly(dateIn:Date):string
      {
        const isoDate=dateIn.toISOString()
        return isoDate.substring(0,isoDate.indexOf('T'))
        //return convertedDate;
      }

}
