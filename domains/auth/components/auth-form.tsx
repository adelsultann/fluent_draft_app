'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';

type AuthMode = 'signup' | 'login';

interface AuthFormProps {
  mode: AuthMode;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === 'signup';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createBrowserClient();

      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage(
            'Account created! Please check your email for a confirmation link to complete your registration.',
          );
          setEmail('');
          setPassword('');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setErrorMessage(error.message);
        } else {
          setSuccessMessage('Signed in successfully!');
          setEmail('');
          setPassword('');
          router.refresh();
        }
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-primary">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            {isSignup
              ? 'Start practising real-world English writing.'
              : 'Sign in to continue your practice.'}
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 rounded-md border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
          >
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            id="auth-email"
            autoComplete={isSignup ? 'email' : 'username'}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />

          <Input
            label="Password"
            type="password"
            id="auth-password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="mt-2">
            {loading ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-muted">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <a href="/login" className="font-medium text-action hover:underline">
                Sign in
              </a>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <a href="/signup" className="font-medium text-action hover:underline">
                Create one
              </a>
            </>
          )}
        </p>
      </Card>
    </div>
  );
}

/* Inline Card wrapper to keep the form self-contained */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">{children}</div>
  );
}
