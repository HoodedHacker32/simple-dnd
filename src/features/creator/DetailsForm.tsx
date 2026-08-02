import type { Character, CharacterField, FieldValue, Race } from '../../types/character';
import { CONTENT } from '../../content';
import './DetailsForm.css';

interface DetailsFormProps {
  character: Character;
  race: Race | null;
  onChange: (patch: Partial<Character>) => void;
}

export function DetailsForm({ character, race, onChange }: DetailsFormProps) {
  const fields = CONTENT.characterFields;

  const setField = (id: string, value: FieldValue) =>
    onChange({ fields: { ...character.fields, [id]: value } });

  const renderField = (field: CharacterField) => {
    const value = character.fields[field.id] ?? '';
    const inputId = `field-${field.id}`;

    // An age field takes its bounds and placeholder from the chosen race.
    const ageBound = field.fillFromRaceAge && race;
    const min = ageBound ? (race.minAge ?? field.min) : field.min;
    const max = ageBound ? (race.maxAge ?? field.max) : field.max;
    const placeholder = ageBound ? String(race.defaultAge) : field.placeholder;

    const help = ageBound
      ? `${race.name} lifespan: ${race.lifespan.toLowerCase()}. Typical adventuring age ${race.defaultAge}.`
      : field.help;

    return (
      <div className={`field${field.width === 'full' ? ' field-full' : ''}`} key={field.id}>
        <label className="field-label" htmlFor={inputId}>
          {field.label}
        </label>

        {field.type === 'longtext' && (
          <textarea
            id={inputId}
            className="textarea"
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(e) => setField(field.id, e.target.value)}
          />
        )}

        {field.type === 'select' && (
          <select
            id={inputId}
            className="select"
            value={String(value)}
            onChange={(e) => setField(field.id, e.target.value)}
          >
            <option value="">Undecided</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {field.type === 'number' && (
          <input
            id={inputId}
            className="input"
            type="number"
            min={min}
            max={max}
            value={value === '' ? '' : Number(value)}
            placeholder={placeholder}
            onChange={(e) => setField(field.id, e.target.value === '' ? '' : Number(e.target.value))}
          />
        )}

        {field.type === 'text' && (
          <input
            id={inputId}
            className="input"
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(e) => setField(field.id, e.target.value)}
          />
        )}

        {help && <p className="hint">{help}</p>}
        {field.type === 'longtext' && (
          <p className="hint">{String(value).trim().split(/\s+/).filter(Boolean).length} words</p>
        )}
      </div>
    );
  };

  return (
    <div className="details-form parchment-surface">
      <div className="details-grid">
        <div className="field field-wide">
          <label className="field-label" htmlFor="char-name">
            Name
          </label>
          <input
            id="char-name"
            className="input"
            value={character.name}
            placeholder="What will the songs call you?"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        {fields.map(renderField)}
      </div>
    </div>
  );
}
