export default class StochasticChartData {
  dateOfClose
  fastSstochasticValue
  slowStochasticValue
    constructor(dateOfClosein:string,fastSstochasticValueIn:number,slowStochasticValueIn:number) {
      this.dateOfClose = dateOfClosein;
      this.fastSstochasticValue=fastSstochasticValueIn;
      this.slowStochasticValue = slowStochasticValueIn;
    }

    toString() {
        return "dateOfClose: " + this.dateOfClose + ', fastSstochasticValue: ' + this.fastSstochasticValue
         + ', slowStochasticValue: ' + this.slowStochasticValue;
      }
}