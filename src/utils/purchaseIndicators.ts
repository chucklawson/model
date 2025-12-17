import type { TickerLot } from '../types';

export interface GroupedPurchase {
  date: string; // YYYY-MM-DD format
  lots: TickerLot[];
  totalShares: number;
  totalCost: number;
  averageCostPerShare: number;
}

export interface PurchaseIndicator {
  date: string;
  yValue: number; // Price/RSI/Stochastic value at purchase date
  groupedPurchase: GroupedPurchase;
}

/**
 * Groups lots by purchase date and calculates aggregate values
 * @param lots - Array of ticker lots to group
 * @returns Array of grouped purchases sorted by date (oldest first)
 */
export function groupLotsByDate(lots: TickerLot[]): GroupedPurchase[] {
  const grouped = lots.reduce((acc, lot) => {
    const date = lot.purchaseDate;
    if (!acc[date]) {
      acc[date] = {
        date,
        lots: [],
        totalShares: 0,
        totalCost: 0,
        averageCostPerShare: 0,
      };
    }
    acc[date].lots.push(lot);
    acc[date].totalShares += lot.shares;
    acc[date].totalCost += lot.totalCost;
    return acc;
  }, {} as Record<string, GroupedPurchase>);

  // Calculate average cost per share for each group
  Object.values(grouped).forEach(group => {
    group.averageCostPerShare = group.totalCost / group.totalShares;
  });

  return Object.values(grouped).sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Matches purchase dates with chart data to get y-values for indicators
 * @param groupedPurchases - Purchases grouped by date
 * @param chartData - Array of chart data points with dateOfClose field
 * @param yField - The field name to extract y-value from (e.g., 'dailyClosingPrice', 'rsiValue')
 * @returns Array of purchase indicators with y-values from chart data
 */
export function matchPurchasesWithChartData<T extends { dateOfClose: string }>(
  groupedPurchases: GroupedPurchase[],
  chartData: T[],
  yField: keyof T
): PurchaseIndicator[] {
  const indicators: PurchaseIndicator[] = [];

  for (const purchase of groupedPurchases) {
    // Find matching chart data point by date
    const matchingDataPoint = chartData.find(
      dataPoint => dataPoint.dateOfClose === purchase.date
    );

    // Only create indicator if we have matching chart data and a valid y-value
    if (matchingDataPoint && matchingDataPoint[yField] !== null && matchingDataPoint[yField] !== undefined) {
      indicators.push({
        date: purchase.date,
        yValue: matchingDataPoint[yField] as number,
        groupedPurchase: purchase,
      });
    }
  }

  return indicators;
}

/**
 * Formats purchase indicator tooltip content
 * @param groupedPurchase - Grouped purchase data
 * @returns Formatted string for tooltip display
 */
export function formatPurchaseTooltip(groupedPurchase: GroupedPurchase): string {
  const { date, totalShares, averageCostPerShare, totalCost, lots } = groupedPurchase;

  if (lots.length === 1) {
    const lot = lots[0];
    return `Purchase: ${date}\n${lot.shares} shares @ $${lot.costPerShare.toFixed(2)}\nTotal: $${totalCost.toFixed(2)}`;
  } else {
    return `Purchase: ${date}\n${lots.length} lots, ${totalShares} shares\nAvg: $${averageCostPerShare.toFixed(2)}\nTotal: $${totalCost.toFixed(2)}`;
  }
}
