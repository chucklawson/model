
import type HistoricalPriceFull_V3 from './HistoricalPriceFull_V3.ts';

export default class GetValuesBasedOnDate {
  date: Date;

    constructor(dateIn: Date){
      this.date=dateIn;
    }

    getAHistoricDateBySubtractingFromNow(numberOfDaysToGoBack:number,oneYearHistoryChecked:boolean)
    {
        const date =new Date();
        
        if(oneYearHistoryChecked === true)
        {
            date.setDate(date.getDate()-1)
            date.setFullYear(date.getFullYear() -1);
        }
        else{
            date.setDate(date.getDate()-numberOfDaysToGoBack)
        }
        return date;
    }

    goBackSpecificNumberOfDays(adjustedTimeSeriesIn: HistoricalPriceFull_V3[], numberOfDaysToGoBack: number)
    {
        const adjustedTimeSeries=adjustedTimeSeriesIn;

        if(adjustedTimeSeries.length<2)
        {
            return -1.0;
        }

        const dateToLocate = getAHistoricDateBySubtractingFromNow(numberOfDaysToGoBack,false);

        /*
        console.log('adjustedTimeSeries stringified: '+ JSON.stringify(adjustedTimeSeries[0]))
        
        for(let i=0;i<adjustedTimeSeries.length;++i)
        {
            console.log('adjustedTimeSeries.date: ' + adjustedTimeSeries[i].date, ', adjClose: ' + adjustedTimeSeries[i].adjClose)
        }
        */

        const value = findAValueBasedOnDate(dateToLocate,adjustedTimeSeries)
        return value;
    }

    findAValueBasedOnDate(dateToLocate:Date,timeSeries:HistoricalPriceFull_V3[])
    {
        let value=0.0;
        //console.log('findAValueBasedOnDate, dateToLocate: ' + dateToLocate.toLocaleDateString());
        for(let i=0;i<timeSeries.length;++i)
        {
            const tempDate=new Date(timeSeries[i].date)
            if(tempDate<=dateToLocate)
            {
                value = timeSeries[i].adjClose;
                //console.log('findAValueBasedOnDate, tempDate: ' + tempDate.toLocaleDateString() + ', value: ' + value);
            }
            else{
                //console.log('findAValueBasedOnDate, BREAKING, tempDate: ' + tempDate.toLocaleDateString() + ', value: ' + timeSeries[i].adjClose);
                value = timeSeries[i].adjClose;
                break;
            }
        }
        return value;
    }

    findTheLowValueBasedOnDate(dateToLocate:Date,timeSeries:HistoricalPriceFull_V3[])
    {
        let lowValue=10000000.0;
        //console.log('findTheHighValueBasedOnDate, dateToLocate: ' + dateToLocate.toLocaleDateString());
        for(let i=0;i<timeSeries.length;++i)
        {
            const tempDate=new Date(timeSeries[i].date)
            if(tempDate>dateToLocate)
            {
                //if( parseFloat(timeSeries[i].adjClose) < lowValue)
              if( timeSeries[i].adjClose < lowValue)
                {
                    //lowValue = parseFloat(timeSeries[i].adjClose);
                    lowValue = timeSeries[i].adjClose;
                    //console.log('Set low value: ' + lowValue);
                }
            }
        }
        return lowValue;
    }

    findTheHighValueBasedOnDate(dateToLocate:Date,timeSeries:HistoricalPriceFull_V3[])
    {
        let hightValue=0.0;
        //console.log('findTheHighValueBasedOnDate, dateToLocate: ' + dateToLocate.toLocaleDateString());
        for(let i=0;i<timeSeries.length;++i)
        {
            const tempDate=new Date(timeSeries[i].date)
            if(tempDate>dateToLocate)
            {
                //if( parseFloat(timeSeries[i].adjClose) > hightValue)
                if(timeSeries[i].adjClose > hightValue)
                {
                    hightValue = timeSeries[i].adjClose;
                    //console.log('Set high value: ' + hightValue);
                }
            }
        }
        return hightValue;
    }

    convertDateForDateInputPicker(dateIn:Date):string
    {
        const isoDate=dateIn.toISOString()
        return isoDate.substring(0,isoDate.indexOf('T'))
      //return convertedDate;
    }

    getDate_2017():Date
    {
        return new Date(Date.parse("2017-02-01T00:00:00"));
        //date=Date.parse("2017-02-01T00:00:00");
    }

    getDate_2021()
    {
       return new Date(Date.parse("2021-02-01T00:00:00"));
        //date=Date.parse("2021-02-01T00:00:00");
    }

    getDate_2025()
    {
        return new Date(Date.parse("2025-02-01T00:00:00"));
        //date=Date.parse("2025-02-01T00:00:00");
    }


    toString() {
        return ("GetValuesBasedOnDate: " + this.date);
      }
  };

  export const { goBackSpecificNumberOfDays, getAHistoricDateBySubtractingFromNow,
                     findAValueBasedOnDate, findTheLowValueBasedOnDate, findTheHighValueBasedOnDate,
                     convertDateForDateInputPicker,getDate_2017,getDate_2021,getDate_2025 } = new GetValuesBasedOnDate(new Date())



