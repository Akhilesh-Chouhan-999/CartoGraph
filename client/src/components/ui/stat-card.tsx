import type { ReactNode } from 'react';

/**
 * Renders the stat card interface.
 * @param props - The component properties.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  tone?: 'blue' | 'cyan' | 'purple' | 'green';
}) {
  return (
    <article className="stat-card">
      <span className={`stat-icon tone-${tone}`}>{icon}</span>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </article>
  );
}
