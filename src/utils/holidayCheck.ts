// ============================================
// FILE: src/utils/holidayCheck.ts
// Holiday Season Date Checking
// ============================================

/**
 * Calculate Thanksgiving date (4th Thursday of November)
 */
function getThanksgivingDate(year: number): Date {
  const november = new Date(year, 10, 1); // Month is 0-indexed

  // Find first Thursday
  let day = november.getDay();
  let firstThursday = day === 4 ? 1 : (11 - day) % 7;

  // 4th Thursday is 3 weeks after first Thursday
  const thanksgiving = new Date(year, 10, firstThursday + 21);
  return thanksgiving;
}

/**
 * Check if current date is in the holiday season
 * (Day after Thanksgiving through Christmas Day)
 */
export function isHolidaySeason(): boolean {
  const now = new Date();
  const year = now.getFullYear();

  // Get Thanksgiving date and add 1 day
  const thanksgiving = getThanksgivingDate(year);
  const dayAfterThanksgiving = new Date(thanksgiving);
  dayAfterThanksgiving.setDate(dayAfterThanksgiving.getDate() + 1);

  // End of Christmas Day (December 26 at midnight)
  const dayAfterChristmas = new Date(year, 11, 26); // December 26

  // Check if current date is between day after Thanksgiving and end of Christmas Day
  return now >= dayAfterThanksgiving && now < dayAfterChristmas;
}

/**
 * Get holiday season date range for current year
 */
export function getHolidaySeasonDates(): { start: Date; end: Date } {
  const year = new Date().getFullYear();
  const thanksgiving = getThanksgivingDate(year);
  const start = new Date(thanksgiving);
  start.setDate(start.getDate() + 1); // Day after Thanksgiving

  const end = new Date(year, 11, 25); // Christmas Day

  return { start, end };
}
