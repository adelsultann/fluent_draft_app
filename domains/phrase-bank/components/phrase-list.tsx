import Link from 'next/link';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
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
// Component
// ---------------------------------------------------------------------------

export default function PhraseList({ items }: PhraseListProps) {
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

      <ul className="space-y-3" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              {/* Phrase text + meaning */}
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-text leading-relaxed break-words">
                  &ldquo;{item.text}&rdquo;
                </p>
                {item.meaning && (
                  <p className="mt-1 text-sm text-text-muted">
                    {item.meaning}
                  </p>
                )}
                <p className="mt-2 text-xs text-text-muted">
                  From{' '}
                  {item.scenarioSlug ? (
                    <Link
                      href={`/practice/${item.scenarioSlug}`}
                      className="font-medium text-action hover:underline"
                    >
                      {item.scenarioTitle}
                    </Link>
                  ) : (
                    <span>{item.scenarioTitle}</span>
                  )}
                </p>
              </div>

              {/* Mastery badge */}
              <div className="flex-shrink-0">
                <Badge variant={MASTERY_VARIANTS[item.mastery]}>
                  {MASTERY_LABELS[item.mastery]}
                </Badge>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
