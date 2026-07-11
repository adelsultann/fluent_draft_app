/**
 * FluentDraft — Leaderboard types
 *
 * Mirrors the API contract in docs/api-contracts.md § Leaderboards.
 *
 * Related docs:
 *   - docs/api-contracts.md § Leaderboards
 *   - docs/database-schema.md § leaderboard_entries
 */

/** Matches the `leaderboard_period_type` Postgres enum. */
export type LeaderboardPeriod = 'weekly' | 'monthly';

/** Input for fetching leaderboard data. */
export interface GetLeaderboardParams {
  period: LeaderboardPeriod;
  periodStart: string; // ISO date string
  periodEnd: string;   // ISO date string
  limit?: number;
}

/** A single leaderboard entry with safe public fields. */
export interface LeaderboardEntry {
  /** Display rank (1-based, computed client-side). */
  rank: number;
  /** Opaque user identifier (safe to expose — not an email). */
  userId: string;
  /** User's public display name. */
  displayName: string;
  /** ISO country code (e.g. "US", "EG"). */
  countryCode: string;
  /** Score for this period. */
  score: number;
  /** The period type. */
  period: LeaderboardPeriod;
  /** Period start date (ISO). */
  periodStart: string;
  /** Period end date (ISO). */
  periodEnd: string;
}
