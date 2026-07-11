'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SeedScenario, SeedKeyPhrase } from '@/domains/scenarios/seed-schema';
import {
  type DemoProgress,
  createProgress,
  loadProgress,
  saveProgress,
  clearProgress,
  isMidway,
} from '../progress';
import { Button, Badge } from '@/components/ui';
import Modal from '@/components/ui/modal';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DemoProgressClientProps {
  scenario: SeedScenario;
}

// ---------------------------------------------------------------------------
// Phase components (inline for simplicity)
// ---------------------------------------------------------------------------

function PhaseLabel({ phase }: { phase: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-action/10 px-2.5 py-0.5 text-xs font-medium text-action">
      {phase}
    </span>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-action transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-muted">
        {done}/{total}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DemoProgressClient({ scenario }: DemoProgressClientProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<DemoProgress | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const completionModalDismissed = useRef(false);
  const mounted = useRef(false);

  // Hydrate from localStorage on the client after mount.
  useEffect(() => {
    let stored = loadProgress(scenario.slug);
    if (!stored) {
      stored = createProgress(scenario.slug);
      saveProgress(stored);
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgress(stored);
  }, [scenario.slug]);

  // Browser tab-close / refresh warning when progress is midway.
  useEffect(() => {
    if (!progress) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (isMidway(progress)) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [progress]);

  // Show completion signup prompt when demo is completed.
  useEffect(() => {
    if (progress?.completed && !completionModalDismissed.current) {
      setShowCompletionModal(true);
    }
  }, [progress?.completed]);

  // Persist whenever progress changes (after initial hydration).
  const update = useCallback(
    (next: DemoProgress) => {
      setProgress(next);
      saveProgress(next);
    },
    [],
  );

  const handleReset = () => {
    clearProgress(scenario.slug);
    const fresh = createProgress(scenario.slug);
    setProgress(fresh);
    saveProgress(fresh);
    completionModalDismissed.current = false;
    setShowCompletionModal(false);
  };

  // Both server and client render the same loading state initially.
  if (!progress) {
    return (
      <div className="py-16 text-center text-sm text-text-muted">Loading demo…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{scenario.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <PhaseLabel phase={progress.currentPhase} />
            <span>·</span>
            <span>{scenario.tone}</span>
            <span>·</span>
            <span>{scenario.difficulty}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isMidway(progress)) {
                setShowExitModal(true);
              } else {
                router.push('/demo');
              }
            }}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            ← Back to demo
          </button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>

      {/* Phase progress bar */}
      <ProgressBar
        done={
          progress.currentPhase === 'understand'
            ? 0
            : progress.currentPhase === 'practice'
              ? 1
              : progress.currentPhase === 'recall'
                ? 2
                : progress.completed
                  ? 4
                  : 3
        }
        total={4}
      />

      {/* Divider */}
      <hr className="border-border" />

      {/* Phase content */}
      {progress.currentPhase === 'understand' && (
        <UnderstandPhase
          scenario={scenario}
          onContinue={() =>
            update({ ...progress, currentPhase: 'practice', currentChunkOrder: 1 })
          }
        />
      )}

      {progress.currentPhase === 'practice' && (
        <PracticePhase
          scenario={scenario}
          progress={progress}
          onUpdate={update}
        />
      )}

      {progress.currentPhase === 'recall' && (
        <RecallPhase
          scenario={scenario}
          progress={progress}
          onUpdate={update}
        />
      )}

      {progress.currentPhase === 'save' && (
        <SavePhase scenario={scenario} progress={progress} onUpdate={update} />
      )}

      {/* Local-only notice */}
      <div className="rounded-md border border-phrase/30 bg-phrase/5 px-4 py-3 text-center text-xs text-text-muted">
        Demo progress is saved only in this browser. Sign up to save your progress permanently.
      </div>

      {/* Exit warning modal */}
      <Modal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Leave demo?"
        description="Your demo progress is saved only in this browser and may be lost if you leave now."
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            You have made progress in this demo lesson. If you leave now, your progress and
            score will <strong>not</strong> be saved permanently.
          </p>
          <p className="text-sm text-text-muted">
            Sign up to save your progress, compete on leaderboards, and unlock all lessons.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => setShowExitModal(false)}
              className="flex-1"
            >
              Keep practicing
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.push('/demo')}
              className="flex-1"
            >
              Leave anyway
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/signup')}
              className="flex-1"
            >
              Sign up to save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Completion signup prompt */}
      <Modal
        open={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          completionModalDismissed.current = true;
        }}
        title="Demo Complete!"
        description="You've finished the demo lesson — great work!"
      >
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Your demo is complete. To save your progress permanently, earn XP, track your
            streaks, save useful phrases to your Phrase Bank, and compete on the leaderboard,
            create a free account now.
          </p>
          <p className="text-sm text-text-muted">
            Without an account, your results and phrases will be lost when you leave this
            browser.
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCompletionModal(false);
                completionModalDismissed.current = true;
              }}
              className="flex-1"
            >
              Review my result
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Flag that demo progress is ready for conversion after signup.
                try {
                  sessionStorage.setItem(
                    'fluentdraft:pending-demo-convert',
                    scenario.slug,
                  );
                } catch { /* ignore */ }
                router.push('/signup');
              }}
              className="flex-1"
            >
              Create free account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================================
