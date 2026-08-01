import type { RuleSection } from '../types/rules';
import { STATS } from '../types/character';
import { EntityList } from './EntityList';
import './EntityEditor.css';

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

  return (
    <div className="entity-editor">
      <EntityList
        items={codex.map((s) => ({ id: s.stat, name: STATS[s.stat]?.label ?? s.stat, accent: 'var(--gold)' }))}
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
              <label className="field-label" htmlFor="codex-footnote">
                Footnote
              </label>
              <input
                id="codex-footnote"
                className="input"
                value={selected.footnote ?? ''}
                placeholder="Optional, e.g. Other uses may arise — ask your GM."
                onChange={(e) => patch({ footnote: e.target.value || undefined })}
              />
            </div>
          </div>

          <p className="id-note">
            The tables under this text are built from the numbers on the <strong>Rules</strong> tab, so what a
            player reads can never disagree with what the app calculates. Change the rule there and this
            section follows.
          </p>
        </div>
      )}
    </div>
  );
}
