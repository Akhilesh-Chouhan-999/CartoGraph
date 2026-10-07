import { ArrowRight } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from '../components/common/brand-mark.js';

export function AuthLayout() {
  return (
    <main className="auth-shell">
      <section className="auth-story">
        <Link to="/">
          <BrandMark />
        </Link>
        <div className="auth-story-content">
          <h1>Understand your codebase.</h1>
          <div className="auth-flow" aria-label="Example dependency flow">
            <span>routes/orders.ts</span>
            <ArrowRight size={18} />
            <span>controllers/orders.ts</span>
            <ArrowRight size={18} />
            <span>services/orders.ts</span>
          </div>
        </div>
        <div className="auth-story-foot">
          <p>Get instant codebase clarity. Connect your GitHub and start mapping in seconds.</p>
          <div className="auth-tech">
            <span>TypeScript</span>
            <span>JavaScript</span>
            <span>AST verified graph</span>
          </div>
        </div>
      </section>
      <section className="auth-form-side">
        <Outlet />
      </section>
    </main>
  );
}
