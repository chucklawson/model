import StatementAnalysisKeyMetricsData from '../../Lib/StatementsData/StatementAnalysisKeyMetricsData'
//import SpreadSheet from 'react-spreadsheet'

interface rowValues{
  value: string|number;
}


export function loadStatmentMetricsData(statmentAnalysisKeyMetrics:StatementAnalysisKeyMetricsData[])
{
    const statementData = [];

    if((statmentAnalysisKeyMetrics!=null) && (statmentAnalysisKeyMetrics.length !== undefined))
    {
        for(let i=0;i<statmentAnalysisKeyMetrics.length;++i)
        {
            const statementAnalysisKeyMetricsData = new StatementAnalysisKeyMetricsData(statmentAnalysisKeyMetrics[i])
            statementData.push(statementAnalysisKeyMetricsData);            
        }
    }
    return statementData;
}

export function buildRowTitles()
{
    let rows:string[]= [];
    //const statementAnalysisKeyMetricsData=statementData[0];

    rows = setRowTitle(rows,"priceToEarnings")
    //rows = setRowTitle(rows,"symbol")
    rows = setRowTitle(rows,"date")
    //rows = setRowTitle(rows,"period")
    //rows = setRowTitle(rows,"calendarYear")
    rows = setRowTitle(rows,"revenuePerShare")
    rows = setRowTitle(rows,"netIncomePerShare")
    rows = setRowTitle(rows,"operatingCashFlowPerShare")
    rows = setRowTitle(rows,"freeCashFlowPerShare")
    rows = setRowTitle(rows,"cashPerShare")
    rows = setRowTitle(rows,"bookValuePerShare")
    rows = setRowTitle(rows,"tangibleBookValuePerShare")
    rows = setRowTitle(rows,"shareholdersEquityPerShare")
    rows = setRowTitle(rows,"interestDebtPerShare")
    rows = setRowTitle(rows,"marketCap")
    rows = setRowTitle(rows,"enterpriseValue")
    rows = setRowTitle(rows,"peRatio")
    rows = setRowTitle(rows,"priceToSalesRatio")
    rows = setRowTitle(rows,"pocfratio")
    rows = setRowTitle(rows,"pfcfRatio")
    rows = setRowTitle(rows,"pbRatio")
    rows = setRowTitle(rows,"ptbRatio")
    rows = setRowTitle(rows,"evToSales")
    rows = setRowTitle(rows,"evToFreeCashFlow")
    rows = setRowTitle(rows,"enterpriseValueOverEBITDA")
    rows = setRowTitle(rows,"evToOperatingCashFlow")
    rows = setRowTitle(rows,"earningsYield")
    rows = setRowTitle(rows,"freeCashFlowYield")
    rows = setRowTitle(rows,"debtToEquity")
    rows = setRowTitle(rows,"debtToAssets")
    rows = setRowTitle(rows,"debtToMarketCap")
    rows = setRowTitle(rows,"netDebtToEBITDA")
    rows = setRowTitle(rows,"currentRatio")
    rows = setRowTitle(rows,"interestCoverage")
    rows = setRowTitle(rows,"incomeQuality")
    rows = setRowTitle(rows,"dividendPerShare")
    rows = setRowTitle(rows,"dividendYield")
    rows = setRowTitle(rows,"dividendYieldPercentage")
    rows = setRowTitle(rows,"payoutRatio")
    rows = setRowTitle(rows,"salesGeneralAndAdministrativeToRevenue")
    rows = setRowTitle(rows,"researchAndDevelopementToRevenue")
    rows = setRowTitle(rows,"intangiblesToTotalAssets")
    rows = setRowTitle(rows,"capexToOperatingCashFlow")
    rows = setRowTitle(rows,"capexToRevenue")
    rows = setRowTitle(rows,"capexToDepreciation")
    rows = setRowTitle(rows,"stockBasedCompensationToRevenue")
    rows = setRowTitle(rows,"grahamNumber")
    rows = setRowTitle(rows,"roic")
    rows = setRowTitle(rows,"returnOnTangibleAssets")
    rows = setRowTitle(rows,"grahamNetNet")
    rows = setRowTitle(rows,"workingCapital")
    rows = setRowTitle(rows,"tangibleAssetValue")
    rows = setRowTitle(rows,"netCurrentAssetValue")
    rows = setRowTitle(rows,"investedCapital")

    rows = setRowTitle(rows,"averageReceivables")
    rows = setRowTitle(rows,"averagePayables")
    rows = setRowTitle(rows,"averageInventory")
    rows = setRowTitle(rows,"daysSalesOutstanding")
    rows = setRowTitle(rows,"daysPayablesOutstanding")
    rows = setRowTitle(rows,"daysOfInventoryOnHand")
    rows = setRowTitle(rows,"receivablesTurnover")
    rows = setRowTitle(rows,"payablesTurnover")
    rows = setRowTitle(rows,"inventoryTurnover")
    rows = setRowTitle(rows,"capexPerShare")
    rows = setRowTitle(rows,"updatedAt")
    rows = setRowTitle(rows,"createdAt")
    rows = setRowTitle(rows,"xAxisDataKey")
    rows = setRowTitle(rows,"priceToEarnings")

    return rows;

}

