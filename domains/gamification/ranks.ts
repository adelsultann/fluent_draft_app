/**
 * FluentDraft — Rank and unlock resolution
 *
 * Minimal MVP rules for resolving a user's rank title and content unlock
 * state from their level, XP, and activity data.
 *
 * Smallest MVP rule:
 *   - Rank = the user's level name (Newcomer → Virtuoso).
 *   - Unlocks = all content is available to registered users in MVP;
 *     unlock state is derived from level for future premium/content gating.
 *
 * Related docs:
 *   - docs/database-schema.md § user_levels, user_profiles
 *   - plan.md § Gamification
 */

import type { LevelDefinition } from './levels';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A user's computed rank information. */
export interface RankState {
  /** Numeric level (1–10). */
  levelNumber: number;
  /** Display name of the rank (matches level name). */
  rankName: string;
  /** The level's minimum XP threshold. */
  minXp: number;
  /** Total XP the user has accumulated. */
  currentXp: number;
  /** XP needed to reach the next level (0 if at max level). */
  xpToNextLevel: number;
  /** Whether the user is at the maximum level. */
  isMaxLevel: boolean;
}

/** Unlock state for a given level. */
export interface UnlockState {
  /** Numeric level (1–10). */
  levelNumber: number;
  /** Scenario pack IDs or slugs that are unlocked at this level. */
  unlockedPackKeys: string[];
  /** Whether the Phrase Bank is available. */
  phraseBankAvailable: boolean;
  /** Whether leaderboards are available. */
  leaderboardAvailable: boolean;
  /** Whether full practice (all phases) is available. */
  fullPracticeAvailable: boolean;
}

// ---------------------------------------------------------------------------
// Rank resolution
// ---------------------------------------------------------------------------

/**
 * Resolve the user's rank state from their current XP and level definition.
 *
 * Uses the smallest MVP rule: rank is the level name.
 *
 * @param currentXp — the user's total accumulated XP
 * @param level — the resolved LevelDefinition for the current XP
 * @param nextLevel — the next LevelDefinition, or null if at max level
 * @returns the user's rank state
 */
export function resolveRank(
  currentXp: number,
  level: LevelDefinition,
  nextLevel: LevelDefinition | null,
): RankState {
  const xpToNextLevel = nextLevel
    ? nextLevel.minXp - currentXp
    : 0;

  return {
    levelNumber: level.levelNumber,
    rankName: level.name,
    minXp: level.minXp,
    currentXp,
    xpToNextLevel: Math.max(0, xpToNextLevel),
    isMaxLevel: nextLevel === null,
  };
}

// ---------------------------------------------------------------------------
// Unlock resolution
// ---------------------------------------------------------------------------

/**
 * Resolve what content is unlocked for a user at a given level.
 *
 * Smallest MVP rule: registered users who have completed onboarding can
 * access all MVP content. No premium/content gating by level in MVP.
 *
 * Future: this can restrict pack access by level, gate premium packs, etc.
 *
 * @param levelNumber — the user's current level (1–10)
 * @returns unlock state indicating what content is available
 */
export function resolveUnlocks(levelNumber: number): UnlockState {
  // MVP: all registered users have full access
  const allPacks = [
    'job-hunt-and-career',
    'daily-workplace',
    'daily-life-and-adulting',
  ];

  return {
    levelNumber,
    unlockedPackKeys: allPacks,
    phraseBankAvailable: true,
    leaderboardAvailable: true,
    fullPracticeAvailable: true,
  };
}
