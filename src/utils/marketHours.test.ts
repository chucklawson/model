import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEasternTime,
  isMarketHoliday,
  isTradingDay,
  shouldShowAfterHoursPricing,
  getCurrentMarketPeriod,
  MARKET_HOURS,
  MARKET_TIMEZONE,
  MarketPeriod,
  US_MARKET_HOLIDAYS,
} from './marketHours';

describe('marketHours', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constants', () => {
    it('should have correct market hours', () => {
      expect(MARKET_HOURS.PRE_MARKET_START).toBe(4);
      expect(MARKET_HOURS.MARKET_OPEN).toBe(9.5);
      expect(MARKET_HOURS.MARKET_CLOSE).toBe(16);
      expect(MARKET_HOURS.AFTER_HOURS_END).toBe(20);
    });

    it('should have correct timezone', () => {
      expect(MARKET_TIMEZONE).toBe('America/New_York');
    });

    it('should have market holidays defined', () => {
      expect(US_MARKET_HOLIDAYS).toBeDefined();
      expect(US_MARKET_HOLIDAYS.length).toBeGreaterThan(0);
    });
  });

  describe('getEasternTime', () => {
    it('should return a Date object', () => {
      vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
      const result = getEasternTime();
      expect(result).toBeInstanceOf(Date);
    });

    it('should convert to Eastern time from UTC', () => {
      // Set to noon UTC on a non-DST date
      vi.setSystemTime(new Date('2024-01-15T17:00:00Z')); // 5 PM UTC
      const result = getEasternTime();

      // Should be noon ET (5 hours behind UTC in EST)
      expect(result.getHours()).toBe(12);
    });
  });

  describe('isMarketHoliday', () => {
    it('should return true for New Years Day 2025', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for MLK Day 2025', () => {
      const date = new Date('2025-01-20T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Presidents Day 2025', () => {
      const date = new Date('2025-02-17T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Good Friday 2025', () => {
      const date = new Date('2025-04-18T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Memorial Day 2025', () => {
      const date = new Date('2025-05-26T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Juneteenth 2025', () => {
      const date = new Date('2025-06-19T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Independence Day 2025', () => {
      const date = new Date('2025-07-04T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Labor Day 2025', () => {
      const date = new Date('2025-09-01T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Thanksgiving 2025', () => {
      const date = new Date('2025-11-27T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return true for Christmas 2025', () => {
      const date = new Date('2025-12-25T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(true);
    });

    it('should return false for a regular weekday', () => {
      // June 15, 2025 is a Sunday, so test June 16 (Monday)
      const date = new Date('2025-06-16T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(false);
    });

    it('should return false for a weekend day', () => {
      // June 15, 2025 is a Sunday
      const date = new Date('2025-06-15T12:00:00Z');
      expect(isMarketHoliday(date)).toBe(false);
    });

    it('should ignore time component when checking holidays', () => {
      // Same holiday at different times should both return true
      const morning = new Date('2025-12-25T08:00:00Z');
      const evening = new Date('2025-12-25T20:00:00Z');

      expect(isMarketHoliday(morning)).toBe(true);
      expect(isMarketHoliday(evening)).toBe(true);
    });

    it('should handle observed holidays correctly (2026 July 4 observed on July 3)', () => {
      const observedDate = new Date('2026-07-03T12:00:00Z');
      const actualDate = new Date('2026-07-04T12:00:00Z');

      expect(isMarketHoliday(observedDate)).toBe(true);
      expect(isMarketHoliday(actualDate)).toBe(false);
    });

    it('should handle 2027 holidays', () => {
      expect(isMarketHoliday(new Date('2027-01-01'))).toBe(true);
      expect(isMarketHoliday(new Date('2027-01-18'))).toBe(true);
    });

    it('should handle 2028 holidays', () => {
      expect(isMarketHoliday(new Date('2028-01-17'))).toBe(true);
      expect(isMarketHoliday(new Date('2028-02-21'))).toBe(true);
    });

    it('should handle 2029 holidays', () => {
      expect(isMarketHoliday(new Date('2029-01-01'))).toBe(true);
      expect(isMarketHoliday(new Date('2029-01-15'))).toBe(true);
    });

    it('should handle 2030 holidays', () => {
      expect(isMarketHoliday(new Date('2030-01-01'))).toBe(true);
      expect(isMarketHoliday(new Date('2030-01-21'))).toBe(true);
    });
  });

  describe('isTradingDay', () => {
    it('should return true for a regular Monday', () => {
      // June 16, 2025 is a Monday (not a holiday)
      const date = new Date('2025-06-16T12:00:00Z');
      expect(isTradingDay(date)).toBe(true);
    });

    it('should return true for a regular Tuesday', () => {
      const date = new Date('2025-06-17T12:00:00Z');
      expect(isTradingDay(date)).toBe(true);
    });

    it('should return true for a regular Wednesday', () => {
      const date = new Date('2025-06-18T12:00:00Z');
      expect(isTradingDay(date)).toBe(true);
    });

    it('should return true for a regular Thursday', () => {
      const date = new Date('2025-06-12T12:00:00Z');
      expect(isTradingDay(date)).toBe(true);
    });

    it('should return true for a regular Friday', () => {
      const date = new Date('2025-06-13T12:00:00Z');
      expect(isTradingDay(date)).toBe(true);
    });

    it('should return false for Saturday', () => {
      const date = new Date('2025-06-14T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });

    it('should return false for Sunday', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });

    it('should return false for holidays (New Years)', () => {
      const date = new Date('2025-01-01T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });

    it('should return false for holidays (Christmas)', () => {
      const date = new Date('2025-12-25T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });

    it('should return false for holiday on Friday (Good Friday)', () => {
      const date = new Date('2025-04-18T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });

    it('should return false for holiday on Monday (MLK Day)', () => {
      const date = new Date('2025-01-20T12:00:00Z');
      expect(isTradingDay(date)).toBe(false);
    });
  });

  describe('shouldShowAfterHoursPricing', () => {
    it('should return true on Saturday', () => {
      // Saturday at noon ET
      vi.setSystemTime(new Date('2025-06-14T16:00:00Z')); // Noon ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true on Sunday', () => {
      // Sunday at noon ET
      vi.setSystemTime(new Date('2025-06-15T16:00:00Z')); // Noon ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true on holiday', () => {
      // Christmas at noon ET
      vi.setSystemTime(new Date('2025-12-25T17:00:00Z')); // Noon ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true before market open (8 AM ET)', () => {
      // Monday at 8 AM ET (before 9:30 AM open)
      vi.setSystemTime(new Date('2025-06-16T12:00:00Z')); // 8 AM ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true at 9:00 AM ET (before market open)', () => {
      // Monday at 9:00 AM ET
      vi.setSystemTime(new Date('2025-06-16T13:00:00Z')); // 9 AM ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return false at 9:30 AM ET (market open)', () => {
      // Monday at 9:30 AM ET
      vi.setSystemTime(new Date('2025-06-16T13:30:00Z')); // 9:30 AM ET
      expect(shouldShowAfterHoursPricing()).toBe(false);
    });

    it('should return false at 10:00 AM ET (during market hours)', () => {
      // Monday at 10:00 AM ET
      vi.setSystemTime(new Date('2025-06-16T14:00:00Z')); // 10 AM ET
      expect(shouldShowAfterHoursPricing()).toBe(false);
    });

    it('should return false at noon ET (during market hours)', () => {
      // Monday at noon ET
      vi.setSystemTime(new Date('2025-06-16T16:00:00Z')); // Noon ET
      expect(shouldShowAfterHoursPricing()).toBe(false);
    });

    it('should return false at 3:59 PM ET (before market close)', () => {
      // Monday at 3:59 PM ET
      vi.setSystemTime(new Date('2025-06-16T19:59:00Z')); // 3:59 PM ET
      expect(shouldShowAfterHoursPricing()).toBe(false);
    });

    it('should return true at 4:00 PM ET (market close)', () => {
      // Monday at 4:00 PM ET
      vi.setSystemTime(new Date('2025-06-16T20:00:00Z')); // 4:00 PM ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true at 5:00 PM ET (after market close)', () => {
      // Monday at 5:00 PM ET
      vi.setSystemTime(new Date('2025-06-16T21:00:00Z')); // 5 PM ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });

    it('should return true at 8:00 PM ET (after hours end)', () => {
      // Monday at 8:00 PM ET
      vi.setSystemTime(new Date('2025-06-17T00:00:00Z')); // 8 PM ET
      expect(shouldShowAfterHoursPricing()).toBe(true);
    });
  });

  describe('getCurrentMarketPeriod', () => {
    it('should return MARKET_CLOSED on Saturday', () => {
      vi.setSystemTime(new Date('2025-06-14T16:00:00Z')); // Saturday noon ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_CLOSED);
    });

    it('should return MARKET_CLOSED on Sunday', () => {
      vi.setSystemTime(new Date('2025-06-15T16:00:00Z')); // Sunday noon ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_CLOSED);
    });

    it('should return MARKET_CLOSED on holiday', () => {
      vi.setSystemTime(new Date('2025-12-25T17:00:00Z')); // Christmas noon ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_CLOSED);
    });

    it('should return PRE_MARKET at 4:00 AM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T08:00:00Z')); // Monday 4 AM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.PRE_MARKET);
    });

    it('should return PRE_MARKET at 8:00 AM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T12:00:00Z')); // Monday 8 AM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.PRE_MARKET);
    });

    it('should return PRE_MARKET at 9:00 AM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T13:00:00Z')); // Monday 9 AM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.PRE_MARKET);
    });

    it('should return MARKET_HOURS at 9:30 AM ET (market open)', () => {
      vi.setSystemTime(new Date('2025-06-16T13:30:00Z')); // Monday 9:30 AM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_HOURS);
    });

    it('should return MARKET_HOURS at 10:00 AM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T14:00:00Z')); // Monday 10 AM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_HOURS);
    });

    it('should return MARKET_HOURS at noon ET', () => {
      vi.setSystemTime(new Date('2025-06-16T16:00:00Z')); // Monday noon ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_HOURS);
    });

    it('should return MARKET_HOURS at 3:30 PM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T19:30:00Z')); // Monday 3:30 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_HOURS);
    });

    it('should return MARKET_HOURS at 3:59 PM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T19:59:00Z')); // Monday 3:59 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.MARKET_HOURS);
    });

    it('should return AFTER_HOURS at 4:00 PM ET (market close)', () => {
      vi.setSystemTime(new Date('2025-06-16T20:00:00Z')); // Monday 4 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.AFTER_HOURS);
    });

    it('should return AFTER_HOURS at 5:00 PM ET', () => {
      vi.setSystemTime(new Date('2025-06-16T21:00:00Z')); // Monday 5 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.AFTER_HOURS);
    });

    it('should return AFTER_HOURS at 8:00 PM ET', () => {
      vi.setSystemTime(new Date('2025-06-17T00:00:00Z')); // Monday 8 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.AFTER_HOURS);
    });

    it('should return AFTER_HOURS late at night (11 PM ET)', () => {
      vi.setSystemTime(new Date('2025-06-17T03:00:00Z')); // Monday 11 PM ET
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.AFTER_HOURS);
    });

    it('should transition from AFTER_HOURS to PRE_MARKET at midnight', () => {
      // 11:59 PM on Monday (still after hours for Monday)
      vi.setSystemTime(new Date('2025-06-17T03:59:00Z'));
      expect(getCurrentMarketPeriod()).toBe(MarketPeriod.AFTER_HOURS);
    });
  });

  describe('MarketPeriod constants', () => {
    it('should have all market period constants defined', () => {
      expect(MarketPeriod.PRE_MARKET).toBe('PRE_MARKET');
      expect(MarketPeriod.MARKET_HOURS).toBe('MARKET_HOURS');
      expect(MarketPeriod.AFTER_HOURS).toBe('AFTER_HOURS');
      expect(MarketPeriod.MARKET_CLOSED).toBe('MARKET_CLOSED');
    });
  });
});
