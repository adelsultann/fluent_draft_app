/**
 * FluentDraft — Phrase review utility functions
 *
 * Pure functions used by both server actions (actions.ts) and
 * client components (phrase-list.tsx).  Separated from the
 * server-action file because Next.js requires every export from
 * a 'use server' module to be an async function.
 *
 * Related docs:
 *   - docs/api-contracts.md § Review Phrase
 *   - docs/database-schema.md § Phrase Bank And Review
 */

import type { MasteryStatus } from './types';

// ---------------------------------------------------------------------------
// Mastery transition rules
// ---------------------------------------------------------------------------

/**
 * Determine the next mastery status after a review.
 *
 * Rules:
 *   - `new` + any rating → `learning`
 *   - `learning` + "easy" → `mastered`
 *   - `learning` + "hard" → stays `learning`
 *   - `mastered` + "easy" → stays `mastered`
 *   - `mastered` + "hard" → regresses to `learning`
 */
export function getNextMastery(
  currentMastery: MasteryStatus,
  rating: 'easy' | 'hard',
): MasteryStatus {
  if (currentMastery === 'new') return 'learning';
  if (currentMastery === 'learning') {
    return rating === 'easy' ? 'mastered' : 'learning';
  }
  // mastered
  return rating === 'easy' ? 'mastered' : 'learning';
}

/**
 * Calculate the next review date based on the rating.
 *
 *   - "easy" → 3 days from now
 *   - "hard" → 1 day from now
 */
export function getNextReviewAt(rating: 'easy' | 'hard'): string {
  const now = new Date();
  const days = rating === 'easy' ? 3 : 1;
  now.setDate(now.getDate() + days);
  return now.toISOString();
}
