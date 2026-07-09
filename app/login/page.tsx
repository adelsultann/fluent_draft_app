import { Suspense } from 'react';
import AppShell from '@/components/layout/app-shell';
import AuthForm from '@/domains/auth/components/auth-form';
import AuthStatus from '@/domains/auth/components/auth-status';
import { getCurrentUser } from '@/lib/supabase/auth';

export default async function LoginPage() {
  const user = await getCurrentUser();

  return (
    <AppShell
      headerRight={
        <AuthStatus isSignedIn={!!user} email={user?.email} />
      }
    >
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
    </AppShell>
  );
}
