import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="admin-auth">
      <div className="admin-auth-card">
        <h1>Admin sign-in</h1>
        <p className="admin-auth-sub">
          Enter your email — we&apos;ll send you a magic link to sign in. No password required.
        </p>
        <Suspense fallback={<div className="admin-auth-loading">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
