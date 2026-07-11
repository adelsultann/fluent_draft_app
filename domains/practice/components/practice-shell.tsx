'use client';

/**
 * FluentDraft — Practice lesson shell
 *
 * The main container for a registered practice lesson. Displays the scenario
 * metadata (title, context, goal, tone, criteria), a phase progress indicator,
 * and phase-specific content panels (Understand → Practice → Recall → Save).
 *
 * Rendered by the practice route page after the scenario is fetched server-side.
 *
 * Related docs:
 *   - docs/api-contracts.md § Get Practice Lesson
 *   - docs/system-design.md § Registered Practice Flow
 *   - docs/style-guide.md § Practice Screen Guidance
 */

import { useState, useCallback } from 'react';
import type { SeedKeyPhrase, SeedChunk, SeedTranslation } from '@/domains/scenarios/seed-schema';
import { isExactMatch } from '@/domains/scoring/engine';
import { Badge, Card, Button, Progress } from '@/components/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The four phases of a practice lesson. */
export type PracticePhase = 'understand' | 'practice' | 'recall' | 'save';

/** Scenario metadata enriched with pack info for breadcrumbs. */
export interface PracticeScenarioMeta {
  scenarioId: string;
  packId: string;
  packTitle: string;
  title: string;
  context: string;
  goal: string;
  tone: string;
  criteria: string[];
  difficulty: string;
  modelResponse: string;
  keyPhrases: SeedKeyPhrase[];
  chunks: SeedChunk[];
  translations: SeedTranslation[];
  chunkCount: number;
  phraseCount: number;
}

export interface PracticeShellProps {
  scenario: PracticeScenarioMeta;
}

// ---------------------------------------------------------------------------
// Phase label lookup
// ---------------------------------------------------------------------------

const PHASE_ORDER: PracticePhase[] = ['understand', 'practice', 'recall', 'save'];

