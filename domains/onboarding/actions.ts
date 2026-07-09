'use server';

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OnboardingFormData } from './types';
import { SUPPORTED_LANGUAGES } from './constants';

interface OnboardingResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Temporary helper to work around the empty Database placeholder type.
 * Replace with the generated Database type after running
 * `npx supabase gen types typescript`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

const VALID_ENGLISH_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

/**
 * Server action that persists onboarding data into `user_profiles`.
 *
 * - Requires an authenticated user.
 * - Validates all fields server-side.
 * - Confirms the target language exists and is enabled.
 * - Upserts the profile row (updates on re-submit).
 * - Redirects to / on success.
 */
export async function completeOnboarding(
  formData: OnboardingFormData,
): Promise<OnboardingResult> {
  // 1. Auth guard
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'You must be signed in to complete onboarding.' };
  }

  // 2. Validate required fields
  const fieldErrors: Record<string, string> = {};

  const displayName = formData.displayName?.trim();
  if (!displayName) fieldErrors.displayName = 'Display name is required.';
  if (displayName && displayName.length > 100)
    fieldErrors.displayName = 'Display name is too long.';

  const englishLevel = formData.englishLevel;
  if (!englishLevel || !VALID_ENGLISH_LEVELS.has(englishLevel))
    fieldErrors.englishLevel = 'Please select a valid English level.';

  const targetLanguageCode = formData.targetLanguageCode?.trim().toLowerCase();
  if (!targetLanguageCode) fieldErrors.targetLanguageCode = 'Please select a target language.';

  const countryCode = formData.countryCode?.trim().toUpperCase();
  if (!countryCode) fieldErrors.countryCode = 'Please select your country.';
  if (countryCode && countryCode.length > 3)
    fieldErrors.countryCode = 'Invalid country code.';

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, fieldErrors };
  }

  // 3. Confirm target language is in the supported list
  if (!VALID_LANGUAGE_CODES.has(targetLanguageCode!)) {
    return {
      success: false,
      fieldErrors: {
        targetLanguageCode: 'The selected language is not supported. Please choose another.',
      },
    };
  }

  // 4. Upsert user profile
  const supabase = (await createServerClient()) as unknown as DbClient;
  const { error: upsertError } = await supabase.from('user_profiles').upsert(
    {
      user_id: user.id,
      display_name: displayName!,
      english_level: englishLevel!,
      target_language_code: targetLanguageCode!,
      country_code: countryCode!,
      onboarding_complete: true,
    },
    { onConflict: 'user_id' },
  );

  if (upsertError) {
    return {
      success: false,
      error: upsertError.message || 'Failed to save your profile. Please try again.',
    };
  }

  // 5. Redirect to home page
  redirect('/');
}
