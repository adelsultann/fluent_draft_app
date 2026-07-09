import AppShell from '@/components/layout/app-shell';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <AppShell
      headerRight={
        <AuthStatus isSignedIn={!!user} email={user?.email} />
      }
    >
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-primary text-lg font-semibold">FluentDraft</p>
        <p className="text-text-muted max-w-md text-center">
          Practice real-world English writing. Build confidence through scenarios, typing, recall,
          and pronunciation.
        </p>
        {user ? (
          <p className="text-sm text-text-muted">
            Signed in as <span className="font-medium text-text">{user.email}</span>
          </p>
        ) : (
          <div className="flex gap-3">
            <a
              href="/signup"
              className="rounded-md bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action/90 transition-colors"
            >
              Get started
            </a>
            <a
              href="/demo"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-background transition-colors"
            >
              Try demo
            </a>
          </div>
        )}
      </div>
    </AppShell>
  );
}
