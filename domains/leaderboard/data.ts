/**
 * FluentDraft — Leaderboard data access
 *
 * Server-side data fetching for the leaderboard.
 * Queries leaderboard_entries joined with user_profiles for safe public fields.
 *
 * RLS on leaderboard_entries allows authenticated read.
 * Only users with show_on_leaderboard = true are included.
 *
 * Related docs:
 *   - docs/api-contracts.md § Leaderboards
 *   - docs/database-schema.md § leaderboard_entries
 */

import { createServerClient } from '@/lib/supabase/server';
import type { LeaderboardEntry, GetLeaderboardParams } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch leaderboard entries for a given period.
 *
 * Joins leaderboard_entries → user_profiles to get display_name and
 * country_code. Filters by period_type and period_start. Only includes
 * users who have opted into the leaderboard.
 *
 * Returns entries sorted by score descending. Rank is computed as the
 * array index + 1.
 */
export async function getLeaderboard(
  params: GetLeaderboardParams,
): Promise<LeaderboardEntry[]> {
  const supabase = (await createServerClient()) as Client;

  // Query leaderboard_entries joined with user_profiles for safe public fields
  // Using a raw join approach since Supabase nested selects work with PK/FK relationships
  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(`
      user_id,
      period_type,
      period_start,
      period_end,
      country_code,
      score,
      rank,
      user_profiles!inner (
        display_name,
        show_on_leaderboard
      )
    `)
    .eq('period_type', params.period)
    .eq('period_start', params.periodStart)
    .order('score', { ascending: false })
    .limit(params.limit ?? 50);

  if (error) {
    throw new Error(`Failed to fetch leaderboard: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Parse and filter — only show users who opted in
  const entries: LeaderboardEntry[] = [];
  let rank = 0;

  for (const row of data as RawLeaderboardRow[]) {
    const profile = row.user_profiles;
    if (!profile || !profile.show_on_leaderboard) continue;

    rank++;
    entries.push({
      rank,
      userId: row.user_id,
      displayName: profile.display_name ?? 'Anonymous',
      countryCode: row.country_code,
      score: row.score,
      period: row.period_type,
      periodStart: row.period_start,
      periodEnd: row.period_end,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface RawLeaderboardRow {
  user_id: string;
  period_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  country_code: string;
  score: number;
  rank: number | null;
  user_profiles: {
    display_name: string | null;
    show_on_leaderboard: boolean;
  } | null;
}
