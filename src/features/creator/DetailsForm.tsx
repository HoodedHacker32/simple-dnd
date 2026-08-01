import type { Character, Race } from '../../types/character';
import './DetailsForm.css';

interface DetailsFormProps {
  character: Character;
  race: Race | null;
  onChange: (patch: Partial<Character>) => void;
}

const ALIGNMENTS = [
  'Lawful Good',
  'Neutral Good',
  'Chaotic Good',
  'Lawful Neutral',
  'True Neutral',
  'Chaotic Neutral',
  'Lawful Evil',
  'Neutral Evil',
  'Chaotic Evil',
];

export function DetailsForm({ character, race, onChange }: DetailsFormProps) {
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

        <div className="field">
          <label className="field-label" htmlFor="char-age">
            Age
          </label>
          <input
            id="char-age"
            className="input"
            type="number"
            min={0}
            value={character.age}
            placeholder={race ? String(race.defaultAge) : '—'}
            onChange={(e) => onChange({ age: e.target.value === '' ? '' : Number(e.target.value) })}
          />
          <p className="hint">
            {race
              ? `${race.name} lifespan: ${race.lifespan.toLowerCase()}. Typical adventuring age ${race.defaultAge}.`
              : 'Pick a race and this fills in with a typical age.'}
          </p>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="char-gender">
            Gender
          </label>
          <input
            id="char-gender"
            className="input"
            value={character.gender}
            placeholder="However you like"
            onChange={(e) => onChange({ gender: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="char-pronouns">
            Pronouns
          </label>
          <input
            id="char-pronouns"
            className="input"
            value={character.pronouns}
            placeholder="they/them"
            onChange={(e) => onChange({ pronouns: e.target.value })}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="char-alignment">
            Alignment
          </label>
          <select
            id="char-alignment"
            className="select"
            value={character.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
          >
            <option value="">Undecided</option>
            {ALIGNMENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label className="field-label" htmlFor="char-backstory">
            Backstory
          </label>
          <textarea
            id="char-backstory"
            className="textarea"
            value={character.backstory}
            placeholder="Where did they come from, and what are they running towards? Or away from?"
            onChange={(e) => onChange({ backstory: e.target.value })}
          />
          <p className="hint">{character.backstory.trim().split(/\s+/).filter(Boolean).length} words</p>
        </div>
      </div>
    </div>
  );
}
