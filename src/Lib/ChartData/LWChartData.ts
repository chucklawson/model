// not really being used
export default class LWChartData {
  date;
  open;
  high;
  low;
  close;
  volume;
  williams;
    constructor(dateIn:string,openIn:number,highIn:number,lowIn:number,closeIn:number,volumeIn:number,williamsIn:number) {
      this.date = dateIn.substring(0,10);
      this.open = openIn;
      this.high = highIn;
      this.low = lowIn;
      this.close = closeIn;
      this.volume = volumeIn;
      this.williams = williamsIn;
    }

    toString() {
        return 'date: ' + this.date + ', open: ' + this.open + ', high: ' + this.high 
        + ', low: ' + this.low + ', close: ' + this.close + ', volume: ' + this.volume + ', williams: ' + this.williams;
      }
}