import { CheckCircle2, CircleAlert, Clock3, LoaderCircle } from 'lucide-react';

import type { AnalysisStatus } from '../../types/domain.js';

const statusConfig: Record<AnalysisStatus, { label: string; icon: typeof Clock3 }> = {
  queued: { label: 'Queued', icon: Clock3 },
  processing: { label: 'Processing', icon: LoaderCircle },
  completed: { label: 'Completed', icon: CheckCircle2 },
  failed: { label: 'Failed', icon: CircleAlert },
};

/**
 * Renders the status badge interface.
 * @param props - The component properties.
 */
export function StatusBadge({ status }: { status: AnalysisStatus }) {
  const { label, icon: Icon } = statusConfig[status];
  return (
    <span className={`status-badge status-${status}`}>
      <Icon size={14} />
      {label}
    </span>
  );
}
