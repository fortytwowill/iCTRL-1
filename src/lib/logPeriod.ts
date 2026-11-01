import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';

export interface LogPeriod {
  /** Inclusive local calendar day in YYYY-MM-DD format. */
  startDate: string;
  /** Inclusive local calendar day in YYYY-MM-DD format. */
  endDate: string;
}

export type LogDateBounds = {
  /** Raw ISO created_at of the earliest matching record. */
  earliest: string;
  /** Raw ISO created_at of the latest matching record. */
  latest: string;
} | null;

const LOG_DATE_FORMAT = 'yyyy-MM-dd';
const LOG_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a strict YYYY-MM-DD string into a local Date at midnight.
 * Returns undefined for malformed strings, invalid calendar dates (e.g. Feb 30),
 * or normalised overflow that does not round-trip to the original input.
 * Never uses `new Date('YYYY-MM-DD')`, which treats the value as UTC.
 */
export function parseLogDate(value: string): Date | undefined {
  if (!LOG_DATE_REGEX.test(value)) return undefined;
  const parsed = parseISO(value);
  if (!isValid(parsed)) return undefined;
  // Round-trip through format to reject normalised overflow such as 2026-02-30 → 2026-03-02.
  if (format(parsed, LOG_DATE_FORMAT) !== value) return undefined;
  return startOfDay(parsed);
}

/**
 * Convert an inclusive local-day period into ISO timestamps suitable for
 * PostgREST filtering. endExclusive is local midnight AFTER the end date,
 * so queries should use gte(startInclusive) and lt(endExclusive).
 * Same-day ranges are valid. Throws on missing/malformed/reversed dates.
 * Uses calendar-day addition to handle 23/25-hour DST days correctly.
 */
export function getLogPeriodBounds(period: LogPeriod): {
  startInclusive: string;
  endExclusive: string;
} {
  const start = parseLogDate(period.startDate);
  const end = parseLogDate(period.endDate);
  if (!start || !end) {
    throw new Error('Select a valid start and end date.');
  }
  if (end < start) {
    throw new Error('End date must be on or after start date.');
  }
  const startInclusive = start.toISOString();
  const endExclusive = addDays(startOfDay(end), 1).toISOString();
  return { startInclusive, endExclusive };
}