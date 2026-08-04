import { useState, type RefObject } from 'react';
import type { Character, DndClass, Race, StatBlock } from '../../types/character';
import type { DerivedStats } from '../../engine/statCalculator';
import { saveCharacterToFile } from '../../export/saveFile';
import { encodeCharacter, shareLink } from '../../export/shareCode';
import { Icon, type IconName } from '../../components/Icon';
import './ExportBar.css';

interface ExportBarProps {
  character: Character;
  race: Race | null;
  dndClass: DndClass | null;
  stats: StatBlock;
  derived: DerivedStats;
  sheetRef: RefObject<HTMLDivElement | null>;
}

export function ExportBar({ character, race, dndClass, stats, derived, sheetRef }: ExportBarProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const run = async (id: string, task: () => Promise<void> | void) => {
    setBusy(id);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That export failed.');
    } finally {
      setBusy(null);
    }
  };

  const withSheet = (task: (node: HTMLElement) => Promise<void>) => async () => {
    const node = sheetRef.current;
    if (!node) throw new Error('The sheet is not on screen yet.');
    await task(node);
  };

  const payload = { character, race, dndClass, stats, derived };

  const actions: { id: string; label: string; icon: IconName; run: () => Promise<void> | void }[] = [
    { id: 'save', label: 'Save', icon: 'save', run: () => saveCharacterToFile(character) },
    {
      id: 'share',
      label: 'Send to DM',
      icon: 'scroll',
      run: async () => {
        setShareCode(await encodeCharacter(character));
        setLink(await shareLink(character));
        setCopied(null);
      },
    },
    {
      id: 'png',
      label: 'PNG',
      icon: 'image',
      run: withSheet(async (node) => (await import('../../export/exportImage')).exportSheetAsPng(node, character)),
    },
    {
      id: 'pdf',
      label: 'PDF',
      icon: 'scroll',
      run: withSheet(async (node) => (await import('../../export/exportImage')).exportSheetAsPdf(node, character)),
    },
    {
      id: 'docx',
      label: 'Word',
      icon: 'document',
      run: async () => (await import('../../export/exportDocs')).exportCharacterAsDocx(payload),
    },
    {
      id: 'xlsx',
      label: 'Sheet',
      icon: 'table',
      run: async () => (await import('../../export/exportDocs')).exportCharacterAsXlsx(payload),
    },
  ];

  return (
    <div className="export-bar">
      <span className="export-title">Take it with you</span>
      <div className="export-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="btn export-btn"
            disabled={busy !== null}
            onClick={() => run(action.id, action.run)}
          >
            <Icon name={action.icon} size={15} />
            {busy === action.id ? 'Working…' : action.label}
          </button>
        ))}
      </div>
      {error && <p className="export-error">{error}</p>}

      {shareCode && (
        <div className="share-box">
          <p className="share-intro">
            Send your DM this link. Opening it drops your character straight into their party — the character
            travels inside the address itself, so nothing is uploaded anywhere.
          </p>

          <textarea
            className="textarea share-code"
            readOnly
            value={link ?? ''}
            onFocus={(e) => e.target.select()}
          />

          <div className="share-actions">
            <button
              className="btn btn-primary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link ?? '');
                  setCopied('link');
                } catch {
                  setError('Could not reach the clipboard — select the link and copy it by hand.');
                }
              }}
            >
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShareCode(null)}>
              Close
            </button>
          </div>

          <details className="share-fallback">
            <summary>Or send the plain code</summary>
            <p className="hint">
              Use this if the link gets mangled on the way — your DM can paste it into the box on their screen.
            </p>
            <textarea className="textarea share-code" readOnly value={shareCode} onFocus={(e) => e.target.select()} />
            <button
              className="btn"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareCode);
                  setCopied('code');
                } catch {
                  setError('Could not reach the clipboard — select the code and copy it by hand.');
                }
              }}
            >
              {copied === 'code' ? 'Copied' : 'Copy code'}
            </button>
          </details>
        </div>
      )}
    </div>
  );
}