const PHASE_LABELS: Record<PracticePhase, string> = {
  understand: 'Understand',
  practice: 'Practice',
  recall: 'Recall',
  save: 'Save',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** The progress indicator showing the 4 phases with the active one highlighted. */
function PhaseProgress({
  currentPhase,
  onPhaseClick,
}: {
  currentPhase: PracticePhase;
  onPhaseClick?: (phase: PracticePhase) => void;
}) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  return (
    <nav aria-label="Lesson phases" className="mb-6">
      <ol className="flex items-center gap-1">
        {PHASE_ORDER.map((phase, i) => {
          const isActive = i === currentIndex;
          const isPast = i < currentIndex;

          return (
            <li key={phase} className="flex items-center gap-1">
              {/* Connector line */}
              {i > 0 && (
                <span
                  className={`mx-1 h-0.5 w-6 rounded-full ${
                    isPast || isActive ? 'bg-action' : 'bg-border'
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Phase step */}
              <button
                type="button"
                disabled={i > currentIndex}
                onClick={() => onPhaseClick?.(phase)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-action text-white'
                    : isPast
                      ? 'bg-action/10 text-action hover:bg-action/20 cursor-pointer'
                      : 'bg-border text-text-muted'
                }`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${PHASE_LABELS[phase]} phase${isActive ? ' (current)' : ''}`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    isActive
                      ? 'bg-white text-action'
                      : isPast
                        ? 'bg-action text-white'
                        : 'bg-border text-text-muted'
                  }`}
                >
                  {isPast ? '✓' : i + 1}
                </span>
                <span className="hidden sm:inline">{PHASE_LABELS[phase]}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Overall progress bar */}
      <Progress
        value={((currentIndex + 1) / PHASE_ORDER.length) * 100}
        className="mt-3"
      />
    </nav>
  );
}

/** Tone badge with appropriate variant. */
function ToneBadge({ tone }: { tone: string }) {
  const variant = tone === 'professional' || tone === 'formal'
    ? 'default'
    : tone === 'friendly' || tone === 'casual'
      ? 'success'
      : 'warning';

  return <Badge variant={variant as 'default' | 'success' | 'warning'}>{tone}</Badge>;
}

/** Criteria checklist. */
function CriteriaList({ criteria }: { criteria: string[] }) {
  return (
    <ul className="space-y-1.5">
      {criteria.map((c, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
          <svg
            className="mt-0.5 h-4 w-4 flex-shrink-0 text-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{c}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Phase sub-components
// ---------------------------------------------------------------------------

/** The Understand phase — read the scenario, then continue. */
function UnderstandPhase({
  scenario,
  onContinue,
}: {
  scenario: PracticeScenarioMeta;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Model response — the main content to read */}
      <Card>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Model Response
        </h2>
        <div className="whitespace-pre-line rounded-md border border-border bg-background p-5 text-sm leading-relaxed text-text">
          {scenario.modelResponse}
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Read the model response carefully. In the Practice phase, you will type it
          chunk by chunk from memory.
        </p>
      </Card>

      {/* Continue action */}
      <div className="flex justify-end">
        <Button onClick={onContinue} variant="primary" size="lg">
          Continue to Practice
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Practice phase
// ---------------------------------------------------------------------------

/** Find the first available chunk translation in any language. */
function findChunkTranslation(
  translations: SeedTranslation[],
  chunkOrder: number,
): SeedTranslation | undefined {
  return translations.find(
    (t) => t.sourceType === 'chunk' && t.sourceKey === `chunk-${chunkOrder}`,
  );
}

/** The Practice phase — type the model response chunk by chunk. */
function PracticePhase({
  scenario,
  onComplete,
}: {
  scenario: PracticeScenarioMeta;
  onComplete: () => void;
}) {
  const sortedChunks = [...scenario.chunks].sort((a, b) => a.order - b.order);
  const totalChunks = sortedChunks.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedDrafts, setTypedDrafts] = useState<Record<number, string>>({});
  const [revealedTranslations, setRevealedTranslations] = useState<Set<number>>(
    () => new Set(),
  );
  // Exact checking state
  const [checkedChunks, setCheckedChunks] = useState<Set<number>>(() => new Set());
  const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, 'idle' | 'correct' | 'retry'>>({});

  const currentChunk = sortedChunks[currentIndex];
  if (!currentChunk) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalChunks - 1;

  const currentTyped = typedDrafts[currentChunk.order] ?? '';
  const chunkTranslation = findChunkTranslation(
    scenario.translations,
    currentChunk.order,
  );
  const isTranslationRevealed = revealedTranslations.has(currentChunk.order);

  // Checking
  const isChecked = checkedChunks.has(currentChunk.order);
  const currentFeedback = feedback[currentChunk.order] ?? 'idle';
  const currentAttempts = attemptCounts[currentChunk.order] ?? 0;
  const canAdvance = isChecked;

  const handleCheck = () => {
    const trimmed = currentTyped.trim();
    if (!trimmed) return; // ignore empty checks

    const attemptNum = currentAttempts + 1;
    setAttemptCounts((prev) => ({ ...prev, [currentChunk.order]: attemptNum }));

    if (isExactMatch(trimmed, currentChunk.text)) {
      setCheckedChunks((prev) => {
        const next = new Set(prev);
        next.add(currentChunk.order);
        return next;
      });
      setFeedback((prev) => ({ ...prev, [currentChunk.order]: 'correct' }));
    } else {
      setFeedback((prev) => ({ ...prev, [currentChunk.order]: 'retry' }));
    }
  };

  // Chunk navigation
  const goNext = () => {
    if (!isLast) setCurrentIndex((i) => i + 1);
  };
  const goPrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  // Typing
  const updateDraft = (value: string) => {
    setTypedDrafts((prev) => ({ ...prev, [currentChunk.order]: value }));
  };

  // Translation toggle
  const toggleTranslation = () => {
    setRevealedTranslations((prev) => {
      const next = new Set(prev);
      if (next.has(currentChunk.order)) {
        next.delete(currentChunk.order);
      } else {
        next.add(currentChunk.order);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">
          Chunk {currentIndex + 1} of {totalChunks}
        </span>
        <span className="text-xs text-text-muted">
          {currentTyped.length} characters typed
        </span>
      </div>

      <Progress
        value={((currentIndex + 1) / totalChunks) * 100}
        className="mt-1"
      />

      {/* Current chunk — the target text */}
      <Card>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Type this chunk
        </h2>
        <div className="whitespace-pre-line rounded-md border border-border bg-background p-4 text-sm leading-relaxed text-text">
          {currentChunk.text}
        </div>

        {/* Audio-friendly variant, if available */}
        {currentChunk.audioText && (
          <p className="mt-2 text-xs italic text-text-muted">
            Listen-friendly: {currentChunk.audioText}
          </p>
        )}
      </Card>

      {/* Listen & pronunciation controls (placeholders for Tasks 33–34) */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled
          title="Audio playback will be available in a future update"
          className="flex items-center gap-1.5"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
            />
          </svg>
          Listen
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled
          title="Pronunciation practice will be available in a future update"
          className="flex items-center gap-1.5"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
          Pronounce
        </Button>
      </div>

      {/* Translation reveal */}
      {chunkTranslation && (
        <div>
          <button
            type="button"
            onClick={toggleTranslation}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-action hover:underline"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.786.15 2.666.269m-2.666-.269A48.63 48.63 0 0115 5.621"
              />
            </svg>
            {isTranslationRevealed ? 'Hide translation' : 'Reveal translation'}
          </button>
          {isTranslationRevealed && (
            <div className="mt-2 rounded-md border border-phrase/30 bg-phrase/5 p-3">
              <p className="text-xs font-medium text-phrase">
                Translation
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text">
                {chunkTranslation.text}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Language: {chunkTranslation.languageCode.toUpperCase()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Typing area */}
      <div>
        <label
          htmlFor="practice-typing-area"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          Your answer
        </label>
        <textarea
          id="practice-typing-area"
          rows={4}
          value={currentTyped}
          onChange={(e) => {
            updateDraft(e.target.value);
            // Clear per-chunk feedback when user edits
            if (currentFeedback !== 'idle') {
              setFeedback((prev) => ({ ...prev, [currentChunk.order]: 'idle' }));
            }
          }}
          placeholder="Type the chunk exactly as shown above…"
          disabled={isChecked}
          className={`w-full rounded-md border px-4 py-3 text-sm placeholder:text-text-muted/60 focus:outline-none focus:ring-1 ${
            isChecked
              ? 'border-success/40 bg-success/5 text-text'
              : currentFeedback === 'retry'
                ? 'border-error/40 bg-error/5 text-text focus:border-action focus:ring-action'
                : 'border-border bg-surface text-text focus:border-action focus:ring-action'
          }`}
        />

        {/* Helper text */}
        <p className="mt-2 text-xs text-text-muted">
          <span className="font-medium text-phrase">Exact match required:</span>{' '}
          Capitalization, punctuation, and spacing must match exactly.
          {!isChecked && ' Type the chunk and click Check Answer.'}
        </p>

        {/* Check button */}
        {!isChecked && (
          <div className="mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleCheck}
              disabled={currentTyped.trim().length === 0}
            >
              Check Answer
            </Button>
          </div>
        )}

        {/* Feedback */}
        {currentFeedback === 'correct' && (
          <div className="mt-3 rounded-md border border-success/30 bg-success/10 px-4 py-3">
            <p className="text-sm font-medium text-success">
              ✓ Correct!
              {currentAttempts === 1
                ? ' (first try)'
                : ` (after ${currentAttempts} ${currentAttempts === 1 ? 'attempt' : 'attempts'})`}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Great work — this chunk is complete. You can now move to the next one.
            </p>
          </div>
        )}

        {currentFeedback === 'retry' && (
          <div className="mt-3 rounded-md border border-error/30 bg-error/10 px-4 py-3">
            <p className="text-sm font-medium text-error">
              ✗ Not quite — try again
              {currentAttempts > 1 && (
                <span className="font-normal"> (attempt {currentAttempts})</span>
              )}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Your answer does not match the expected text exactly.
              Check your capitalization, punctuation, and spacing.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={goPrev}
          disabled={isFirst}
        >
          ← Previous
        </Button>

        <span className="text-xs text-text-muted">
          {currentIndex + 1} / {totalChunks}
        </span>

        {isLast ? (
          <Button
            variant="primary"
            size="sm"
            onClick={onComplete}
            disabled={!canAdvance}
            title={!canAdvance ? 'Check your answer before continuing' : undefined}
          >
            Continue to Recall →
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={goNext}
            disabled={!canAdvance}
            title={!canAdvance ? 'Check your answer before continuing' : undefined}
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}

/** Placeholder for phases not yet implemented (Tasks 30–31). */
function PhasePlaceholder({
  currentPhase,
  onBack,
}: {
  currentPhase: PracticePhase;
  onBack: () => void;
}) {
  return (
    <Card className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <div className="max-w-md space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-action/10">
          <svg
            className="h-6 w-6 text-action"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-primary">
          {PHASE_LABELS[currentPhase]} Phase
        </h3>
        <p className="text-sm text-text-muted">
          The {PHASE_LABELS[currentPhase].toLowerCase()} phase will be fully implemented
          in a future task.
        </p>
        <Button variant="secondary" size="lg" onClick={onBack} className="mt-2">
          ← Back to Practice
        </Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PracticeShell({ scenario }: PracticeShellProps) {
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('understand');

  const goToPhase = useCallback(
    (phase: PracticePhase) => {
      const targetIndex = PHASE_ORDER.indexOf(phase);
      const currentIndex = PHASE_ORDER.indexOf(currentPhase);
      // Allow navigating to any phase the user has already reached
      // (current phase) or past phases. Future phases are not accessible.
      if (targetIndex <= currentIndex) {
        setCurrentPhase(phase);
      }
    },
    [currentPhase],
  );

  const advancePhase = useCallback(() => {
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    if (currentIndex < PHASE_ORDER.length - 1) {
      setCurrentPhase(PHASE_ORDER[currentIndex + 1]);
    }
  }, [currentPhase]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <p className="text-xs text-text-muted">
          <a href="/packs" className="hover:text-action transition-colors">
            Packs
          </a>
          <span className="mx-1.5">/</span>
          <a
            href={`/packs/${scenario.packId}`}
            className="hover:text-action transition-colors"
          >
            {scenario.packTitle}
          </a>
          <span className="mx-1.5">/</span>
          <span className="text-text">{scenario.title}</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-primary">{scenario.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ToneBadge tone={scenario.tone} />
          <Badge variant="muted" className="capitalize">
            {scenario.difficulty}
          </Badge>
          <span className="text-xs text-text-muted">
            {scenario.chunkCount} chunks · {scenario.phraseCount} phrases
          </span>
        </div>
      </div>

      {/* Phase progress */}
      <PhaseProgress currentPhase={currentPhase} onPhaseClick={goToPhase} />

      {/* Two-column layout: scenario info + action panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: scenario info */}
        <div className="space-y-5 lg:col-span-1">
          {/* Context */}
          <Card>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Context
            </h2>
            <p className="text-sm leading-relaxed text-text">{scenario.context}</p>
          </Card>

          {/* Goal */}
          <Card>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Goal
            </h2>
            <p className="text-sm leading-relaxed text-text">{scenario.goal}</p>
          </Card>

          {/* Criteria */}
          <Card>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              Criteria
            </h2>
            <CriteriaList criteria={scenario.criteria} />
          </Card>

          {/* Key phrases preview */}
          {scenario.keyPhrases.length > 0 && (
            <Card>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                Key Phrases
              </h2>
              <div className="space-y-2">
                {scenario.keyPhrases
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((phrase) => (
                    <div
                      key={phrase.order}
                      className="rounded-md border border-phrase/20 bg-phrase/5 px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-phrase">{phrase.text}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{phrase.meaning}</p>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: main action panel — phase-dependent */}
        <div className="lg:col-span-2">
          {currentPhase === 'understand' && (
            <UnderstandPhase
              scenario={scenario}
              onContinue={advancePhase}
            />
          )}

          {currentPhase === 'practice' && (
            <PracticePhase
              scenario={scenario}
              onComplete={advancePhase}
            />
          )}

          {(currentPhase === 'recall' || currentPhase === 'save') && (
            <PhasePlaceholder
              currentPhase={currentPhase}
              onBack={() => setCurrentPhase('practice')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
