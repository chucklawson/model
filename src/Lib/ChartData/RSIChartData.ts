export default class RSIChartData {
  dateOfClose;
  close;
  upwardMean;
  downwardMean;
    rsiValue;
    constructor(dateOfClosein:string,closeIn:number,upwardMeanIn:number,downwardMeanIn:number,rsiValueIn:number) {
      this.dateOfClose = dateOfClosein;
      this.close = closeIn;
      this.upwardMean = upwardMeanIn;
      this.downwardMean = downwardMeanIn;
      this.rsiValue=rsiValueIn;
    }

    toString() {
        return "dateOfClose: " + this.dateOfClose + ', close: ' + this.close + ', upwardMean: ' + this.upwardMean +
        ', downwardMean: ' + this.downwardMean + ', rsiValue: ' + this.rsiValue;
      }
}