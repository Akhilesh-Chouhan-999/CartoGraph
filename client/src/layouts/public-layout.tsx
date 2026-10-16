import { ArrowRight, Github, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';

import { BrandMark } from '../components/common/brand-mark.js';
import { useTheme } from '../context/use-theme.js';

/**
 * Renders the public layout interface.
 */
export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
        <div className="public-nav-actions">
          <button
            className="icon-button theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <Link className="button button-primary public-cta" to="/register">
            Analyze a repository <ArrowRight size={16} />
          </Link>
        </div>
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
