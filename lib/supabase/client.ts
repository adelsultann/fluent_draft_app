import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";

/**
 * Browser-side Supabase client.
 *
 * Uses the anon (public) key. Safe to expose to the browser.
 * For authenticated requests, the user's JWT is managed automatically
 * by Supabase Auth (once auth is wired up in later steps).
 */
export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
