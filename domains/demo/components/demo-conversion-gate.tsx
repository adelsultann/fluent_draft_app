'use client';

/**
 * FluentDraft — Demo conversion gate
 *
 * Client component that checks for pending demo progress after signup.
 * When a user comes from completing the demo, this component reads
 * the sessionStorage flag and triggers the conversion server action.
 *
 * Place this component on pages that an authenticated user lands on
 * after signup (e.g., dashboard, onboarding).
 */

import { useEffect, useState, useRef } from 'react';
import { convertStoredDemoProgress } from '@/domains/demo/convert';
import type { ConvertDemoProgressResult } from '@/domains/demo/actions';

const FLAG_KEY = 'fluentdraft:pending-demo-convert';

interface DemoConversionGateProps {
  /** Called after a successful conversion with the result. */
  onConverted?: (result: ConvertDemoProgressResult) => void;
}

type ConversionState = 'idle' | 'converting' | 'done' | 'error';

export default function DemoConversionGate({ onConverted }: DemoConversionGateProps) {
  // Derive initial state: if the flag is present, we immediately show "converting".
  const initialSlug = readFlag();
  const [state, setState] = useState<ConversionState>(
    initialSlug ? 'converting' : 'idle',
  );
  const [result, setResult] = useState<ConvertDemoProgressResult | null>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    // Guard against double-trigger.
    if (triggeredRef.current) return;
    if (!initialSlug) return;

    triggeredRef.current = true;
    clearFlag();

    convertStoredDemoProgress(initialSlug)
      .then((res) => {
        setResult(res);
        setState(res.success ? 'done' : 'error');
        if (res.success) onConverted?.(res);
      })
      .catch((err) => {
        setResult({
          success: false,
          error: err instanceof Error ? err.message : 'Conversion failed unexpectedly.',
        });
        setState('error');
      });
  }, [initialSlug, onConverted]);

  if (state === 'idle') return null;

  if (state === 'converting') {
    return (
      <div className="rounded-lg border border-phrase/30 bg-phrase/5 p-4 text-center">
        <p className="text-sm font-medium text-phrase">Saving your demo progress…</p>
        <p className="mt-1 text-xs text-text-muted">
          We&apos;re transferring your demo results to your new account.
        </p>
      </div>
    );
  }

  if (state === 'done' && result) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
        <p className="text-sm font-medium text-success">Demo progress saved!</p>
        <p className="mt-1 text-xs text-text-muted">
          Your demo score and progress have been attached to your account.
        </p>
      </div>
    );
  }

  if (state === 'error' && result) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-4 text-center">
        <p className="text-sm font-medium text-error">Could not save progress</p>
        <p className="mt-1 text-xs text-text-muted">
          {result.error ?? 'An unexpected error occurred.'}
        </p>
        <p className="mt-2 text-xs text-text-muted">
          Don&apos;t worry — your demo progress is still saved in this browser.
          You can try again later.
        </p>
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Read the pending-convert flag (without clearing). */
function readFlag(): string | null {
  try {
    return sessionStorage.getItem(FLAG_KEY);
  } catch {
    return null;
  }
}

/** Remove the pending-convert flag from sessionStorage. */
function clearFlag(): void {
  try {
    sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // ignore
  }
}
