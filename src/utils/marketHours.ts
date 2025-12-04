// ============================================
// FILE: src/utils/marketHours.ts
// ============================================
// US Stock Market Hours and Trading Day Utilities
//
// Handles detection of:
// - Market hours (9:30 AM - 4:00 PM ET)
// - Pre-market and after-hours periods
// - Weekends and holidays
// - US market holidays through 2030

/**
 * Market hours constants (in decimal format for easier comparison)
 * All times are in Eastern Time (ET)
 */
export const MARKET_HOURS = {
  PRE_MARKET_START: 4,     // 4:00 AM ET
  MARKET_OPEN: 9.5,        // 9:30 AM ET (9 hours + 30 minutes = 9.5)
  MARKET_CLOSE: 16,        // 4:00 PM ET
  AFTER_HOURS_END: 20,     // 8:00 PM ET
} as const;

/**
 * Timezone for US stock markets
 */
export const MARKET_TIMEZONE = 'America/New_York';

/**
 * US Stock Market Holidays (2025-2030)
 * NYSE and NASDAQ observed holidays
 *
 * NOTE: Update this list annually with new holidays
 * TODO: Update holidays list for 2031 and beyond (next update: January 2031)
 */
export const US_MARKET_HOLIDAYS: Date[] = [
  // 2025
  new Date('2025-01-01'), // New Year's Day - Wednesday
  new Date('2025-01-20'), // Martin Luther King Jr. Day - Monday
  new Date('2025-02-17'), // Presidents' Day - Monday
  new Date('2025-04-18'), // Good Friday - Friday
  new Date('2025-05-26'), // Memorial Day - Monday
  new Date('2025-06-19'), // Juneteenth - Thursday
  new Date('2025-07-04'), // Independence Day - Friday
  new Date('2025-09-01'), // Labor Day - Monday
  new Date('2025-11-27'), // Thanksgiving Day - Thursday
  new Date('2025-12-25'), // Christmas Day - Thursday

  // 2026
  new Date('2026-01-01'), // New Year's Day - Thursday
  new Date('2026-01-19'), // Martin Luther King Jr. Day - Monday
  new Date('2026-02-16'), // Presidents' Day - Monday
  new Date('2026-04-03'), // Good Friday - Friday
  new Date('2026-05-25'), // Memorial Day - Monday
  new Date('2026-06-19'), // Juneteenth - Friday
  new Date('2026-07-03'), // Independence Day (observed) - Friday (July 4 is Saturday)
  new Date('2026-09-07'), // Labor Day - Monday
  new Date('2026-11-26'), // Thanksgiving Day - Thursday
  new Date('2026-12-25'), // Christmas Day - Friday

  // 2027
  new Date('2027-01-01'), // New Year's Day - Friday
  new Date('2027-01-18'), // Martin Luther King Jr. Day - Monday
  new Date('2027-02-15'), // Presidents' Day - Monday
  new Date('2027-03-26'), // Good Friday - Friday
  new Date('2027-05-31'), // Memorial Day - Monday
  new Date('2027-06-18'), // Juneteenth (observed) - Friday (June 19 is Saturday)
  new Date('2027-07-05'), // Independence Day (observed) - Monday (July 4 is Sunday)
  new Date('2027-09-06'), // Labor Day - Monday
  new Date('2027-11-25'), // Thanksgiving Day - Thursday
  new Date('2027-12-24'), // Christmas Day (observed) - Friday (Dec 25 is Saturday)

  // 2028
  new Date('2028-01-17'), // Martin Luther King Jr. Day - Monday (Jan 1 is Saturday)
  new Date('2028-02-21'), // Presidents' Day - Monday
  new Date('2028-04-14'), // Good Friday - Friday
  new Date('2028-05-29'), // Memorial Day - Monday
  new Date('2028-06-19'), // Juneteenth - Monday
  new Date('2028-07-04'), // Independence Day - Tuesday
  new Date('2028-09-04'), // Labor Day - Monday
  new Date('2028-11-23'), // Thanksgiving Day - Thursday
  new Date('2028-12-25'), // Christmas Day - Monday

  // 2029
  new Date('2029-01-01'), // New Year's Day - Monday
  new Date('2029-01-15'), // Martin Luther King Jr. Day - Monday
  new Date('2029-02-19'), // Presidents' Day - Monday
  new Date('2029-03-30'), // Good Friday - Friday
  new Date('2029-05-28'), // Memorial Day - Monday
  new Date('2029-06-19'), // Juneteenth - Tuesday
  new Date('2029-07-04'), // Independence Day - Wednesday
  new Date('2029-09-03'), // Labor Day - Monday
  new Date('2029-11-22'), // Thanksgiving Day - Thursday
  new Date('2029-12-25'), // Christmas Day - Tuesday

  // 2030
  new Date('2030-01-01'), // New Year's Day - Tuesday
  new Date('2030-01-21'), // Martin Luther King Jr. Day - Monday
  new Date('2030-02-18'), // Presidents' Day - Monday
  new Date('2030-04-19'), // Good Friday - Friday
  new Date('2030-05-27'), // Memorial Day - Monday
  new Date('2030-06-19'), // Juneteenth - Wednesday
  new Date('2030-07-04'), // Independence Day - Thursday
  new Date('2030-09-02'), // Labor Day - Monday
  new Date('2030-11-28'), // Thanksgiving Day - Thursday
  new Date('2030-12-25'), // Christmas Day - Wednesday
];

