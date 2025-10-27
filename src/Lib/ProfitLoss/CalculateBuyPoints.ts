
import type {TickersToEvaluate} from "../TickersToEvaluate/TickersToEvaluate"

interface AccumulatedValues
  {
    totalProjectedGain:string;
    percentageGainLoss: string;
  }

  export interface BuyPoints{
    downFivePercent: string;
    downTenPercent: string;
    downFifteenPercent: string;
    downTwentyPercent: string;
    downTwentyFivePercent: string;
    downThirtyPercent: string;
    downThirtyFivePercent: string;
    downFortyPercent: string;
    downFortyFivePercent: string;
    downFiftyPercent: string;
    downFiftyFivePercent: string;
    downSixtyPercent: string;
}
interface SetBuyPoints{
  (buyPointsIn:BuyPoints):void;
}
export function CalculateBuyPoints(highOverLastTwelveMonths:number,setTheBuyPoints:SetBuyPoints):void
{
    const buyPoints:BuyPoints={
     downFivePercent: ("$" + Number(highOverLastTwelveMonths*.95).toFixed(2)),
     downTenPercent: ("$" + Number(highOverLastTwelveMonths*.90).toFixed(2)),
     downFifteenPercent: ("$" + Number(highOverLastTwelveMonths*.85).toFixed(2)),
     downTwentyPercent: ("$" + Number(highOverLastTwelveMonths*.80).toFixed(2)),
     downTwentyFivePercent: ("$" + Number(highOverLastTwelveMonths*.75).toFixed(2)),
     downThirtyPercent: ("$" + Number(highOverLastTwelveMonths*.70).toFixed(2)),
     downThirtyFivePercent: ("$" + Number(highOverLastTwelveMonths*.65).toFixed(2)),
     downFortyPercent: ("$" + Number(highOverLastTwelveMonths*.60).toFixed(2)),
     downFortyFivePercent: ("$" + Number(highOverLastTwelveMonths*.55).toFixed(2)),
     downFiftyPercent: ("$" + Number(highOverLastTwelveMonths*.50).toFixed(2)),
     downFiftyFivePercent: ("$" + Number(highOverLastTwelveMonths*.45).toFixed(2)),
     downSixtyPercent: ("$" + Number(highOverLastTwelveMonths*.40).toFixed(2))
    }
  setTheBuyPoints(buyPoints);
}



/*
      ticker: "BXP",
      costBasis: '70.28',
      unitsOnHand: 40,
      calculateAccumulatedProfitLoss: true,
      baseYield: '5.74',   
      */  
export function calculateProjectedYield(tickersToEvaluate:TickersToEvaluate[]):AccumulatedValues
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

    const accumulatedValues:AccumulatedValues=
    {
      totalProjectedGain:totalProjectedGain.toFixed(2),
      percentageGainLoss:percentageGainLoss.toFixed(2)
    }
    return  accumulatedValues;

}
