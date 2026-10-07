import { ArrowRight, Github, LoaderCircle, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../context/use-auth.js';

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
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

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
          <span className="auth-card-icon">
            <Mail size={18} />
          </span>
          <h2>{registering ? 'Create your account' : 'Sign in to CartoGraph'}</h2>
          <p>
            {registering
              ? 'Start mapping your repositories today.'
              : 'Start visualizing your repositories today.'}
          </p>
        </div>
        <button
          className="oauth-button oauth-github"
          disabled
          title="GitHub OAuth is not configured on this backend"
        >
          <Github size={18} /> Continue with GitHub <span className="coming-soon">Coming soon</span>
        </button>
        <button
          className="oauth-button"
          disabled
          title="GitLab OAuth is not configured on this backend"
        >
          <span className="gitlab-mark">◆</span> Continue with GitLab{' '}
          <span className="coming-soon">Coming soon</span>
        </button>
        <div className="or-divider">
          <span />
          or continue with email
          <span />
        </div>
        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          {registering && (
            <label className="field-label">
              Full name
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
            Work email
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
            Password
            <input
              type="password"
              autoComplete={registering ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={registering ? 'At least 8 characters' : 'Enter your password'}
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
                />{' '}
                Keep me signed in
              </label>
              <span className="muted-link" title="Password reset is not available yet">
                Forgot password?
              </span>
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
            ) : (
              <>
                {registering ? 'Create account' : 'Sign in'} <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
        <p className="auth-legal">
          By continuing, you agree to CartoGraph’s Terms of Service and Privacy Policy.
        </p>
      </div>
      <p className="auth-switch">
        {registering ? 'Already have an account?' : 'No account yet?'}{' '}
        <Link to={registering ? '/login' : '/register'}>
          {registering ? 'Sign in' : 'Create one'}
        </Link>
      </p>
      <p className="oauth-note">OAuth sign-in is not enabled for this backend yet.</p>
    </div>
  );
}
