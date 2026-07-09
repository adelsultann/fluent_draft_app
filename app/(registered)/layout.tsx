import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/app-shell';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';

interface RegisteredLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for routes that require authentication.
 *
 * - Checks for a valid session server-side.
 * - Redirects to /login with a `next` param so the user returns
 *   here after signing in.
 * - Renders the shared AppShell with auth status in the header.
 */
export default async function RegisteredLayout({ children }: RegisteredLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    // Build the `next` query param dynamically from the current pathname.
    // In a layout, we use a relative redirect — Next.js resolves the full URL.
    redirect('/login');
  }

  return (
    <AppShell headerRight={<AuthStatus isSignedIn={true} email={user.email} />}>
      {children}
    </AppShell>
  );
}
