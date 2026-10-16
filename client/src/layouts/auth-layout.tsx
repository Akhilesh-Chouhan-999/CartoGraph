import { ArrowRight } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import { BrandMark } from '../components/common/brand-mark.js';

/**
 * Renders the auth layout interface matching the design mockups.
 */
export function AuthLayout() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  return (
    <main className="auth-shell">
      <div className="auth-top-switch">
        {isRegister ? (
          <span>
            Already have an account? <Link to="/login">Sign in</Link>
          </span>
        ) : (
          <span>
            No account? <Link to="/register">Sign up</Link>
          </span>
        )}
      </div>

      <section className="auth-story">
        <div className="auth-story-brand">
          <Link to="/" aria-label="CartoGraph home">
            <BrandMark />
          </Link>
        </div>

        <div className="auth-story-content">
          <h1>Understand your codebase.</h1>

          <div className="auth-flow" aria-label="Example dependency flow">
            <div className="auth-flow-node">
              <code>routes/orders.ts</code>
            </div>
            <ArrowRight className="auth-flow-arrow" size={16} aria-hidden="true" />
            <div className="auth-flow-node">
              <code>controllers/orders.ts</code>
            </div>
            <ArrowRight className="auth-flow-arrow" size={16} aria-hidden="true" />
            <div className="auth-flow-node">
              <code>services/orders.ts</code>
            </div>
          </div>
        </div>

        <div className="auth-story-foot">
          <p>
            Get instant codebase clarity.
            <br />
            Connect your GitHub and start mapping in seconds.
          </p>
          <div className="auth-tech">
            <span className="tech-badge tech-ts">
              <span className="badge-chip ts-chip">TS</span> TypeScript
            </span>
            <span className="tech-badge tech-js">
              <span className="badge-chip js-chip">JS</span> JavaScript
            </span>
            <span className="tech-badge tech-py">
              <span className="badge-chip py-chip">🐍</span> Python
            </span>
            <span className="tech-badge tech-go">
              <span className="badge-chip go-chip">GO</span> Go
            </span>
          </div>
        </div>
      </section>

      <section className="auth-form-side">
        <Outlet />
      </section>
    </main>
  );
}
