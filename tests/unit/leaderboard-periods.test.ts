/**
 * Unit tests — Leaderboard period boundaries
 *
 * Covers: weekly (Monday–Sunday) and monthly (1st–last day) period
 * calculations across various dates, edge cases, and year/month transitions.
 *
 * Uses fake timers to produce deterministic results.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getWeekStartISO,
  getWeekEndISO,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartISO,
  getMonthEndISO,
  getMonthStartDate,
  getMonthEndDate,
} from '@/domains/leaderboard/periods';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Set the system clock to a specific UTC date-time. */
function setClock(dateStr: string) {
  vi.setSystemTime(new Date(dateStr + 'T12:00:00Z'));
}

/** Extract YYYY-MM-DD from an ISO string. */
function datePart(iso: string): string {
  return iso.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Weekly boundaries
// ---------------------------------------------------------------------------

describe('getWeekStartISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the previous Monday when today is Wednesday', () => {
    setClock('2026-07-15'); // Wednesday
    expect(datePart(getWeekStartISO())).toBe('2026-07-13');
  });

  it('returns today when today is Monday', () => {
    setClock('2026-07-13'); // Monday
    expect(datePart(getWeekStartISO())).toBe('2026-07-13');
  });

  it('returns the previous Monday when today is Sunday', () => {
    setClock('2026-07-19'); // Sunday
    expect(datePart(getWeekStartISO())).toBe('2026-07-13');
  });

  it('returns the previous Monday when today is Saturday', () => {
    setClock('2026-07-18'); // Saturday
    expect(datePart(getWeekStartISO())).toBe('2026-07-13');
  });

  it('returns the previous Monday when today is Friday', () => {
    setClock('2026-07-17'); // Friday
    expect(datePart(getWeekStartISO())).toBe('2026-07-13');
  });

  it('handles week crossing month boundary', () => {
    setClock('2026-08-01'); // Saturday in July → Monday is July 27
    expect(datePart(getWeekStartISO())).toBe('2026-07-27');
  });

  it('handles week crossing year boundary', () => {
    setClock('2026-01-01'); // Thursday → Monday is Dec 29, 2025
    expect(datePart(getWeekStartISO())).toBe('2025-12-29');
  });

  it('returns time at exactly 00:00:00.000Z', () => {
    setClock('2026-07-15');
    const iso = getWeekStartISO();
    expect(iso).toMatch(/T00:00:00\.000Z$/);
  });
});

describe('getWeekEndISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the next Sunday when today is Wednesday', () => {
    setClock('2026-07-15'); // Wednesday → Sunday is July 19
    expect(datePart(getWeekEndISO())).toBe('2026-07-19');
  });

  it('returns today when today is Sunday', () => {
    setClock('2026-07-19'); // Sunday
    expect(datePart(getWeekEndISO())).toBe('2026-07-19');
  });

  it('returns the next Sunday when today is Monday', () => {
    setClock('2026-07-13'); // Monday → Sunday is July 19
    expect(datePart(getWeekEndISO())).toBe('2026-07-19');
  });

  it('handles week crossing month boundary', () => {
    setClock('2026-07-27'); // Monday → Sunday is Aug 2
    expect(datePart(getWeekEndISO())).toBe('2026-08-02');
  });

  it('returns time at exactly 23:59:59.999Z', () => {
    setClock('2026-07-15');
    const iso = getWeekEndISO();
    expect(iso).toMatch(/T23:59:59\.999Z$/);
  });
});

