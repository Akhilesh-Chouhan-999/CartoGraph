import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Bot,
  GitBranch,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: ScanSearch,
    title: 'Automated AST analysis',
    text: 'Trace imports, exports, and module references directly from your JavaScript and TypeScript source.',
  },
  {
    icon: Waypoints,
    title: 'Blast radius',
    text: 'See which files depend on a module before a change turns into a surprise.',
  },
  {
    icon: Bot,
    title: 'Grounded code assistant',
    text: 'Ask questions about your architecture with answers tied to verified graph data.',
  },
  {
    icon: ShieldCheck,
    title: 'Impact tracking',
    text: 'Follow dependency paths and understand how each layer connects.',
  },
];

export function HomePage() {
  return (
    <main>
      <section className="hero-section" id="product">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" /> CODEBASE INTELLIGENCE FOR TEAMS
          </div>
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
              Analyze a repository <ArrowRight size={18} />
            </Link>
            <a
              className="button button-outline button-large"
              href="https://github.com/Akhilesh-Chouhan-999/CartoGraph"
              target="_blank"
              rel="noreferrer"
            >
              View GitHub <ArrowUpRight size={17} />
            </a>
          </div>
          <div className="hero-proof">
            <span>
              <ShieldCheck size={15} /> Deterministic dependency graph
            </span>
            <span>
              <GitBranch size={15} /> No source execution
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-toolbar">
            <span className="window-dots">
              <i />
              <i />
              <i />
            </span>
            <span className="visual-address">
              <GitBranch size={14} /> Sample architecture · illustrative
            </span>
            <span className="visual-zoom">− &nbsp; 100% &nbsp; +</span>
          </div>
          <div className="visual-canvas">
            <div className="visual-grid" />
            <span className="map-label map-entry">Entry point</span>
            <div className="map-node node-entry">
              <span className="node-dot" />
              <b>api.ts</b>
              <small>Entry point</small>
            </div>
            <div className="map-node node-controller">
              <span className="node-dot" />
              <b>project.controller.ts</b>
              <small>Controller</small>
            </div>
            <div className="map-node node-service">
              <span className="node-dot" />
              <b>project.service.ts</b>
              <small>Service</small>
            </div>
            <div className="map-node node-repository">
              <span className="node-dot" />
              <b>project.repository.ts</b>
              <small>Repository</small>
            </div>
            <div className="map-node node-model">
              <span className="node-dot" />
              <b>project.model.ts</b>
              <small>Model</small>
            </div>
            <div className="map-edge edge-1" />
            <div className="map-edge edge-2" />
            <div className="map-edge edge-3" />
            <div className="map-edge edge-4" />
            <div className="map-insight">
              <span className="insight-icon">
                <Sparkles size={14} />
              </span>
              <span>
                <strong>Verified path</strong>
                <small>api → controller → service → repository</small>
              </span>
            </div>
          </div>
          <div className="visual-footer">
            <span>
              <i className="pulse-dot" /> Example static-analysis flow
            </span>
            <span>
              5 example files <ArrowDown size={13} />
            </span>
          </div>
        </div>
        <div className="hero-scroll">
          <span /> Explore the platform
        </div>
      </section>
      <section className="trust-strip">
        <span>BUILT FOR COMPLEX CODEBASES</span>
        <div>
          <b>TypeScript</b>
          <b>JavaScript</b>
          <b>ES Modules</b>
          <b>CommonJS</b>
        </div>
      </section>
      <section className="feature-section section-container" id="features">
        <div className="section-heading">
          <span className="eyebrow">FROM CODE TO CLARITY</span>
          <h2>See how your system really works.</h2>
          <p>
            Explore architecture from verified code relationships, then use AI to make sense of what
            you find.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article className="feature-card" key={title}>
              <span className={`feature-icon feature-${index}`}>
                <Icon size={20} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-index">0{index + 1}</span>
            </article>
          ))}
        </div>
      </section>
      <section className="method-section" id="documentation">
        <div className="section-container method-inner">
          <div>
            <span className="eyebrow">TRUST THE GRAPH</span>
            <h2>
              AI explains.
              <br />
              <span>Static analysis verifies.</span>
            </h2>
            <p>
              CartoGraph’s graph is built by parsing the repository. AI can explain verified
              relationships, but it never creates them.
            </p>
            <Link to="/register" className="text-link">
              Start exploring <ArrowRight size={16} />
            </Link>
          </div>
          <div className="method-steps">
            <div>
              <span>01</span>
              <div>
                <strong>Scan a commit</strong>
                <small>Analyze an exact repository revision.</small>
              </div>
            </div>
            <div>
              <span>02</span>
              <div>
                <strong>Build the graph</strong>
                <small>Resolve local imports and module relationships.</small>
              </div>
            </div>
            <div>
              <span>03</span>
              <div>
                <strong>Explore with context</strong>
                <small>Trace paths, impacts, and grounded explanations.</small>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="bottom-cta" id="pricing">
        <Network size={20} />
        <h2>Make your next code change with context.</h2>
        <p>Start with a repository commit and get a clear map of its architecture.</p>
        <Link className="button button-primary button-large" to="/register">
          Analyze a repository <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}
