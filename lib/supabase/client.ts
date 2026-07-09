import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { Database } from './database';

/**
 * Browser-side Supabase client using @supabase/ssr.
 *
 * Creates a client that reads/writes auth tokens via cookies,
 * keeping the session in sync with the server and middleware.
 * Uses the anon (public) key — safe to expose in the browser.
 */
export function createBrowserClient() {
  return createSsrBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
