import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.jsx';
import LoadingState from '../components/common/LoadingState.jsx';
import ErrorState from '../components/common/ErrorState.jsx';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { refresh, loading, authenticated } = useAuth();
  const denied = params.get('error') === 'denied';

  useEffect(() => {
    if (denied) return;
    let tries = 0;
    const interval = setInterval(async () => {
      tries += 1;
      await refresh();
      if (tries >= 8) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, [denied, refresh]);

  if (denied) {
    return (
      <div className="auth-shell mt-5 p-3">
        <div className="auth-card">
          <ErrorState
            title="GitHub sign-in cancelled"
            message="You cancelled the GitHub authorization. You can sign in any time you're ready."
            action={
              <a className="btn btn-primary" href="/api/auth/github">
                <i className="bi bi-github me-1" aria-hidden="true" />
                Try again
              </a>
            }
          />
          <div className="text-center mt-3">
            <Link to="/" className="small">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/app" replace />;
  }

  if (!loading) {
    return (
      <div className="auth-shell mt-5 p-3">
        <div className="auth-card">
          <ErrorState
            title="Sign-in didn't complete"
            message="We couldn't finish the GitHub sign-in. Please try connecting again."
            action={
              <a className="btn btn-primary" href="/api/auth/github">
                <i className="bi bi-github me-1" aria-hidden="true" />
                Connect GitHub
              </a>
            }
          />
          <div className="text-center mt-3">
            <Link to="/" className="small">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell mt-5 p-3">
      <div className="auth-card">
        <LoadingState label="Completing GitHub sign-in…" rows={2} />
      </div>
    </div>
  );
}