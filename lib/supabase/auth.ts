import { createServerClient } from './server';

/**
 * Get the currently authenticated user from the server-side session.
 *
 * Returns `null` when no valid session exists (anonymous / signed-out).
 * Use in server components and server actions to check auth state.
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current Supabase Auth session from the server side.
 *
 * Returns `null` when no session exists.
 */
export async function getCurrentSession() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}
