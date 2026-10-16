import { GitBranch, Github, LoaderCircle } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/use-auth.js';
import {
  authService,
  createOAuthClientState,
  OAUTH_CLIENT_STATE_KEY,
  OAUTH_REMEMBER_KEY,
  OAUTH_RETURN_TO_KEY,
  type OAuthProvider,
  type OAuthProviderStatus,
} from '../../services/auth/auth.service.js';

/**
 * Renders the auth page interface.
 * @param props - The component properties.
 */
export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const registering = mode === 'register';
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [providers, setProviders] = useState<OAuthProviderStatus>({
    google: false,
    github: false,
    gitlab: false,
  });
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  useEffect(() => {
    let active = true;
    void authService
      .oauthProviders()
      .then((result) => {
        if (active) setProviders(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  function startOAuth(provider: OAuthProvider) {
    setOauthBusy(provider);
    const clientState = createOAuthClientState();
    window.sessionStorage.setItem(OAUTH_CLIENT_STATE_KEY, clientState);
    window.sessionStorage.setItem(OAUTH_REMEMBER_KEY, String(remember));
    window.sessionStorage.setItem(OAUTH_RETURN_TO_KEY, from);
    window.location.assign(authService.oauthStartUrl(provider, clientState));
  }

  /**
   * Validates and submits the current form values.
   * @param event - The event value used by this operation.
   */
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (registering) await signUp(name, email, password);
      else await signIn(email, password, remember);
      navigate(from, { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'We could not authenticate your account.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-mobile-brand">
        <Link to="/">
          <span className="brand-wordmark">
            Carto<span>Graph</span>
          </span>
        </Link>
      </div>
      <div className="auth-card">
        <div className="auth-card-heading">
          <h2>{registering ? 'Create your account' : 'Sign in to CartoGraph'}</h2>
          <p>
            {registering
              ? 'Start visualising your repositories today.'
              : 'Start visualising your repositories today.'}
          </p>
        </div>

        <div className="auth-oauth-group">
          <button
            type="button"
            className="oauth-button oauth-github"
            disabled={!providers.github || oauthBusy !== null}
            onClick={() => startOAuth('github')}
            title={providers.github ? 'Continue with GitHub' : 'GitHub sign-in is not configured'}
          >
            <Github size={18} />
            {oauthBusy === 'github' ? 'Connecting…' : 'Continue with GitHub'}
          </button>
          <button
            type="button"
            className="oauth-button oauth-google"
            disabled={!providers.google || oauthBusy !== null}
            onClick={() => startOAuth('google')}
            title={providers.google ? 'Continue with Google' : 'Google sign-in is not configured'}
          >
            <svg
              className="google-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            {oauthBusy === 'google' ? 'Connecting…' : 'Continue with Google'}
          </button>
          <button
            type="button"
            className="oauth-button oauth-gitlab"
            disabled={!providers.gitlab || oauthBusy !== null}
            onClick={() => startOAuth('gitlab')}
            title={providers.gitlab ? 'Continue with GitLab' : 'GitLab sign-in is not configured'}
          >
            <GitBranch size={18} />
            {oauthBusy === 'gitlab' ? 'Connecting…' : 'Continue with GitLab'}
          </button>
        </div>

        <div className="or-divider">
          <span />
          or
          <span />
        </div>

        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          {registering && (
            <label className="field-label">
              <span>Full name</span>
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                maxLength={100}
                required
              />
            </label>
          )}

          <label className="field-label">
            <span>Work Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>

          <label className="field-label">
            <div className="field-label-row">
              <span>Password</span>
              {!registering && (
                <span className="forgot-password-link" title="Password reset is not configured">
                  Forgot password?
                </span>
              )}
            </div>
            <input
              type="password"
              autoComplete={registering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={registering ? 'At least 8 characters' : ''}
              minLength={registering ? 8 : 1}
              maxLength={128}
              required
            />
          </label>

          {!registering && (
            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>Keep me signed in</span>
              </label>
            </div>
          )}

          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}

          <button className="button button-primary full-width auth-submit" disabled={busy}>
            {busy ? (
              <>
                <LoaderCircle size={17} className="spin" />{' '}
                {registering ? 'Creating account…' : 'Signing in…'}
              </>
            ) : registering ? (
              'Create account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="auth-legal">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