describe('getWeekStartDate / getWeekEndDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns YYYY-MM-DD format for week start', () => {
    setClock('2026-07-15');
    expect(getWeekStartDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getWeekStartDate()).toBe('2026-07-13');
  });

  it('returns YYYY-MM-DD format for week end', () => {
    setClock('2026-07-15');
    expect(getWeekEndDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getWeekEndDate()).toBe('2026-07-19');
  });

  it('week start is always <= today <= week end', () => {
    setClock('2026-07-15');
    const start = getWeekStartDate();
    const end = getWeekEndDate();
    expect(start <= '2026-07-15').toBe(true);
    expect(end >= '2026-07-15').toBe(true);
  });

  it('week span covers Monday through Sunday (7 calendar days)', () => {
    setClock('2026-07-15');
    const start = new Date(getWeekStartISO());
    const end = new Date(getWeekEndISO());
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // Monday 00:00 to Sunday 23:59:59.999 = 6 full days + partial
    expect(diffDays).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// Weekly — full week coverage (every day of week)
// ---------------------------------------------------------------------------

describe('Weekly period — every weekday', () => {
  // For the week of Monday 2026-07-13 to Sunday 2026-07-19
  const weekdays = [
    { date: '2026-07-13', day: 'Monday',    expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-14', day: 'Tuesday',   expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-15', day: 'Wednesday', expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-16', day: 'Thursday',  expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-17', day: 'Friday',    expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-18', day: 'Saturday',  expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
    { date: '2026-07-19', day: 'Sunday',    expectedStart: '2026-07-13', expectedEnd: '2026-07-19' },
  ];

  for (const { date, day, expectedStart, expectedEnd } of weekdays) {
    it(`returns correct week boundaries for ${day} (${date})`, () => {
      vi.useFakeTimers();
      setClock(date);
      expect(getWeekStartDate()).toBe(expectedStart);
      expect(getWeekEndDate()).toBe(expectedEnd);
      vi.useRealTimers();
    });
  }
});

// ---------------------------------------------------------------------------
// Monthly boundaries
// ---------------------------------------------------------------------------

describe('getMonthStartISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the 1st of the current month', () => {
    setClock('2026-07-15');
    expect(datePart(getMonthStartISO())).toBe('2026-07-01');
  });

  it('returns the 1st when today is the 1st', () => {
    setClock('2026-07-01');
    expect(datePart(getMonthStartISO())).toBe('2026-07-01');
  });

  it('returns the 1st when today is the last day of month', () => {
    setClock('2026-07-31');
    expect(datePart(getMonthStartISO())).toBe('2026-07-01');
  });

  it('returns the 1st for January', () => {
    setClock('2026-01-20');
    expect(datePart(getMonthStartISO())).toBe('2026-01-01');
  });

  it('returns the 1st for December', () => {
    setClock('2026-12-20');
    expect(datePart(getMonthStartISO())).toBe('2026-12-01');
  });

  it('returns time at exactly 00:00:00.000Z', () => {
    setClock('2026-07-15');
    const iso = getMonthStartISO();
    expect(iso).toMatch(/T00:00:00\.000Z$/);
  });
});

describe('getMonthEndISO', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the last day for a 31-day month (July)', () => {
    setClock('2026-07-15');
    expect(datePart(getMonthEndISO())).toBe('2026-07-31');
  });

  it('returns the last day for a 30-day month (June)', () => {
    setClock('2026-06-15');
    expect(datePart(getMonthEndISO())).toBe('2026-06-30');
  });

  it('returns Feb 28 for a non-leap year (2026)', () => {
    setClock('2026-02-15');
    expect(datePart(getMonthEndISO())).toBe('2026-02-28');
  });

  it('returns Feb 29 for a leap year (2028)', () => {
    setClock('2028-02-15'); // 2028 is a leap year
    expect(datePart(getMonthEndISO())).toBe('2028-02-29');
  });

  it('returns the last day when today is the 1st', () => {
    setClock('2026-07-01');
    expect(datePart(getMonthEndISO())).toBe('2026-07-31');
  });

  it('returns the last day for December', () => {
    setClock('2026-12-15');
    expect(datePart(getMonthEndISO())).toBe('2026-12-31');
  });

  it('returns the last day for January', () => {
    setClock('2026-01-15');
    expect(datePart(getMonthEndISO())).toBe('2026-01-31');
  });

  it('returns time at exactly 23:59:59.999Z', () => {
    setClock('2026-07-15');
    const iso = getMonthEndISO();
    expect(iso).toMatch(/T23:59:59\.999Z$/);
  });
});

