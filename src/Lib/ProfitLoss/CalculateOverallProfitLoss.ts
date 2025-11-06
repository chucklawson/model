


import type {TickersToEvaluate} from "../TickersToEvaluate/TickersToEvaluate"
import type Quote_V3 from "../Quote_V3.ts";

interface CostEntry{ticker: string;
                    cost: number;
                    unitsPurchased: number}

export function calculateOverallProfitAndLoss(tickerEntries:TickersToEvaluate[],setCalculatedTotalProfitLoss)
{
/*
  for(let i=0;i<tickerEntries.length;++i)
  {
    console.log("tickerEntries[i].ticker: " + tickerEntries[i].ticker + ", unitsOnHand: " + tickerEntries[i].unitsOnHand);
  }
 */

    let ticker = ''
    let costBasis = 0
    let currentQuantityOnHand = 0
    let useThisOne = false;
    let costEntry:CostEntry = {ticker: "",
                              cost: 0.0,
                              unitsPurchased: 0}
    const tickerEntriesToSum:CostEntry[]=[];
    const tickersToEvaluate = [];
    tickerEntries.map( (tickerEntry)=> ( 
         ticker=tickerEntry.ticker,
         costBasis=Number(tickerEntry.costBasis),
         currentQuantityOnHand=Number(tickerEntry.unitsOnHand),
         useThisOne=Boolean(tickerEntry.calculateAccumulatedProfitLoss),

         costEntry = {  ticker: ticker,
                        cost: costBasis,
                        unitsPurchased:currentQuantityOnHand},

         useThisOne === true ?  tickerEntriesToSum.push(costEntry): '',             
         useThisOne === true ?  tickersToEvaluate.push(ticker): ''
         //console.log("Entry: " + ticker +", costBasis: " + costBasis + ", currentQuantityOnHand: " + currentQuantityOnHand + ", use: " + useThisOne)
         
    ))
    //console.log("tickerEntriesToSum: " + JSON.stringify(tickerEntriesToSum))

    batchQuote(tickersToEvaluate.toString(),setCalculatedTotalProfitLoss,tickerEntriesToSum)
}

function calculalteCost(tickerEntriesToSum:CostEntry[])
{
    let totalCost=0.0;
    for(let i=0;i<tickerEntriesToSum.length;++i)
    {
        totalCost+=Number(tickerEntriesToSum[i].unitsPurchased)*Number(tickerEntriesToSum[i].cost);
        //console.log("ticker: " + tickerEntriesToSum[i].ticker + ", unitsPurchased: " + tickerEntriesToSum[i].unitsPurchased + ", cost: "+ tickerEntriesToSum[i].cost)
    }
    //console.log("calculalteCost totalCost: " + totalCost);
    return totalCost;
}

async function batchQuote (tickersToObtain:string,setCalculatedTotalProfitLoss,tickerEntriesToSum:CostEntry[])
{  
    const uniqueValue = '25a5fa6deb331d46e42609787aa281fe';    
    const currentInfo= `https://financialmodelingprep.com/api/v3/quote/${tickersToObtain}?apikey=${uniqueValue}`;
    let currentQuote:Quote_V3[];
    //console.log("tickersToObtain: "+ tickersToObtain)

    //console.log("tickersToEvaluate: " + tickersToObtain)
        await Promise.all([
            fetch(currentInfo)
          ]).then(function (responses) {
            // Get a JSON object from each of the responses
            return Promise.all(responses.map(function (response) {
              return response.json();
            }));
          }).then(function (data) {
            if(data[0][0].symbol !== undefined){
              //currentQuote=data[0]

              const parsedQuoteData: Quote_V3[] = JSON.parse(JSON.stringify(data[0]));
              //console.log("parsedQuoteData: " + parsedQuoteData)
              currentQuote = parsedQuoteData;
            } 
          }).catch(function (error) {
            // if there's an error, log it
            console.log(error);
          })
/*
  console.log("currentQuote.length: ", currentQuote.length);
  for(let i=0;i<currentQuote.length;++i)
  {
    console.log("currentQuote[i].symbol: " + currentQuote[i].symbol + ", price: " + currentQuote[i].price + ", previousClose: " + currentQuote[i].previousClose);
  }
*/

    const totalCost=calculalteCost(tickerEntriesToSum)

    const totalValue=calculalteCurrentValue(currentQuote,tickerEntriesToSum)

    const totalPreviousValue=calculaltePreviosValue(currentQuote,tickerEntriesToSum)

    let gainLossPercentage= 0.0;
    if(totalCost!==0.0)
    {
      gainLossPercentage=(((totalValue-totalCost)/totalCost)*100.0);
    }

    const currentDaysProfitLoss=(totalValue-totalPreviousValue)

  //console.log("currentDaysProfitLoss: " + currentDaysProfitLoss)

    setCalculatedTotalProfitLoss("$" + (totalValue-totalCost).toFixed(2) + ", Invested: $"+ totalCost.toFixed(2)+ ", Gain: " + gainLossPercentage.toFixed(2) + "%, Today: $"+currentDaysProfitLoss.toFixed(2))
}

