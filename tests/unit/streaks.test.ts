/**
 * Unit tests — Streak calculation
 *
 * Covers: first activity, same-day no-increment,
 * consecutive-day increment, missed-day reset, longest streak tracking.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateStreak,
  daysBetween,
  todayDateString,
} from '@/domains/gamification/streaks';

// ---------------------------------------------------------------------------
// daysBetween helper
// ---------------------------------------------------------------------------

describe('daysBetween', () => {
  it('returns 0 for same date', () => {
    expect(daysBetween('2026-01-15', '2026-01-15')).toBe(0);
  });

  it('returns 1 for consecutive dates', () => {
    expect(daysBetween('2026-01-15', '2026-01-16')).toBe(1);
  });

  it('returns 2 for a 2-day gap', () => {
    expect(daysBetween('2026-01-15', '2026-01-17')).toBe(2);
  });

  it('handles month boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
  });

  it('handles year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// todayDateString
// ---------------------------------------------------------------------------

describe('todayDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const today = todayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// calculateStreak
// ---------------------------------------------------------------------------

describe('calculateStreak', () => {
  const TODAY = '2026-07-12';

  it('starts streak at 1 for first activity (null existing)', () => {
    const result = calculateStreak(null, TODAY);
    expect(result.currentStreakDays).toBe(1);
    expect(result.longestStreakDays).toBe(1);
    expect(result.lastPracticeDate).toBe(TODAY);
    expect(result.updated).toBe(true);
  });

  it('starts streak at 1 when existing has null lastPracticeDate', () => {
    const result = calculateStreak(
      { currentStreakDays: 0, longestStreakDays: 0, lastPracticeDate: null },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(1);
    expect(result.updated).toBe(true);
  });

  it('does not increment for same-day practice', () => {
    const result = calculateStreak(
      { currentStreakDays: 3, longestStreakDays: 5, lastPracticeDate: TODAY },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(3);
    expect(result.longestStreakDays).toBe(5);
    expect(result.updated).toBe(false);
  });

  it('increments streak for consecutive-day practice', () => {
    const result = calculateStreak(
      { currentStreakDays: 3, longestStreakDays: 5, lastPracticeDate: '2026-07-11' },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(4);
    expect(result.longestStreakDays).toBe(5); // longest stays 5 (existing was higher)
    expect(result.updated).toBe(true);
    expect(result.lastPracticeDate).toBe(TODAY);
  });

  it('updates longest streak when current surpasses it', () => {
    const result = calculateStreak(
      { currentStreakDays: 5, longestStreakDays: 5, lastPracticeDate: '2026-07-11' },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(6);
    expect(result.longestStreakDays).toBe(6);
    expect(result.updated).toBe(true);
  });

  it('resets streak to 1 after a missed day (gap > 1)', () => {
    const result = calculateStreak(
      { currentStreakDays: 10, longestStreakDays: 15, lastPracticeDate: '2026-07-09' },
      TODAY,
    );
    // gap = 3 days → reset
    expect(result.currentStreakDays).toBe(1);
    expect(result.longestStreakDays).toBe(15); // preserved
    expect(result.lastPracticeDate).toBe(TODAY);
    expect(result.updated).toBe(true);
  });

  it('resets streak to 1 after 2-day gap', () => {
    const result = calculateStreak(
      { currentStreakDays: 7, longestStreakDays: 10, lastPracticeDate: '2026-07-10' },
      TODAY,
    );
    // gap = 2 days → reset
    expect(result.currentStreakDays).toBe(1);
    expect(result.longestStreakDays).toBe(10);
  });

  it('increments from day 1 to day 2', () => {
    const result = calculateStreak(
      { currentStreakDays: 1, longestStreakDays: 1, lastPracticeDate: '2026-07-11' },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(2);
    expect(result.longestStreakDays).toBe(2);
    expect(result.updated).toBe(true);
  });

  it('handles lastPracticeDate as yesterday correctly', () => {
    // This is the most common case: user practiced yesterday, practicing today
    const result = calculateStreak(
      { currentStreakDays: 4, longestStreakDays: 7, lastPracticeDate: '2026-07-11' },
      TODAY,
    );
    expect(result.currentStreakDays).toBe(5);
    expect(result.updated).toBe(true);
  });
});
