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

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SeedKeyPhrase, SeedChunk, SeedTranslation, SeedRecallBlank } from '@/domains/scenarios/seed-schema';
import { isExactMatch } from '@/domains/scoring/engine';
import { Badge, Card, Button, Progress } from '@/components/ui';
import { completeLesson } from '@/domains/practice/actions';
import { useSpeechSynthesis } from '@/domains/pronunciation/use-speech-synthesis';
import type {
  CompleteLessonInput,
  CompleteLessonResult,
  PracticeAttemptInput as ServerPracticeAttemptInput,
} from '@/domains/practice/actions';

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
  recallBlanks: SeedRecallBlank[];
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
// Phase result types (shared between phases for the Save/review screen)
// ---------------------------------------------------------------------------

export interface PracticeAttemptResults {
  totalChunks: number;
  correctChunks: number;
  firstTryChunks: number;
  totalAttempts: number;
  mistakes: Array<{ chunkOrder: number; text: string; attempts: number }>;
}

export interface RecallAttemptResults {
  totalPhrases: number;
  correctPhrases: number;
  firstTryPhrases: number;
  totalAttempts: number;
  mistakes: Array<{ phraseOrder: number; text: string; attempts: number }>;
}

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
  onComplete: (results: PracticeAttemptResults) => void;
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

  // TTS (must be before early return)
  const { supported: ttsSupported, speaking, speak, stop } = useSpeechSynthesis();
  // Cancel speech when chunk changes
  useEffect(() => { stop(); }, [currentIndex, stop]);

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

      {/* Listen & pronunciation controls */}
      <div className="flex flex-wrap gap-2">
        {/* Listen / Stop */}
        {ttsSupported ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (speaking) {
                stop();
              } else {
                const textToSpeak = currentChunk.audioText || currentChunk.text;
                speak(textToSpeak);
              }
            }}
            className="flex items-center gap-1.5"
          >
            {speaking ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Listen
              </>
            )}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            disabled
            title="Audio playback is not supported in this browser"
            className="flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            Listen unavailable
          </Button>
        )}

        {/* Pronounce (placeholder — Task 34) */}
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
            onClick={() => {
              // Build practice results summary
              const chunksForReport = sortedChunks;
              let correctCount = 0;
              let firstTryCount = 0;
              let totalAttemptsCount = 0;
              const mistakeList: PracticeAttemptResults['mistakes'] = [];

              for (const c of chunksForReport) {
                const att = attemptCounts[c.order] ?? 0;
                totalAttemptsCount += att;
                if (checkedChunks.has(c.order)) {
                  correctCount++;
                  if (att === 1) firstTryCount++;
                } else if (att > 0) {
                  mistakeList.push({ chunkOrder: c.order, text: c.text, attempts: att });
                }
              }

              onComplete({
                totalChunks: chunksForReport.length,
                correctChunks: correctCount,
                firstTryChunks: firstTryCount,
                totalAttempts: totalAttemptsCount,
                mistakes: mistakeList,
              });
            }}
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

// ---------------------------------------------------------------------------
// Recall phase
// ---------------------------------------------------------------------------