function calculalteCurrentValue(currentQuote:Quote_v3[],tickersToEvaluate:CostEntry[])
{
    let totalValue=0.0;
    for(let i=0;i<currentQuote.length;++i)
    {
        const unitsPurchased=getQuantityOwnForOneTicker(currentQuote[i].symbol,tickersToEvaluate)
        totalValue+=Number(unitsPurchased)*Number(currentQuote[i].price);
    }
  //console.log("calculalteCurrentValue totalValue: " + totalValue)
    return totalValue;
}

function calculaltePreviosValue(currentQuote:Quote_v3[],tickersToEvaluate:CostEntry[])
{
  let totalValue=0.0;
  //console.log("currentQuote.length: " + currentQuote.length)
  for(let i=0;i<currentQuote.length;++i)
  {
    const unitsPurchased=getQuantityOwnForOneTicker(currentQuote[i].symbol,tickersToEvaluate)
    const currentTickersPreviousValue= Number(unitsPurchased * currentQuote[i].previousClose);
    totalValue+=currentTickersPreviousValue;
    //console.log("symbol: " + currentQuote[i].symbol + ", unitsPurchased: " + unitsPurchased + ", current price: " + currentQuote[i].price + ", previousDay: " + currentQuote[i].previousClose)
    //console.log("Previous days value: " + ( unitsPurchased * currentQuote[i].previousClose))
  }
  //console.log("calculaltePreviosValue totalValue: " + totalValue)
  return totalValue;
}

function getQuantityOwnForOneTicker(ticker:string,tickersToEvaluate:CostEntry[])
{
  //console.log("getQuantityOwnForOneTicker, Ticker: " +ticker +", tickersToEvaluate.length: " + tickersToEvaluate.length);

    let quantityOnHand=0;
    for(let i=0;i<tickersToEvaluate.length;++i)
    {
        //console.log("tickersToEvaluate[i].ticker: " + tickersToEvaluate[i].ticker + ", unitsOnHand: " + tickersToEvaluate[i].unitsOnHand);

        if(ticker.toUpperCase().localeCompare(tickersToEvaluate[i].ticker.toUpperCase()) === 0)
        {
            quantityOnHand = tickersToEvaluate[i].unitsPurchased;
            //console.log("quantityOnHand: " + quantityOnHand);
            break;
        }
    }
    return quantityOnHand
}

/*
      ticker: "BXP",
      costBasis: '70.28',
      unitsOnHand: 40,
      calculateAccumulatedProfitLoss: true,
      baseYield: '5.74',
      */
export function calculateProjectedYield(tickersToEvaluate:TickersToEvaluate[])
{
    let totalCostBasis=0.0;
    let projectedTotalValue=0.0;

    for(let i=0;i<tickersToEvaluate.length;++i)
    {     
      const costThisEntry=Number(tickersToEvaluate[i].costBasis)*Number(tickersToEvaluate[i].unitsOnHand);
      const projectedOneYearGainThisEntry=costThisEntry*(Number(tickersToEvaluate[i].baseYield)/100.0);
      totalCostBasis+=costThisEntry;
      projectedTotalValue+=(costThisEntry+projectedOneYearGainThisEntry)
    }
    const totalProjectedGain=projectedTotalValue-totalCostBasis;
    const percentageGainLoss=(totalProjectedGain/totalCostBasis)*100.0;

    const accumulatedValues=
    {
      totalProjectedGain: totalProjectedGain.toFixed(2),
      percentageGainLoss: percentageGainLoss.toFixed(2)
    }
    return  accumulatedValues;
    
}
