import type { Mechanics, Rounding, TierValues } from '../types/rules';
import { Icon } from '../components/Icon';
import './EntityEditor.css';
import './RulesEditor.css';

interface RulesEditorProps {
  mechanics: Mechanics;
  onChange: (next: Mechanics) => void;
}

const ROUNDING: { value: Rounding; label: string }[] = [
  { value: 'floor', label: 'Round down' },
  { value: 'ceil', label: 'Round up' },
  { value: 'round', label: 'Round to nearest' },
];

/** A multiplier table indexed by stat score, with "cannot" as a real option. */
function TierRow({
  label,
  hint,
  values,
  onChange,
  allowCannot = true,
  cannotLabel = 'Cannot',
}: {
  label: string;
  hint?: string;
  values: TierValues;
  onChange: (next: TierValues) => void;
  allowCannot?: boolean;
  cannotLabel?: string;
}) {
  const setAt = (i: number, v: number | null) => onChange(values.map((old, j) => (j === i ? v : old)));

  return (
    <div className="rule-table">
      <div className="rule-table-head">
        <span className="field-label">{label}</span>
        <div className="rule-table-tools">
          <button
            type="button"
            className="tier-tool"
            disabled={values.length <= 1}
            onClick={() => onChange(values.slice(0, -1))}
            title="Remove the highest score"
          >
            −
          </button>
          <span className="tier-count">scores 0–{values.length - 1}</span>
          <button
            type="button"
            className="tier-tool"
            onClick={() => onChange([...values, values[values.length - 1] ?? 1])}
            title="Add another score"
          >
            +
          </button>
        </div>
      </div>
      {hint && <p className="hint rule-hint">{hint}</p>}

      <div className="tier-grid">
        {values.map((v, i) => (
          <div className="tier-cell" key={i}>
            <span className="tier-score">{i}</span>
            <input
              className="input tier-input"
              type="number"
              step="0.05"
              value={v === null ? '' : v}
              disabled={v === null}
              placeholder="—"
              aria-label={`Value at score ${i}`}
              onChange={(e) => setAt(i, e.target.value === '' ? 0 : Number(e.target.value))}
            />
            {allowCannot && (
              <label className="tier-cannot">
                <input
                  type="checkbox"
                  checked={v === null}
                  onChange={(e) => setAt(i, e.target.checked ? null : 1)}
                />
                {cannotLabel}
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** A d20 target table — the roll you need or better. */
function TargetRow({
  label,
  hint,
  values,
  onChange,
}: {
  label: string;
  hint?: string;
  values: number[];
  onChange: (next: number[]) => void;
}) {
  return (
    <div className="rule-table">
      <span className="field-label">{label}</span>
      {hint && <p className="hint rule-hint">{hint}</p>}
      <div className="tier-grid">
        {values.map((v, i) => (
          <div className="tier-cell" key={i}>
            <span className="tier-score">{i}</span>
            <input
              className="input tier-input"
              type="number"
              min={1}
              max={21}
              value={v}
              aria-label={`Target at score ${i}`}
              onChange={(e) =>
                onChange(values.map((old, j) => (j === i ? Math.max(1, Math.min(21, Number(e.target.value))) : old)))
              }
            />
            <span className="tier-suffix">{v >= 21 ? 'never' : `${v}+`}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RulesEditor({ mechanics: m, onChange }: RulesEditorProps) {
  const patch = (changes: Partial<Mechanics>) => onChange({ ...m, ...changes });

  return (
    <div className="rules-editor parchment-surface">
      <p className="rules-intro illuminated">
        These are the numbers the app actually calculates with. Change one here and every character sheet and
        every Codex table updates to match — there is no second copy to keep in step.
      </p>

      {/* ---------------------------------------------------------- Health */}
      <section className="rule-group">
        <h3 className="rule-group-title">Health</h3>
        <div className="rule-pair">
          <div className="field">
            <label className="field-label" htmlFor="base-hp">
              Starting HP
            </label>
            <input
              id="base-hp"
              className="input"
              type="number"
              value={m.baseHp}
              onChange={(e) => patch({ baseHp: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="hp-per">
              HP per point of Health
            </label>
            <input
              id="hp-per"
              className="input"
              type="number"
              value={m.hpPerPoint}
              onChange={(e) => patch({ hpPerPoint: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Stat range */}
      <section className="rule-group">
        <h3 className="rule-group-title">Scores above the tables</h3>
        <div className="rule-pair">
          <div className="field">
            <label className="field-label" htmlFor="max-tier">
              Highest score the rules cover
            </label>
            <input
              id="max-tier"
              className="input"
              type="number"
              min={0}
              value={m.maxTier}
              onChange={(e) => patch({ maxTier: Math.max(0, Number(e.target.value)) })}
            />
            <p className="hint">
              A Half-Orc Barbarian reaches Strength 4, but the tables stop at 3. Anything above this reuses the
              top row. The sheet still shows the true total.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- Strength */}
      <section className="rule-group">
        <h3 className="rule-group-title">Strength — weapon access</h3>
        <div className="access-list">
          {m.weaponAccess.map((text, i) => (
            <div className="access-row" key={i}>
              <span className="tier-score">{i}</span>
              <input
                className="input"
                value={text}
                aria-label={`Weapon access at Strength ${i}`}
                onChange={(e) =>
                  patch({ weaponAccess: m.weaponAccess.map((t, j) => (j === i ? e.target.value : t)) })
                }
              />
              <button
                type="button"
                className="ability-delete"
                disabled={m.weaponAccess.length <= 1}
                aria-label={`Remove Strength ${i}`}
                onClick={() => patch({ weaponAccess: m.weaponAccess.filter((_, j) => j !== i) })}
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost list-add"
            onClick={() => patch({ weaponAccess: [...m.weaponAccess, ''] })}
          >
            <Icon name="plus" size={13} />
            Add a Strength score
          </button>
        </div>
      </section>

      {/* ---------------------------------------------------------- Magic */}
      <section className="rule-group">
        <h3 className="rule-group-title">Magic</h3>
        <div className="rule-pair">
          <div className="field">
            <label className="field-label" htmlFor="spells-day">
              Spells per day
            </label>
            <input
              id="spells-day"
              className="input"
              type="number"
              min={0}
              value={m.magic.spellsPerDay}
              onChange={(e) =>
                patch({ magic: { ...m.magic, spellsPerDay: Math.max(0, Number(e.target.value)) } })
              }
            />
            <p className="hint">Applies to every caster, whatever their class.</p>
          </div>
        </div>
        <TierRow
          label="Spell power multiplier"
          hint="Roll the spell, then multiply by this."
          values={m.magic.multipliers}
          cannotLabel="No magic"
          onChange={(multipliers) => patch({ magic: { ...m.magic, multipliers } })}
        />
      </section>

      {/* ---------------------------------------------------------- Speed */}
      <section className="rule-group">
        <h3 className="rule-group-title">Speed</h3>
        <div className="rule-pair">
          <div className="field">
            <label className="field-label" htmlFor="move-die">
              Movement die
            </label>
            <input
              id="move-die"
              className="input"
              type="number"
              min={2}
              value={m.movement.die}
              onChange={(e) => patch({ movement: { ...m.movement, die: Math.max(2, Number(e.target.value)) } })}
            />
            <p className="hint">Players roll d{m.movement.die} and multiply.</p>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="move-round">
              Rounding
            </label>
            <select
              id="move-round"
              className="select"
              value={m.movement.rounding}
              onChange={(e) =>
                patch({ movement: { ...m.movement, rounding: e.target.value as Rounding } })
              }
            >
              {ROUNDING.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TierRow
          label="Movement multiplier"
          values={m.movement.multipliers}
          cannotLabel="Cannot move"
          onChange={(multipliers) => patch({ movement: { ...m.movement, multipliers } })}
        />

        <div className="rule-table">
          <span className="field-label">Dodging — d20 target by speed difference</span>
          <p className="hint rule-hint">
            "Difference" is your Speed minus your opponent's. 21 means it cannot be dodged at all.
          </p>
          <div className="dodge-rows">
            {m.dodge.map((row, i) => (
              <div className="dodge-row" key={i}>
                <div className="field">
                  <label className="field-label" htmlFor={`dodge-d-${i}`}>
                    Difference
                  </label>
                  <input
                    id={`dodge-d-${i}`}
                    className="input"
                    type="number"
                    value={row.delta}
                    onChange={(e) =>
                      patch({
                        dodge: m.dodge.map((r, j) => (j === i ? { ...r, delta: Number(e.target.value) } : r)),
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor={`dodge-t-${i}`}>
                    Need
                  </label>
                  <input
                    id={`dodge-t-${i}`}
                    className="input"
                    type="number"
                    min={1}
                    max={21}
                    value={row.target}
                    onChange={(e) =>
                      patch({
                        dodge: m.dodge.map((r, j) =>
                          j === i ? { ...r, target: Math.max(1, Math.min(21, Number(e.target.value))) } : r,
                        ),
                      })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="ability-delete"
                  disabled={m.dodge.length <= 1}
                  aria-label={`Remove dodge row ${i + 1}`}
                  onClick={() => patch({ dodge: m.dodge.filter((_, j) => j !== i) })}
                >
                  <Icon name="close" size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-ghost list-add"
            onClick={() =>
              patch({ dodge: [...m.dodge, { delta: (m.dodge.at(-1)?.delta ?? 0) + 1, target: 10 }] })
            }
          >
            <Icon name="plus" size={13} />
            Add a difference
          </button>
        </div>
      </section>

      {/* ------------------------------------------------------ Dexterity */}
      <section className="rule-group">
        <h3 className="rule-group-title">Dexterity</h3>
        <div className="rule-pair">
          <div className="field">
            <label className="field-label" htmlFor="bow-round">
              Bow range rounding
            </label>
            <select
              id="bow-round"
              className="select"
              value={m.bow.rounding}
              onChange={(e) => patch({ bow: { ...m.bow, rounding: e.target.value as Rounding } })}
            >
              {ROUNDING.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TierRow
          label="Bow range multiplier"
          values={m.bow.multipliers}
          cannotLabel="No bows"
          onChange={(multipliers) => patch({ bow: { ...m.bow, multipliers } })}
        />

        <TargetRow
          label="Stealth — when being seen is likely"
          hint="Open ground, bright light, alert guards."
          values={m.stealth.unlikely}
          onChange={(unlikely) => patch({ stealth: { ...m.stealth, unlikely } })}
        />

        <TargetRow
          label="Stealth — when conditions favour you"
          hint="Darkness, cover, distracted enemies."
          values={m.stealth.likely}
          onChange={(likely) => patch({ stealth: { ...m.stealth, likely } })}
        />
      </section>

      {/* ------------------------------------------------------- Charisma */}
      <section className="rule-group">
        <h3 className="rule-group-title">Charisma</h3>
        <TierRow
          label="Social roll multiplier"
          values={m.charisma.multipliers}
          cannotLabel="Cannot try"
          onChange={(multipliers) => patch({ charisma: { multipliers } })}
        />
      </section>
    </div>
  );
}
