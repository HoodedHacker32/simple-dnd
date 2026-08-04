import { useState } from 'react';
import { Icon } from '../components/Icon';
import { DicePad } from './DiceRoller';
import { applyDamage, applyHealing, setMaxHp, type Combatant } from './encounter';
import type { Roll } from './dice';
import './SimpleTable.css';

/*
 * The plain version of the table.
 *
 * Dice, the party, and whatever you are fighting. No turn order, no mana, no
 * spell list, no reference tables. Everything here is a thing you can point at
 * and understand without being told what it is, because the moment this is
 * harder than a sheet of paper it has failed.
 */

interface SimpleTableProps {
  combatants: Combatant[];
  onChange: (id: string, next: Combatant) => void;
  onRemove: (id: string) => void;
  onAddEnemy: () => void;
  onLoad: () => void;
  onSave: () => void;
  onRestAll: () => void;
  onLog: (roll: Roll) => void;
  /** The share code box, so a player's link or code works here too. */
  code: string;
  onCodeChange: (code: string) => void;
  onAddCode: () => void;
}

function SimpleCard({
  c,
  onChange,
  onRemove,
}: {
  c: Combatant;
  onChange: (next: Combatant) => void;
  onRemove: () => void;
}) {
  const [amount, setAmount] = useState(10);
  const pct = c.maxHp > 0 ? (c.hp / c.maxHp) * 100 : 0;
  const band = pct > 60 ? 'hp-well' : pct > 25 ? 'hp-hurt' : 'hp-dire';
  const isEnemy = c.kind !== 'player';

  return (
    <div
      className={`simple-card${c.downed ? ' simple-down' : ''}`}
      style={{ '--c-accent': c.accent } as React.CSSProperties}
    >
      <div className="simple-head">
        {isEnemy ? (
          <input
            className="input simple-name-input"
            value={c.name}
            placeholder="Name this enemy"
            aria-label="Enemy name"
            onChange={(e) => onChange({ ...c, name: e.target.value })}
          />
        ) : (
          <span className="simple-name">{c.name}</span>
        )}
        <button className="simple-remove" onClick={onRemove} aria-label={`Remove ${c.name || 'enemy'}`}>
          <Icon name="close" size={14} />
        </button>
      </div>

      <div className={`simple-bar ${band}`}>
        <div className="simple-fill" style={{ width: `${pct}%` }} />
        <span className="simple-hp">
          {c.hp} <em>/</em>{' '}
          {isEnemy ? (
            <input
              className="simple-max"
              type="number"
              min={1}
              value={c.maxHp}
              aria-label="Maximum health"
              onChange={(e) => onChange(setMaxHp(c, Number(e.target.value)))}
            />
          ) : (
            c.maxHp
          )}
        </span>
      </div>

      <div className="simple-controls">
        <button
          className="btn simple-hurt"
          onClick={() => onChange(applyDamage(c, amount))}
          aria-label={`Take ${amount} damage`}
        >
          − {amount}
        </button>
        <input
          className="input simple-amount"
          type="number"
          min={0}
          value={amount}
          aria-label="How much"
          onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
        />
        <button
          className="btn simple-heal"
          onClick={() => onChange(applyHealing(c, amount))}
          aria-label={`Heal ${amount}`}
        >
          + {amount}
        </button>
      </div>

      {c.downed && <p className="simple-downed">Down</p>}
    </div>
  );
}

export function SimpleTable({
  combatants,
  onChange,
  onRemove,
  onAddEnemy,
  onLoad,
  onSave,
  onRestAll,
  onLog,
  code,
  onCodeChange,
  onAddCode,
}: SimpleTableProps) {
  const party = combatants.filter((c) => c.kind === 'player');
  const enemies = combatants.filter((c) => c.kind !== 'player');

  return (
    <div className="simple-table">
      <div className="simple-dice">
        <DicePad onRoll={onLog} bare />
      </div>

      <div className="simple-people">
        <div className="simple-group">
          <div className="simple-group-head">
            <h3>Your party</h3>
            <div className="simple-group-actions">
              <button className="btn" onClick={onLoad}>
                <Icon name="document" size={14} />
                Add a character
              </button>
              <button className="btn" disabled={party.length === 0} onClick={onSave}>
                <Icon name="save" size={14} />
                Save party
              </button>
            </div>
          </div>

          <div className="simple-code-row">
            <input
              className="input"
              value={code}
              placeholder="Or paste a share code a player sent you"
              spellCheck={false}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onAddCode()}
            />
            <button className="btn btn-primary" disabled={!code.trim()} onClick={onAddCode}>
              Add
            </button>
          </div>

          {party.length === 0 ? (
            <p className="simple-empty">
              No one here yet. Open a link a player sent you, paste their code above, or press
              <strong> Add a character</strong> to load their file.
            </p>
          ) : (
            <div className="simple-grid">
              {party.map((c) => (
                <SimpleCard
                  key={c.id}
                  c={c}
                  onChange={(next) => onChange(c.id, next)}
                  onRemove={() => onRemove(c.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="simple-group">
          <div className="simple-group-head">
            <h3>Enemies</h3>
            <button className="btn" onClick={onAddEnemy}>
              <Icon name="plus" size={14} />
              Add an enemy
            </button>
          </div>

          {enemies.length === 0 ? (
            <p className="simple-empty">Nothing to fight. Add an enemy and give it a name and some health.</p>
          ) : (
            <div className="simple-grid">
              {enemies.map((c) => (
                <SimpleCard
                  key={c.id}
                  c={c}
                  onChange={(next) => onChange(c.id, next)}
                  onRemove={() => onRemove(c.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {combatants.length > 0 && (
        <div className="simple-footer">
          <button className="btn" onClick={onRestAll} title="Everyone back to full health">
            <Icon name="star" size={14} />
            Heal everyone
          </button>
        </div>
      )}
    </div>
  );
}
