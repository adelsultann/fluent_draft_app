'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { ENGLISH_LEVELS, SUPPORTED_LANGUAGES, COUNTRIES, countryCodeToFlag } from '../constants';
import { completeOnboarding } from '../actions';
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
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Close the country dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
      }
    }
    if (countryOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [countryOpen]);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase()),
      )
    : COUNTRIES;

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

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      const payload: OnboardingFormData = {
        displayName: displayName.trim(),
        englishLevel: englishLevel as OnboardingFormData['englishLevel'],
        targetLanguageCode,
        countryCode,
      };

      const result = await completeOnboarding(payload);

      if (!result.success) {
        setErrors((prev) => {
          const next: Record<string, string> = { ...prev };
          if (result.fieldErrors) Object.assign(next, result.fieldErrors);
          if (result.error) next.form = result.error;
          return next;
        });
      }
      // On success the server action redirects — no explicit setState needed.
    } catch {
      setErrors({ form: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
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

          {/* Country — searchable with flags */}
          <div className="flex flex-col gap-1" ref={countryRef}>
            <label htmlFor="onboarding-country-search" className={labelClass}>
              Country
            </label>

            {/* Trigger / search input */}
            <div className="relative">
              <input
                id="onboarding-country-search"
                type="text"
                placeholder="Search your country…"
                value={
                  countryOpen
                    ? countrySearch
                    : selectedCountry
                      ? `${countryCodeToFlag(selectedCountry.code)} ${selectedCountry.name}`
                      : ''
                }
                onChange={(e) => {
                  setCountrySearch(e.target.value);
                  setCountryOpen(true);
                  if (countryCode) setCountryCode('');
                }}
                onFocus={() => {
                  setCountryOpen(true);
                  setCountrySearch('');
                }}
                disabled={loading}
                className={selectClass + ' w-full pr-8'}
                role="combobox"
                aria-expanded={countryOpen}
                aria-controls="onboarding-country-listbox"
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-describedby={
                  errors.countryCode ? 'onboarding-country-error' : 'onboarding-country-help'
                }
                autoComplete="off"
              />
              {/* Chevron */}
              <span
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted"
                aria-hidden="true"
              >
                {countryOpen ? '▲' : '▼'}
              </span>
            </div>

            {/* Dropdown list */}
            {countryOpen && (
              <ul
                id="onboarding-country-listbox"
                role="listbox"
                className="max-h-56 overflow-y-auto rounded-md border border-border bg-surface shadow-md"
              >
                {filteredCountries.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-text-muted">No countries found.</li>
                ) : (
                  filteredCountries.map((c) => (
                    <li
                      key={c.code}
                      role="option"
                      aria-selected={countryCode === c.code}
                      onClick={() => {
                        setCountryCode(c.code);
                        setCountrySearch('');
                        setCountryOpen(false);
                        setErrors((prev) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { countryCode: _c, ...rest } = prev;
                          return rest;
                        });
                      }}
                      className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors ${
                        countryCode === c.code
                          ? 'bg-action/10 text-action font-medium'
                          : 'hover:bg-background'
                      }`}
                    >
                      <span className="text-lg leading-none">{countryCodeToFlag(c.code)}</span>
                      <span>{c.name}</span>
                    </li>
                  ))
                )}
              </ul>
            )}

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
