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
import type { SeedKeyPhrase } from '@/domains/scenarios/seed-schema';
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

/** Placeholder for phases not yet implemented (Tasks 28–31). */
function PracticePlaceholder({
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
          in a future task. You can return to the Understand phase to review the
          scenario content.
        </p>
        <Button variant="secondary" size="lg" onClick={onBack} className="mt-2">
          ← Back to Understand
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

          {currentPhase !== 'understand' && (
            <PracticePlaceholder
              currentPhase={currentPhase}
              onBack={() => setCurrentPhase('understand')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
