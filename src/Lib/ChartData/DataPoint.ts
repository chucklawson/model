export default class DataPoint {
  date;
  calculatedValue;
    constructor(dateIn: string,calculatedValueIn:number) {
        this.date = dateIn;
        this.calculatedValue=calculatedValueIn;
    }
    toString() {
        return ("DataPoint date: " + this.date + ':, calculatedValue: ' + this.calculatedValue);
      }
  }