function setRowTitle(rows:string[],titleToUse:string)
{
    rows.push(titleToUse)
    return rows;
}

export function buildColumnTitlesByPeriod(statementData:StatementAnalysisKeyMetricsData[],maxPeriodsIn:number)
{
    const colTitles:string[] = [];
    let maxPeriods=maxPeriodsIn;
    if(statementData.length<maxPeriods)
    {
        maxPeriods=statementData.length
    }
    for(let i=0;i<maxPeriods;++i)
    {
        const aColumnTitle:string = statementData[i].xAxisDataKey;
        colTitles.push(aColumnTitle);
    }
    colTitles.push('Average');
    return colTitles;
}


export function buildDataToShow(statementData:StatementAnalysisKeyMetricsData[],periodsToUseIn:number)
{
    let periodsToUse:number=periodsToUseIn;
    if(statementData.length<periodsToUse)
    {
        periodsToUse=statementData.length
    }

    const rows:rowValues[][] = [];
    let row:rowValues[];

    let accumulatedValue=Number(0.0);
    let averageValue=0.0;

    row=[];

    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].priceToEarnings)
        const tempValue=Number(statementData[i].priceToEarnings);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    /*
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].symbol)
    }
    rows.push(row)
    */
    row = [];
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].date)
    }
    rows.push(row)

    /*
    row = [];
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].period)
    }
    rows.push(row)

    row = [];
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].calendarYear)
    }
    rows.push(row)
    */

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].revenuePerShare)
        const tempValue=Number(statementData[i].revenuePerShare);
        accumulatedValue+=tempValue;
    }
    //console.log('accumulatedValue:' + accumulatedValue)
    averageValue=(accumulatedValue/periodsToUse);
    //console.log('averageValue:' + averageValue)
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].netIncomePerShare)
        const tempValue=Number(statementData[i].netIncomePerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].operatingCashFlowPerShare)
        const tempValue=Number(statementData[i].operatingCashFlowPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].freeCashFlowPerShare)
        const tempValue=Number(statementData[i].freeCashFlowPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].cashPerShare)
        const tempValue=Number(statementData[i].cashPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].bookValuePerShare)
        const tempValue=Number(statementData[i].bookValuePerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].tangibleBookValuePerShare)
        const tempValue=Number(statementData[i].tangibleBookValuePerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].shareholdersEquityPerShare)
        const tempValue=Number(statementData[i].shareholdersEquityPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].interestDebtPerShare)
        const tempValue=Number(statementData[i].interestDebtPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].marketCap)
        //const tempValue=Number(statementData[i].foo);
        //accumulatedValue+=tempValue;
    }
    //averageValue=(accumulatedValue/periodsToUse);
    //row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].enterpriseValue)
    }
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].peRatio)
        const tempValue=Number(statementData[i].peRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].priceToSalesRatio)
        const tempValue=Number(statementData[i].priceToSalesRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].pocfratio)
        const tempValue=Number(statementData[i].pocfratio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].pfcfRatio)
        const tempValue=Number(statementData[i].pfcfRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].pbRatio)
        const tempValue=Number(statementData[i].pbRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].ptbRatio)
        const tempValue=Number(statementData[i].ptbRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].evToSales)
        const tempValue=Number(statementData[i].evToSales);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].evToFreeCashFlow)
        const tempValue=Number(statementData[i].evToFreeCashFlow);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].enterpriseValueOverEBITDA)
        const tempValue=Number(statementData[i].enterpriseValueOverEBITDA);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].evToOperatingCashFlow)
        const tempValue=Number(statementData[i].evToOperatingCashFlow);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].earningsYield)
        const tempValue=Number(statementData[i].earningsYield);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].freeCashFlowYield)
        const tempValue=Number(statementData[i].freeCashFlowYield);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].debtToEquity)
        const tempValue=Number(statementData[i].debtToEquity);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].debtToAssets)
        const tempValue=Number(statementData[i].debtToAssets);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)
    /*
    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].debtToMarketCap)
    }
    rows.push(row)
    */

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].netDebtToEBITDA)
        const tempValue=Number(statementData[i].netDebtToEBITDA);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].currentRatio)
        const tempValue=Number(statementData[i].currentRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].interestCoverage)
        const tempValue=Number(statementData[i].interestCoverage);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].incomeQuality)
        const tempValue=Number(statementData[i].incomeQuality);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

  /*
    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].dividendPerShare)
    }
    rows.push(row)
   */

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].dividendYield)
        const tempValue=Number(statementData[i].dividendYield);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

  /*
    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].dividendYieldPercentage)
    }
    rows.push(row)
   */

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].payoutRatio)
        const tempValue=Number(statementData[i].payoutRatio);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].salesGeneralAndAdministrativeToRevenue)
        const tempValue=Number(statementData[i].salesGeneralAndAdministrativeToRevenue);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

  /*
    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {   

            row = addOneRowElement(row,statementData[i].researchAndDevelopementToRevenue)

    }
    */
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].intangiblesToTotalAssets)
        const tempValue=Number(statementData[i].intangiblesToTotalAssets);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].capexToOperatingCashFlow)
        const tempValue=Number(statementData[i].capexToOperatingCashFlow);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].capexToRevenue)
        const tempValue=Number(statementData[i].capexToRevenue);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].capexToDepreciation)
        const tempValue=Number(statementData[i].capexToDepreciation);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].stockBasedCompensationToRevenue)
        const tempValue=Number(statementData[i].stockBasedCompensationToRevenue);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].grahamNumber)
        const tempValue=Number(statementData[i].grahamNumber);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].roic)
        const tempValue=Number(statementData[i].roic);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].returnOnTangibleAssets)
        const tempValue=Number(statementData[i].returnOnTangibleAssets);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].grahamNetNet)
        const tempValue=Number(statementData[i].grahamNetNet);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].workingCapital)
        const tempValue=Number(statementData[i].workingCapital);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].tangibleAssetValue)
        const tempValue=Number(statementData[i].tangibleAssetValue);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].netCurrentAssetValue)
        const tempValue=Number(statementData[i].netCurrentAssetValue);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].investedCapital)
        const tempValue=Number(statementData[i].investedCapital);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].averageReceivables)
        const tempValue=Number(statementData[i].averageReceivables);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].averagePayables)
        const tempValue=Number(statementData[i].averagePayables);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].averageInventory)
        const tempValue=Number(statementData[i].averageInventory);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].daysSalesOutstanding)
        const tempValue=Number(statementData[i].daysSalesOutstanding);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].daysPayablesOutstanding)
        const tempValue=Number(statementData[i].daysPayablesOutstanding);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].daysOfInventoryOnHand)
        const tempValue=Number(statementData[i].daysOfInventoryOnHand);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].receivablesTurnover)
        const tempValue=Number(statementData[i].receivablesTurnover);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].payablesTurnover)
        const tempValue=Number(statementData[i].payablesTurnover);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].inventoryTurnover)
        const tempValue=Number(statementData[i].inventoryTurnover);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].capexPerShare)
        const tempValue=Number(statementData[i].capexPerShare);
        accumulatedValue+=tempValue;
    }
    averageValue=(accumulatedValue/periodsToUse);
    row=addOneRowElement(row,averageValue);
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].updatedAt)
    }
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].createdAt)
    }
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].xAxisDataKey)
    }
    rows.push(row)

    row = [];
    accumulatedValue=0.0;
    for(let i=0;i<periodsToUse;++i)
    {        
        row = addOneRowElement(row,statementData[i].priceToEarnings)
    }
    rows.push(row)
    return rows;
}


function addOneRowElement(row:rowValues[],element:string|number):rowValues[]
{
  if ((typeof element === 'number') && (Number.isInteger(element)==false))
  {

    row.push({ value: element.toFixed(4) })
  }
  else{
    row.push({ value: element})
  }
  return row;
}