/**
 * FluentDraft — Demo conversion validation
 *
 * Pure validation logic for the demo progress conversion payload.
 * Separated from the server action so it can be unit-tested
 * without requiring Supabase or a server environment.
 */

/** Fixed UUID of the demo scenario from the seed migration. */
export const DEMO_SCENARIO_ID = '00000000-0000-0000-0000-000000000002';

/** Fixed UUIDs of the 6 demo key phrases. */
export const DEMO_PHRASE_IDS = new Set([
  '00000000-0000-0000-0002-000000000001',
  '00000000-0000-0000-0002-000000000002',
  '00000000-0000-0000-0002-000000000003',
  '00000000-0000-0000-0002-000000000004',
  '00000000-0000-0000-0002-000000000005',
  '00000000-0000-0000-0002-000000000006',
]);

// ---------------------------------------------------------------------------
// Input types (mirrors actions.ts)
// ---------------------------------------------------------------------------

export interface TypedPhraseAttemptInput {
  keyPhraseId: string;
  typedText: string;
  attemptNumber: number;
}

export interface PronunciationAttemptInput {
  keyPhraseId: string;
  expectedText: string;
  transcript: string;
}

export interface ConvertDemoProgressInput {
  scenarioId: string;
  completed: boolean;
  phaseReached: string;
  typedPhraseAttempts: TypedPhraseAttemptInput[];
  pronunciationAttempts: PronunciationAttemptInput[];
  savedPhraseIds: string[];
  clientCompletedAt?: string;
}

// ---------------------------------------------------------------------------
// Validation errors
// ---------------------------------------------------------------------------

export interface ValidationError {
  fieldErrors: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a demo conversion payload.
 *
 * Returns `null` if valid, or a `ValidationError` with field-specific
 * error messages describing what needs to be fixed.
 */
export function validateConversionPayload(
  input: ConvertDemoProgressInput,
): ValidationError | null {
  const { scenarioId, completed, typedPhraseAttempts, pronunciationAttempts, savedPhraseIds } =
    input;

  // 1. Scenario must be the fixed demo lesson
  if (!scenarioId || scenarioId !== DEMO_SCENARIO_ID) {
    return { fieldErrors: { scenarioId: 'Invalid demo scenario.' } };
  }

  // 2. Must be completed to convert
  if (completed !== true) {
    return {
      fieldErrors: {
        completed: 'Only completed demo lessons can be converted. Please finish the demo first.',
      },
    };
  }

  // 3. Validate typedPhraseAttempts — all phrase IDs must belong to the demo
  for (let i = 0; i < typedPhraseAttempts.length; i++) {
    const a = typedPhraseAttempts[i];
    if (!a.keyPhraseId || !DEMO_PHRASE_IDS.has(a.keyPhraseId)) {
      return {
        fieldErrors: {
          [`typedPhraseAttempts[${i}].keyPhraseId`]: `Invalid or unknown phrase ID: "${a.keyPhraseId}".`,
        },
      };
    }
    if (typeof a.attemptNumber !== 'number' || a.attemptNumber < 1) {
      return {
        fieldErrors: {
          [`typedPhraseAttempts[${i}].attemptNumber`]: 'Attempt number must be >= 1.',
        },
      };
    }
    if (typeof a.typedText !== 'string') {
      return {
        fieldErrors: {
          [`typedPhraseAttempts[${i}].typedText`]: 'Typed text is required.',
        },
      };
    }
  }

  // 4. Validate pronunciationAttempts — IDs must belong to demo
  for (let i = 0; i < pronunciationAttempts.length; i++) {
    const a = pronunciationAttempts[i];
    if (!a.keyPhraseId || !DEMO_PHRASE_IDS.has(a.keyPhraseId)) {
      return {
        fieldErrors: {
          [`pronunciationAttempts[${i}].keyPhraseId`]: `Invalid phrase ID: "${a.keyPhraseId}".`,
        },
      };
    }
  }

  // 5. Validate savedPhraseIds — must belong to demo, no duplicates
  const seenPhraseIds = new Set<string>();
  for (let i = 0; i < savedPhraseIds.length; i++) {
    const id = savedPhraseIds[i];
    if (!id || !DEMO_PHRASE_IDS.has(id)) {
      return {
        fieldErrors: {
          [`savedPhraseIds[${i}]`]: `Invalid saved phrase ID: "${id}".`,
        },
      };
    }
    if (seenPhraseIds.has(id)) {
      return {
        fieldErrors: {
          [`savedPhraseIds[${i}]`]: `Duplicate saved phrase ID: "${id}".`,
        },
      };
    }
    seenPhraseIds.add(id);
  }

  return null;
}
