import HistoricalDividendData from './HistoricalDividendData'
import type Quote_V3 from "../Quote_V3.ts";

interface rowValues{
  value: string|number;
}

export function loadHistoricalMetricsData(dividendData:HistoricalDividendData[])
{
    const historicalDividendsData = [];

    if((dividendData!=null) && (dividendData.length !== undefined))
    {
        for(let i=0;i<dividendData.length;++i)
        {
            const historicalDividendData = new HistoricalDividendData(dividendData[i])
            historicalDividendsData.push(historicalDividendData);            
        }
    }
    //console.log('historicalDividendsData.length' + historicalDividendsData.length)
    return historicalDividendsData;
}

export function buildRowTitles(historicalData:HistoricalDividendData[],periodsToShow:number)
{
    let rows:string[] = [];
    //let statementAnalysisKeyMetricsData=statementData[0];

    for(let i=0;i<periodsToShow;++i)
    {
        rows = setRowTitle(rows,historicalData[i].label)
    }   
    return rows;
}

function setRowTitle(rows:string[],titleToUse:string)
{
    rows.push(titleToUse)
    return rows;
}

export function buildColumnTitles()
{
    const colTitles:string[] = [];
    colTitles.push('Date');
    colTitles.push('Adj Dividend');
    colTitles.push('Dividend');
    colTitles.push('Record Date');
    colTitles.push('Payment Date');
    colTitles.push('Declaration Date');
    return colTitles;
}

export function buildHstoricalDataToShow(historicalData:HistoricalDividendData[],periodsToUse:number):rowValues[][]
{
  const rows:rowValues[][] = [];
  let row:rowValues[];
    for(let i=0;i<periodsToUse;++i)
    {    
        row = []; 
        row=addOneRowElement(row,historicalData[i].date);
        row=addOneRowElement(row,historicalData[i].adjDividend);
        row=addOneRowElement(row,historicalData[i].dividend);
        row=addOneRowElement(row,historicalData[i].recordDate);
        row=addOneRowElement(row,historicalData[i].paymentDate);
        row=addOneRowElement(row,historicalData[i].declarationDate);
        rows.push(row)
    }
    return rows;
}

function addOneRowElement(row:rowValues[],element:string|number):rowValues[]
{
    if ((typeof element === 'number') && (Number.isInteger(element)==false))
    {
        row.push({ value: element.toFixed(2) })
    }
    else{
        row.push({ value: element})
    }
    return row;
}

export function calculateYield(historicalData:HistoricalDividendData[],currentQuote:Quote_V3):number
{
    const periodsInPreviousYear=calculatePeriodsInPreiousYear(historicalData)
    //console.log('periodsInPreviousYear: ' + periodsInPreviousYear)

    const dividendRate=periodsInPreviousYear*historicalData[0].dividend
    //console.log('dividendRate: ' + dividendRate)

    //console.log("currentQuote: " + JSON.stringify(currentQuote));

    //console.log('currentPrice: ' + currentQuote.price)

    const price = currentQuote.price

    let percentageYield = 0.0;
    if((dividendRate>0.0)&&(price>0.0))
    {
        percentageYield=Number( ((dividendRate/price)*100.0).toFixed(2) )
    }
    return percentageYield
}

function calculatePeriodsInPreiousYear(historicalData:HistoricalDividendData[])
{
    const previousYear=(parseInt(historicalData[0].date.substring(0,4))-1)
    //console.log('previousYear: ' + previousYear)
    let periodsInPreviousYear=0;
    for(let i=0;i<historicalData.length;++i)
    {
        if(parseInt(historicalData[i].date.substring(0,4)) === previousYear)
        {
            ++periodsInPreviousYear;
        }
    }
    return periodsInPreviousYear;
}

