'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

interface AuthStatusProps {
  /** `true` when a valid user session exists (determined server-side). */
  isSignedIn: boolean;
  /** The user's email (available when signed in). */
  email?: string | null;
}

/**
 * Small auth-status indicator shown in the page header.
 *
 * - Signed out: shows Login / Sign Up links.
 * - Signed in: shows the user email and a Sign Out button.
 */
export default function AuthStatus({ isSignedIn, email }: AuthStatusProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="max-w-[200px] truncate text-text-muted">{email}</span>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <a href="/login" className="font-medium text-white/80 hover:text-white transition-colors">
        Sign in
      </a>
      <a href="/signup" className="font-medium text-white/80 hover:text-white transition-colors">
        Sign up
      </a>
    </div>
  );
}
