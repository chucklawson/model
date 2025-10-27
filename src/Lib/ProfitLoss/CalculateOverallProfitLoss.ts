export function calculateOverallProfitAndLoss(tickerEntries,setCalculatedTotalProfitLoss)
{  
    let ticker = ''
    let costBasis = 0
    let currentQuantityOnHand = 0
    let useThisOne = false;
    let costEntry = {ticker: "",
                    cost: 0.0,
                    unitsPurchased: 0}
    let tickerEntriesToSum=[];
    let tickersToEvaluate = [];
    tickerEntries.map( (tickerEntry)=> ( 
         ticker=tickerEntry.ticker,
         costBasis=Number(tickerEntry.costBasis),
         currentQuantityOnHand=Number(tickerEntry.unitsOnHand),
         useThisOne=Boolean(tickerEntry.calculateAccumulatedProfitLoss),
         costEntry = {ticker: ticker,
                        cost: costBasis,
                        unitsPurchased:currentQuantityOnHand},
         useThisOne === true ?  tickerEntriesToSum.push(costEntry): '',             
         useThisOne === true ?  tickersToEvaluate.push(ticker): ''
         //console.log("Entry: " + ticker +", costBasis: " + costBasis + ", currentQuantityOnHand: " + currentQuantityOnHand + ", use: " + useThisOne)
         
    ))
    //console.log("tickerEntriesToSum: " + JSON.stringify(tickerEntriesToSum))

    batchQuote(tickersToEvaluate.toString(),setCalculatedTotalProfitLoss,tickerEntriesToSum)    
}

function calculalteCost(tickerEntriesToSum)
{
    let totalCost=0.0;
    for(let i=0;i<tickerEntriesToSum.length;++i)
    {
        totalCost+=Number(tickerEntriesToSum[i].unitsPurchased)*Number(tickerEntriesToSum[i].cost);
        //console.log("ticker: " + tickerEntriesToSum[i].ticker + ", unitsPurchased: " + tickerEntriesToSum[i].unitsPurchased + ", cost: "+ tickerEntriesToSum[i].cost)
    }
    return totalCost;
}

async function batchQuote (tickersToObtain,setCalculatedTotalProfitLoss,tickerEntriesToSum)
{  
    const uniqueValue = '25a5fa6deb331d46e42609787aa281fe';    
    let currentInfo= `https://financialmodelingprep.com/api/v3/quote/${tickersToObtain}?apikey=${uniqueValue}`;
    let currentQuote = {};
    //console.log("currentInfo: "+ currentInfo)

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
              currentQuote=data[0]
            } 
          }).catch(function (error) {
            // if there's an error, log it
            console.log(error);
          })
    //console.log('currentQuote: ' + JSON.stringify(currentQuote))

    let totalCost=calculalteCost(tickerEntriesToSum)

    let totalValue=calculalteCurrentValue(currentQuote,tickerEntriesToSum)

    let totalPreviousValue=calculaltePreviosValue(currentQuote,tickerEntriesToSum)

    let gainLossPercentage= 0.0;
    if(totalCost!==0.0)
    {
      gainLossPercentage=(((totalValue-totalCost)/totalCost)*100.0);
    }

    let currentDaysProfitLoss=(totalValue-totalPreviousValue)

  //console.log("currentDaysProfitLoss: " + currentDaysProfitLoss)

    setCalculatedTotalProfitLoss("$" + (totalValue-totalCost).toFixed(2) + ", Invested: $"+ totalCost.toFixed(2)+ ", Gain: " + gainLossPercentage.toFixed(2) + "%, Today: $"+currentDaysProfitLoss.toFixed(2))
}

function calculalteCurrentValue(currentQuote,tickersToEvaluate)
{
    let totalValue=0.0;
    for(let i=0;i<currentQuote.length;++i)
    {
        let unitsPurchased=getQuantityOwnForOneTicker(currentQuote[i].symbol,tickersToEvaluate)
        //console.log("symbol: " + currentQuote[i].symbol + ", unitsPurchased: " + unitsPurchased + ", value: " + currentQuote[i].price)
        totalValue+=Number(unitsPurchased)*Number(currentQuote[i].price);
    }
    return totalValue;
}

function calculaltePreviosValue(currentQuote,tickersToEvaluate)
{
  let totalValue=0.0;
  for(let i=0;i<currentQuote.length;++i)
  {
    let unitsPurchased=getQuantityOwnForOneTicker(currentQuote[i].symbol,tickersToEvaluate)
    let currentTickersPreviousValue= Number(unitsPurchased * currentQuote[i].previousClose);
    totalValue+=currentTickersPreviousValue;
    //console.log("symbol: " + currentQuote[i].symbol + ", unitsPurchased: " + unitsPurchased + ", current price: " + currentQuote[i].price + ", previousDay: " + currentQuote[i].previousClose)
    //console.log("Previous days value: " + ( unitsPurchased * currentQuote[i].previousClose))
  }
  return totalValue;
}

function getQuantityOwnForOneTicker(ticker,tickersToEvaluate)
{
    let quantityOnHand=0;
    for(let i=0;i<tickersToEvaluate.length;++i)
    {
        if(ticker.toUpperCase().localeCompare(tickersToEvaluate[i].ticker.toUpperCase()) === 0)
        {
            quantityOnHand = tickersToEvaluate[i].unitsPurchased;
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
export function calculateProjectedYield(tickersToEvaluate)
{
    let totalCostBasis=0.0;
    let projectedTotalValue=0.0;

    for(let i=0;i<tickersToEvaluate.length;++i)
    {     
      let costThisEntry=Number(tickersToEvaluate[i].costBasis)*Number(tickersToEvaluate[i].unitsOnHand);
      let projectedOneYearGainThisEntry=costThisEntry*(Number(tickersToEvaluate[i].baseYield)/100.0); 
      totalCostBasis+=costThisEntry;
      projectedTotalValue+=(costThisEntry+projectedOneYearGainThisEntry)
    }
    let totalProjectedGain=projectedTotalValue-totalCostBasis;
    let percentageGainLoss=(totalProjectedGain/totalCostBasis)*100.0;

    let accumulatedValues=
    {
      totalProjectedGain: totalProjectedGain.toFixed(2),
      percentageGainLoss: percentageGainLoss.toFixed(2)
    }
    return  accumulatedValues;
    
}
