import AppShell from '@/components/layout/app-shell';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';
import { getDemoLesson } from '@/domains/demo/get-demo-lesson';
import DemoProgressClient from '@/domains/demo/components/demo-progress-client';

export default async function DemoStartPage() {
  const user = await getCurrentUser();
  const scenario = getDemoLesson();

  if (!scenario) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-primary">Demo not available</p>
          <p className="mt-2 text-sm text-text-muted">
            The demo lesson content could not be loaded.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell headerRight={<AuthStatus isSignedIn={!!user} email={user?.email} />}>
      <DemoProgressClient scenario={scenario} />
    </AppShell>
  );
}
