/**
 * FluentDraft — Leaderboard page
 *
 * Displays the weekly or monthly leaderboard with rank, display name,
 * country code, and score. Only safe public fields are shown.
 *
 * Period is controlled via the `period` URL search param:
 *   /leaderboard          → weekly (default)
 *   /leaderboard?period=monthly → monthly
 *
 * Auth is enforced by the parent (registered) layout and the
 * RLS policy on leaderboard_entries (authenticated read-only).
 *
 * Related docs:
 *   - docs/tasks-and-acceptance-criteria.md § Steps 45–46
 *   - docs/api-contracts.md § Leaderboards
 */

import { Suspense } from 'react';
import Link from 'next/link';
import {
  getLeaderboard,
  getWeekStartDate,
  getWeekEndDate,
  getMonthStartDate,
  getMonthEndDate,
} from '@/domains/leaderboard';
import LeaderboardView from '@/domains/leaderboard/components/leaderboard-view';
import type { LeaderboardEntry, LeaderboardPeriod } from '@/domains/leaderboard';

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
// Period switch (rendered as links for server-side navigation)
// ---------------------------------------------------------------------------

function PeriodSwitch({ current }: { current: LeaderboardPeriod }) {
  const tabs: { label: string; value: LeaderboardPeriod }[] = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  return (
    <nav className="flex gap-1 rounded-lg bg-background p-1" role="tablist" aria-label="Leaderboard period">
      {tabs.map((tab) => {
        const isActive = tab.value === current;
        const href = tab.value === 'weekly' ? '/leaderboard' : '/leaderboard?period=monthly';

        return (
          <Link
            key={tab.value}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action ${
              isActive
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Leaderboard content (data-fetching server component)
// ---------------------------------------------------------------------------

interface LeaderboardContentProps {
  period: LeaderboardPeriod;
}

async function LeaderboardContent({ period }: LeaderboardContentProps) {
  let entries: LeaderboardEntry[];

  try {
    const isMonthly = period === 'monthly';
    const periodStart = isMonthly ? getMonthStartDate() : getWeekStartDate();
    const periodEnd = isMonthly ? getMonthEndDate() : getWeekEndDate();

    entries = await getLeaderboard({
      period,
      periodStart,
      periodEnd,
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

  const isMonthly = period === 'monthly';
  const periodLabel = isMonthly ? 'This Month' : 'This Week';
  const periodStart = isMonthly ? getMonthStartDate() : getWeekStartDate();
  const periodEnd = isMonthly ? getMonthEndDate() : getWeekEndDate();

  return (
    <LeaderboardView
      entries={entries}
      periodLabel={periodLabel}
      periodStart={periodStart}
      periodEnd={periodEnd}
    />
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const params = await searchParams;
  const period: LeaderboardPeriod = params.period === 'monthly' ? 'monthly' : 'weekly';

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Leaderboard</h1>
          <p className="mt-1 text-sm text-text-muted">
            Rankings based on practice and review activity.
          </p>
        </div>
        <PeriodSwitch current={period} />
      </div>

      <div className="mt-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <LeaderboardContent period={period} />
        </Suspense>
      </div>
    </div>
  );
}
