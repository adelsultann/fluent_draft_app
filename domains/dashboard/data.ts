/**
 * FluentDraft — Dashboard data access
 *
 * Server-side data fetching for the dashboard summary.
 * Fetches profile, streaks, weekly XP, phrase bank counts,
 * continue-lesson, and level information for the current user.
 *
 * All data is scoped to the authenticated user via RLS and explicit
 * user_id filters.
 *
 * Related docs:
 *   - docs/api-contracts.md § Dashboard summary output
 *   - docs/database-schema.md § Identity And Profile, Scoring, Phrase Bank
 */

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import { resolveLevel, LEVELS } from '@/domains/gamification/levels';
import { getAllActiveScenarios } from '@/domains/scenarios/data';
import type { DashboardSummary } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the complete dashboard summary for the current authenticated user.
 *
 * Returns null if the user is not authenticated (should not happen since
 * the route is protected by the (registered) layout).
 */
export async function getDashboardSummary(): Promise<DashboardSummary | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = (await createServerClient()) as Client;

  // Run independent queries in parallel
  const [
    profileResult,
    streakResult,
    weeklyXpResult,
    phraseBankResult,
    reviewDueResult,
    continueResult,
    completedResult,
  ] = await Promise.all([
    // 1. User profile (display_name, total_xp, current_level_id, english_level)
    supabase
      .from('user_profiles')
      .select('display_name, total_xp, current_level_id, english_level')
      .eq('user_id', user.id)
      .maybeSingle(),

    // 2. Streaks
    supabase
      .from('streaks')
      .select('current_streak_days')
      .eq('user_id', user.id)
      .maybeSingle(),

    // 3. Weekly XP (current week: Monday 00:00 to Sunday 23:59:59 UTC)
    supabase
      .from('score_events')
      .select('points')
      .eq('user_id', user.id)
      .gte('created_at', getWeekStartISO())
      .lte('created_at', getWeekEndISO()),

    // 4. Phrase bank counts by mastery
    supabase
      .from('phrase_bank_items')
      .select('mastery')
      .eq('user_id', user.id),

    // 5. Review due count (next_review_at <= now)
    supabase
      .from('phrase_bank_items')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('next_review_at', 'is', null)
      .lte('next_review_at', new Date().toISOString()),

    // 6. Most recent in-progress lesson attempt for "continue"
    supabase
      .from('lesson_attempts')
      .select('id, scenario_id')
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // 7. Completed scenario slugs (for recommendation filtering)
    supabase
      .from('lesson_attempts')
      .select('scenarios!inner(slug)')
      .eq('user_id', user.id)
      .eq('status', 'completed'),
  ]);

  // --- Process results ---

  const profile = profileResult.data as {
    display_name: string;
    total_xp: number;
    current_level_id: number;
    english_level: string;
  } | null;
  const streak = streakResult.data as { current_streak_days: number } | null;
  const weeklyXpRows = (weeklyXpResult.data ?? []) as { points: number }[];
  const phraseBankRows = (phraseBankResult.data ?? []) as { mastery: string }[];
  const reviewDueCount = reviewDueResult.count ?? 0;

  // Total XP and level
  const totalXp = profile?.total_xp ?? 0;
  const currentLevel = resolveLevel(totalXp);
  const currentLevelNumber = currentLevel.levelNumber;
  const nextLevel = LEVELS[currentLevelNumber] ?? null; // LEVELS is 0-indexed, levelNumber is 1-indexed
  const xpToNextLevel = nextLevel ? Math.max(0, nextLevel.minXp - totalXp) : 0;

  // Weekly XP
  const weeklyXp = weeklyXpRows.reduce((sum, row) => sum + (row.points ?? 0), 0);

  // Phrase bank summary
  let weak = 0;
  let learning = 0;
  let mastered = 0;
  for (const row of phraseBankRows) {
    if (row.mastery === 'new') weak++;
    else if (row.mastery === 'learning') learning++;
    else if (row.mastery === 'mastered') mastered++;
  }
  const saved = weak + learning + mastered;

  // Continue lesson
  let continueLesson: DashboardSummary['continueLesson'] = null;
  const continueData = continueResult.data as { id: string; scenario_id: string } | null;
  if (continueData) {
    const scenarioId = continueData.scenario_id;
    // Resolve scenario slug and title from the scenario ID
    const { data: scenario } = await supabase
      .from('scenarios')
      .select('slug, title')
      .eq('id', scenarioId)
      .maybeSingle();

    const scenarioRow = scenario as { slug: string; title: string } | null;
    if (scenarioRow) {
      continueLesson = {
        lessonAttemptId: continueData.id,
        scenarioId: scenarioRow.slug,
        title: scenarioRow.title,
      };
    }
  }

  // Recommendation
  const recommendedLesson = buildRecommendation(
    continueLesson,
    profile?.english_level ?? 'beginner',
    completedResult.data as { scenarios: { slug: string } }[] | null,
  );

  return {
    displayName: profile?.display_name ?? 'Learner',
    streakDays: streak?.current_streak_days ?? 0,
    weeklyXp,
    rankName: currentLevel.name,
    totalXp,
    levelNumber: currentLevelNumber,
    xpToNextLevel,
    reviewDueCount,
    continueLesson,
    recommendedLesson,
    phraseBankSummary: { saved, learning, weak, mastered },
  };
}

