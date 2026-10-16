import { HelpCircle, LineChart, ScanSearch, Sparkles, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';

import { InteractiveHeroGraph } from '../../components/landing/interactive-hero-graph.js';

const features = [
  {
    icon: ScanSearch,
    title: 'Automated AST Analysis',
    text: 'Automated AST analysis and architecture extraction.',
  },
  {
    icon: Waypoints,
    title: 'Blast Radius Simulation',
    text: 'Map dependency blast radius before making breaking changes.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Code Assistant',
    text: 'AI-powered code assistant grounded in your graph architecture.',
  },
  {
    icon: LineChart,
    title: 'Impact Tracking',
    text: 'Impact tracking and dependency monitoring across commits.',
  },
];

/**
 * Renders the home page interface.
 */
export function HomePage() {
  return (
    <main className="landing-main">
      <section className="hero-section" id="product">
        <div className="hero-copy">
          <h1>
            Understand your
            <br />
            <span>codebase. Visually.</span>
          </h1>
          <p>
            Analyze your GitHub repositories, map real dependencies, explore architecture, and ask
            AI questions grounded in your codebase.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" to="/register">
              Analyze a Repository
            </Link>
            <a
              className="button button-outline button-large"
              href="https://github.com/Akhilesh-Chouhan-999/CartoGraph"
              target="_blank"
              rel="noreferrer"
            >
              View Demo / View GitHub
            </a>
          </div>
          <div className="hero-repo-form">
            <strong>Input GitHub URL</strong>
            <div>
              <input
                aria-label="GitHub repository URL"
                defaultValue="github.com/Akhilesh-Chouhan-999/CartoGraph"
                placeholder="github.com/owner/repository"
              />
              <Link className="button button-primary button-small" to="/register">
                Analyze Repo
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <InteractiveHeroGraph />
        </div>
      </section>

      <section className="feature-cards-row">
        {features.map(({ icon: Icon, title, text }) => (
          <article className="landing-feature-card" key={title}>
            <span className="landing-feature-icon">
              <Icon size={20} />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="landing-bottom-bar">
        <div className="quick-scan-pill">
          <span className="scan-pill-icon">
            <ScanSearch size={18} />
          </span>
          <div className="scan-pill-copy">
            <strong>Quick scan available without installation</strong>
            <span>Quick scan available widget quick scan available without installation.</span>
          </div>
        </div>

        <div className="ecosystem-strip">
          <span className="ecosystem-label">Supported ecosystem</span>
          <div className="ecosystem-badges">
            <span className="eco-badge eco-ts">TS</span>
            <span className="eco-badge eco-py">🐍</span>
            <span className="eco-badge eco-js">JS</span>
            <span className="eco-badge eco-go">Go</span>
          </div>
        </div>

        <div className="trusted-strip">
          <span>Trusted by developers at...</span>
          <div className="trusted-avatars">
            <span className="trusted-avatar">👤</span>
            <span className="trusted-badge">TS</span>
            <span className="trusted-badge">🐙</span>
          </div>
        </div>

        <button className="help-fab" aria-label="Help and documentation">
          <HelpCircle size={22} />
        </button>
      </section>
    </main>
  );
}
