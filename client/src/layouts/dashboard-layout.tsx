import {
  Activity,
  BotMessageSquare,
  Boxes,
  ChevronLeft,
  CircleUserRound,
  Files,
  LayoutDashboard,
  LogOut,
  Settings,
  Waypoints,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { BrandMark } from '../components/common/brand-mark.js';
import { TopBar } from '../components/layout/top-bar.js';
import { useAuth } from '../context/use-auth.js';

const navigation = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', icon: Boxes },
  { label: 'Analyses', to: '/analyses', icon: Activity },
  { label: 'Dependency Graph', to: '/analyses', icon: Waypoints },
  { label: 'Files', to: '/analyses', icon: Files },
  { label: 'AI Chat', to: '/analyses', icon: BotMessageSquare },
];

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [navigationFilter, setNavigationFilter] = useState('');
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function logout() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className={`workspace${collapsed ? ' workspace-collapsed' : ''}`}>
      {mobileOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar${mobileOpen ? ' sidebar-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <BrandMark />
          <button
            className="icon-button collapse-button"
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed((value) => !value)}
          >
            <ChevronLeft size={18} />
          </button>
        </div>
        <label className="sidebar-search">
          <span className="sr-only">Filter navigation</span>
          <input
            value={navigationFilter}
            onChange={(event) => setNavigationFilter(event.target.value)}
            placeholder="Search"
            aria-label="Search navigation"
          />
        </label>
        <div className="nav-section-label">WORKSPACE</div>
        <nav className="side-navigation">
          {navigation
            .filter(({ label }) =>
              label.toLowerCase().includes(navigationFilter.trim().toLowerCase()),
            )
            .map(({ label, to, icon: Icon }) => {
              const active =
                label === 'Overview'
                  ? location.pathname === to
                  : label === 'Projects'
                    ? location.pathname.startsWith('/projects')
                    : label === 'Analyses'
                      ? location.pathname.startsWith('/analyses') &&
                        !location.pathname.includes('/graph') &&
                        !location.pathname.includes('/files') &&
                        !location.pathname.includes('/chat')
                      : label === 'Dependency Graph'
                        ? location.pathname.includes('/graph')
                        : label === 'Files'
                          ? location.pathname.includes('/files')
                          : location.pathname.includes('/chat');
              return (
                <NavLink
                  key={label}
                  to={to}
                  className={`side-link${active ? ' side-link-active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          {navigation.every(
            ({ label }) => !label.toLowerCase().includes(navigationFilter.trim().toLowerCase()),
          ) && <span className="sidebar-no-results">No matching pages</span>}
        </nav>
        <div className="sidebar-spacer" />
        <NavLink
          to="/settings"
          className={`side-link settings-link${location.pathname === '/settings' ? ' side-link-active' : ''}`}
          onClick={() => setMobileOpen(false)}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
        <div className="account-menu-wrap">
          {accountOpen && (
            <div className="account-popover">
              <div className="account-email">{user?.email}</div>
              <button onClick={() => void logout()}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
          <button
            className="account-button"
            onClick={() => setAccountOpen((value) => !value)}
            aria-expanded={accountOpen}
          >
            <span className="avatar">
              <CircleUserRound size={20} />
            </span>
            <span className="account-copy">
              <strong>{user?.name ?? 'Your account'}</strong>
              <small>{user?.email ?? ''}</small>
            </span>
            <span className="account-dots">···</span>
          </button>
        </div>
      </aside>
      <div className="workspace-main">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main className="workspace-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
