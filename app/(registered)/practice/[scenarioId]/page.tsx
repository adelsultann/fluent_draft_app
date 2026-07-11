/**
 * FluentDraft — Practice lesson route
 *
 * Renders the practice lesson shell for a given scenario.
 * Auth is handled by the parent (registered) layout.
 *
 * Related tasks:
 *   - Task 26: Build practice lesson shell (this file)
 *   - Task 27: Implement Understand phase
 *   - Task 28: Implement Practice phase
 */

import { notFound } from 'next/navigation';
import { getScenarioWithPack } from '@/domains/scenarios/data';
import { getUserTargetLanguage } from '@/domains/translation/get-target-language';
import PracticeShell from '@/domains/practice/components/practice-shell';
import type { PracticeScenarioMeta } from '@/domains/practice/components/practice-shell';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PracticePageProps {
  params: Promise<{ scenarioId: string }>;
}

export default async function PracticePage({ params }: PracticePageProps) {
  const { scenarioId } = await params;

  // 1. Fetch scenario from seed data
  const scenario = getScenarioWithPack(scenarioId);
  if (!scenario) {
    notFound();
  }

  // 1b. Fetch user's target language for translation reveal
  const targetLanguageCode = await getUserTargetLanguage();

  // 2. Map seed data to the PracticeShell's expected shape
  const meta: PracticeScenarioMeta = {
    scenarioId: scenario.slug,
    packId: scenario.packSlug,
    packTitle: scenario.packTitle,
    title: scenario.title,
    context: scenario.context,
    goal: scenario.goal,
    tone: scenario.tone,
    criteria: scenario.criteria,
    difficulty: scenario.difficulty,
    modelResponse: scenario.modelResponse,
    keyPhrases: scenario.keyPhrases,
    chunks: scenario.chunks,
    translations: scenario.translations,
    recallBlanks: scenario.recallBlanks,
    targetLanguageCode,
    chunkCount: scenario.chunks.length,
    phraseCount: scenario.keyPhrases.length,
  };

  // 3. Render the practice shell
  return <PracticeShell scenario={meta} />;
}
