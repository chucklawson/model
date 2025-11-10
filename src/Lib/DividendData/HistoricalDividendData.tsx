
export default class HistoricalDividendData {
date:string;
label:string;
adjDividend:number;
dividend:number;
recordDate:string;
paymentDate:string;
declarationDate:string;
    constructor(dataObjectIn:HistoricalDividendData) {
        this.date=dataObjectIn.date;
        this.label=dataObjectIn.label;
        this.adjDividend=dataObjectIn.adjDividend;
        this.dividend=dataObjectIn.dividend;
        this.recordDate=dataObjectIn.recordDate;
        this.paymentDate=dataObjectIn.paymentDate;
        this.declarationDate=dataObjectIn.declarationDate;
    }

    toString() {
        return "date: " + this.date + ', label: ' + this.label
         + ', adjDividend: ' + this.adjDividend + ', dividend: ' + this.dividend
         + ', recordDate: ' + this.recordDate + ', paymentDate: ' + this.paymentDate
         + ', declarationDate: ' + this.declarationDate
    }
}