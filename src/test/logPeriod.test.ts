import { describe, expect, it } from 'vitest';
import { getLogPeriodBounds, parseLogDate } from '../lib/logPeriod';

describe('parseLogDate', () => {
  it('parses a valid YYYY-MM-DD string into local midnight', () => {
    const date = parseLogDate('2026-03-15');
    expect(date).toBeDefined();
    // Verify local midnight (00:00:00) regardless of timezone offset
    expect(date?.getHours()).toBe(0);
    expect(date?.getMinutes()).toBe(0);
    expect(date?.getSeconds()).toBe(0);
  });

  it('returns undefined for malformed strings', () => {
    expect(parseLogDate('not-a-date')).toBeUndefined();
    expect(parseLogDate('2026/03/15')).toBeUndefined();
    expect(parseLogDate('26-03-15')).toBeUndefined();
  });

  it('returns undefined for invalid calendar dates (overflow)', () => {
    // Feb 30 normalises to Mar 2, which fails the round-trip check
    expect(parseLogDate('2026-02-30')).toBeUndefined();
    expect(parseLogDate('2026-04-31')).toBeUndefined();
  });

  it('handles leap year correctly', () => {
    const date = parseLogDate('2024-02-29');
    expect(date).toBeDefined();
    expect(parseLogDate('2025-02-29')).toBeUndefined();
  });
});

describe('getLogPeriodBounds', () => {
  it('throws on missing or malformed dates', () => {
    expect(() => getLogPeriodBounds({ startDate: '', endDate: '2026-01-01' })).toThrow(
      'Select a valid start and end date.'
    );
    expect(() => getLogPeriodBounds({ startDate: 'bad', endDate: '2026-01-01' })).toThrow(
      'Select a valid start and end date.'
    );
  });

  it('throws on reversed dates', () => {
    expect(() =>
      getLogPeriodBounds({ startDate: '2026-01-05', endDate: '2026-01-01' })
    ).toThrow('End date must be on or after start date.');
  });

  it('handles same-day ranges (inclusive end)', () => {
    const bounds = getLogPeriodBounds({ startDate: '2026-06-15', endDate: '2026-06-15' });
    // Start at midnight, end at next day midnight
    expect(bounds.startInclusive).toMatch(/^2026-06-15T/);
    expect(bounds.endExclusive).toMatch(/^2026-06-16T/);
  });

  it('covers cross-month and cross-year intervals', () => {
    const bounds = getLogPeriodBounds({ startDate: '2025-12-28', endDate: '2026-01-03' });
    expect(bounds.startInclusive).toMatch(/^2025-12-28T/);
    expect(bounds.endExclusive).toMatch(/^2026-01-04T/);
  });

  it('ensures fractional-second records at end of day are included', () => {
    // The plan requires that 23:59:59.999999 on the end date is < endExclusive
    const bounds = getLogPeriodBounds({ startDate: '2026-01-01', endDate: '2026-01-01' });
    const endOfDayMs = new Date('2026-01-01T23:59:59.999999Z').getTime();
    const exclusiveBound = new Date(bounds.endExclusive).getTime();
    expect(endOfDayMs).toBeLessThan(exclusiveBound);
  });
});