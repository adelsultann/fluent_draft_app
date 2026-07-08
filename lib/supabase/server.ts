import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database";

/**
 * Server-side Supabase client.
 *
 * Creates a fresh client per request. In a full auth setup this would
 * use @supabase/ssr's createServerClient with cookie handling via
 * next/headers. For now we use the base createClient with anon key.
 */
export function createServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
