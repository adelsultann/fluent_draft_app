'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, Badge, Button } from '@/components/ui';
import type { PhraseBankItem, MasteryStatus } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PhraseListProps {
  items: PhraseBankItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MASTERY_LABELS: Record<MasteryStatus, string> = {
  new: 'New',
  learning: 'Learning',
  mastered: 'Mastered',
};

const MASTERY_VARIANTS: Record<MasteryStatus, 'muted' | 'warning' | 'success'> = {
  new: 'muted',
  learning: 'warning',
  mastered: 'success',
};

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-5xl text-text-muted/40" aria-hidden="true">
        &#9998;
      </div>
      <h2 className="text-lg font-semibold text-text">Your Phrase Bank is empty</h2>
      <p className="mt-2 max-w-sm text-sm text-text-muted">
        Complete lessons and save useful phrases to build your personal
        collection. Saved phrases will appear here for review and practice.
      </p>
      <Link
        href="/packs"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-action px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-action/90"
      >
        Browse lessons
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// No selection placeholder
// ---------------------------------------------------------------------------

function NoSelectionPlaceholder() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-background/50 p-8">
      <p className="text-sm text-text-muted">
        Select a phrase to see details and practice options.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Phrase detail panel
// ---------------------------------------------------------------------------

interface PhraseDetailProps {
  item: PhraseBankItem;
  onClose: () => void;
}

function PhraseDetail({ item, onClose }: PhraseDetailProps) {
  return (
    <Card className="h-fit">
      {/* Header with close (mobile) */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <Badge variant={MASTERY_VARIANTS[item.mastery]}>
          {MASTERY_LABELS[item.mastery]}
        </Badge>
        <button
          onClick={onClose}
          className="rounded p-1 text-text-muted transition-colors hover:bg-background hover:text-text sm:hidden"
          aria-label="Close detail panel"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Phrase text */}
      <p className="text-lg font-semibold text-text leading-relaxed">
        &ldquo;{item.text}&rdquo;
      </p>

      {/* Meaning */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Meaning
        </h3>
        <p className="mt-1 text-sm text-text">
          {item.meaning || <span className="italic text-text-muted">No description available.</span>}
        </p>
      </div>

      {/* Example */}
      {item.example && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Example
          </h3>
          <p className="mt-1 text-sm italic text-text">
            {item.example}
          </p>
        </div>
      )}

      {/* Common mistake */}
      {item.commonMistake && (
        <div className="mt-4 rounded-md border border-phrase/30 bg-phrase/5 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-phrase">
            Common mistake
          </h3>
          <p className="mt-1 text-sm text-text">
            {item.commonMistake}
          </p>
        </div>
      )}

      {/* Source scenario */}
      <div className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Source
        </h3>
        <p className="mt-1 text-sm">
          {item.scenarioSlug ? (
            <Link
              href={`/practice/${item.scenarioSlug}`}
              className="font-medium text-action hover:underline"
            >
              {item.scenarioTitle}
            </Link>
          ) : (
            <span className="text-text">{item.scenarioTitle}</span>
          )}
        </p>
      </div>

      {/* Practice action buttons (placeholders) */}
      <div className="mt-6 space-y-2 border-t border-border pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Practice
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" disabled title="Coming soon">
            Listen
          </Button>
          <Button variant="secondary" size="sm" disabled title="Coming soon">
            Practice Typing
          </Button>
          <Button variant="secondary" size="sm" disabled title="Coming soon">
            Review
          </Button>
        </div>
        <p className="text-xs text-text-muted">
          Practice actions will be available in a future update.
        </p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PhraseList({ items }: PhraseListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedItem = selectedId
    ? items.find((item) => item.id === selectedId) ?? null
    : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedId(null);
  }, []);

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {items.length} saved phrase{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="gap-6 lg:grid lg:grid-cols-[1fr_380px]">
        {/* Phrase list */}
        <div>
          <ul className="space-y-2" role="list">
            {items.map((item) => {
              const isSelected = item.id === selectedId;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item.id)}
                    className={`w-full rounded-lg border p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action ${
                      isSelected
                        ? 'border-action bg-action/5 ring-1 ring-action'
                        : 'border-border bg-surface hover:border-text-muted/40 hover:bg-background/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-text leading-relaxed break-words">
                          &ldquo;{item.text}&rdquo;
                        </p>
                        {item.meaning && (
                          <p className="mt-1 text-xs text-text-muted line-clamp-1">
                            {item.meaning}
                          </p>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant={MASTERY_VARIANTS[item.mastery]}>
                          {MASTERY_LABELS[item.mastery]}
                        </Badge>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Detail panel */}
        <div className="mt-6 lg:mt-0">
          {selectedItem ? (
            <PhraseDetail item={selectedItem} onClose={handleCloseDetail} />
          ) : (
            <NoSelectionPlaceholder />
          )}
        </div>
      </div>
    </div>
  );
}
