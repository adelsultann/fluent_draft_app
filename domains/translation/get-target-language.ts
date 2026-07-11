import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbClient = SupabaseClient<any>;

/**
 * Retrieve the authenticated user's target language code from their profile.
 *
 * Returns `null` when:
 * - No user is signed in
 * - The user has not completed onboarding (no profile row)
 * - The profile row exists but `target_language_code` is missing
 */
export async function getUserTargetLanguage(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = (await createServerClient()) as unknown as DbClient;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('target_language_code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !data?.target_language_code) return null;
  return data.target_language_code;
}
