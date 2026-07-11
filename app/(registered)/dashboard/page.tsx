/**
 * FluentDraft — Dashboard page
 *
 * Displays the authenticated user's practice summary, streak,
 * weekly XP, rank, review due count, continue lesson,
 * recommendation, and phrase bank summary.
 *
 * Auth is enforced by the parent (registered) layout.
 *
 * Related docs:
 *   - docs/tasks-and-acceptance-criteria.md § Step 43
 *   - docs/api-contracts.md § Dashboard summary output
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import DemoConversionGate from '@/domains/demo/components/demo-conversion-gate';
import { getDashboardSummary, DashboardSummaryView } from '@/domains/dashboard';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-64 rounded bg-border" />
        <div className="mt-2 h-4 w-40 rounded bg-border" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <div className="h-3 w-16 rounded bg-border" />
            <div className="mt-2 h-7 w-20 rounded bg-border" />
            <div className="mt-1 h-3 w-24 rounded bg-border" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-surface p-6 shadow-sm">
            <div className="h-3 w-16 rounded bg-border" />
            <div className="mt-2 h-5 w-32 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard content (data-fetching server component)
// ---------------------------------------------------------------------------

async function DashboardContent() {
  let data;
  try {
    data = await getDashboardSummary();
  } catch (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-error">
          Unable to load your dashboard. Please try again later.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  if (!data) {
    redirect('/login');
  }

  return <DashboardSummaryView data={data} />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  return (
    <div className="py-6">
      {/* Demo conversion gate — runs once after signup if demo progress exists */}
      <div className="mb-8">
        <DemoConversionGate />
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
