import type { CharacterField, FieldType } from '../types/character';
import { FIELD_TYPES } from '../types/character';
import { Icon } from '../components/Icon';
import { ListEditor } from './fields/ListEditor';
import { EntityList } from './EntityList';
import { renameWithId, slugFrom } from './useContentDraft';
import './EntityEditor.css';

interface FieldsEditorProps {
  fields: CharacterField[];
  onChange: (next: CharacterField[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FieldsEditor({ fields, onChange, selectedId, onSelect }: FieldsEditorProps) {
  const selected = fields.find((f) => f.id === selectedId) ?? fields[0] ?? null;

  const patch = (changes: Partial<CharacterField>) => {
    if (!selected) return;
    onChange(fields.map((f) => (f.id === selected.id ? { ...f, ...changes } : f)));
  };

  const add = () => {
    const field: CharacterField = {
      id: slugFrom('new field', new Set(fields.map((f) => f.id))),
      label: 'New field',
      type: 'text',
      showOnSheet: true,
      width: 'half',
    };
    onChange([...fields, field]);
    onSelect(field.id);
  };

  const move = (delta: number) => {
    if (!selected) return;
    const i = fields.findIndex((f) => f.id === selected.id);
    const j = i + delta;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="entity-editor">
      <EntityList
        items={fields.map((f) => ({ id: f.id, name: f.label, accent: 'var(--gold)' }))}
        selectedId={selected?.id ?? null}
        onSelect={onSelect}
        onAdd={add}
        onRemove={(id) => {
          const remaining = fields.filter((f) => f.id !== id);
          onChange(remaining);
          if (selected?.id === id && remaining[0]) onSelect(remaining[0].id);
        }}
        addLabel="New field"
        minimum={0}
      />

      {selected ? (
        <div className="entity-form parchment-surface" key={selected.id}>
          <div className="form-grid">
            <div className="field field-span2">
              <label className="field-label" htmlFor="field-label">
                Label
              </label>
              <input
                id="field-label"
                className="input"
                value={selected.label}
                onChange={(e) => {
                  const label = e.target.value;
                  const taken = new Set(fields.filter((f) => f.id !== selected.id).map((f) => f.id));
                  const renamed = renameWithId(selected, label, 'new-field', taken);
                  patch({ label, ...renamed });
                  if (renamed.id) onSelect(renamed.id);
                }}
              />
            </div>

            <div className="field">
              <label className="field-label" htmlFor="field-type">
                Type
              </label>
              <select
                id="field-type"
                className="select"
                value={selected.type}
                onChange={(e) => {
                  const type = e.target.value as FieldType;
                  patch({ type, options: type === 'select' ? (selected.options ?? ['First option']) : undefined });
                }}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="hint">{FIELD_TYPES.find((t) => t.type === selected.type)?.hint}</p>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="field-width">
                Width
              </label>
              <select
                id="field-width"
                className="select"
                value={selected.width}
                onChange={(e) => patch({ width: e.target.value as 'half' | 'full' })}
              >
                <option value="half">Half row</option>
                <option value="full">Full row</option>
              </select>
            </div>

            <div className="field field-span2">
              <label className="field-label" htmlFor="field-placeholder">
                Placeholder
              </label>
              <input
                id="field-placeholder"
                className="input"
                value={selected.placeholder ?? ''}
                onChange={(e) => patch({ placeholder: e.target.value || undefined })}
              />
            </div>

            <div className="field field-span2">
              <label className="field-label" htmlFor="field-help">
                Help text
              </label>
              <input
                id="field-help"
                className="input"
                value={selected.help ?? ''}
                placeholder="Shown in small print under the box"
                onChange={(e) => patch({ help: e.target.value || undefined })}
              />
            </div>

            {selected.type === 'number' && (
              <>
                <div className="field">
                  <label className="field-label" htmlFor="field-min">
                    Minimum
                  </label>
                  <input
                    id="field-min"
                    className="input"
                    type="number"
                    value={selected.min ?? ''}
                    placeholder="None"
                    onChange={(e) => patch({ min: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <label className="field-label" htmlFor="field-max">
                    Maximum
                  </label>
                  <input
                    id="field-max"
                    className="input"
                    type="number"
                    value={selected.max ?? ''}
                    placeholder="None"
                    onChange={(e) => patch({ max: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </div>
                <div className="field field-full checkbox-field">
                  <input
                    id="field-age"
                    type="checkbox"
                    checked={Boolean(selected.fillFromRaceAge)}
                    onChange={(e) => patch({ fillFromRaceAge: e.target.checked })}
                  />
                  <label htmlFor="field-age">
                    Treat as an age — pre-fill from the race's typical age, and use its age bounds
                  </label>
                </div>
              </>
            )}

            {selected.type === 'select' && (
              <div className="field field-full">
                <ListEditor
                  label="Options"
                  items={selected.options ?? []}
                  placeholder="One choice"
                  addLabel="Add option"
                  onChange={(options) => patch({ options })}
                />
              </div>
            )}

            <div className="field field-full checkbox-field">
              <input
                id="field-sheet"
                type="checkbox"
                checked={selected.showOnSheet}
                onChange={(e) => patch({ showOnSheet: e.target.checked })}
              />
              <label htmlFor="field-sheet">
                {selected.type === 'longtext'
                  ? 'Give this its own section on the finished sheet'
                  : 'Show in the identity line on the finished sheet'}
              </label>
            </div>

            <div className="field field-full">
              <span className="field-label">Order</span>
              <div className="order-tools">
                <button type="button" className="btn btn-ghost" onClick={() => move(-1)}>
                  <Icon name="chevronLeft" size={14} />
                  Earlier
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => move(1)}>
                  Later
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>
            </div>
          </div>

          <p className="id-note">
            Internal id: <code>{selected.id}</code> — saved characters store their answers under this key.
            Deleting this field hides those answers but does not erase them, so re-adding a field with the
            same id brings them back.
          </p>
        </div>
      ) : (
        <div className="entity-form parchment-surface">
          <p className="hint">
            No extra fields. Characters will have only a name. Add one to start collecting more.
          </p>
        </div>
      )}
    </div>
  );
}
