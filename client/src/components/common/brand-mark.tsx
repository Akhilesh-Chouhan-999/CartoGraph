import { GitBranch } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <span className={`brand-mark${inverse ? ' brand-mark-inverse' : ''}`}>
      <span className="brand-symbol">
        <GitBranch size={21} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span>
          Carto<span className="brand-graph">Graph</span>
        </span>
      )}
    </span>
  );
}
