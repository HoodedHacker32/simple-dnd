import type { StatBlock } from '../../types/character';
import { STATS, STAT_ORDER } from '../../types/character';
import { formatModifier } from '../../engine/statCalculator';
import './StatEditor.css';

interface StatEditorProps {
  value: StatBlock;
  onChange: (next: StatBlock) => void;
  accent?: string;
}

export function StatEditor({ value, onChange, accent = 'var(--gold)' }: StatEditorProps) {
  const set = (key: keyof StatBlock, n: number) => onChange({ ...value, [key]: n });

  return (
    <div className="stat-editor" style={{ '--stat-accent': accent } as React.CSSProperties}>
      {STAT_ORDER.map((key) => (
        <div className="stat-edit-row" key={key}>
          <span className="stat-edit-abbr">{STATS[key].abbr}</span>
          <span className="stat-edit-name">{STATS[key].label}</span>
          <div className="stat-stepper">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => set(key, Math.max(-5, value[key] - 1))}
              aria-label={`Decrease ${STATS[key].label}`}
            >
              −
            </button>
            <span className="stepper-value">{formatModifier(value[key])}</span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => set(key, Math.min(5, value[key] + 1))}
              aria-label={`Increase ${STATS[key].label}`}
            >
              +
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
