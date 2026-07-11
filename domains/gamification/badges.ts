/**
 * FluentDraft — Badge evaluation
 *
 * Pure functions that determine which badges should be awarded
 * based on the user's current activity context.
 *
 * Related docs:
 *   - supabase/migrations/20260709000003_seed_gamification.sql § Badges
 *   - docs/database-schema.md § badges, user_badges
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Context passed to badge evaluation after lesson completion. */
export interface BadgeEvaluationContext {
  /** Total completed lessons (including this one). */
  totalLessonsCompleted: number;
  /** Current streak days (after this lesson's update). */
  streakDays: number;
  /** Whether the recall phase had zero mistakes. */
  perfectRecall: boolean;
  /** Total phrases saved to the Phrase Bank (including this lesson). */
  totalPhrasesSaved: number;
  /** Whether the user has ever done pronunciation practice. */
  hasPronunciationAttempt: boolean;
  /** Whether all 4 phases were completed in this lesson. */
  allPhasesCompleted: boolean;
  /** Whether this is the user's first lesson. */
  isFirstLesson: boolean;
}

/** Result of badge evaluation. */
export interface BadgeEvaluationResult {
  /** Badge codes to award (not yet awarded). */
  awardedCodes: string[];
  /** Badge codes that were already owned (no-op). */
  alreadyOwnedCodes: string[];
}

// ---------------------------------------------------------------------------
// Badge definitions (mirrors seed migration)
// ---------------------------------------------------------------------------

interface BadgeRule {
  code: string;
  name: string;
  evaluate: (ctx: BadgeEvaluationContext) => boolean;
}

const BADGE_RULES: BadgeRule[] = [
  {
    code: 'first_lesson',
    name: 'First Step',
    evaluate: (ctx) => ctx.isFirstLesson,
  },
  {
    code: 'all_phases',
    name: 'Thorough',
    evaluate: (ctx) => ctx.allPhasesCompleted,
  },
  {
    code: 'perfect_recall',
    name: 'Perfect Recall',
    evaluate: (ctx) => ctx.perfectRecall,
  },
  {
    code: 'first_save',
    name: 'Collector',
    evaluate: (ctx) => ctx.totalPhrasesSaved >= 1,
  },
  {
    code: 'five_phrases',
    name: 'Librarian',
    evaluate: (ctx) => ctx.totalPhrasesSaved >= 5,
  },
  {
    code: 'ten_phrases',
    name: 'Curator',
    evaluate: (ctx) => ctx.totalPhrasesSaved >= 10,
  },
  {
    code: 'five_lessons',
    name: 'Scholar',
    evaluate: (ctx) => ctx.totalLessonsCompleted >= 5,
  },
  {
    code: 'ten_lessons',
    name: 'Veteran',
    evaluate: (ctx) => ctx.totalLessonsCompleted >= 10,
  },
  {
    code: 'practice_streak_3',
    name: 'Consistent',
    evaluate: (ctx) => ctx.streakDays >= 3,
  },
  {
    code: 'practice_streak_7',
    name: 'Dedicated',
    evaluate: (ctx) => ctx.streakDays >= 7,
  },
  {
    code: 'practice_streak_14',
    name: 'Committed',
    evaluate: (ctx) => ctx.streakDays >= 14,
  },
  // pronunciation_try requires DB knowledge; handled separately in the action
];

/**
 * Evaluate which badges are newly eligible.
 *
 * @param ctx — the user's current activity context
 * @param alreadyOwnedCodes — set of badge codes the user already has
 * @returns evaluation result with codes to award
 */
export function evaluateBadges(
  ctx: BadgeEvaluationContext,
  alreadyOwnedCodes: Set<string>,
): BadgeEvaluationResult {
  const awardedCodes: string[] = [];
  const alreadyOwnedCodesList: string[] = [];

  for (const rule of BADGE_RULES) {
    if (rule.evaluate(ctx)) {
      if (alreadyOwnedCodes.has(rule.code)) {
        alreadyOwnedCodesList.push(rule.code);
      } else {
        awardedCodes.push(rule.code);
      }
    }
  }

  return { awardedCodes, alreadyOwnedCodes: alreadyOwnedCodesList };
}
