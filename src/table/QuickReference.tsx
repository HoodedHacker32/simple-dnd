import { useState } from 'react';
import { CONTENT } from '../content';
import './QuickReference.css';

/**
 * The handful of tables a DM reaches for mid-turn. Built from the same mechanics
 * the engine uses, so it cannot drift from what the app calculates.
 */
export function QuickReference() {
  const m = CONTENT.mechanics;
  const [open, setOpen] = useState<string>('');

  const section = (id: string, title: string, body: React.ReactNode) => (
    <div className={`qr-section${open === id ? ' qr-open' : ''}`} key={id}>
      <button className="qr-head" onClick={() => setOpen(open === id ? '' : id)}>
        <span className="qr-caret" aria-hidden="true" />
        {title}
      </button>
      {open === id && <div className="qr-body">{body}</div>}
    </div>
  );

  const row = (k: string, v: string) => (
    <div className="qr-row" key={k}>
      <span>{k}</span>
      <strong>{v}</strong>
    </div>
  );

  return (
    <div className="quick-ref">
      <h4 className="qr-title">At a glance</h4>

      {section(
        'turn',
        'A turn',
        <ol className="qr-steps">
          {[
            'Highest Speed acts first, down to the lowest. Equal speeds — the players decide between them.',
            `Roll a d${m.movement.die} for movement, multiply, round down.`,
            'One attack or one spell, before, during or after moving.',
            'Melee reaches one tile in any direction, like a king. Two creatures never share a tile.',
          ].map((step, i) => (
            <li key={i}>
              <span className="qr-step-n">{i + 1}</span>
              <span className="qr-step-text">{step}</span>
            </li>
          ))}
        </ol>,
      )}

      {section(
        'movement',
        'Movement by Speed',
        <>
          {m.movement.multipliers.map((v, i) =>
            row(`Speed ${i}`, v === null ? 'Cannot move' : `${v}x the roll — ${Math.floor(m.movement.die * v)} max`),
          )}
        </>,
      )}

      {section(
        'weapons',
        'Weapons by Strength',
        <>{m.weaponAccess.map((text, i) => row(`Strength ${i}`, text))}</>,
      )}

      {section(
        'stealth',
        'Stealth by Dexterity',
        <>
          <p className="qr-note">Left is when the odds favour them, right when being seen is likely.</p>
          {m.stealth.likely.map((v, i) => row(`Dexterity ${i}`, `${v}+  /  ${m.stealth.unlikely[i] ?? '—'}+`))}
        </>,
      )}

      {section(
        'mana',
        'Mana',
        <>
          {row('Carried', String(m.mana.max))}
          {row('Sleeping', 'Full restore')}
          {row('Monsters', 'Can drop mana')}
          {row('Meditating', `+${m.mana.meditationPerTurn} per whole turn`)}
          <p className="qr-note">Meditating takes the turn — no moving, no defending.</p>
        </>,
      )}
    </div>
  );
}
