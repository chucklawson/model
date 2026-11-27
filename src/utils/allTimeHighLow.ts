import type HistoricalPriceFull_V3 from '../Lib/HistoricalPriceFull_V3';

export interface AllTimeIndicator {
  date: string;
  type: 'high' | 'low';
}

/**
 * For each day in [viewStartDate, viewEndDate], marks it as a new 52-week high/low
 * if its high/low exceeds the max/min of the prior 365 calendar days.
 * historical must be in FMP newest-first order; this function reverses internally.
 */
export function computeRolling52WeekHighLowDates(
  historical: HistoricalPriceFull_V3[],
  viewStartDate: string,
  viewEndDate: string
): AllTimeIndicator[] {
  if (historical.length === 0) return [];

  const sorted = [...historical].reverse(); // oldest→newest
  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  const times = sorted.map(d => new Date(d.date).getTime());
  const viewStart = new Date(viewStartDate).getTime();
  const viewEnd = new Date(viewEndDate).getTime();

  const indicators: AllTimeIndicator[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const dayTime = times[i];
    if (dayTime < viewStart || dayTime > viewEnd) continue;

    const windowStart = dayTime - msPerYear;
    let windowHigh = -Infinity;
    let windowLow = Infinity;

    for (let j = i - 1; j >= 0 && times[j] >= windowStart; j--) {
      if (sorted[j].high > windowHigh) windowHigh = sorted[j].high;
      if (sorted[j].low < windowLow) windowLow = sorted[j].low;
    }

    const day = sorted[i];
    if (windowHigh === -Infinity) {
      // No prior data in window — first point, initialize both
      indicators.push({ date: day.date, type: 'high' });
      indicators.push({ date: day.date, type: 'low' });
    } else {
      if (day.high > windowHigh) indicators.push({ date: day.date, type: 'high' });
      if (day.low < windowLow) indicators.push({ date: day.date, type: 'low' });
    }
  }

  return indicators;
}

export function computeAllTimeHighLowDates(
  historical: HistoricalPriceFull_V3[]
): AllTimeIndicator[] {
  if (historical.length === 0) return [];

  // FMP returns newest-first; reverse to process oldest→newest
  const sorted = [...historical].reverse();

  const indicators: AllTimeIndicator[] = [];
  let runningHigh = -Infinity;
  let runningLow = Infinity;

  for (const day of sorted) {
    if (day.high > runningHigh) {
      runningHigh = day.high;
      indicators.push({ date: day.date, type: 'high' });
    }
    if (day.low < runningLow) {
      runningLow = day.low;
      indicators.push({ date: day.date, type: 'low' });
    }
  }

  return indicators;
}
