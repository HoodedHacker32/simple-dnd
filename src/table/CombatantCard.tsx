import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Spell } from '../types/spells';
import { healingFrom, makeRoll, resolveSpell, type Roll } from './dice';
import { applyDamage, applyHealing, spellsFor, type Combatant } from './encounter';
import './CombatantCard.css';

interface CombatantCardProps {
  combatant: Combatant;
  active: boolean;
  /** Score of the stat that governs this combatant's spells, for resolving them. */
  keyScores: Record<string, number>;
  onChange: (next: Combatant) => void;
  onRemove: () => void;
  onLog: (roll: Roll) => void;
}

export function CombatantCard({ combatant: c, active, keyScores, onChange, onRemove, onLog }: CombatantCardProps) {
  const [amount, setAmount] = useState(10);
  const [open, setOpen] = useState(false);

  const spells = spellsFor(c);
  const pct = c.maxHp > 0 ? (c.hp / c.maxHp) * 100 : 0;
  const band = pct > 60 ? 'hp-well' : pct > 25 ? 'hp-hurt' : 'hp-dire';

  const damage = (n: number) => onChange(applyDamage(c, n));
  const heal = (n: number) => onChange(applyHealing(c, n));

  /** Rolls a spell, resolves it against the caster's stat, and spends the mana. */
  const cast = (spell: Spell) => {
    const score = spell.keyStat ? (keyScores[spell.keyStat] ?? 0) : 0;
    const roll = makeRoll(20, `${c.name} casts ${spell.name}`);
    const result = resolveSpell(spell, score, roll.value);
    const healed = healingFrom(spell, roll.value);

    let next = { ...c, mana: Math.max(0, c.mana - spell.manaCost) };
    if (healed !== null) next = applyHealing(next, healed);
    onChange(next);

    onLog({
      ...roll,
      outcome: result?.text,
      outcomeFailed: result?.failed,
      totalLabel:
        healed !== null
          ? `heals ${healed}`
          : spell.damage && !result?.failed
            ? `${spell.damage.base} base damage`
            : undefined,
    });
  };

  return (
    <div
      className={`combatant${active ? ' combatant-active' : ''}${c.downed ? ' combatant-downed' : ''}`}
      style={{ '--c-accent': c.accent } as React.CSSProperties}
    >
      <div className="combatant-head">
        <div className="combatant-id">
          <h4 className="combatant-name">{c.name}</h4>
          {c.subtitle && <span className="combatant-sub">{c.subtitle}</span>}
        </div>
        <div className="combatant-speed" title="Speed — sets turn order">
          <span className="speed-label">SP</span>
          <span className="speed-value">{c.speed}</span>
        </div>
        <button className="combatant-remove" onClick={onRemove} aria-label={`Remove ${c.name}`}>
          <Icon name="close" size={13} />
        </button>
      </div>

      <div className="bar-row">
        <div className={`bar hp-bar ${band}`}>
          <div className="bar-fill" style={{ width: `${pct}%` }} />
          <span className="bar-text">
            {c.hp} / {c.maxHp} HP
          </span>
        </div>
      </div>

      {c.maxMana > 0 && (
        <div className="bar-row">
          <div className="bar mana-bar">
            <div className="bar-fill" style={{ width: `${(c.mana / c.maxMana) * 100}%` }} />
            <span className="bar-text">
              {c.mana} / {c.maxMana} mana
            </span>
          </div>
          <button
            className="mana-btn"
            onClick={() => onChange({ ...c, mana: Math.min(c.maxMana, c.mana + 1) })}
            title="Meditate — +1 mana for the whole turn"
          >
            Meditate
          </button>
        </div>
      )}

      {c.downed && <p className="downed-note">Down — 0 HP</p>}

      <div className="hp-controls">
        <input
          className="input amount-input"
          type="number"
          min={0}
          value={amount}
          aria-label={`Amount for ${c.name}`}
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
        />
        <button className="btn hurt-btn" onClick={() => damage(amount)}>
          Damage
        </button>
        <button className="btn heal-btn" onClick={() => heal(amount)}>
          Heal
        </button>
        <button className="btn btn-ghost full-btn" onClick={() => onChange({ ...c, hp: c.maxHp, mana: c.maxMana, downed: false })}>
          Full
        </button>
      </div>

      {c.attacks.length > 0 && (
        <div className="attack-row">
          {c.attacks.map((a, i) => (
            <span className="attack-chip" key={i}>
              {a.name} · {a.damage} · {a.speed}
            </span>
          ))}
        </div>
      )}

      {(spells.length > 0 || c.notes) && (
        <button className="disclosure" onClick={() => setOpen(!open)}>
          <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={12} />
          {open ? 'Hide' : spells.length > 0 ? `${spells.length} spells` : 'Notes'}
        </button>
      )}

      {open && (
        <div className="combatant-detail">
          {spells.map((spell) => {
            const afford = c.maxMana === 0 || c.mana >= spell.manaCost;
            return (
              <div className="spell-row" key={spell.id}>
                <div className="spell-info">
                  <span className="spell-name">{spell.name}</span>
                  <span className="spell-cost">
                    {spell.manaCost === 0 ? 'free' : `${spell.manaCost}m`}
                    {spell.healing ? ` · heals ${spell.healing.multiplier}x d${spell.healing.die}` : ''}
                    {spell.damage ? ` · ${spell.damage.base} dmg` : ''}
                    {spell.guaranteed ? ' · always works' : ''}
                  </span>
                </div>
                <button className="btn cast-btn" disabled={!afford} onClick={() => cast(spell)}>
                  {afford ? 'Cast' : 'No mana'}
                </button>
              </div>
            );
          })}

          <textarea
            className="textarea notes-box"
            value={c.notes}
            placeholder="Conditions, burning, held, invisible…"
            onChange={(e) => onChange({ ...c, notes: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