/** The Recall phase — complete missing key phrases from memory. */
function RecallPhase({
  scenario,
  onComplete,
}: {
  scenario: PracticeScenarioMeta;
  onComplete: (results: RecallAttemptResults) => void;
}) {
  // Build recall prompts from seed recallBlanks, or fall back to keyPhrases
  const phraseByOrder = new Map<number, SeedKeyPhrase>();
  for (const p of scenario.keyPhrases) {
    phraseByOrder.set(p.order, p);
  }

  interface RecallPrompt {
    phraseOrder: number;
    promptText: string;
    expectedText: string;
  }

  const prompts: RecallPrompt[] = [];

  if (scenario.recallBlanks && scenario.recallBlanks.length > 0) {
    // Use seeded recall blanks — they specify which phrases and blanked prompts
    const sortedBlanks = [...scenario.recallBlanks].sort(
      (a, b) => a.phraseOrder - b.phraseOrder,
    );
    for (const blank of sortedBlanks) {
      const phrase = phraseByOrder.get(blank.phraseOrder);
      if (phrase) {
        prompts.push({
          phraseOrder: blank.phraseOrder,
          promptText: blank.blankedText,
          expectedText: phrase.text,
        });
      }
    }
  }

  // Fallback: if no recall blanks exist, use all key phrases directly
  if (prompts.length === 0) {
    const sortedPhrases = [...scenario.keyPhrases].sort((a, b) => a.order - b.order);
    for (const phrase of sortedPhrases) {
      prompts.push({
        phraseOrder: phrase.order,
        promptText: `Type the phrase: "${phrase.text}"`,
        expectedText: phrase.text,
      });
    }
  }

  const totalPrompts = prompts.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [checkedPhrases, setCheckedPhrases] = useState<Set<number>>(() => new Set());
  const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, 'idle' | 'correct' | 'retry'>>({});
  const [typedDrafts, setTypedDrafts] = useState<Record<number, string>>({});

  // TTS
  const { supported: ttsSupported, speaking, speak, stop } = useSpeechSynthesis();

  // Cancel speech when prompt changes
  useEffect(() => { stop(); }, [currentIndex, stop]);

  const currentPrompt = prompts[currentIndex];
  if (!currentPrompt) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalPrompts - 1;
  const allChecked = checkedPhrases.size >= totalPrompts;

  const currentTyped = typedDrafts[currentPrompt.phraseOrder] ?? '';
  const isChecked = checkedPhrases.has(currentPrompt.phraseOrder);
  const currentFeedback = feedback[currentPrompt.phraseOrder] ?? 'idle';
  const currentAttempts = attemptCounts[currentPrompt.phraseOrder] ?? 0;

  // Find the key phrase for reference (shown after correct answer)
  const currentPhrase = phraseByOrder.get(currentPrompt.phraseOrder);

  const handleCheck = () => {
    const trimmed = currentTyped.trim();
    if (!trimmed) return;

    const attemptNum = currentAttempts + 1;
    setAttemptCounts((prev) => ({ ...prev, [currentPrompt.phraseOrder]: attemptNum }));

    if (isExactMatch(trimmed, currentPrompt.expectedText)) {
      setCheckedPhrases((prev) => {
        const next = new Set(prev);
        next.add(currentPrompt.phraseOrder);
        return next;
      });
      setFeedback((prev) => ({ ...prev, [currentPrompt.phraseOrder]: 'correct' }));
    } else {
      setFeedback((prev) => ({ ...prev, [currentPrompt.phraseOrder]: 'retry' }));
    }
  };

  const goNext = () => {
    if (!isLast) setCurrentIndex((i) => i + 1);
  };
  const goPrev = () => {
    if (!isFirst) setCurrentIndex((i) => i - 1);
  };

  const checkedCount = checkedPhrases.size;

  return (
    <div className="space-y-6">
      {/* Recall progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text">
          Phrase {currentIndex + 1} of {totalPrompts}
        </span>
        <span className="text-xs text-text-muted">
          {checkedCount} of {totalPrompts} correct
        </span>
      </div>

      <Progress
        value={((currentIndex + 1) / totalPrompts) * 100}
        className="mt-1"
      />

      {/* Recall prompt */}
      <Card>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Recall the missing phrase
        </h2>
        <div className="whitespace-pre-line rounded-md border border-border bg-background p-5 text-sm leading-relaxed text-text">
          {currentPrompt.promptText}
        </div>
        {currentPhrase && (
          <p className="mt-2 text-xs text-text-muted">
            <span className="font-medium">Hint:</span> {currentPhrase.meaning}
          </p>
        )}
      </Card>

      {/* Listen control */}
      {ttsSupported ? (
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (speaking) {
                stop();
              } else {
                speak(currentPrompt.expectedText);
              }
            }}
            className="flex items-center gap-1.5"
          >
            {speaking ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
                Listen
              </>
            )}
          </Button>
        </div>
      ) : null}

      {/* Typing area */}
      <div>
        <label
          htmlFor="recall-typing-area"
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-text-muted"
        >
          Type the missing phrase
        </label>
        <textarea
          id="recall-typing-area"
          rows={3}
          value={currentTyped}
          onChange={(e) => {
            setTypedDrafts((prev) => ({
              ...prev,
              [currentPrompt.phraseOrder]: e.target.value,
            }));
            // Clear feedback when user edits
            if (currentFeedback !== 'idle') {
              setFeedback((prev) => ({
                ...prev,
                [currentPrompt.phraseOrder]: 'idle',
              }));
            }
          }}
          placeholder="Type the missing phrase from memory…"
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
          <span className="font-medium text-phrase">Type from memory:</span>{' '}
          Capitalization, punctuation, and spacing must match exactly.
          {!isChecked && ' Type the phrase and click Check Answer.'}
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
              Great recall! The phrase was:{' '}
              <span className="font-medium text-text">{currentPrompt.expectedText}</span>
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
              Your answer does not match the expected phrase exactly.
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
          Phrase {currentIndex + 1} / {totalPrompts}
        </span>

        {isLast ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // Build recall results summary
              let correctCount = 0;
              let firstTryCount = 0;
              let totalAttemptsCount = 0;
              const mistakeList: RecallAttemptResults['mistakes'] = [];

              for (const p of prompts) {
                const att = attemptCounts[p.phraseOrder] ?? 0;
                totalAttemptsCount += att;
                if (checkedPhrases.has(p.phraseOrder)) {
                  correctCount++;
                  if (att === 1) firstTryCount++;
                } else if (att > 0) {
                  mistakeList.push({
                    phraseOrder: p.phraseOrder,
                    text: p.expectedText,
                    attempts: att,
                  });
                }
              }

              onComplete({
                totalPhrases: prompts.length,
                correctPhrases: correctCount,
                firstTryPhrases: firstTryCount,
                totalAttempts: totalAttemptsCount,
                mistakes: mistakeList,
              });
            }}
            disabled={!allChecked}
            title={
              !allChecked
                ? `Complete all phrases first (${checkedCount}/${totalPrompts} done)`
                : undefined
            }
          >
            Continue to Save →
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={goNext}
            disabled={!isChecked}
            title={!isChecked ? 'Check your answer before continuing' : undefined}
          >
            Next →
          </Button>
        )}
      </div>
    </div>
  );
}

