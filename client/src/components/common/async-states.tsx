import { AlertCircle, Boxes, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Renders the loading state interface.
 * @param props - The component properties.
 */
export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="state-card state-loading" role="status" aria-live="polite">
      <LoaderCircle className="spin text-brand" size={22} aria-hidden="true" />
      <span className="state-label">{label}</span>
    </div>
  );
}

/**
 * Renders the loading screen interface.
 * @param props - The component properties.
 */
export function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen-inner">
        <LoaderCircle className="spin text-brand" size={28} aria-hidden="true" />
        <span className="state-label">{label}</span>
      </div>
    </main>
  );
}

/**
 * Renders the error state interface.
 * @param props - The component properties.
 */
export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="state-card state-error" role="alert">
      <div className="state-error-icon" aria-hidden="true">
        <AlertCircle size={20} />
      </div>
      <div className="state-error-content">
        <strong className="state-error-title">An error occurred</strong>
        <p className="state-error-message">{message}</p>
      </div>
      {retry && (
        <button
          type="button"
          className="button button-small button-outline state-retry-btn"
          onClick={retry}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/**
 * Renders the empty state interface.
 * @param props - The component properties.
 */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        <Boxes size={24} />
      </span>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {action && (
        <Link className="button button-primary button-small empty-action" to={action.to}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
