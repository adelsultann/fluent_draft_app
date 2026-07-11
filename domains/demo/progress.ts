/**
 * FluentDraft — Demo progress (browser-local, no server session).
 *
 * All state is stored in `localStorage` under:
 *   fluentdraft:demo-progress:<scenarioSlug>
 *
 * This is intentionally separate from Supabase — anonymous users
 * never create server-side attempts or database rows.
 */

export type DemoPhase = 'understand' | 'practice' | 'recall' | 'save';

export interface DemoProgress {
  scenarioSlug: string;
  startedAt: string;
  updatedAt: string;
  currentPhase: DemoPhase;
  /** 1-based index of the current chunk the user is viewing in Practice. */
  currentChunkOrder: number;
  /** Chunks the user has viewed (advanced past). */
  completedChunkOrders: number[];
  /** Recall blanks the user has revealed. */
  completedPhraseOrders: number[];
  /** Whether the user has reached the Save/complete screen. */
  completed: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function storageKey(scenarioSlug: string): string {
  return `fluentdraft:demo-progress:${scenarioSlug}`;
}

/** Create a fresh progress object for a given scenario. */
export function createProgress(scenarioSlug: string): DemoProgress {
  return {
    scenarioSlug,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentPhase: 'understand',
    currentChunkOrder: 1,
    completedChunkOrders: [],
    completedPhraseOrders: [],
    completed: false,
  };
}

/** Load progress from localStorage. Returns `null` if none exists. */
export function loadProgress(scenarioSlug: string): DemoProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(scenarioSlug));
    if (!raw) return null;
    return JSON.parse(raw) as DemoProgress;
  } catch {
    return null;
  }
}

/** Persist the progress object to localStorage. */
export function saveProgress(progress: DemoProgress): void {
  try {
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(storageKey(progress.scenarioSlug), JSON.stringify(progress));
  } catch {
    // localStorage may be full or unavailable — silently ignore.
  }
}

/** Remove demo progress for the given scenario from localStorage. */
export function clearProgress(scenarioSlug: string): void {
  try {
    localStorage.removeItem(storageKey(scenarioSlug));
  } catch {
    // ignore
  }
}
