import Link from 'next/link';
import { Card, Badge, Progress } from '@/components/ui';
import type { DashboardSummary } from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DashboardSummaryProps {
  data: DashboardSummary;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subtitle,
  href,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <Card className="flex h-full flex-col justify-between">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{value}</p>
      {subtitle && (
        <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
      )}
    </Card>
  );

  if (href) {
    return <Link href={href} className="block transition-opacity hover:opacity-80">{content}</Link>;
  }

  return content;
}

function PhraseBankSummaryCard({
  saved,
  learning,
  weak,
  mastered,
}: DashboardSummary['phraseBankSummary']) {
  const categories = [
    { label: 'New', count: weak, color: 'bg-border' },
    { label: 'Learning', count: learning, color: 'bg-phrase' },
    { label: 'Mastered', count: mastered, color: 'bg-success' },
  ];

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Phrase Bank
      </p>
      <p className="mt-2 text-2xl font-bold text-primary">{saved}</p>
      <p className="text-xs text-text-muted">phrases saved</p>

      {saved > 0 && (
        <div className="mt-3 space-y-1.5">
          {categories.map((cat) => (
            <div key={cat.label} className="flex items-center gap-2 text-xs">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${cat.color}`} />
              <span className="flex-1 text-text-muted">{cat.label}</span>
              <span className="font-medium text-text">{cat.count}</span>
            </div>
          ))}
        </div>
      )}

      {saved === 0 && (
        <p className="mt-2 text-xs text-text-muted">
          Complete lessons and save phrases to build your collection.
        </p>
      )}
    </Card>
  );
}

function ContinueLessonCard({
  lesson,
}: {
  lesson: DashboardSummary['continueLesson'];
}) {
  if (!lesson) return null;

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Continue Lesson
      </p>
      <p className="mt-1 text-sm font-medium text-text line-clamp-1">
        {lesson.title}
      </p>
      <Link
        href={`/practice/${lesson.scenarioId}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-action hover:underline"
      >
        Resume
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </Card>
  );
}

function NextRecommendationCard({
  lesson,
}: {
  lesson: DashboardSummary['recommendedLesson'];
}) {
  if (!lesson) {
    return (
      <Card className="border-dashed bg-background/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Recommended
        </p>
        <p className="mt-2 text-sm text-text-muted">
          No lessons available right now.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Recommended
      </p>
      <p className="mt-1 text-sm font-medium text-text line-clamp-1">
        {lesson.title}
      </p>
      <p className="mt-0.5 text-xs text-text-muted">{lesson.packTitle}</p>
      <p className="mt-2 text-xs italic text-text-muted">{lesson.reason}</p>
      <Link
        href={`/practice/${lesson.scenarioId}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-action hover:underline"
      >
        Start lesson
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </Card>
  );
}

function LevelProgressCard({
  rankName,
  levelNumber,
  totalXp,
  xpToNextLevel,
}: {
  rankName: string;
  levelNumber: number;
  totalXp: number;
  xpToNextLevel: number;
}) {
  const isMaxLevel = xpToNextLevel === 0;

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Rank
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-primary">{rankName}</span>
        <Badge variant="muted">Lv.{levelNumber}</Badge>
      </div>
      {!isMaxLevel && (
        <div className="mt-3">
          <Progress
            value={totalXp}
            max={totalXp + xpToNextLevel}
            label="XP progress"
          />
          <p className="mt-1 text-xs text-text-muted">
            {xpToNextLevel} XP to next level
          </p>
        </div>
      )}
      {isMaxLevel && (
        <p className="mt-2 text-xs text-success font-medium">Max level reached</p>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DashboardSummaryView({ data }: DashboardSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-primary">
          Welcome back, {data.displayName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Here&apos;s your practice summary.
        </p>
      </div>

      {/* Top stat cards — responsive grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Streak"
          value={`${data.streakDays} day${data.streakDays !== 1 ? 's' : ''}`}
          subtitle={data.streakDays > 0 ? 'Keep it going!' : 'Start practicing today'}
        />
        <StatCard
          label="Weekly XP"
          value={data.weeklyXp.toLocaleString()}
          subtitle={`Total: ${data.totalXp.toLocaleString()} XP`}
        />
        <StatCard
          label="Reviews Due"
          value={data.reviewDueCount}
          subtitle={
            data.reviewDueCount > 0
              ? 'Phrases ready for practice'
              : 'All caught up!'
          }
          href={data.reviewDueCount > 0 ? '/phrase-bank' : undefined}
        />
        <PhraseBankSummaryCard {...data.phraseBankSummary} />
      </div>

      {/* Secondary row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LevelProgressCard
          rankName={data.rankName}
          levelNumber={data.levelNumber}
          totalXp={data.totalXp}
          xpToNextLevel={data.xpToNextLevel}
        />
        {data.continueLesson ? (
          <ContinueLessonCard lesson={data.continueLesson} />
        ) : (
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Continue Lesson
            </p>
            <p className="mt-2 text-sm text-text-muted">
              No lessons in progress. Start a new one!
            </p>
            <Link
              href="/packs"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-action hover:underline"
            >
              Browse packs
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </Card>
        )}
        <NextRecommendationCard lesson={data.recommendedLesson} />
      </div>
    </div>
  );
}
