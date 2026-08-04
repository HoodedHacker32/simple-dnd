import { useState } from 'react';
import { CONTENT } from '../content';
import { makeRoll, type Roll } from './dice';
import './DiceRoller.css';

const D4 = 'M32 3 L60 56 L4 56 Z';
const D20 = 'M32 2 L58 17 L58 47 L32 62 L6 47 L6 17 Z';

function Die({ sides, value, rolling }: { sides: number; value: number | null; rolling: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={`die-face${rolling ? ' die-rolling' : ''}`} aria-hidden="true">
      <path
        d={sides === 4 ? D4 : D20}
        fill="var(--die-fill, rgba(0,0,0,0.35))"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <text x="32" y={sides === 4 ? 46 : 40} textAnchor="middle" className="die-number" fill="currentColor">
        {value ?? sides}
      </text>
    </svg>
  );
}

/** The dice themselves, with the protect-throw targets reacting to the last d20. */
export function DicePad({ onRoll }: { onRoll: (roll: Roll) => void }) {
  const [last, setLast] = useState<Roll | null>(null);
  const [rolling, setRolling] = useState(false);

  const roll = (sides: number, label: string) => {
    setRolling(true);
    const result = makeRoll(sides, label);
    // Let the tumble play before the number lands.
    window.setTimeout(() => {
      setLast(result);
      setRolling(false);
      onRoll(result);
    }, 380);
  };

  return (
    <div className="dice-stage parchment-surface">
      <div className="dice-buttons">
        <button className="die-btn" onClick={() => roll(4, 'Movement')} disabled={rolling}>
          <Die sides={4} value={rolling ? null : last?.die === 4 ? last.value : null} rolling={rolling} />
          <span className="die-label">d4</span>
          <span className="die-sub">Movement</span>
        </button>

        <button className="die-btn" onClick={() => roll(20, 'd20')} disabled={rolling}>
          <Die sides={20} value={rolling ? null : last?.die === 20 ? last.value : null} rolling={rolling} />
          <span className="die-label">d20</span>
          <span className="die-sub">Everything else</span>
        </button>
      </div>

      {last && !rolling && (
        <div className={`dice-result${last.critical ? ' dice-crit' : ''}${last.fumble ? ' dice-fumble' : ''}`}>
          <span className="dice-result-value">{last.value}</span>
          <span className="dice-result-label">
            {last.critical
              ? 'Natural 20 — a critical'
              : last.fumble
                ? 'Natural 1 — a fumble'
                : `on a d${last.die}`}
          </span>
        </div>
      )}

      {last?.die === 4 && !rolling && (
        <p className="dice-note">Multiply by the mover's Speed multiplier, then round down.</p>
      )}

      <div className="dice-reference">
        <h4 className="dice-ref-title">Protect throws</h4>
        <div className="dice-ref-rows">
          {CONTENT.mechanics.protectThrows.map((t) => (
            <div
              className={`dice-ref-row${
                last?.die === 20 && !rolling ? (last.value >= t.target ? ' ref-pass' : ' ref-miss') : ''
              }`}
              key={t.speed}
            >
              <span>
                {t.label} <em>({t.speed})</em>
              </span>
              <strong>{t.target}+</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Everything rolled so far, newest first. */
export function RollLog({ history, onClear }: { history: Roll[]; onClear: () => void }) {
  return (
    <div className="dice-history">
      <div className="dice-history-head">
        <h4>Recent rolls</h4>
        {history.length > 0 && (
          <button className="btn btn-ghost dice-clear" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      {history.length === 0 && <p className="hint">Nothing rolled yet.</p>}
      <ul className="dice-log">
        {history.map((r) => (
          <li key={r.id} className={r.outcomeFailed ? 'log-fail' : undefined}>
            <span className="log-die">d{r.die}</span>
            <span className="log-value">{r.value}</span>
            <span className="log-label">
              {r.label}
              {r.outcome ? ` — ${r.outcome}` : ''}
              {r.totalLabel ? ` (${r.totalLabel})` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
