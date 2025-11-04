export default class BollingerBandDataPoint {
  date
  lowerBandValue
  upperBandValue
  currentPrice
  movingAverage
  starndardDeviation
  mean

    constructor(dateIn:Date,lowerBandValueIn:number,upperBandValueIn:number,currentPriceIn:number, movingAverageIn:number,starndardDeviationIn:number,meanIn:number) {
        this.date = dateIn;
        this.lowerBandValue=lowerBandValueIn;
        this.upperBandValue=upperBandValueIn;
        this.currentPrice=currentPriceIn;
        this.movingAverage=movingAverageIn;       
        this.starndardDeviation=starndardDeviationIn
        this.mean=meanIn
    }
    setDate(dateIn:Date)
    {
        this.date=dateIn;
    }

    setLowerBandValue(lowerBandValueIn:number)
    {
        this.lowerBandValue=lowerBandValueIn;
    }

    setCurrentPrice(currentPriceIn:number)
    {
        this.currentPrice=currentPriceIn;
    }

    setMovingAverage(movingAverageIn:number)
    {
        this.movingAverage=movingAverageIn;
    }
    setUpperBandValue(upperBandValueIn:number)
    {
        this.upperBandValue=upperBandValueIn;
    }
    setStarndardDeviation(starndardDeviationIn:number)
    {
        this.starndardDeviation=starndardDeviationIn;
    }

    toString() {
        return ("BollingerBandDataPoint, date: " + this.date +
         ', lowerBandValue: ' + this.lowerBandValue +
         ', upperBandValue: ' + this.upperBandValue + 
         ', currentPrice: ' + this.currentPrice + 
         ', movingAverage: ' + this.movingAverage +
         ', starndardDeviation: ' + this.starndardDeviation);
      }
  }