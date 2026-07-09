import AppShell from '@/components/layout/app-shell';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';
import OnboardingForm from '@/domains/onboarding/components/onboarding-form';

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md text-center py-16">
          <p className="text-lg font-semibold text-primary">Sign in required</p>
          <p className="mt-2 text-sm text-text-muted">
            Please sign in or create an account before completing onboarding.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/login"
              className="rounded-md bg-action px-4 py-2 text-sm font-medium text-white hover:bg-action/90 transition-colors"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:bg-background transition-colors"
            >
              Create account
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      headerRight={<AuthStatus isSignedIn={true} email={user.email} />}
    >
      <OnboardingForm />
    </AppShell>
  );
}