// Phase: Understand
// ============================================================================

function UnderstandPhase({
  scenario,
  onContinue,
}: {
  scenario: SeedScenario;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-primary">Understand the Scenario</h2>

      <div className="rounded-md border border-border bg-surface p-4 text-sm leading-relaxed text-text">
        <p>{scenario.context}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Goal</p>
        <p className="mt-1 text-sm text-text">{scenario.goal}</p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Criteria</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-text-muted">
          {scenario.criteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
          Model Response
        </p>
        <div className="mt-1 whitespace-pre-line rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-text">
          {scenario.modelResponse}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue}>Start Practice</Button>
      </div>
    </div>
  );
}

// ============================================================================
// Phase: Practice (chunks)
// ============================================================================

function PracticePhase({
  scenario,
  progress,
  onUpdate,
}: {
  scenario: SeedScenario;
  progress: DemoProgress;
  onUpdate: (p: DemoProgress) => void;
}) {
  const chunks = [...scenario.chunks].sort((a, b) => a.order - b.order);
  const currentChunk = chunks.find((c) => c.order === progress.currentChunkOrder);
  const totalChunks = chunks.length;

  const goTo = (order: number) => {
    const next = { ...progress, currentChunkOrder: order };
    // Track completion
    if (!next.completedChunkOrders.includes(order)) {
      next.completedChunkOrders = [...next.completedChunkOrders, order];
    }
    onUpdate(next);
  };

  const goNext = () => {
    if (progress.currentChunkOrder < totalChunks) {
      goTo(progress.currentChunkOrder + 1);
    }
  };

  const goPrev = () => {
    if (progress.currentChunkOrder > 1) {
      goTo(progress.currentChunkOrder - 1);
    }
  };

  const allDone = progress.completedChunkOrders.length >= totalChunks;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-primary">Practice Chunks</h2>
      <p className="text-xs text-text-muted">
        Read each chunk of the model response. In a full lesson, you would type each one from
        memory.
      </p>

      <ProgressBar done={progress.completedChunkOrders.length} total={totalChunks} />

      {/* Current chunk */}
      {currentChunk && (
        <div className="rounded-md border border-border bg-surface p-5">
          <p className="text-xs text-text-muted">
            Chunk {progress.currentChunkOrder} of {totalChunks}
          </p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text">
            {currentChunk.text}
          </p>
          {currentChunk.audioText && (
            <p className="mt-2 text-xs italic text-text-muted">
              Audio version: {currentChunk.audioText}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" size="sm" onClick={goPrev} disabled={progress.currentChunkOrder <= 1}>
          Previous
        </Button>
        <span className="text-xs text-text-muted">
          {progress.completedChunkOrders.length}/{totalChunks} viewed
        </span>
        <Button variant="secondary" size="sm" onClick={goNext} disabled={progress.currentChunkOrder >= totalChunks}>
          Next
        </Button>
      </div>

      {allDone && (
        <div className="flex justify-end">
          <Button onClick={() => onUpdate({ ...progress, currentPhase: 'recall' })}>
            Continue to Recall
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Phase: Recall
// ============================================================================

function RecallPhase({
  scenario,
  progress,
  onUpdate,
}: {
  scenario: SeedScenario;
  progress: DemoProgress;
  onUpdate: (p: DemoProgress) => void;
}) {
  const sorted = [...scenario.recallBlanks].sort(
    (a, b) => a.phraseOrder - b.phraseOrder,
  );
  const total = sorted.length;

  const phraseByOrder = new Map<number, SeedKeyPhrase>();
  for (const p of scenario.keyPhrases) {
    phraseByOrder.set(p.order, p);
  }

  const toggleReveal = (phraseOrder: number) => {
    const next = { ...progress };
    if (next.completedPhraseOrders.includes(phraseOrder)) {
      next.completedPhraseOrders = next.completedPhraseOrders.filter((o) => o !== phraseOrder);
    } else {
      next.completedPhraseOrders = [...next.completedPhraseOrders, phraseOrder];
    }
    onUpdate(next);
  };

  const handleComplete = () => {
    onUpdate({ ...progress, currentPhase: 'save', completed: true });
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-primary">Recall Key Phrases</h2>
      <p className="text-xs text-text-muted">
        In a full lesson, you would type the missing phrases from memory. For this demo,
        click each blank to reveal the answer.
      </p>

      <ProgressBar done={progress.completedPhraseOrders.length} total={total} />

      <div className="space-y-3">
        {sorted.map((blank) => {
          const phrase = phraseByOrder.get(blank.phraseOrder);
          const revealed = progress.completedPhraseOrders.includes(blank.phraseOrder);
          return (
            <div
              key={blank.phraseOrder}
              className="rounded-md border border-border bg-surface p-4"
            >
              <p className="whitespace-pre-line text-sm text-text">
                {revealed
                  ? blank.blankedText.replace('___', phrase?.text ?? '___')
                  : blank.blankedText}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleReveal(blank.phraseOrder)}
                  className="text-xs font-medium text-action hover:underline"
                >
                  {revealed ? 'Hide answer' : 'Reveal answer'}
                </button>
                {revealed && phrase && (
                  <span className="text-xs text-text-muted">{phrase.meaning}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleComplete}>Continue to Save</Button>
      </div>
    </div>
  );
}

// ============================================================================
// Phase: Save / Complete
// ============================================================================

function SavePhase({
  scenario,
}: {
  scenario: SeedScenario;
  progress: DemoProgress;
  onUpdate: (p: DemoProgress) => void;
}) {
  const phraseCount = scenario.keyPhrases.length;
  const chunkCount = scenario.chunks.length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
        <Badge variant="success" className="mb-2">
          Demo Complete
        </Badge>
        <h2 className="text-lg font-semibold text-primary">Great work!</h2>
        <p className="mt-2 text-sm text-text-muted">
          You completed the demo lesson &quot;{scenario.title}&quot;.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-lg font-semibold text-action">{chunkCount}</p>
            <p className="text-xs text-text-muted">Chunks practiced</p>
          </div>
          <div className="rounded-md border border-border bg-surface p-3">
            <p className="text-lg font-semibold text-action">{phraseCount}</p>
            <p className="text-xs text-text-muted">Phrases learned</p>
          </div>
        </div>

        <div className="mt-5">
          <a
            href="/signup"
            className="inline-block rounded-md bg-action px-6 py-2.5 text-sm font-medium text-white hover:bg-action/90 transition-colors"
          >
            Sign up to save your progress
          </a>
          <p className="mt-2 text-xs text-text-muted">
            Create a free account to save your score, track streaks, and compete on the
            leaderboard.
          </p>
        </div>
      </div>

      {/* Phrases learned */}
      <div>
        <p className="text-sm font-medium text-primary">Phrases you learned</p>
        <div className="mt-2 space-y-2">
          {scenario.keyPhrases
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((p) => (
              <div
                key={p.order}
                className="rounded-md border border-border bg-surface p-3 text-sm"
              >
                <p className="font-medium text-phrase">{p.text}</p>
                <p className="mt-0.5 text-xs text-text-muted">{p.meaning}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
