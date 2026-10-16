import {
  ArrowRight,
  CircleUserRound,
  GitBranch,
  Github,
  LockKeyhole,
  Moon,
  Paintbrush,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { PageHeader } from '../../components/ui/page-header.js';
import { useAuth } from '../../context/use-auth.js';
import { useTheme } from '../../context/use-theme.js';
import {
  authService,
  createOAuthClientState,
  OAUTH_CLIENT_STATE_KEY,
  type OAuthProvider,
  type OAuthProviderStatus,
} from '../../services/auth/auth.service.js';

/**
 * Renders the settings page interface.
 */
export function SettingsPage() {
  const { user } = useAuth();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState<OAuthProviderStatus>({
    google: false,
    github: false,
    gitlab: false,
  });
  const [linkedProviders, setLinkedProviders] = useState<OAuthProvider[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<OAuthProvider | null>(null);
  const [providerMessage, setProviderMessage] = useState('');
  const [providerError, setProviderError] = useState(false);
  const [compact, setCompact] = useState(
    () => window.localStorage.getItem('cartograph.ui.compact') === 'true',
  );
  useEffect(() => {
    document.documentElement.dataset.compact = String(compact);
    return () => {
      delete document.documentElement.dataset.compact;
    };
  }, [compact]);
  useEffect(() => {
    void Promise.all([authService.oauthProviders(), authService.linkedProviders()])
      .then(([status, linked]) => {
        setProviders(status);
        setLinkedProviders(linked);
      })
      .catch(() => setProviderMessage('Could not load connected sign-in providers.'));
  }, []);
  useEffect(() => {
    const linked = searchParams.get('oauth');
    const error = searchParams.get('oauth_error');
    const clientState = searchParams.get('client_state');
    const savedState = window.sessionStorage.getItem(OAUTH_CLIENT_STATE_KEY);
    const callbackMatches = clientState !== null && clientState === savedState;
    if (clientState !== null) window.sessionStorage.removeItem(OAUTH_CLIENT_STATE_KEY);
    if (callbackMatches && linked === 'linked') {
      setProviderMessage('Sign-in provider connected.');
      setProviderError(false);
    } else if (callbackMatches && error) {
      setProviderMessage(
        error === 'account_conflict'
          ? 'That provider is linked to another CartoGraph account.'
          : 'Provider connection could not be completed. Please try again.',
      );
      setProviderError(true);
    } else if (linked || error) {
      setProviderMessage('The provider connection could not be verified. Please try again.');
      setProviderError(true);
    }
    if (linked || error) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  /**
   * Applies the supplied changes to the selected project.
   * @param key - The key value used by this operation.
   * @param value - The value value used by this operation.
   * @param updateState - The update state value used by this operation.
   */
  function update(key: string, value: boolean, updateState: (next: boolean) => void) {
    window.localStorage.setItem(key, String(value));
    updateState(value);
  }
  async function linkProvider(provider: OAuthProvider) {
    setLinkingProvider(provider);
    setProviderMessage('');
    try {
      const clientState = createOAuthClientState();
      window.sessionStorage.setItem(OAUTH_CLIENT_STATE_KEY, clientState);
      const authorizationUrl = await authService.startAccountLink(provider, clientState);
      window.location.assign(authorizationUrl);
    } catch (error) {
      setProviderError(true);
      setProviderMessage(
        error instanceof Error ? error.message : 'Could not start provider linking.',
      );
      setLinkingProvider(null);
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        description="Manage your profile and local workspace preferences."
      />
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <CircleUserRound size={18} />
          </span>
          <div>
            <h2>Profile</h2>
            <p>Your account information from CartoGraph.</p>
          </div>
        </div>
        <div className="settings-profile">
          <span className="profile-avatar">{user?.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <span className="read-only-pill">Read only</span>
        </div>
        <p className="muted-note">Profile editing is not available in the current backend.</p>
      </section>
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <CircleUserRound size={18} />
          </span>
          <div>
            <h2>Sign-in providers</h2>
            <p>Connect an identity provider to use it for future sign-ins.</p>
          </div>
        </div>
        {providerMessage && (
          <p className={providerError ? 'inline-error' : 'security-note'} role="status">
            {providerMessage}
          </p>
        )}
        {(['google', 'github', 'gitlab'] as const).map((provider) => {
          const connected = linkedProviders.includes(provider);
          const available = providers[provider];
          const title = provider[0]!.toUpperCase() + provider.slice(1);
          return (
            <div className="account-setting-row" key={provider}>
              <div>
                <strong>{title}</strong>
                <small>
                  {connected
                    ? 'Connected to this CartoGraph account.'
                    : available
                      ? 'Use this provider as an alternate sign-in.'
                      : 'Provider sign-in is not configured on the server.'}
                </small>
              </div>
              {connected ? (
                <span className="read-only-pill">Connected</span>
              ) : (
                <button
                  className="button button-outline button-small"
                  disabled={!available || linkingProvider !== null}
                  onClick={() => void linkProvider(provider)}
                >
                  {linkingProvider === provider ? (
                    'Connecting…'
                  ) : (
                    <>
                      {provider === 'github' ? <Github size={14} /> : <GitBranch size={14} />}
                      Connect
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </section>
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <CircleUserRound size={18} />
          </span>
          <div>
            <h2>Account</h2>
            <p>Manage the current signed-in session.</p>
          </div>
        </div>
        <div className="account-setting-row">
          <div>
            <strong>{user?.email}</strong>
            <small>Your session is authenticated with a CartoGraph access token.</small>
          </div>
          <button
            className="button button-outline button-small"
            onClick={() =>
              void signOut()
                .catch(() => undefined)
                .finally(() => navigate('/login'))
            }
          >
            Sign out <ArrowRight size={14} />
          </button>
        </div>
      </section>
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <GitBranch size={18} />
          </span>
          <div>
            <h2>Repository preferences</h2>
            <p>Repository defaults are managed on each project.</p>
          </div>
        </div>
        <div className="account-setting-row">
          <div>
            <strong>Default branch and repository URL</strong>
            <small>
              Choose a default branch when connecting a project. Analysis jobs are pinned to an
              exact commit SHA.
            </small>
          </div>
          <Link className="button button-outline button-small" to="/projects">
            Manage projects <ArrowRight size={14} />
          </Link>
        </div>
      </section>
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <Paintbrush size={18} />
          </span>
          <div>
            <h2>Appearance</h2>
            <p>Personalize how your workspace is displayed.</p>
          </div>
        </div>
        <PreferenceRow
          icon={theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
          title="Color theme"
          description="Switch between the default classic light appearance and dark appearance."
          control={
            <div className="segmented-control" role="group" aria-label="Theme selection">
              <button
                type="button"
                className={`segmented-btn${theme === 'light' ? ' segmented-btn-active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <Sun size={14} /> Light
              </button>
              <button
                type="button"
                className={`segmented-btn${theme === 'dark' ? ' segmented-btn-active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          }
        />
        <PreferenceRow
          icon={<Moon size={17} />}
          title="Compact tables"
          description="Reduce row spacing in repository and file tables."
          control={
            <input
              type="checkbox"
              checked={compact}
              onChange={(event) =>
                update('cartograph.ui.compact', event.target.checked, setCompact)
              }
            />
          }
        />
      </section>
      <section className="settings-section panel">
        <div className="settings-section-heading">
          <span className="settings-section-icon">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2>Security</h2>
            <p>Authentication is handled by your signed CartoGraph session.</p>
          </div>
        </div>
        <PreferenceRow
          icon={<LockKeyhole size={17} />}
          title="Token storage"
          description="Session tokens are kept in this browser session unless you select “Keep me signed in”."
          control={<span className="preference-static">JWT</span>}
        />
        <div className="security-note">
          <ShieldCheck size={16} />
          <span>Signing out revokes the current token through Redis.</span>
        </div>
      </section>
    </div>
  );
}

/**
 * Renders the preference row interface.
 * @param props - The component properties.
 */
function PreferenceRow({
  icon,
  title,
  description,
  control,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="preference-row">
      <span className="preference-icon">{icon}</span>
      <div className="preference-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
      <div className="preference-control">{control}</div>
    </div>
  );
}
