import {
  ArrowRight,
  CircleUserRound,
  GitBranch,
  LockKeyhole,
  Moon,
  Paintbrush,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { PageHeader } from '../../components/ui/page-header.js';
import { useAuth } from '../../context/use-auth.js';

/**
 * Renders the settings page interface.
 */
export function SettingsPage() {
  const { user } = useAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [compact, setCompact] = useState(
    () => window.localStorage.getItem('cartograph.ui.compact') === 'true',
  );
  useEffect(() => {
    document.documentElement.dataset.compact = String(compact);
    return () => {
      delete document.documentElement.dataset.compact;
    };
  }, [compact]);
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
          icon={<Sun size={17} />}
          title="Light appearance"
          description="CartoGraph uses the light interface shown in the product design."
          control={
            <span className="preference-static">
              <Sun size={14} /> Light
            </span>
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