describe('getMonthStartDate / getMonthEndDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns YYYY-MM-DD format for month start', () => {
    setClock('2026-07-15');
    expect(getMonthStartDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getMonthStartDate()).toBe('2026-07-01');
  });

  it('returns YYYY-MM-DD format for month end', () => {
    setClock('2026-07-15');
    expect(getMonthEndDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getMonthEndDate()).toBe('2026-07-31');
  });

  it('month start is always <= today <= month end', () => {
    setClock('2026-07-15');
    const start = getMonthStartDate();
    const end = getMonthEndDate();
    expect(start <= '2026-07-15').toBe(true);
    expect(end >= '2026-07-15').toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Monthly — full year coverage (every month)
// ---------------------------------------------------------------------------

describe('Monthly period — every month of 2026', () => {
  const months = [
    { date: '2026-01-10', expectedStart: '2026-01-01', expectedEnd: '2026-01-31' },
    { date: '2026-02-10', expectedStart: '2026-02-01', expectedEnd: '2026-02-28' },
    { date: '2026-03-10', expectedStart: '2026-03-01', expectedEnd: '2026-03-31' },
    { date: '2026-04-10', expectedStart: '2026-04-01', expectedEnd: '2026-04-30' },
    { date: '2026-05-10', expectedStart: '2026-05-01', expectedEnd: '2026-05-31' },
    { date: '2026-06-10', expectedStart: '2026-06-01', expectedEnd: '2026-06-30' },
    { date: '2026-07-10', expectedStart: '2026-07-01', expectedEnd: '2026-07-31' },
    { date: '2026-08-10', expectedStart: '2026-08-01', expectedEnd: '2026-08-31' },
    { date: '2026-09-10', expectedStart: '2026-09-01', expectedEnd: '2026-09-30' },
    { date: '2026-10-10', expectedStart: '2026-10-01', expectedEnd: '2026-10-31' },
    { date: '2026-11-10', expectedStart: '2026-11-01', expectedEnd: '2026-11-30' },
    { date: '2026-12-10', expectedStart: '2026-12-01', expectedEnd: '2026-12-31' },
  ];

  for (const { date, expectedStart, expectedEnd } of months) {
    it(`returns correct month boundaries for ${date.slice(0, 7)}`, () => {
      vi.useFakeTimers();
      setClock(date);
      expect(getMonthStartDate()).toBe(expectedStart);
      expect(getMonthEndDate()).toBe(expectedEnd);
      vi.useRealTimers();
    });
  }
});

// ---------------------------------------------------------------------------
// Consistency checks
// ---------------------------------------------------------------------------

describe('Period consistency', () => {
  it('weekly period start is always a Monday', () => {
    vi.useFakeTimers();
    // Test across several dates
    const dates = ['2026-01-01', '2026-03-15', '2026-06-01', '2026-07-13', '2026-12-25'];
    for (const date of dates) {
      setClock(date);
      const startIso = getWeekStartISO();
      const startDate = new Date(startIso);
      expect(startDate.getUTCDay()).toBe(1); // Monday = 1
    }
    vi.useRealTimers();
  });

  it('weekly period end is always a Sunday', () => {
    vi.useFakeTimers();
    const dates = ['2026-01-01', '2026-03-15', '2026-06-01', '2026-07-13', '2026-12-25'];
    for (const date of dates) {
      setClock(date);
      const endIso = getWeekEndISO();
      const endDate = new Date(endIso);
      expect(endDate.getUTCDay()).toBe(0); // Sunday = 0
    }
    vi.useRealTimers();
  });

  it('monthly period start is always day 1', () => {
    vi.useFakeTimers();
    const dates = ['2026-02-15', '2026-07-31', '2026-12-01'];
    for (const date of dates) {
      setClock(date);
      const startIso = getMonthStartISO();
      const startDate = new Date(startIso);
      expect(startDate.getUTCDate()).toBe(1);
    }
    vi.useRealTimers();
  });

  it('week start date ≤ week end date', () => {
    vi.useFakeTimers();
    setClock('2026-07-15');
    const start = getWeekStartDate();
    const end = getWeekEndDate();
    expect(start <= end).toBe(true);
    vi.useRealTimers();
  });

  it('month start date ≤ month end date', () => {
    vi.useFakeTimers();
    setClock('2026-07-15');
    const start = getMonthStartDate();
    const end = getMonthEndDate();
    expect(start <= end).toBe(true);
    vi.useRealTimers();
  });

  it('week boundaries are deterministic — same result on repeated calls', () => {
    vi.useFakeTimers();
    setClock('2026-07-15');
    const start1 = getWeekStartDate();
    const end1 = getWeekEndDate();
    const start2 = getWeekStartDate();
    const end2 = getWeekEndDate();
    expect(start1).toBe(start2);
    expect(end1).toBe(end2);
    vi.useRealTimers();
  });

  it('month boundaries are deterministic — same result on repeated calls', () => {
    vi.useFakeTimers();
    setClock('2026-07-15');
    const start1 = getMonthStartDate();
    const end1 = getMonthEndDate();
    const start2 = getMonthStartDate();
    const end2 = getMonthEndDate();
    expect(start1).toBe(start2);
    expect(end1).toBe(end2);
    vi.useRealTimers();
  });
});
