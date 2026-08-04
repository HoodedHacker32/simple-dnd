import { useState } from 'react';
import { Icon } from '../components/Icon';
import type { Spell } from '../types/spells';
import { ATTACK_SPEEDS, type AttackSpeed } from '../types/spells';
import { CONTENT } from '../content';
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
  const [editing, setEditing] = useState(false);

  const spells = spellsFor(c);
  const pct = c.maxHp > 0 ? (c.hp / c.maxHp) * 100 : 0;
  const band = pct > 60 ? 'hp-well' : pct > 25 ? 'hp-hurt' : 'hp-dire';

  const damage = (n: number) => onChange(applyDamage(c, n));
  const heal = (n: number) => onChange(applyHealing(c, n));

  /**
   * Rolls the defender's protect throw against one of this creature's attacks,
   * so the DM gets the number they need without looking it up.
   */
  const swing = (index: number) => {
    const attack = c.attacks[index];
    const rule = CONTENT.mechanics.protectThrows.find((p) => p.speed === attack.speed);
    const target = rule?.target ?? 11;
    const roll = makeRoll(20, `${c.name} — ${attack.name}`);
    const protectedOff = roll.value >= target;
    onLog({
      ...roll,
      outcome: protectedOff
        ? `Dodged or defended (needed ${target}+)`
        : `Gets through (needed ${target}+)`,
      outcomeFailed: protectedOff,
      totalLabel: protectedOff ? undefined : `${attack.damage} damage`,
    });
  };

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

  const setAttack = (i: number, patch: Partial<Combatant['attacks'][number]>) =>
    onChange({ ...c, attacks: c.attacks.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  return (
    <div
      className={`combatant${active ? ' combatant-active' : ''}${c.downed ? ' combatant-downed' : ''}`}
      style={{ '--c-accent': c.accent } as React.CSSProperties}
    >
      <div className="combatant-head">
        <div className="combatant-id">
          {editing ? (
            <input
              className="input name-input"
              value={c.name}
              aria-label="Name"
              onChange={(e) => onChange({ ...c, name: e.target.value })}
            />
          ) : (
            <h4 className="combatant-name">{c.name}</h4>
          )}
          {c.subtitle && !editing && <span className="combatant-sub">{c.subtitle}</span>}
        </div>

        <div className="combatant-speed" title="Speed — sets turn order">
          <span className="speed-label">SP</span>
          <span className="speed-value">{c.speed}</span>
        </div>

        {c.kind !== 'player' && (
          <button
            className="combatant-remove"
            onClick={() => setEditing(!editing)}
            aria-label={`Edit ${c.name}`}
            title="Edit this creature"
          >
            <Icon name="document" size={13} />
          </button>
        )}
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
            onClick={() => onChange({ ...c, mana: Math.min(c.maxMana, c.mana + CONTENT.mechanics.mana.meditationPerTurn) })}
            title="Meditate — takes the whole turn"
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
        <button
          className="btn btn-ghost full-btn"
          onClick={() => onChange({ ...c, hp: c.maxHp, mana: c.maxMana, downed: false })}
        >
          Full
        </button>
      </div>

      {c.attacks.length > 0 && !editing && (
        <div className="attack-row">
          {c.attacks.map((a, i) => (
            <button
              className="attack-chip"
              key={i}
              onClick={() => swing(i)}
              title={`Roll the defender's protect throw against ${a.name}`}
            >
              {a.name} · {a.damage} · {a.speed}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="edit-block">
          <div className="edit-grid">
            <label className="edit-field">
              <span>Max HP</span>
              <input
                className="input"
                type="number"
                min={1}
                value={c.maxHp}
                onChange={(e) => {
                  const maxHp = Math.max(1, Number(e.target.value));
                  onChange({ ...c, maxHp, hp: Math.min(c.hp, maxHp) });
                }}
              />
            </label>
            <label className="edit-field">
              <span>Speed</span>
              <input
                className="input"
                type="number"
                value={c.speed}
                onChange={(e) => onChange({ ...c, speed: Number(e.target.value) })}
              />
            </label>
            <label className="edit-field">
              <span>Max mana</span>
              <input
                className="input"
                type="number"
                min={0}
                value={c.maxMana}
                onChange={(e) => {
                  const maxMana = Math.max(0, Number(e.target.value));
                  onChange({ ...c, maxMana, mana: Math.min(c.mana, maxMana) });
                }}
              />
            </label>
            <label className="edit-field">
              <span>Colour</span>
              <input
                className="colour-swatch"
                type="color"
                value={c.accent}
                onChange={(e) => onChange({ ...c, accent: e.target.value })}
              />
            </label>
          </div>

          <span className="edit-label">Attacks</span>
          {c.attacks.map((a, i) => (
            <div className="attack-edit" key={i}>
              <input
                className="input"
                value={a.name}
                aria-label={`Attack ${i + 1} name`}
                onChange={(e) => setAttack(i, { name: e.target.value })}
              />
              <input
                className="input attack-dmg"
                type="number"
                aria-label={`Attack ${i + 1} damage`}
                value={a.damage}
                onChange={(e) => setAttack(i, { damage: Number(e.target.value) })}
              />
              <select
                className="select attack-speed"
                aria-label={`Attack ${i + 1} speed`}
                value={a.speed}
                onChange={(e) => setAttack(i, { speed: e.target.value as AttackSpeed })}
              >
                {ATTACK_SPEEDS.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.label}
                  </option>
                ))}
              </select>
              <button
                className="combatant-remove"
                aria-label={`Remove attack ${i + 1}`}
                onClick={() => onChange({ ...c, attacks: c.attacks.filter((_, j) => j !== i) })}
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          ))}
          <button
            className="btn btn-ghost list-add"
            onClick={() => onChange({ ...c, attacks: [...c.attacks, { name: 'Attack', damage: 15, speed: 'SN' }] })}
          >
            <Icon name="plus" size={12} />
            Add attack
          </button>
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
