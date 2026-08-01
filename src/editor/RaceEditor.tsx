import type { Race } from '../types/character';
import { StatEditor } from './fields/StatEditor';
import { ListEditor } from './fields/ListEditor';
import { EntityList } from './EntityList';
import { newRace } from './useContentDraft';
import './EntityEditor.css';

interface RaceEditorProps {
  races: Race[];
  onChange: (next: Race[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RaceEditor({ races, onChange, selectedId, onSelect }: RaceEditorProps) {
  const selected = races.find((r) => r.id === selectedId) ?? races[0] ?? null;

  const patch = (changes: Partial<Race>) => {
    if (!selected) return;
    onChange(races.map((r) => (r.id === selected.id ? { ...r, ...changes } : r)));
  };

  const add = () => {
    const race = newRace(new Set(races.map((r) => r.id)));
    onChange([...races, race]);
    onSelect(race.id);
  };

  const remove = (id: string) => {
    const remaining = races.filter((r) => r.id !== id);
    onChange(remaining);
    if (selected?.id === id && remaining[0]) onSelect(remaining[0].id);
  };

  return (
    <div className="entity-editor">
      <EntityList
        items={races.map((r) => ({ id: r.id, name: r.name, accent: r.accent }))}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        onAdd={add}
        onRemove={remove}
        addLabel="New race"
        minimum={1}
      />

      {selected && (
        <div className="entity-form parchment-surface" key={selected.id}>
          <div className="form-grid">
            <div className="field field-span2">
              <label className="field-label" htmlFor="race-name">
                Name
              </label>
              <input
                id="race-name"
                className="input"
                value={selected.name}
                onChange={(e) => patch({ name: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="race-accent">
                Colour
              </label>
              <div className="colour-field">
                <input
                  id="race-accent"
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

            <div className="field">
              <label className="field-label" htmlFor="race-age">
                Typical age
              </label>
              <input
                id="race-age"
                className="input"
                type="number"
                min={0}
                value={selected.defaultAge}
                onChange={(e) => patch({ defaultAge: Number(e.target.value) })}
              />
              <p className="hint">Pre-fills the age box when a player picks this race.</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="race-lifespan">
                Lifespan
              </label>
              <input
                id="race-lifespan"
                className="input"
                value={selected.lifespan}
                placeholder="Around 80 years"
                onChange={(e) => patch({ lifespan: e.target.value })}
              />
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
              <label className="field-label" htmlFor="race-lore">
                Lore
              </label>
              <textarea
                id="race-lore"
                className="textarea"
                value={selected.lore}
                placeholder="What are they like? Where do they come from?"
                onChange={(e) => patch({ lore: e.target.value })}
              />
            </div>

            <div className="field field-full">
              <ListEditor
                label="Traits"
                items={selected.traits}
                placeholder="A short, flavourful line"
                addLabel="Add trait"
                onChange={(traits) => patch({ traits })}
              />
            </div>
          </div>

          <p className="id-note">
            Internal id: <code>{selected.id}</code> — fixed once created, because saved characters point at it.
          </p>
        </div>
      )}
    </div>
  );
}
