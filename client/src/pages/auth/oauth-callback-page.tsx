import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '../../context/use-auth.js';
import {
  OAUTH_CLIENT_STATE_KEY,
  OAUTH_REMEMBER_KEY,
  OAUTH_RETURN_TO_KEY,
} from '../../services/auth/auth.service.js';

/**
 * Exchanges a one-time OAuth code for the existing CartoGraph session.
 */
export function OAuthCallbackPage() {
  const { completeOAuth } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing sign-in…');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const providerError = searchParams.get('oauth_error');
    const clientState = searchParams.get('client_state');
    const savedState = window.sessionStorage.getItem(OAUTH_CLIENT_STATE_KEY);
    if (!clientState || clientState !== savedState) {
      window.sessionStorage.removeItem(OAUTH_CLIENT_STATE_KEY);
      window.sessionStorage.removeItem(OAUTH_REMEMBER_KEY);
      window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
      setMessage('The sign-in request could not be verified. Please start again.');
      setFailed(true);
      return;
    }
    if (providerError) {
      window.sessionStorage.removeItem(OAUTH_CLIENT_STATE_KEY);
      window.sessionStorage.removeItem(OAUTH_REMEMBER_KEY);
      window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
      const messages: Record<string, string> = {
        account_conflict:
          'Sign in with your existing account, then link this provider in Settings.',
        verified_email_required: 'This provider must return a verified email address to sign in.',
        oauth_failed: 'Provider sign-in could not be completed. Please try again.',
      };
      setMessage(messages[providerError] ?? messages.oauth_failed!);
      setFailed(true);
      return;
    }
    if (!code) {
      setMessage('The sign-in callback did not include a valid exchange code.');
      setFailed(true);
      return;
    }

    const remember = window.sessionStorage.getItem(OAUTH_REMEMBER_KEY) === 'true';
    const requestedPath = window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY);
    const destination =
      requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
        ? requestedPath
        : '/dashboard';
    window.sessionStorage.removeItem(OAUTH_REMEMBER_KEY);
    window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY);
    window.sessionStorage.removeItem(OAUTH_CLIENT_STATE_KEY);
    let active = true;
    void completeOAuth(code, clientState, remember)
      .then(() => {
        if (active) navigate(destination, { replace: true });
      })
      .catch(() => {
        if (!active) return;
        setMessage('Sign-in could not be completed. The code may have expired; please try again.');
        setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [completeOAuth, navigate, searchParams]);

  return (
    <main className="auth-form-wrap">
      <section className="auth-card" aria-live="polite">
        <h1>{failed ? 'Sign-in failed' : 'Signing you in'}</h1>
        <p>{message}</p>
        {failed && <Link to="/login">Return to sign in</Link>}
      </section>
    </main>
  );
}
