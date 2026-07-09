import AppShell from '@/components/layout/app-shell';
import AuthForm from '@/domains/auth/components/auth-form';

export default function LoginPage() {
  return (
    <AppShell>
      <AuthForm mode="login" />
    </AppShell>
  );
}
