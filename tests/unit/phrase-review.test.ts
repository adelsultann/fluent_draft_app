/**
 * Unit tests — Phrase review mastery transitions and next review scheduling
 *
 * Covers: getNextMastery, getNextReviewAt for all mastery × rating combinations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getNextMastery, getNextReviewAt } from '@/domains/phrase-bank/actions';

// ---------------------------------------------------------------------------
// getNextMastery
// ---------------------------------------------------------------------------

describe('getNextMastery', () => {
  // -- new → learning always
  it('new + easy → learning', () => {
    expect(getNextMastery('new', 'easy')).toBe('learning');
  });

  it('new + hard → learning', () => {
    expect(getNextMastery('new', 'hard')).toBe('learning');
  });

  // -- learning transitions
  it('learning + easy → mastered', () => {
    expect(getNextMastery('learning', 'easy')).toBe('mastered');
  });

  it('learning + hard → learning (stays)', () => {
    expect(getNextMastery('learning', 'hard')).toBe('learning');
  });

  // -- mastered transitions
  it('mastered + easy → mastered (stays)', () => {
    expect(getNextMastery('mastered', 'easy')).toBe('mastered');
  });

  it('mastered + hard → learning (regresses)', () => {
    expect(getNextMastery('mastered', 'hard')).toBe('learning');
  });
});

// ---------------------------------------------------------------------------
// getNextReviewAt
// ---------------------------------------------------------------------------

describe('getNextReviewAt', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns date 3 days from now for easy', () => {
    const result = getNextReviewAt('easy');
    const date = new Date(result);
    expect(date.toISOString()).toBe('2026-07-18T12:00:00.000Z');
  });

  it('returns date 1 day from now for hard', () => {
    const result = getNextReviewAt('hard');
    const date = new Date(result);
    expect(date.toISOString()).toBe('2026-07-16T12:00:00.000Z');
  });

  it('returns a valid ISO string', () => {
    const result = getNextReviewAt('easy');
    expect(() => new Date(result)).not.toThrow();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it('easy review date is later than hard review date', () => {
    const easyDate = new Date(getNextReviewAt('easy'));
    const hardDate = new Date(getNextReviewAt('hard'));
    expect(easyDate.getTime()).toBeGreaterThan(hardDate.getTime());
  });
});
