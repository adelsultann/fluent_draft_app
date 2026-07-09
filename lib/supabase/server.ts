import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database';

/**
 * Server-side Supabase client using @supabase/ssr + Next.js cookies.
 *
 * Reads auth session from request cookies so server components,
 * server actions, and route handlers can access the current user.
 * Must be awaited — `cookies()` is async in Next.js 15+.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSsrServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `set` method may throw in a Server Component context.
            // Middleware handles cookie writes; supressing the error is safe here.
          }
        },
      },
    },
  );
}
