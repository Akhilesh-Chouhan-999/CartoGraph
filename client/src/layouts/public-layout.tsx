import { ArrowRight, Github, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from '../components/common/brand-mark.js';

/**
 * Renders the public layout interface.
 */
export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="public-shell">
      <header className="public-nav">
        <Link to="/" aria-label="CartoGraph home">
          <BrandMark />
        </Link>
        <button
          className="icon-button mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={menuOpen ? 'public-links public-links-open' : 'public-links'}>
          <a href="/#product" onClick={() => setMenuOpen(false)}>
            Product
          </a>
          <a href="/#features" onClick={() => setMenuOpen(false)}>
            Features
          </a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)}>
            Pricing
          </a>
          <a href="/#documentation" onClick={() => setMenuOpen(false)}>
            Documentation
          </a>
          <a
            href="https://github.com/Akhilesh-Chouhan-999/CartoGraph"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} /> GitHub
          </a>
        </nav>
        <Link className="button button-primary public-cta" to="/register">
          Analyze a repository <ArrowRight size={16} />
        </Link>
      </header>
      <Outlet />
      <footer className="public-footer">
        <BrandMark />
        <span>Static analysis you can trust. AI explanations you can verify.</span>
        <small>© {new Date().getFullYear()} CartoGraph</small>
      </footer>
    </div>
  );
}
