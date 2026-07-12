/**
 * Integration tests — Phrase Bank review flow
 *
 * Tests the full phrase review pipeline: checking answers →
 * determining next mastery → scheduling next review. All pure
 * logic composed together — no Supabase required.
 *
 * Related docs:
 *   - docs/testing-strategy.md § Integration Tests
 *   - docs/api-contracts.md § Review Phrase
 *   - docs/database-schema.md § Phrase Bank And Review
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isExactMatch } from '@/domains/scoring/engine';
import { getNextMastery, getNextReviewAt } from '@/domains/phrase-bank/actions';
import type { MasteryStatus, ReviewRating } from '@/domains/phrase-bank/types';

// ---------------------------------------------------------------------------
// Phrase review pipeline
// ---------------------------------------------------------------------------

describe('Phrase review pipeline', () => {
  it('new phrase reviewed correctly → mastery becomes learning', () => {
    const expected = 'thank you again for taking the time';
    const typed = 'thank you again for taking the time';
    const rating: ReviewRating = 'easy';

    // Step 1: Check answer
    const correct = isExactMatch(typed, expected);
    expect(correct).toBe(true);

    // Step 2: Determine next mastery
    const mastery = getNextMastery('new', rating);
    expect(mastery).toBe('learning');

    // Step 3: Schedule next review
    const nextReview = getNextReviewAt(rating);
    expect(nextReview).toBeTruthy();
    expect(new Date(nextReview).getTime()).toBeGreaterThan(Date.now());
  });

  it('new phrase reviewed incorrectly → still becomes learning on review', () => {
    const expected = 'please find attached the document';
    const typed = 'please find the document attached';
    const rating: ReviewRating = 'hard';

    const correct = isExactMatch(typed, expected);
    expect(correct).toBe(false);

    // Even incorrect, reviewing moves from new → learning
    const mastery = getNextMastery('new', rating);
    expect(mastery).toBe('learning');
  });

  it('learning phrase marked easy → mastered', () => {
    const mastery = getNextMastery('learning', 'easy');
    expect(mastery).toBe('mastered');
  });

  it('learning phrase marked hard → stays learning', () => {
    const mastery = getNextMastery('learning', 'hard');
    expect(mastery).toBe('learning');
  });

  it('mastered phrase marked easy → stays mastered', () => {
    const mastery = getNextMastery('mastered', 'easy');
    expect(mastery).toBe('mastered');
  });

  it('mastered phrase marked hard → regresses to learning', () => {
    const mastery = getNextMastery('mastered', 'hard');
    expect(mastery).toBe('learning');
  });
});

// ---------------------------------------------------------------------------
// Mastery progression over multiple reviews
// ---------------------------------------------------------------------------

describe('Mastery progression over multiple reviews', () => {
  it('new → learning → mastered (2 easy reviews)', () => {
    let mastery: MasteryStatus = 'new';
    mastery = getNextMastery(mastery, 'easy');
    expect(mastery).toBe('learning');

    mastery = getNextMastery(mastery, 'easy');
    expect(mastery).toBe('mastered');
  });

  it('new → learning → learning → mastered (hard then easy)', () => {
    let mastery: MasteryStatus = 'new';
    mastery = getNextMastery(mastery, 'hard');
    expect(mastery).toBe('learning');

    mastery = getNextMastery(mastery, 'hard');
    expect(mastery).toBe('learning'); // stays

    mastery = getNextMastery(mastery, 'easy');
    expect(mastery).toBe('mastered');
  });

  it('new → learning → mastered → learning (mastered then hard regresses)', () => {
    let mastery: MasteryStatus = 'new';
    mastery = getNextMastery(mastery, 'easy');
    expect(mastery).toBe('learning');

    mastery = getNextMastery(mastery, 'easy');
    expect(mastery).toBe('mastered');

    mastery = getNextMastery(mastery, 'hard');
    expect(mastery).toBe('learning'); // regresses!
  });
});

// ---------------------------------------------------------------------------
// Review scheduling
// ---------------------------------------------------------------------------

describe('Review scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('easy review schedules 3 days later', () => {
    const next = getNextReviewAt('easy');
    expect(new Date(next).toISOString()).toBe('2026-07-18T12:00:00.000Z');
  });

  it('hard review schedules 1 day later', () => {
    const next = getNextReviewAt('hard');
    expect(new Date(next).toISOString()).toBe('2026-07-16T12:00:00.000Z');
  });

  it('hard reviews come sooner than easy reviews', () => {
    const easyDate = new Date(getNextReviewAt('easy'));
    const hardDate = new Date(getNextReviewAt('hard'));
    expect(hardDate.getTime()).toBeLessThan(easyDate.getTime());
  });
});

// ---------------------------------------------------------------------------
// Exact checking edge cases in review context
// ---------------------------------------------------------------------------

describe('Exact checking in review context', () => {
  it('correctly identifies exact match with real-world phrase', () => {
    const expected = "I'm writing to follow up on our conversation";
    const typed = "I'm writing to follow up on our conversation";
    expect(isExactMatch(typed, expected)).toBe(true);
  });

  it('rejects near-match with wrong word', () => {
    const expected = "I'm writing to follow up on our conversation";
    const typed = "I'm writing to follow up on our discussion";
    expect(isExactMatch(typed, expected)).toBe(false);
  });

  it('rejects match with extra whitespace in the middle', () => {
    const expected = 'please find attached';
    const typed = 'please  find attached'; // double space
    expect(isExactMatch(typed, expected)).toBe(false);
  });

  it('accepts match with extra whitespace only at boundaries', () => {
    const expected = 'best regards';
    const typed = '  best regards  ';
    expect(isExactMatch(typed, expected)).toBe(true);
  });

  it('rejects case mismatch', () => {
    const expected = 'Best Regards';
    const typed = 'best regards';
    expect(isExactMatch(typed, expected)).toBe(false);
  });

  it('rejects punctuation mismatch', () => {
    const expected = "Don't forget";
    const typed = 'Dont forget';
    expect(isExactMatch(typed, expected)).toBe(false);
  });
});
