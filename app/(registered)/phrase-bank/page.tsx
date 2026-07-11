/**
 * FluentDraft — Phrase Bank page
 *
 * Displays the current user's saved phrases with text, meaning,
 * source scenario, and mastery status.
 *
 * Auth is enforced by the parent (registered) layout.
 *
 * Related docs:
 *   - docs/tasks-and-acceptance-criteria.md § Step 40
 *   - docs/api-contracts.md § Phrase Bank
 */

import { Suspense } from 'react';
import { getUserPhrases, PhraseList } from '@/domains/phrase-bank';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-border bg-surface p-6 shadow-sm"
        >
          <div className="h-5 w-3/4 rounded bg-border" />
          <div className="mt-2 h-4 w-1/2 rounded bg-border" />
          <div className="mt-3 h-3 w-1/4 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phrase bank content (data-fetching server component)
// ---------------------------------------------------------------------------

async function PhraseBankContent() {
  let phrases;
  try {
    phrases = await getUserPhrases();
  } catch (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-error">
          Unable to load your phrase bank. Please try again later.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          {error instanceof Error ? error.message : 'An unexpected error occurred.'}
        </p>
      </div>
    );
  }

  return <PhraseList items={phrases} />;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PhraseBankPage() {
  return (
    <div className="py-6">
      <h1 className="text-2xl font-semibold text-primary">Phrase Bank</h1>
      <p className="mt-1 text-sm text-text-muted">
        Your saved phrases and expressions for review and practice.
      </p>

      <div className="mt-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <PhraseBankContent />
        </Suspense>
      </div>
    </div>
  );
}
