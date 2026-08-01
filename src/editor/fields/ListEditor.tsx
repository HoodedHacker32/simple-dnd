import { Icon } from '../../components/Icon';
import './ListEditor.css';

interface ListEditorProps {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}

/** Editable list of single-line strings, used for race traits. */
export function ListEditor({ label, items, onChange, placeholder, addLabel = 'Add' }: ListEditorProps) {
  const setAt = (i: number, value: string) => onChange(items.map((item, j) => (j === i ? value : item)));
  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i));

  return (
    <div className="list-editor">
      <span className="field-label">{label}</span>

      {items.length === 0 && <p className="list-empty">Nothing here yet.</p>}

      {items.map((item, i) => (
        <div className="list-row" key={i}>
          <input
            className="input"
            value={item}
            placeholder={placeholder}
            onChange={(e) => setAt(i, e.target.value)}
          />
          <button
            type="button"
            className="list-remove"
            onClick={() => removeAt(i)}
            aria-label={`Remove item ${i + 1}`}
          >
            <Icon name="close" size={13} />
          </button>
        </div>
      ))}

      <button type="button" className="btn btn-ghost list-add" onClick={() => onChange([...items, ''])}>
        <Icon name="plus" size={13} />
        {addLabel}
      </button>
    </div>
  );
}
