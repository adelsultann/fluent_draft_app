import AppShell from '@/components/layout/app-shell';
import AuthForm from '@/domains/auth/components/auth-form';

export default function SignupPage() {
  return (
    <AppShell>
      <AuthForm mode="signup" />
    </AppShell>
  );
}
