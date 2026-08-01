import type { Character } from '../../types/character';
import { RACE_BY_ID } from '../../data/races';
import { CLASS_BY_ID, classDisplayName } from '../../data/classes';
import { Icon } from '../../components/Icon';
import './Roster.css';

interface RosterProps {
  characters: Character[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onImportClick: () => void;
}

export function Roster({ characters, activeId, onSelect, onNew, onDelete, onImportClick }: RosterProps) {
  return (
    <aside className="roster">
      <div className="roster-head">
        <span className="filigree">Party</span>
      </div>

      <div className="roster-list">
        {characters.length === 0 && <p className="roster-empty">No one here yet. Forge someone.</p>}

        {characters.map((c) => {
          const race = c.raceId ? RACE_BY_ID.get(c.raceId) : null;
          const cls = c.classId ? CLASS_BY_ID.get(c.classId) : null;
          const accent = cls?.accent ?? race?.accent ?? 'var(--iron-light)';
          return (
            <div
              key={c.id}
              className={`roster-item${c.id === activeId ? ' roster-active' : ''}`}
              style={{ '--roster-accent': accent } as React.CSSProperties}
            >
              <button className="roster-select" onClick={() => onSelect(c.id)}>
                <span className="roster-name">{c.name || 'Unnamed'}</span>
                <span className="roster-meta">
                  {[race?.name, cls ? classDisplayName(cls) : null].filter(Boolean).join(' · ') || 'Not yet chosen'}
                </span>
              </button>
              <button className="roster-delete" onClick={() => onDelete(c.id)} title="Remove from party">
                <Icon name="close" size={13} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="roster-actions">
        <button className="btn btn-primary roster-action" onClick={onNew}>
          <Icon name="plus" size={14} />
          New
        </button>
        <button className="btn roster-action" onClick={onImportClick}>
          <Icon name="save" size={14} />
          Load file
        </button>
      </div>
    </aside>
  );
}