// ---------------------------------------------------------------------------
// Week boundaries (UTC Monday–Sunday)
// ---------------------------------------------------------------------------

function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  // Monday = 1, Sunday = 0 → diff from Monday
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - diffToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString();
}

function getWeekEndISO(): string {
  const now = new Date();
  const day = now.getUTCDay();
  // Sunday = 0, so diff to Sunday
  const diffToSunday = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + diffToSunday);
  sunday.setUTCHours(23, 59, 59, 999);
  return sunday.toISOString();
}

// ---------------------------------------------------------------------------
// Recommendation logic (Task 44)
// ---------------------------------------------------------------------------

/**
 * Build a recommended next lesson using simple MVP priority logic:
 *
 *   1. Continue an in-progress lesson if one exists.
 *   2. Recommend an active scenario matching the user's English level.
 *   3. Recommend the first active uncompleted scenario.
 *   4. Return null (all completed / empty state).
 */
function buildRecommendation(
  continueLesson: DashboardSummary['continueLesson'],
  userEnglishLevel: string,
  completedRows: { scenarios: { slug: string } }[] | null,
): DashboardSummary['recommendedLesson'] {
  // Priority 1: continue in-progress lesson
  if (continueLesson) {
    const allScenarios = getAllActiveScenarios();
    const match = allScenarios.find((s) => s.slug === continueLesson.scenarioId);
    return {
      scenarioId: continueLesson.scenarioId,
      title: continueLesson.title,
      packTitle: match?.packTitle ?? '',
      reason: 'Continue where you left off',
    };
  }

  // Build set of completed scenario slugs
  const completedSlugs = new Set(
    (completedRows ?? []).map((r) => r.scenarios?.slug).filter(Boolean) as string[],
  );

  // Get active non-demo scenarios
  const allScenarios = getAllActiveScenarios().filter((s) => !s.isDemo);

  // Map English level to difficulty
  const levelMap: Record<string, string> = {
    beginner: 'beginner',
    intermediate: 'intermediate',
    advanced: 'advanced',
  };
  const targetDifficulty = levelMap[userEnglishLevel] ?? 'beginner';

  // Priority 2: match user level, not yet completed
  const levelMatch = allScenarios.find(
    (s) => s.difficulty === targetDifficulty && !completedSlugs.has(s.slug),
  );
  if (levelMatch) {
    return {
      scenarioId: levelMatch.slug,
      title: levelMatch.title,
      packTitle: levelMatch.packTitle,
      reason: `Matches your ${userEnglishLevel} level`,
    };
  }

  // Priority 3: any active uncompleted scenario
  const anyUncompleted = allScenarios.find(
    (s) => !completedSlugs.has(s.slug),
  );
  if (anyUncompleted) {
    return {
      scenarioId: anyUncompleted.slug,
      title: anyUncompleted.title,
      packTitle: anyUncompleted.packTitle,
      reason: 'Try this lesson next',
    };
  }

  // Priority 4: all completed
  if (allScenarios.length > 0) {
    return {
      scenarioId: allScenarios[0].slug,
      title: allScenarios[0].title,
      packTitle: allScenarios[0].packTitle,
      reason: 'Practice this lesson again',
    };
  }

  // Nothing available
  return null;
}