/** Review/Save phase — review mistakes, save key phrases, persist lesson. */
function ReviewSavePhase({
  scenario,
  practiceResults,
  recallResults,
  scenarioSlug,
}: {
  scenario: PracticeScenarioMeta;
  practiceResults: PracticeAttemptResults | null;
  recallResults: RecallAttemptResults | null;
  scenarioSlug: string;
}) {
  const sortedPhrases = [...scenario.keyPhrases].sort((a, b) => a.order - b.order);
  const [savedPhraseOrders, setSavedPhraseOrders] = useState<Set<number>>(() => {
    return new Set(sortedPhrases.map((p) => p.order));
  });
  const [persistState, setPersistState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [persistError, setPersistError] = useState<string | null>(null);
  const [result, setResult] = useState<CompleteLessonResult | null>(null);
  const savingRef = useRef(false);

  const toggleSave = (order: number) => {
    setSavedPhraseOrders((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  // ---- Computed stats ----
  const practiceCorrect = practiceResults?.correctChunks ?? 0;
  const practiceTotal = practiceResults?.totalChunks ?? 0;
  const recallCorrect = recallResults?.correctPhrases ?? 0;
  const recallTotal = recallResults?.totalPhrases ?? 0;
  const totalAttempts =
    (practiceResults?.totalAttempts ?? 0) + (recallResults?.totalAttempts ?? 0);

  // ---- Persist lesson ----
  const handleFinish = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setPersistState('saving');
    setPersistError(null);

    // Build server-side attempt inputs from phase results
    const typedPracticeAttempts: ServerPracticeAttemptInput[] =
      practiceResults?.mistakes?.map((m) => ({
        typedText: m.text,
        expectedText: m.text, // overwritten server-side
        attemptNumber: m.attempts,
        phraseOrder: m.chunkOrder,
      })) ?? [];

    const typedRecallAttempts: ServerPracticeAttemptInput[] =
      recallResults?.mistakes?.map((m) => ({
        typedText: m.text,
        expectedText: m.text,
        attemptNumber: m.attempts,
        phraseOrder: m.phraseOrder,
      })) ?? [];

    const input: CompleteLessonInput = {
      scenarioSlug,
      typedPracticeAttempts,
      typedRecallAttempts,
      savedPhraseOrders: Array.from(savedPhraseOrders),
      reviewedMistakes: true,
    };

    try {
      const res = await completeLesson(input);
      setResult(res);
      if (res.success) {
        setPersistState('saved');
      } else {
        setPersistState('error');
        setPersistError(res.error ?? 'An unknown error occurred.');
      }
    } catch (err) {
      setPersistState('error');
      setPersistError(err instanceof Error ? err.message : 'Persistence failed.');
    } finally {
      savingRef.current = false;
    }
  };

  // ---- Saved state ----
  if (persistState === 'saved') {
    return (
      <Card className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <div className="max-w-md space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <svg
              className="h-6 w-6 text-success"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-primary">Lesson Complete!</h3>
          <p className="text-sm text-text-muted">
            Your progress has been saved to your account.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="rounded-md border border-border bg-background p-2 text-center">
              <p className="text-sm font-semibold text-action">
                {result?.practiceCorrect ?? 0}/{result?.practiceTotal ?? 0}
              </p>
              <p className="text-[11px] text-text-muted">Chunks</p>
            </div>
            <div className="rounded-md border border-border bg-background p-2 text-center">
              <p className="text-sm font-semibold text-action">
                {result?.recallCorrect ?? 0}/{result?.recallTotal ?? 0}
              </p>
              <p className="text-[11px] text-text-muted">Phrases</p>
            </div>
            <div className="rounded-md border border-border bg-background p-2 text-center">
              <p className="text-sm font-semibold text-action">
                {result?.savedPhraseCount ?? 0}
              </p>
              <p className="text-[11px] text-text-muted">Saved</p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="inline-block rounded-md bg-action px-6 py-2.5 text-sm font-medium text-white hover:bg-action/90 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-primary">Review &amp; Save</h2>
        <p className="mt-1 text-sm text-text-muted">
          Review your mistakes, save useful phrases, and see your learning summary.
        </p>
      </div>

      {/* ---- Mistakes section ---- */}
      {/* ... same as before ... */}
      {(practiceResults?.mistakes?.length ?? 0) > 0 ||
      (recallResults?.mistakes?.length ?? 0) > 0 ? (
        <Card>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-error">
            Mistakes to review
          </h3>
          {practiceResults?.mistakes && practiceResults.mistakes.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-text-muted">
                Practice phase ({practiceResults.mistakes.length} chunk{practiceResults.mistakes.length !== 1 ? 's' : ''} needed retries)
              </p>
              <div className="mt-2 space-y-2">
                {practiceResults.mistakes.map((m) => (
                  <div key={`p-${m.chunkOrder}`} className="rounded-md border border-error/20 bg-error/5 px-3 py-2">
                    <p className="text-sm text-text">{m.text}</p>
                    <p className="mt-0.5 text-xs text-error">Took {m.attempts} attempt{m.attempts !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recallResults?.mistakes && recallResults.mistakes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted">
                Recall phase ({recallResults.mistakes.length} phrase{recallResults.mistakes.length !== 1 ? 's' : ''} needed retries)
              </p>
              <div className="mt-2 space-y-2">
                {recallResults.mistakes.map((m) => (
                  <div key={`r-${m.phraseOrder}`} className="rounded-md border border-error/20 bg-error/5 px-3 py-2">
                    <p className="text-sm font-medium text-text">{m.text}</p>
                    <p className="mt-0.5 text-xs text-error">Took {m.attempts} attempt{m.attempts !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="text-center">
            <svg className="mx-auto h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <p className="mt-2 text-sm font-medium text-success">No mistakes — perfect run!</p>
            <p className="mt-1 text-xs text-text-muted">All chunks and phrases were answered correctly.</p>
          </div>
        </Card>
      )}

      {/* ---- Key phrases to save ---- */}
      <Card>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Save useful phrases</h3>
        <p className="mb-3 text-xs text-text-muted">Select phrases to keep in your Phrase Bank for later review.</p>
        <div className="space-y-2">
          {sortedPhrases.map((phrase) => (
            <label
              key={phrase.order}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                savedPhraseOrders.has(phrase.order) ? 'border-phrase/40 bg-phrase/5' : 'border-border bg-surface hover:bg-background'
              }`}
            >
              <input type="checkbox" checked={savedPhraseOrders.has(phrase.order)} onChange={() => toggleSave(phrase.order)}
                className="mt-0.5 h-4 w-4 rounded border-border text-action focus:ring-action" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-phrase">{phrase.text}</p>
                <p className="mt-0.5 text-xs text-text-muted">{phrase.meaning}</p>
                {phrase.example && <p className="mt-0.5 text-xs italic text-text-muted">e.g. {phrase.example}</p>}
                {phrase.commonMistake && <p className="mt-0.5 text-xs text-error"><span className="font-medium">Watch out:</span> {phrase.commonMistake}</p>}
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* ---- Learning summary ---- */}
      <Card>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Learning summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border bg-background p-3 text-center">
            <p className="text-lg font-semibold text-action">{practiceCorrect}/{practiceTotal}</p>
            <p className="text-xs text-text-muted">Chunks correct</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3 text-center">
            <p className="text-lg font-semibold text-action">{recallCorrect}/{recallTotal}</p>
            <p className="text-xs text-text-muted">Phrases correct</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3 text-center">
            <p className="text-lg font-semibold text-action">{totalAttempts}</p>
            <p className="text-xs text-text-muted">Total attempts</p>
          </div>
          <div className="rounded-md border border-border bg-background p-3 text-center">
            <p className="text-lg font-semibold text-action">{savedPhraseOrders.size}</p>
            <p className="text-xs text-text-muted">Phrases to save</p>
          </div>
        </div>
      </Card>

      {/* ---- Error state ---- */}
      {persistState === 'error' && (
        <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3">
          <p className="text-sm font-medium text-error">Could not save lesson</p>
          <p className="mt-1 text-xs text-text-muted">{persistError ?? 'An unexpected error occurred.'}</p>
          <p className="mt-1 text-xs text-text-muted">Your progress is still available — you can try again.</p>
        </div>
      )}

      {/* ---- Finish action ---- */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="lg"
          onClick={handleFinish}
          disabled={persistState === 'saving'}
        >
          {persistState === 'saving' ? 'Saving…' : 'Finish Lesson'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PracticeShell({ scenario }: PracticeShellProps) {
  const [currentPhase, setCurrentPhase] = useState<PracticePhase>('understand');
  const [practiceResults, setPracticeResults] = useState<PracticeAttemptResults | null>(null);
  const [recallResults, setRecallResults] = useState<RecallAttemptResults | null>(null);

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
              onComplete={(results: PracticeAttemptResults) => {
                setPracticeResults(results);
                advancePhase();
              }}
            />
          )}

          {currentPhase === 'recall' && (
            <RecallPhase
              scenario={scenario}
              onComplete={(results: RecallAttemptResults) => {
                setRecallResults(results);
                advancePhase();
              }}
            />
          )}

          {currentPhase === 'save' && (
            <ReviewSavePhase
              scenario={scenario}
              practiceResults={practiceResults}
              recallResults={recallResults}
              scenarioSlug={scenario.scenarioId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
