import type { RuleSection, RuleTable } from '../types/rules';
import { STATS } from '../types/character';
import { Icon } from '../components/Icon';
import { EntityList } from './EntityList';
import './EntityEditor.css';
import './CodexEditor.css';

interface CodexEditorProps {
  codex: RuleSection[];
  onChange: (next: RuleSection[]) => void;
  selectedStat: string | null;
  onSelect: (stat: string) => void;
}

export function CodexEditor({ codex, onChange, selectedStat, onSelect }: CodexEditorProps) {
  const selected = codex.find((s) => s.stat === selectedStat) ?? codex[0] ?? null;

  const patch = (changes: Partial<RuleSection>) => {
    if (!selected) return;
    onChange(codex.map((s) => (s.stat === selected.stat ? { ...s, ...changes } : s)));
  };

  const setTable = (i: number, changes: Partial<RuleTable>) =>
    patch({ tables: selected!.tables.map((t, j) => (j === i ? { ...t, ...changes } : t)) });

  return (
    <div className="entity-editor">
      <EntityList
        items={codex.map((s) => ({
          id: s.stat,
          name: STATS[s.stat]?.label ?? s.stat,
          accent: 'var(--gold)',
        }))}
        selectedId={selected?.stat ?? null}
        onSelect={onSelect}
        onAdd={() => {}}
        onRemove={() => {}}
        addLabel=""
        minimum={codex.length}
      />

      {selected && (
        <div className="entity-form parchment-surface" key={selected.stat}>
          <div className="form-grid">
            <div className="field field-full">
              <label className="field-label" htmlFor="codex-headline">
                Headline
              </label>
              <input
                id="codex-headline"
                className="input"
                value={selected.headline}
                placeholder="One sentence on what this stat is for."
                onChange={(e) => patch({ headline: e.target.value })}
              />
            </div>

            <div className="field field-full">
              <label className="field-label" htmlFor="codex-plain">
                Plain-English explanation
              </label>
              <textarea
                id="codex-plain"
                className="textarea"
                value={selected.plainEnglish}
                onChange={(e) => patch({ plainEnglish: e.target.value })}
              />
            </div>

            <div className="field field-full">
              <span className="field-label">Tables</span>

              {selected.tables.map((table, i) => (
                <div className="table-block" key={i}>
                  <div className="ability-head">
                    <div className="field">
                      <label className="field-label" htmlFor={`table-title-${i}`}>
                        Table title
                      </label>
                      <input
                        id={`table-title-${i}`}
                        className="input"
                        value={table.title}
                        onChange={(e) => setTable(i, { title: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      className="ability-delete"
                      aria-label={`Remove table ${table.title}`}
                      onClick={() => patch({ tables: selected.tables.filter((_, j) => j !== i) })}
                    >
                      <Icon name="close" size={13} />
                    </button>
                  </div>

                  <div className="table-cols">
                    <div className="field">
                      <label className="field-label" htmlFor={`table-c0-${i}`}>
                        Left column
                      </label>
                      <input
                        id={`table-c0-${i}`}
                        className="input"
                        value={table.columns[0]}
                        onChange={(e) => setTable(i, { columns: [e.target.value, table.columns[1]] })}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor={`table-c1-${i}`}>
                        Right column
                      </label>
                      <input
                        id={`table-c1-${i}`}
                        className="input"
                        value={table.columns[1]}
                        onChange={(e) => setTable(i, { columns: [table.columns[0], e.target.value] })}
                      />
                    </div>
                  </div>

                  <table className="row-grid">
                    <tbody>
                      {table.rows.map((row, k) => (
                        <tr key={k}>
                          <td>
                            <input
                              className="input"
                              value={row.key}
                              aria-label={`Row ${k + 1} left`}
                              onChange={(e) =>
                                setTable(i, {
                                  rows: table.rows.map((r, m) =>
                                    m === k ? { ...r, key: e.target.value } : r,
                                  ),
                                })
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={row.value}
                              aria-label={`Row ${k + 1} right`}
                              onChange={(e) =>
                                setTable(i, {
                                  rows: table.rows.map((r, m) =>
                                    m === k ? { ...r, value: e.target.value } : r,
                                  ),
                                })
                              }
                            />
                          </td>
                          <td className="row-actions">
                            <button
                              type="button"
                              className="ability-delete"
                              aria-label={`Remove row ${k + 1}`}
                              onClick={() =>
                                setTable(i, { rows: table.rows.filter((_, m) => m !== k) })
                              }
                            >
                              <Icon name="close" size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button
                    type="button"
                    className="btn btn-ghost list-add"
                    onClick={() => setTable(i, { rows: [...table.rows, { key: '', value: '' }] })}
                  >
                    <Icon name="plus" size={13} />
                    Add row
                  </button>

                  <div className="field table-footnote">
                    <label className="field-label" htmlFor={`table-foot-${i}`}>
                      Footnote
                    </label>
                    <input
                      id={`table-foot-${i}`}
                      className="input"
                      value={table.footnote ?? ''}
                      placeholder="Optional"
                      onChange={(e) => setTable(i, { footnote: e.target.value || undefined })}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                className="btn btn-ghost list-add"
                onClick={() =>
                  patch({
                    tables: [
                      ...selected.tables,
                      { title: 'New table', columns: ['Score', 'Effect'], rows: [{ key: '0', value: '' }] },
                    ],
                  })
                }
              >
                <Icon name="plus" size={13} />
                Add table
              </button>
            </div>
          </div>

          <p className="id-note">
            These tables are what players <em>read</em>. The numbers the app actually calculates with live in
            <code>src/data/rules.ts</code> — if you change a table here, change that file to match.
          </p>
        </div>
      )}
    </div>
  );
}
