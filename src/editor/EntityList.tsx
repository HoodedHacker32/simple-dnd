import { Icon } from '../components/Icon';
import './EntityList.css';

interface EntityListItem {
  id: string;
  name: string;
  accent: string;
  muted?: boolean;
}

interface EntityListProps {
  items: EntityListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel: string;
  /** Refuse to delete below this many entries — a pack with no races cannot load. */
  minimum?: number;
}

export function EntityList({
  items,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  addLabel,
  minimum = 0,
}: EntityListProps) {
  const canRemove = items.length > minimum;

  return (
    <aside className="entity-list">
      {items.map((item) => (
        <div
          key={item.id}
          className={`entity-item${item.id === selectedId ? ' entity-active' : ''}${item.muted ? ' entity-muted' : ''}`}
          style={{ '--entity-accent': item.accent } as React.CSSProperties}
        >
          <button className="entity-select" onClick={() => onSelect(item.id)}>
            {item.name || 'Untitled'}
          </button>
          <button
            className="entity-remove"
            onClick={() => onRemove(item.id)}
            disabled={!canRemove}
            title={canRemove ? `Delete ${item.name}` : 'You need to keep at least one'}
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}

      <button className="btn entity-add" onClick={onAdd}>
        <Icon name="plus" size={13} />
        {addLabel}
      </button>
    </aside>
  );
}
