import type { Ability, DndClass } from '../types/character';
import { Icon } from '../components/Icon';
import { StatEditor } from './fields/StatEditor';
import { EntityList } from './EntityList';
import { newClass } from './useContentDraft';
import './EntityEditor.css';

interface ClassEditorProps {
  classes: DndClass[];
  onChange: (next: DndClass[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClassEditor({ classes, onChange, selectedId, onSelect }: ClassEditorProps) {
  const selected = classes.find((c) => c.id === selectedId) ?? classes[0] ?? null;

  const patch = (changes: Partial<DndClass>) => {
    if (!selected) return;
    onChange(classes.map((c) => (c.id === selected.id ? { ...c, ...changes } : c)));
  };

  const add = () => {
    const cls = newClass(new Set(classes.map((c) => c.id)));
    onChange([...classes, cls]);
    onSelect(cls.id);
  };

  const remove = (id: string) => {
    // Dropping a class that another one links to as its oath partner would
    // produce a pack the validator rejects, so clear those links too.
    const remaining = classes
      .filter((c) => c.id !== id)
      .map((c) => (c.oathState?.partnerId === id ? { ...c, oathState: undefined } : c));
    onChange(remaining);
    if (selected?.id === id && remaining[0]) onSelect(remaining[0].id);
  };

  const setAbility = (i: number, changes: Partial<Ability>) =>
    patch({ abilities: selected!.abilities.map((a, j) => (j === i ? { ...a, ...changes } : a)) });

  return (
    <div className="entity-editor">
      <EntityList
        items={classes.map((c) => ({
          id: c.id,
          name: c.subtitle ? `${c.name} — ${c.subtitle}` : c.name,
          accent: c.accent,
          muted: c.placeholder,
        }))}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        onAdd={add}
        onRemove={remove}
        addLabel="New class"
        minimum={1}
      />

      {selected && (
        <div className="entity-form parchment-surface" key={selected.id}>
          <div className="form-grid">
            <div className="field field-span2">
              <label className="field-label" htmlFor="class-name">
                Name
              </label>
              <input
                id="class-name"
                className="input"
                value={selected.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="class-subtitle">
                Subtitle
              </label>
              <input
                id="class-subtitle"
                className="input"
                value={selected.subtitle ?? ''}
                placeholder="Optional, e.g. Oath Sworn"
                onChange={(e) => patch({ subtitle: e.target.value || undefined })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="class-accent">
                Colour
              </label>
              <div className="colour-field">
                <input
                  id="class-accent"
                  className="colour-swatch"
                  type="color"
                  value={selected.accent}
                  onChange={(e) => patch({ accent: e.target.value })}
                />
                <input
                  className="input"
                  value={selected.accent}
                  onChange={(e) => patch({ accent: e.target.value })}
                />
              </div>
            </div>

            <div className="field field-full">
              <span className="field-label">Stat modifiers</span>
              <StatEditor
                value={selected.modifiers}
                accent={selected.accent}
                onChange={(modifiers) => patch({ modifiers })}
              />
            </div>

            <div className="field field-full">
              <label className="field-label" htmlFor="class-lore">
                Lore
              </label>
              <textarea
                id="class-lore"
                className="textarea"
                value={selected.lore}
                onChange={(e) => patch({ lore: e.target.value })}
              />
            </div>

            <div className="field field-full">
              <span className="field-label">Abilities</span>
              {selected.abilities.length === 0 && <p className="hint">No abilities yet.</p>}

              {selected.abilities.map((ability, i) => (
                <div className="ability-block" key={i}>
                  <div className="ability-head">
                    <div className="field">
                      <label className="field-label" htmlFor={`ability-name-${i}`}>
                        Ability name
                      </label>
                      <input
                        id={`ability-name-${i}`}
                        className="input"
                        value={ability.name}
                        onChange={(e) => setAbility(i, { name: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="ability-delete"
                      aria-label={`Remove ${ability.name || 'ability'}`}
                      onClick={() =>
                        patch({ abilities: selected.abilities.filter((_, j) => j !== i) })
                      }
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                  <textarea
                    className="textarea"
                    value={ability.description}
                    placeholder="What does it do, in the words a player will read?"
                    onChange={(e) => setAbility(i, { description: e.target.value })}
                  />
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost list-add"
                onClick={() =>
                  patch({ abilities: [...selected.abilities, { name: 'New ability', description: '' }] })
                }
              >
                <Icon name="plus" size={13} />
                Add ability
              </button>
            </div>

            <div className="field field-full checkbox-field">
              <input
                id="class-placeholder"
                type="checkbox"
                checked={Boolean(selected.placeholder)}
                onChange={(e) => patch({ placeholder: e.target.checked })}
              />
              <label htmlFor="class-placeholder">
                Not finished yet — show it locked, with a "Coming Soon" badge
              </label>
            </div>

            {selected.placeholder && (
              <div className="field field-full">
                <label className="field-label" htmlFor="class-placeholder-note">
                  Locked tooltip
                </label>
                <input
                  id="class-placeholder-note"
                  className="input"
                  value={selected.placeholderNote ?? ''}
                  placeholder="Stat block pending — this class has not been designed yet."
                  onChange={(e) => patch({ placeholderNote: e.target.value || undefined })}
                />
              </div>
            )}

            <div className="field field-full">
              <label className="field-label" htmlFor="class-oath">
                Transforms into
              </label>
              <select
                id="class-oath"
                className="select"
                value={selected.oathState?.partnerId ?? ''}
                onChange={(e) => {
                  const partnerId = e.target.value;
                  patch({
                    oathState: partnerId
                      ? {
                          partnerId,
                          label: selected.oathState?.label || 'Break the oath',
                          warning:
                            selected.oathState?.warning ||
                            'This change is permanent and rewrites the character sheet.',
                        }
                      : undefined,
                  });
                }}
              >
                <option value="">Nothing — this class does not transform</option>
                {classes
                  .filter((c) => c.id !== selected.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subtitle ? `${c.name} (${c.subtitle})` : c.name}
                    </option>
                  ))}
              </select>
              <p className="hint">
                Adds a button to the class step that swaps the character into the chosen class, the way a
                Paladin breaking their oath does.
              </p>
            </div>

            {selected.oathState && (
              <>
                <div className="field field-span2">
                  <label className="field-label" htmlFor="oath-label">
                    Button text
                  </label>
                  <input
                    id="oath-label"
                    className="input"
                    value={selected.oathState.label}
                    onChange={(e) =>
                      patch({ oathState: { ...selected.oathState!, label: e.target.value } })
                    }
                  />
                </div>
                <div className="field field-span2">
                  <label className="field-label" htmlFor="oath-warning">
                    Warning text
                  </label>
                  <input
                    id="oath-warning"
                    className="input"
                    value={selected.oathState.warning}
                    onChange={(e) =>
                      patch({ oathState: { ...selected.oathState!, warning: e.target.value } })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <p className="id-note">
            Internal id: <code>{selected.id}</code> — fixed once created, because saved characters point at it.
          </p>
        </div>
      )}
    </div>
  );
}
