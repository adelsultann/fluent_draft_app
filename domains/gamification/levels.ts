/**
 * FluentDraft — Level resolution
 *
 * Pure function that determines which user_level a given total XP
 * corresponds to, based on the seeded `user_levels.min_xp` thresholds.
 *
 * Related docs:
 *   - docs/database-schema.md § Scoring, Gamification, And Leaderboards
 *   - plan.md § Gamification
 */

// ---------------------------------------------------------------------------
// Level thresholds (source of truth: seed migration)
// ---------------------------------------------------------------------------

export interface LevelDefinition {
  levelNumber: number;
  name: string;
  minXp: number;
}

/** Seeded level thresholds — matches supabase/migrations/20260709000003_seed_gamification.sql */
const LEVELS: LevelDefinition[] = [
  { levelNumber: 1,  name: 'Newcomer',       minXp: 0 },
  { levelNumber: 2,  name: 'Learner',         minXp: 100 },
  { levelNumber: 3,  name: 'Practitioner',    minXp: 250 },
  { levelNumber: 4,  name: 'Communicator',    minXp: 500 },
  { levelNumber: 5,  name: 'Wordsmith',       minXp: 1000 },
  { levelNumber: 6,  name: 'Professional',    minXp: 2000 },
  { levelNumber: 7,  name: 'Specialist',      minXp: 3500 },
  { levelNumber: 8,  name: 'Expert',          minXp: 5000 },
  { levelNumber: 9,  name: 'Master',          minXp: 7500 },
  { levelNumber: 10, name: 'Virtuoso',        minXp: 10000 },
];

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Find the highest level whose `minXp` is ≤ the given `totalXp`.
 *
 * Returns the level definition.  Guaranteed to return a value because
 * level 1 has `minXp: 0`.
 */
export function resolveLevel(totalXp: number): LevelDefinition {
  let best = LEVELS[0];
  for (const level of LEVELS) {
    if (totalXp >= level.minXp) {
      best = level;
    } else {
      break;
    }
  }
  return best;
}

/**
 * Return the level_number (bigint ID) for a given total XP.
 * Matches the `user_levels.id` primary key from the seed.
 */
export function resolveLevelNumber(totalXp: number): number {
  return resolveLevel(totalXp).levelNumber;
}

export { LEVELS };
