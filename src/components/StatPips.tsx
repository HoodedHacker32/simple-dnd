import './StatPips.css';

interface StatPipsProps {
  value: number;
  max?: number;
  accent?: string;
}

/** Renders a stat value as filled/empty gems, with overflow shown numerically. */
export function StatPips({ value, max = 4, accent = 'var(--gold)' }: StatPipsProps) {
  const filled = Math.max(0, Math.min(max, value));
  const overflow = value - filled;
  const negative = value < 0;

  return (
    <span className="stat-pips" style={{ '--pip-accent': accent } as React.CSSProperties}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`pip${i < filled ? ' pip-filled' : ''}${negative && i === 0 ? ' pip-drained' : ''}`} />
      ))}
      {overflow > 0 && <span className="pip-overflow">+{overflow}</span>}
      {negative && <span className="pip-overflow pip-negative">{value}</span>}
    </span>
  );
}
