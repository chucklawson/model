import type AnnualProjection from './AnnualProjection';
import type AnalystEstimate_V3 from './AnalystEstimate_V3';

/**
 * Calculate P/E ratio for a specific year using linear interpolation
 * @param currentPE - Current P/E ratio
 * @param targetPE - Target P/E ratio at the end of the period
 * @param currentYear - Current year in the projection (1-based)
 * @param totalYears - Total number of years in the projection
 * @returns Interpolated P/E ratio for the current year
 */
export function calculateInterpolatedPE(
  currentPE: number,
  targetPE: number,
  currentYear: number,
  totalYears: number
): number {
  if (totalYears === 0) return targetPE;
  const progression = currentYear / totalYears;
  return currentPE + (targetPE - currentPE) * progression;
}

/**
 * Calculate implied annual growth rate from analyst estimates using CAGR formula
 * @param currentEPS - Current earnings per share
 * @param estimates - Array of analyst estimates (sorted by date)
 * @returns Implied annual growth rate as a percentage
 */
export function calculateImpliedGrowth(
  currentEPS: number,
  estimates: AnalystEstimate_V3[]
): number {
  if (estimates.length === 0 || currentEPS <= 0) return 0;

  const finalEPS = estimates[estimates.length - 1]?.epsAvg;
  if (!finalEPS || finalEPS <= 0) return 0;

  const years = estimates.length;

  // CAGR formula: (finalValue / initialValue)^(1/years) - 1
  const growthRate = Math.pow(finalEPS / currentEPS, 1 / years) - 1;
  return growthRate * 100; // Convert to percentage
}

/**
 * Generate annual projection data with P/E interpolation
 * @param currentPrice - Current stock price
 * @param currentEPS - Current earnings per share
 * @param currentPE - Current P/E ratio
 * @param targetPE - Target P/E ratio at the end of the period
 * @param years - Number of years to project
 * @param growthRate - Annual earnings growth rate (as decimal, e.g., 0.1 for 10%)
 * @param useAnalystEstimates - Whether to use analyst estimates for EPS
 * @param analystData - Array of analyst estimates
 * @returns Array of annual projections
 */
export function generateAnnualProjections(
  currentPrice: number,
  currentEPS: number,
  currentPE: number,
  targetPE: number,
  years: number,
  growthRate: number,
  useAnalystEstimates: boolean,
  analystData: AnalystEstimate_V3[]
): AnnualProjection[] {
  const projections: AnnualProjection[] = [];
  const currentYear = new Date().getFullYear();

  for (let year = 1; year <= years; year++) {
    // Calculate EPS for this year
    let eps: number;
    if (useAnalystEstimates && analystData.length >= year) {
      eps = analystData[year - 1].epsAvg;
    } else {
      eps = currentEPS * Math.pow(1 + growthRate, year);
    }

    // Calculate interpolated P/E
    const peRatio = calculateInterpolatedPE(currentPE, targetPE, year, years);

    // Calculate stock price
    const stockPrice = eps * peRatio;

    // Calculate annual growth (year-over-year)
    const previousPrice = year === 1 ? currentPrice : projections[year - 2].stockPrice;
    const annualGrowth = ((stockPrice - previousPrice) / previousPrice) * 100;

    // Calculate cumulative return
    const cumulativeReturn = ((stockPrice - currentPrice) / currentPrice) * 100;

    projections.push({
      year,
      calendarYear: currentYear + year,
      eps,
      peRatio,
      stockPrice,
      annualGrowth,
      cumulativeReturn
    });
  }

  return projections;
}
