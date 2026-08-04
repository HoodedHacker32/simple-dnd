import { Suspense, lazy, useState } from 'react';
import { CONTENT } from '../content';
import { makeRoll, type Roll } from './dice';
import './DiceRoller.css';

// Three.js is a few hundred kilobytes, so the dice arrive after the screen does.
const Die3D = lazy(() => import('./Die3D').then((m) => ({ default: m.Die3D })));

function DieSlot({ sides, value, rolling }: { sides: 4 | 20; value: number | null; rolling: boolean }) {
  return (
    <Suspense fallback={<div className="die-3d die-loading" style={{ width: 96, height: 96 }} />}>
      <Die3D sides={sides} value={value} rolling={rolling} />
    </Suspense>
  );
}

/** The dice themselves, with the protect-throw targets reacting to the last d20. */
export function DicePad({ onRoll }: { onRoll: (roll: Roll) => void }) {
  const [last, setLast] = useState<Roll | null>(null);
  const [rolling, setRolling] = useState<4 | 20 | null>(null);
  const [pending, setPending] = useState<Roll | null>(null);

  const roll = (sides: 4 | 20, label: string) => {
    const result = makeRoll(sides, label);
    // The die knows its result immediately so it can land on the right face;
    // the readout waits until it has stopped tumbling.
    setPending(result);
    setRolling(sides);
    window.setTimeout(() => {
      setLast(result);
      setPending(null);
      setRolling(null);
      onRoll(result);
    }, 950);
  };

  const faceFor = (sides: 4 | 20) => {
    if (pending?.die === sides) return pending.value;
    return last?.die === sides ? last.value : null;
  };

  return (
    <div className="dice-stage parchment-surface">
      <div className="dice-buttons">
        <button className="die-btn" onClick={() => roll(4, 'Movement')} disabled={rolling !== null}>
          <DieSlot sides={4} value={faceFor(4)} rolling={rolling === 4} />
          <span className="die-label">d4</span>
          <span className="die-sub">Movement</span>
        </button>

        <button className="die-btn" onClick={() => roll(20, 'd20')} disabled={rolling !== null}>
          <DieSlot sides={20} value={faceFor(20)} rolling={rolling === 20} />
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
                last?.die === 20 && rolling === null ? (last.value >= t.target ? ' ref-pass' : ' ref-miss') : ''
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
