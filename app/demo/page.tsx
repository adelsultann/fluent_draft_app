import AppShell from '@/components/layout/app-shell';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getDemoLesson } from '@/domains/demo/get-demo-lesson';
import { Badge } from '@/components/ui';

export default async function DemoPage() {
  const user = await getCurrentUser();
  const lesson = getDemoLesson();

  if (!lesson) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-primary">Demo not available</p>
          <p className="mt-2 text-sm text-text-muted">
            The demo lesson content could not be loaded. Please try again later.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      headerRight={<AuthStatus isSignedIn={!!user} email={user?.email} />}
    >
      <div className="mx-auto max-w-3xl space-y-8 py-6">
        {/* Hero */}
        <div className="text-center">
          <Badge variant="warning" className="mb-3">
            Free Demo
          </Badge>
          <h1 className="text-2xl font-semibold text-primary">{lesson.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">{lesson.context}</p>
        </div>

        {/* Goal + Tone + Difficulty */}
        <div className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Goal" value={lesson.goal} />
          <InfoCard label="Tone" value={lesson.tone} />
          <InfoCard label="Difficulty" value={lesson.difficulty} />
        </div>

        {/* Criteria */}
        <Section title="What you'll practice">
          <ul className="list-inside list-disc space-y-1 text-sm text-text-muted">
            {lesson.criteria.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>

        {/* Model Response */}
        <Section title="Model Response">
          <div className="whitespace-pre-line rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-text">
            {lesson.modelResponse}
          </div>
        </Section>

        {/* Chunks */}
        <Section title="Practice Chunks">
          <p className="mb-3 text-xs text-text-muted">
            You will type these chunks one at a time during the guided practice phase.
          </p>
          <ol className="space-y-2">
            {lesson.chunks
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((chunk) => (
                <li
                  key={chunk.order}
                  className="flex gap-3 rounded-md border border-border bg-surface p-3 text-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
                    {chunk.order}
                  </span>
                  <span className="text-text">{chunk.text}</span>
                </li>
              ))}
          </ol>
        </Section>

        {/* Key Phrases */}
        <Section title="Key Phrases">
          <p className="mb-3 text-xs text-text-muted">
            These useful phrases are extracted from the model response. You will practice
            pronouncing, typing, and recalling them.
          </p>
          <div className="space-y-3">
            {lesson.keyPhrases
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((phrase) => (
                <div
                  key={phrase.order}
                  className="rounded-md border border-border bg-surface p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-phrase">{phrase.text}</p>
                    <span className="flex-shrink-0 text-xs text-text-muted">
                      #{phrase.order}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text">{phrase.meaning}</p>
                  <p className="mt-1 text-xs text-text-muted">
                    <span className="font-medium">Example:</span> {phrase.example}
                  </p>
                  {phrase.commonMistake && (
                    <p className="mt-1 text-xs text-error">
                      <span className="font-medium">Watch out:</span> {phrase.commonMistake}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Section>

        {/* CTA */}
        <div className="rounded-lg border border-border bg-surface p-6 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary">Ready to try it yourself?</p>
          <p className="mt-2 text-sm text-text-muted">
            This is a free demo. Sign up to save your progress, earn XP, and compete on
            the leaderboard.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <a
              href="/demo/start"
              className="rounded-md bg-action px-6 py-2.5 text-sm font-medium text-white hover:bg-action/90 transition-colors"
            >
              Start demo lesson
            </a>
            {!user && (
              <a
                href="/signup"
                className="rounded-md border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text hover:bg-background transition-colors"
              >
                Sign up
              </a>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ------------------------------------------------------------------ */
/* Internal helpers                                                   */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-primary">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-text">{value}</p>
    </div>
  );
}
