/**
 * FluentDraft — Leaderboard page
 *
 * Displays the weekly leaderboard with rank, display name,
 * country code, and score. Only safe public fields are shown.
 *
 * Auth is enforced by the parent (registered) layout and the
 * RLS policy on leaderboard_entries (authenticated read-only).
 *
 * Related docs:
 *   - docs/tasks-and-acceptance-criteria.md § Step 45
 *   - docs/api-contracts.md § Leaderboards
 */

import { Suspense } from 'react';
import { getLeaderboard, getWeekStartDate, getWeekEndDate } from '@/domains/leaderboard';
import LeaderboardView from '@/domains/leaderboard/components/leaderboard-view';
import type { LeaderboardEntry } from '@/domains/leaderboard';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm"
        >
          <div className="h-6 w-8 rounded bg-border" />
          <div className="h-4 w-32 rounded bg-border" />
          <div className="h-4 w-12 rounded bg-border" />
          <div className="ml-auto h-5 w-16 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard content (data-fetching server component)
// ---------------------------------------------------------------------------

async function LeaderboardContent() {
  let entries: LeaderboardEntry[];

  try {
    const weekStart = getWeekStartDate();
    const weekEnd = getWeekEndDate();

    entries = await getLeaderboard({
      period: 'weekly',
      periodStart: weekStart,
      periodEnd: weekEnd,
    });
  } catch (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-error">
          Unable to load the leaderboard. Please try again later.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  return (
    <LeaderboardView
      entries={entries}
      periodLabel="This Week"
      periodStart={getWeekStartDate()}
      periodEnd={getWeekEndDate()}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-3xl py-8">
      <h1 className="text-2xl font-semibold text-primary">Leaderboard</h1>
      <p className="mt-1 text-sm text-text-muted">
        Weekly rankings based on practice and review activity.
      </p>

      <div className="mt-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <LeaderboardContent />
        </Suspense>
      </div>
    </div>
  );
}
