/**
 * FluentDraft — Dashboard types
 *
 * Mirrors the API contract in docs/api-contracts.md § Dashboard summary output.
 *
 * Related docs:
 *   - docs/api-contracts.md § Scoring And Gamification
 *   - docs/database-schema.md § Identity And Profile, Streaks, Phrase Bank
 */

/** Summary of the user's saved phrases grouped by mastery status. */
export interface PhraseBankSummary {
  /** Total saved phrases. */
  saved: number;
  /** Phrases with mastery "learning". */
  learning: number;
  /** Phrases with mastery "new" (weak). */
  weak: number;
  /** Phrases with mastery "mastered". */
  mastered: number;
}

/** A lightweight recommendation for the next lesson to practice. */
export interface RecommendedLesson {
  /** Slug of the recommended scenario. */
  scenarioId: string;
  /** Title of the scenario. */
  title: string;
  /** Title of the pack this scenario belongs to. */
  packTitle: string;
  /** Why this lesson is recommended. */
  reason: string;
}

/** A lightweight reference to a lesson the user can resume. */
export interface ContinueLesson {
  /** UUID of the lesson_attempt to resume. */
  lessonAttemptId: string;
  /** Slug of the scenario. */
  scenarioId: string;
  /** Title of the scenario. */
  title: string;
}

/** Full dashboard summary returned by the server data layer. */
export interface DashboardSummary {
  /** User's display name from their profile. */
  displayName: string;
  /** Current streak in days (0 if no streak row). */
  streakDays: number;
  /** Total XP earned this week (Monday–Sunday). */
  weeklyXp: number;
  /** Rank name (level name for MVP — leaderboard rank deferred). */
  rankName: string;
  /** User's current total XP. */
  totalXp: number;
  /** User's current level number (1–10). */
  levelNumber: number;
  /** XP needed to reach the next level (0 if max). */
  xpToNextLevel: number;
  /** Number of phrases due for review (next_review_at <= now). */
  reviewDueCount: number;
  /** A lesson the user can pick up where they left off, if any. */
  continueLesson: ContinueLesson | null;
  /** A recommended next lesson (placeholder until Task 44). */
  recommendedLesson: RecommendedLesson | null;
  /** Breakdown of saved phrases by mastery. */
  phraseBankSummary: PhraseBankSummary;
}
