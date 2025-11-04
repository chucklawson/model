import LWChartData from "./LWChartData"

export default class LWChartEntries {
  larryWilliams;
  startDate;
  endDate;
    constructor(larryWilliamsIn:LWChartData[],startDateIn:string,endDateIn:string) {
        this.larryWilliams = larryWilliamsIn;
        this.startDate = startDateIn;
        this.endDate = endDateIn;
        //console.log("larryWilliams startDate: "+ this.startDate +  ", endDate: " + this.endDate);
        //console.log("larryWilliams: "+ JSON.stringify(this.larryWilliams))

        

        //LWChartData
        //console.log("larryWilliams length: "+ JSON.stringify(this.larryWilliams.length))
        //console.log("fullYearOfDataValuesIn: "+ JSON.stringify(fullYearOfDataValuesIn))
      }

    generateLWValues()
    {
        

       

        if((this.larryWilliams == null)||(this.larryWilliams.length === undefined))
        {
            console.log("larryWilliams.length is null or undefined")
            return null;
        }

        const startAddress = this.findAddressBasedOnDate(this.larryWilliams,this.startDate)
        const endAddress = this.findAddressBasedOnDate(this.larryWilliams,this.endDate)
        //console.log("start address: " + startAddress)
        //console.log("end address: " + endAddress)

        const LWData = [];

        for(let i=startAddress;i>=endAddress;--i)
        {
          const aLWChartData = new LWChartData( this.larryWilliams[i].date,
            this.larryWilliams[i].open,
            this.larryWilliams[i].high,
            this.larryWilliams[i].low,
            this.larryWilliams[i].close,
            this.larryWilliams[i].volume,
            this.larryWilliams[i].williams);

            LWData.push(aLWChartData);
        }

        //console.log("LWData:  " + LWData)

        return LWData;
      }

      findAddressBasedOnDate(dataToEvaluate:LWChartData[],dateToFind:string)
      {
        //console.log('dataToEvaluate: ' + JSON.stringify(dataToEvaluate))

        //console.log('dateToFind: ' + dateToFind);

        let dateToLocate=new Date(dateToFind)

        dateToLocate=new Date(this.convertDateForAnalysis(dateToLocate))

        //consoleateToLocate: ' + dateToLocate);
        
        let address=-1;
        for(let i=0;i<dataToEvaluate.length;i++)
        {
            let dateEvaluating = new Date(dataToEvaluate[i].date); 
            dateEvaluating=new Date( this.convertDateForAnalysis(dateEvaluating) )

            //console.log('dateEvaluating: ' + dateEvaluating);

            if(dateEvaluating<=dateToLocate)
            {
                //console.log('located ' + dateToFind + ' at address: ' + i + ' where the date is: ' + dataToEvaluate[i].date)
                address=i;
                break;
            }
        }
        return address;
      }

      convertDateForAnalysis(dateIn:Date)
      {
          const isoDate=dateIn.toISOString()
          const convertedDate=isoDate.substring(0,isoDate.indexOf('T'))
          return convertedDate;
      }
      

}
