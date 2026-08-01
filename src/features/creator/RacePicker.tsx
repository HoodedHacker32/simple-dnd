import { RACES } from '../../data/races';
import { STATS, STAT_ORDER } from '../../types/character';
import { formatModifier } from '../../engine/statCalculator';
import { Icon } from '../../components/Icon';
import './Picker.css';

interface RacePickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RacePicker({ selectedId, onSelect }: RacePickerProps) {
  const selected = RACES.find((r) => r.id === selectedId) ?? null;

  return (
    <div className={`picker${selected ? ' picker-open' : ''}`}>
      <div className="picker-grid">
        {RACES.map((race) => (
          <button
            key={race.id}
            className={`choice-card${selectedId === race.id ? ' choice-selected' : ''}`}
            style={{ '--card-accent': race.accent } as React.CSSProperties}
            onClick={() => onSelect(race.id)}
            aria-pressed={selectedId === race.id}
            aria-label={race.name}
          >
            <span className="choice-banner" />
            <span className="choice-name">{race.name}</span>
            <span className="choice-mods">
              {STAT_ORDER.map((key) => {
                const mod = race.modifiers[key];
                return (
                  <span key={key} className={`mod${mod > 0 ? ' mod-up' : mod < 0 ? ' mod-down' : ' mod-flat'}`}>
                    <span className="mod-abbr">{STATS[key].abbr}</span>
                    <span className="mod-val">{formatModifier(mod)}</span>
                  </span>
                );
              })}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <aside className="lore-panel parchment-surface rise-in" key={selected.id}>
          <header className="lore-header">
            <h3 className="lore-title">{selected.name}</h3>
            <span className="lore-sub">{selected.lifespan}</span>
          </header>
          <p className="lore-text illuminated">{selected.lore}</p>
          <ul className="lore-traits">
            {selected.traits.map((trait) => (
              <li key={trait}>
                <Icon name="fleuron" size={13} className="trait-marker" />
                <span>{trait}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
