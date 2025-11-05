

export default class StandardCharData {
  dateOfClose;
  dailyClosingPrice;
  simpleMovingAverage;
  expMovingAverage;
  twoHundredDayMovingAverage;
  fiftyDayMovingAverage;
  lowerBollingerValue;
  upperBollingerValue;
  mean;
  constructor(dateOfClosein:string,dailyClosingPriceIn:number,simpleMovingAverageIn:number,expMovingAverageIn:number,twoHundredDayMovingAverageIn:number,fiftyDayMovingAverageIn:number,
              lowerBollingerValueIn:number,upperBollingerValueIn:number,meanIn:number) {
    this.dateOfClose = dateOfClosein;
    this.dailyClosingPrice = dailyClosingPriceIn;
    this.simpleMovingAverage =simpleMovingAverageIn;    
    this.expMovingAverage=expMovingAverageIn;
    this.twoHundredDayMovingAverage = twoHundredDayMovingAverageIn;
    this.fiftyDayMovingAverage = fiftyDayMovingAverageIn;
    this.lowerBollingerValue=lowerBollingerValueIn;
    this.upperBollingerValue=upperBollingerValueIn; 
    this.mean=meanIn;            
  }
  
  /*
  set simpleMovingAverage(val){
    console.log("setting simpleMovingAverage")
    this.simpleMovingAverage = val;
  }

  set expMovingAverage(val){
    console.log("setting expMovingAverage")
    this.expMovingAverage = val;
  }
  */
 
  toString() {
      return "dateOfClose: " + this.dateOfClose + ':, dailyClosingPrice: ' + this.dailyClosingPrice +
      ':, simpleMovingAverage: ' + this.simpleMovingAverage + ':, expMovingAverage: ' + this.expMovingAverage +':, twoHundredDayMovingAverage: ' + this.twoHundredDayMovingAverage
      +':, fiftyDayMovingAverage: ' + this.fiftyDayMovingAverage;
    }
}