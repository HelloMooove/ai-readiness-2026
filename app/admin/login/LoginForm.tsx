'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserSupabase } from '@/lib/supabase/browser';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setStatus('sending');

    const supabase = createBrowserSupabase();
    if (!supabase) {
      setStatus('error');
      setErrorMsg(
        'Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel and redeploy.',
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
    } else {
      setStatus('sent');
    }
  }

  if (status === 'sent') {
    return (
      <div className="admin-auth-success">
        <strong>Check your inbox.</strong>
        <p>
          We sent a sign-in link to <code>{email}</code>. Click it to access the admin.
        </p>
      </div>
    );
  }

  return (
    <form className="admin-auth-form" onSubmit={handleSubmit} noValidate>
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === 'sending'}
      />
      <button type="submit" disabled={status === 'sending' || email.trim().length === 0}>
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>

      {(errorMsg || urlError) && (
        <p className="admin-auth-error" role="alert">
          {errorMsg || urlError}
        </p>
      )}
    </form>
  );
}
