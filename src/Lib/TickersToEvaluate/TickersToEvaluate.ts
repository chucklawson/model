
export interface TickersToEvaluate {
  ticker: string;
  costBasis: string;
  unitsOnHand: number;
  calculateAccumulatedProfitLoss: boolean;
  baseYield?: string;
}

export interface PortfoliosToInclude{
  portfolio: string;
}
