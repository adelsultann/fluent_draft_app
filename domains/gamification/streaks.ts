/**
 * FluentDraft — Streak calculation
 *
 * Pure functions for determining streak state transitions after
 * a practice activity.  Isolated from database access so they can
 * be unit-tested independently.
 *
 * Streak rules (from docs/tasks-and-acceptance-criteria.md Step 38):
 *   - First eligible practice → streak starts at 1
 *   - Same-day practice → does not increment
 *   - Next-day practice → increments
 *   - Missed day → resets to 1
 *   - Update longest streak when needed
 *
 * Related docs:
 *   - docs/database-schema.md § streaks table
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The current streak state from the database (null if no row exists). */
export interface StreakState {
  currentStreakDays: number;
  longestStreakDays: number;
  lastPracticeDate: string | null; // ISO date string ('YYYY-MM-DD')
}

/** The computed streak state after an activity. */
export interface StreakUpdate {
  currentStreakDays: number;
  longestStreakDays: number;
  lastPracticeDate: string;
  /** Whether the streak value changed (for return values). */
  updated: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get today's date as 'YYYY-MM-DD'. */
export function todayDateString(): string {
  // In tests this can be mocked; in production returns actual today
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Compute the difference in days between two 'YYYY-MM-DD' strings. */
export function daysBetween(a: string, b: string): number {
  const dateA = new Date(a + 'T00:00:00Z');
  const dateB = new Date(b + 'T00:00:00Z');
  return Math.round((dateB.getTime() - dateA.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Streak calculation
// ---------------------------------------------------------------------------

/**
 * Compute the new streak state after a practice activity.
 *
 * @param existing — the current streak row from DB, or `null` for first-ever activity
 * @param today — today's date as 'YYYY-MM-DD'
 * @returns the new streak state and whether it was updated
 */
export function calculateStreak(
  existing: StreakState | null,
  today: string,
): StreakUpdate {
  // First activity ever
  if (!existing || existing.lastPracticeDate === null) {
    return {
      currentStreakDays: 1,
      longestStreakDays: 1,
      lastPracticeDate: today,
      updated: true,
    };
  }

  const lastDate = existing.lastPracticeDate;
  const diff = daysBetween(lastDate, today);

  // Same day — no change
  if (diff === 0) {
    return {
      currentStreakDays: existing.currentStreakDays,
      longestStreakDays: existing.longestStreakDays,
      lastPracticeDate: today,
      updated: false,
    };
  }

  // Consecutive day — increment
  if (diff === 1) {
    const newCurrent = existing.currentStreakDays + 1;
    const newLongest = Math.max(existing.longestStreakDays, newCurrent);
    return {
      currentStreakDays: newCurrent,
      longestStreakDays: newLongest,
      lastPracticeDate: today,
      updated: true,
    };
  }

  // Gap > 1 day — reset streak to 1
  return {
    currentStreakDays: 1,
    longestStreakDays: existing.longestStreakDays,
    lastPracticeDate: today,
    updated: true,
  };
}
