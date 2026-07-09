'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { ENGLISH_LEVELS, SUPPORTED_LANGUAGES, COUNTRIES } from '../constants';
import type { OnboardingFormData } from '../types';

/**
 * Shared styles for native selects, matching the Input primitive's look.
 */
const selectClass =
  'rounded-md border bg-surface px-3 py-2 text-sm text-text border-border focus:border-action focus:outline-none focus:ring-1 focus:ring-action disabled:cursor-not-allowed disabled:opacity-50';

const labelClass = 'text-sm font-medium text-text';
const helpClass = 'text-xs text-text-muted';
const errorClass = 'text-xs text-error';

export default function OnboardingForm() {
  const [displayName, setDisplayName] = useState('');
  const [englishLevel, setEnglishLevel] = useState('');
  const [targetLanguageCode, setTargetLanguageCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Display name is required.';
    if (!englishLevel) errs.englishLevel = 'Please select your English level.';
    if (!targetLanguageCode) errs.targetLanguageCode = 'Please select a target language.';
    if (!countryCode) errs.countryCode = 'Please select your country.';
    return errs;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(false);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      // Task 19 will persist this data to user_profiles.
      // For now, we simulate success so the UI flow is complete.
      const payload: OnboardingFormData = {
        displayName: displayName.trim(),
        englishLevel: englishLevel as OnboardingFormData['englishLevel'],
        targetLanguageCode,
        countryCode,
      };

      // Simulate a short delay so the loading state is visible.
      await new Promise((r) => setTimeout(r, 400));

      console.log('Onboarding payload (will be persisted in Task 19):', payload);

      setSubmitted(true);
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto w-full max-w-md text-center">
        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <p className="text-lg font-semibold text-success">All set!</p>
          <p className="mt-2 text-sm text-text-muted">
            Your preferences have been saved.
            {process.env.NODE_ENV === 'development' &&
              ' (Persistence will be wired in Task 19.)'}
          </p>
          <p className="mt-4">
            <a
              href="/dashboard"
              className="inline-block rounded-md bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action/90 transition-colors"
            >
              Go to Dashboard
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-primary">Welcome to FluentDraft</h1>
          <p className="mt-1 text-sm text-text-muted">
            Tell us a little about yourself so we can personalise your practice.
          </p>
        </div>

        {errors.form && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Display name */}
          <Input
            label="Display name"
            id="onboarding-name"
            placeholder="How should we call you?"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            error={errors.displayName}
            disabled={loading}
            required
          />

          {/* English level */}
          <div className="flex flex-col gap-1">
            <span className={labelClass}>English level</span>
            <div className="flex flex-col gap-2">
              {ENGLISH_LEVELS.map((level) => (
                <label
                  key={level.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    englishLevel === level.value
                      ? 'border-action bg-action/5 text-action'
                      : 'border-border hover:bg-background'
                  }`}
                >
                  <input
                    type="radio"
                    name="englishLevel"
                    value={level.value}
                    checked={englishLevel === level.value}
                    onChange={(e) => setEnglishLevel(e.target.value)}
                    disabled={loading}
                    className="mt-0.5 accent-action"
                  />
                  <span>{level.label}</span>
                </label>
              ))}
            </div>
            {errors.englishLevel && <p className={errorClass}>{errors.englishLevel}</p>}
            <p className={helpClass}>This helps us recommend the right lesson difficulty.</p>
          </div>

          {/* Target language */}
          <div className="flex flex-col gap-1">
            <label htmlFor="onboarding-language" className={labelClass}>
              Target translation language
            </label>
            <select
              id="onboarding-language"
              value={targetLanguageCode}
              onChange={(e) => setTargetLanguageCode(e.target.value)}
              disabled={loading}
              className={selectClass}
              aria-describedby={
                errors.targetLanguageCode ? 'onboarding-language-error' : 'onboarding-language-help'
              }
            >
              <option value="">Select a language…</option>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} {lang.nativeName ? `(${lang.nativeName})` : ''}
                </option>
              ))}
            </select>
            {errors.targetLanguageCode && (
              <p id="onboarding-language-error" className={errorClass}>
                {errors.targetLanguageCode}
              </p>
            )}
            <p id="onboarding-language-help" className={helpClass}>
              You will be able to reveal translations during practice.
            </p>
          </div>

          {/* Country */}
          <div className="flex flex-col gap-1">
            <label htmlFor="onboarding-country" className={labelClass}>
              Country
            </label>
            <select
              id="onboarding-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={loading}
              className={selectClass}
              aria-describedby={
                errors.countryCode ? 'onboarding-country-error' : 'onboarding-country-help'
              }
            >
              <option value="">Select your country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.countryCode && (
              <p id="onboarding-country-error" className={errorClass}>
                {errors.countryCode}
              </p>
            )}
            <p id="onboarding-country-help" className={helpClass}>
              Shown on leaderboards alongside your display name.
            </p>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-2">
            {loading ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
