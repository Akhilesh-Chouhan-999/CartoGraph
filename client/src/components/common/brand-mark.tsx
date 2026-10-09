import { BarChart3 } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
  inverse?: boolean;
}

/**
 * Renders the brand mark interface.
 * @param props - The component properties.
 */
export function BrandMark({ compact = false, inverse = false }: BrandMarkProps) {
  return (
    <span className={`brand-mark${inverse ? ' brand-mark-inverse' : ''}`}>
      <span className="brand-symbol">
        <BarChart3 size={21} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span>
          Carto<span className="brand-graph">Graph</span>
        </span>
      )}
    </span>
  );
}
