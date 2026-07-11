import { Card } from '@/components/ui';
import type { LeaderboardEntry } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render the rank cell with special styling for top 3. */
function RankCell({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-phrase/20 text-sm font-bold text-phrase">
        1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-text-muted/15 text-sm font-bold text-text-muted">
        2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-phrase/10 text-sm font-bold text-phrase/70">
        3
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-text-muted">{rank}</span>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ periodLabel }: { periodLabel: string }) {
  return (
    <Card className="py-12 text-center">
      <p className="text-lg font-semibold text-text">No rankings yet</p>
      <p className="mt-2 text-sm text-text-muted">
        {periodLabel}&apos;s leaderboard is empty. Complete lessons and earn
        XP to appear here.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LeaderboardView({
  entries,
  periodLabel,
  periodStart,
  periodEnd,
}: LeaderboardViewProps) {
  if (entries.length === 0) {
    return <EmptyState periodLabel={periodLabel} />;
  }

  return (
    <div>
      {/* Period info */}
      <p className="mb-4 text-xs text-text-muted">
        {periodLabel}: {periodStart} &ndash; {periodEnd}
      </p>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border bg-background/50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <span className="w-8 text-center">#</span>
          <span className="flex-1">Player</span>
          <span className="w-12 text-center">Country</span>
          <span className="w-20 text-right">Score</span>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-border" role="list">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-background/40"
            >
              {/* Rank */}
              <span className="w-8 text-center">
                <RankCell rank={entry.rank} />
              </span>

              {/* Display name */}
              <span className="flex-1 truncate text-sm font-medium text-text">
                {entry.displayName}
              </span>

              {/* Country */}
              <span className="w-12 text-center text-xs font-medium uppercase text-text-muted">
                {entry.countryCode}
              </span>

              {/* Score */}
              <span className="w-20 text-right text-sm font-semibold text-primary">
                {entry.score.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-xs text-text-muted text-center">
        {entries.length} player{entries.length !== 1 ? 's' : ''} ranked
      </p>
    </div>
  );
}