/**
 * Get current time in Eastern timezone
 * @returns Date object representing current time in ET
 */
export function getEasternTime(): Date {
  const now = new Date();
  // Convert to Eastern Time using locale string
  const estTimeString = now.toLocaleString('en-US', {
    timeZone: MARKET_TIMEZONE
  });
  return new Date(estTimeString);
}

/**
 * Check if a given date is a US stock market holiday
 * @param date - Date to check
 * @returns true if the date is a market holiday
 */
export function isMarketHoliday(date: Date): boolean {
  // Normalize the date to midnight for comparison (ignore time component)
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Check if this date matches any holiday
  return US_MARKET_HOLIDAYS.some(holiday => {
    const holidayStr = holiday.toISOString().split('T')[0];
    return dateStr === holidayStr;
  });
}

/**
 * Check if a given date is a trading day
 * Trading days are weekdays (Monday-Friday) that are not holidays
 * @param date - Date to check
 * @returns true if the date is a trading day
 */
export function isTradingDay(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

  // Check if it's a weekday (Monday=1 to Friday=5)
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Check if it's not a holiday
  const notHoliday = !isMarketHoliday(date);

  return isWeekday && notHoliday;
}

/**
 * Determine if after-hours pricing should be displayed
 *
 * Shows after-hours pricing when:
 * - It's a non-trading day (weekend or holiday), OR
 * - It's before market open (9:30 AM ET), OR
 * - It's after market close (4:00 PM ET)
 *
 * @returns true if after-hours pricing should be shown
 */
export function shouldShowAfterHoursPricing(): boolean {
  const now = getEasternTime();

  // If it's not a trading day (weekend or holiday), always show after-hours
  if (!isTradingDay(now)) {
    return true;
  }

  // It's a trading day - check if we're within market hours
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalTime = hour + minute / 60;

  // Show after-hours if before market open OR after market close
  const beforeMarketOpen = decimalTime < MARKET_HOURS.MARKET_OPEN;
  const afterMarketClose = decimalTime >= MARKET_HOURS.MARKET_CLOSE;

  return beforeMarketOpen || afterMarketClose;
}

/**
 * Market period constants
 * Useful for displaying market status to users
 */
export const MarketPeriod = {
  PRE_MARKET: 'PRE_MARKET',
  MARKET_HOURS: 'MARKET_HOURS',
  AFTER_HOURS: 'AFTER_HOURS',
  MARKET_CLOSED: 'MARKET_CLOSED'
} as const;

export type MarketPeriod = typeof MarketPeriod[keyof typeof MarketPeriod];

/**
 * Get the current market period
 * @returns MarketPeriod indicating current market status
 */
export function getCurrentMarketPeriod(): MarketPeriod {
  const now = getEasternTime();

  // If it's not a trading day, market is closed
  if (!isTradingDay(now)) {
    return MarketPeriod.MARKET_CLOSED;
  }

  // It's a trading day - determine which period we're in
  const hour = now.getHours();
  const minute = now.getMinutes();
  const decimalTime = hour + minute / 60;

  if (decimalTime < MARKET_HOURS.MARKET_OPEN) {
    return MarketPeriod.PRE_MARKET;
  } else if (decimalTime < MARKET_HOURS.MARKET_CLOSE) {
    return MarketPeriod.MARKET_HOURS;
  } else {
    return MarketPeriod.AFTER_HOURS;
  }
}
