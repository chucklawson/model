import type { TickerLot, TickerSummary, Ticker } from '../types/index';

export function calculateTickerSummaries(lots: TickerLot[], tickers: Ticker[] = []): TickerSummary[] {
  const grouped = lots.reduce((acc, lot) => {
    if (!acc[lot.ticker]) {
      acc[lot.ticker] = [];
    }
    acc[lot.ticker].push(lot);
    return acc;
  }, {} as Record<string, TickerLot[]>);

  return Object.entries(grouped).map(([ticker, tickerLots]) => {
    const totalShares = tickerLots.reduce((sum, lot) => sum + lot.shares, 0);
    const totalCost = tickerLots.reduce((sum, lot) => sum + lot.totalCost, 0);
    const dates = tickerLots.map(lot => lot.purchaseDate).sort();

    // Aggregate all unique portfolios across all lots for this ticker
    const allPortfolios = new Set<string>();
    tickerLots.forEach(lot => {
      lot.portfolios.forEach(portfolio => allPortfolios.add(portfolio));
    });

    // Find matching ticker data
    const tickerData = tickers.find(t => t.symbol === ticker);

    return {
      ticker,
      companyName: tickerData?.companyName ?? '',
      baseYield: tickerData?.baseYield ?? 0,
      expectedFiveYearGrowth: tickerData?.expectedFiveYearGrowth ?? 0,
      totalShares,
      totalCost,
      averageCostPerShare: totalCost / totalShares,
      lotCount: tickerLots.length,
      earliestPurchase: dates[0],
      latestPurchase: dates[dates.length - 1],
      portfolios: Array.from(allPortfolios).sort(),
    };
  }).sort((a, b) => b.totalCost - a.totalCost);
}

export function getLotsForTicker(lots: TickerLot[], ticker: string): TickerLot[] {
  return lots
    .filter(lot => lot.ticker === ticker)
    .sort((a, b) => {
      // Primary sort: by purchase date (oldest first)
      const dateCompare = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
      if (dateCompare !== 0) return dateCompare;

      // Secondary sort: by shares (largest first)
      const sharesCompare = b.shares - a.shares;
      if (sharesCompare !== 0) return sharesCompare;

      // Tertiary sort: by cost per share (highest first)
      return b.costPerShare - a.costPerShare;
    });
}

/**
 * Calculate cumulative dividend metrics for dividend portfolio
 * @param summaries - Ticker summaries to calculate from
 * @returns Object with weighted yield percentage and annual dividend income
 */
export function calculateDividendMetrics(summaries: TickerSummary[]): {
  weightedYieldPercentage: number;
  annualDividendIncome: number;
} {
  let totalInvestment = 0;
  let totalProjectedReturn = 0;

  summaries.forEach(summary => {
    const investment = summary.totalCost;
    const projectedReturn = (summary.baseYield / 100) * investment;

    totalInvestment += investment;
    totalProjectedReturn += projectedReturn;
  });

  const weightedYieldPercentage = totalInvestment > 0
    ? (totalProjectedReturn / totalInvestment) * 100
    : 0;

  return {
    weightedYieldPercentage,
    annualDividendIncome: totalProjectedReturn
  };
}