import { AlertCircle, Boxes, LoaderCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Renders the loading state interface.
 * @param props - The component properties.
 */
export function LoadingState({ label = 'Loading your workspace' }: { label?: string }) {
  return (
    <div className="state-card" role="status">
      <LoaderCircle className="spin text-brand" size={22} />
      <span>{label}</span>
    </div>
  );
}

/**
 * Renders the loading screen interface.
 * @param props - The component properties.
 */
export function LoadingScreen({ label }: { label: string }) {
  return (
    <main className="loading-screen">
      <LoadingState label={label} />
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
      <AlertCircle size={20} />
      <span>{message}</span>
      {retry && (
        <button className="button button-small button-outline" onClick={retry}>
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
      <span className="empty-icon">
        <Boxes size={22} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && (
        <Link className="button button-primary button-small" to={action.to}>
          {action.label}
        </Link>
      )}
    </div>
  );
}
