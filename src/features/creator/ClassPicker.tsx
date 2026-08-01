import { CLASSES, classDisplayName } from '../../data/classes';
import { STATS, STAT_ORDER } from '../../types/character';
import { formatModifier } from '../../engine/statCalculator';
import './Picker.css';

interface ClassPickerProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClassPicker({ selectedId, onSelect }: ClassPickerProps) {
  const selected = CLASSES.find((c) => c.id === selectedId) ?? null;

  return (
    <div className={`picker${selected ? ' picker-open' : ''}`}>
      <div className="picker-grid">
        {CLASSES.map((cls) => {
          const locked = Boolean(cls.placeholder);
          return (
            <button
              key={cls.id}
              className={`choice-card${selectedId === cls.id ? ' choice-selected' : ''}${locked ? ' choice-locked' : ''}`}
              style={{ '--card-accent': cls.accent } as React.CSSProperties}
              onClick={() => !locked && onSelect(cls.id)}
              disabled={locked}
              aria-pressed={selectedId === cls.id}
              aria-label={classDisplayName(cls)}
              title={locked ? cls.placeholderNote : undefined}
            >
              <span className="choice-banner" />
              <span className="choice-name">{cls.name}</span>
              {cls.subtitle && <span className="choice-subtitle">{cls.subtitle}</span>}
              {locked ? (
                <span className="choice-locked-badge">Coming Soon</span>
              ) : (
                <span className="choice-mods">
                  {STAT_ORDER.map((key) => {
                    const mod = cls.modifiers[key];
                    return (
                      <span key={key} className={`mod${mod > 0 ? ' mod-up' : mod < 0 ? ' mod-down' : ' mod-flat'}`}>
                        <span className="mod-abbr">{STATS[key].abbr}</span>
                        <span className="mod-val">{formatModifier(mod)}</span>
                      </span>
                    );
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <aside className="lore-panel parchment-surface rise-in" key={selected.id}>
          <header className="lore-header">
            <h3 className="lore-title">{selected.name}</h3>
            {selected.subtitle && <span className="lore-sub">{selected.subtitle}</span>}
          </header>
          <p className="lore-text illuminated">{selected.lore}</p>
          <div className="lore-abilities">
            <span className="filigree">Ability</span>
            {selected.abilities.map((ability) => (
              <div key={ability.name} className="ability">
                <h4 className="ability-name">{ability.name}</h4>
                <p className="ability-desc">{ability.description}</p>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
