import { useEffect, useState } from 'react';
import { TextureDefs } from '../theme/TextureDefs';
import { Tabs, type TabDef } from '../components/Tabs';
import { Icon } from '../components/Icon';
import type { ContentPack } from '../content';
import type { Roll } from '../table/dice';
import { TablePanel } from '../table/TablePanel';
import { PasswordGate, forgetUnlock, isRemembered } from './PasswordGate';
import { readSharedCode } from '../export/shareCode';
import { useContentDraft } from './useContentDraft';
import { RaceEditor } from './RaceEditor';
import { ClassEditor } from './ClassEditor';
import { CodexEditor } from './CodexEditor';
import { RulesEditor } from './RulesEditor';
import { FieldsEditor } from './FieldsEditor';
import { PublishPanel } from './PublishPanel';
import './EditorApp.css';

/** Running a session and authoring the game are different jobs, so they get different rooms. */
type Mode = 'table' | 'forge';

const FORGE_TABS: TabDef[] = [
  { id: 'races', label: 'Races', icon: 'star' },
  { id: 'classes', label: 'Classes', icon: 'sword' },
  { id: 'rules', label: 'Rules', icon: 'table' },
  { id: 'fields', label: 'Fields', icon: 'document' },
  { id: 'codex', label: 'Codex', icon: 'book' },
  { id: 'publish', label: 'Publish', icon: 'scroll' },
];

const ROLLS_KEY = 'chroniclers-table.rolls.v1';

export function EditorApp() {
  // Remembered across visits, so the DM is not challenged every time they sit down.
  const [unlocked, setUnlocked] = useState(isRemembered);
  // A share link may have arrived; hold it until the gate is open.
  const [incoming] = useState<string | null>(readSharedCode);
  const [mode, setMode] = useState<Mode>('table');
  const [forgeTab, setForgeTab] = useState('races');

  const [raceId, setRaceId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [codexStat, setCodexStat] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);

  const [rolls, setRolls] = useState<Roll[]>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(ROLLS_KEY) ?? '[]') as Roll[];
    } catch {
      return [];
    }
  });

  const draft = useContentDraft();

  useEffect(() => {
    try {
      sessionStorage.setItem(ROLLS_KEY, JSON.stringify(rolls.slice(0, 40)));
    } catch {
      /* nothing important is lost if the log cannot be kept */
    }
  }, [rolls]);

  const logRoll = (roll: Roll) => setRolls((prev) => [roll, ...prev].slice(0, 40));

  const handleImport = (pack: ContentPack) => {
    draft.replace(pack);
    setRaceId(null);
    setClassId(null);
    setCodexStat(null);
    setFieldId(null);
  };

  if (!unlocked) {
    return (
      <div className="app wood-surface">
        <TextureDefs />
        <PasswordGate onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }


  return (
    <div className="app wood-surface">
      <TextureDefs />

      <header className="app-header">
        <div className="brand">
          <h1 className="display-title brand-title">DM Screen</h1>
          <p className="brand-sub">
            {mode === 'table' ? 'Run the session' : 'Rewrite the races, the classes and the rules'}
          </p>
        </div>
        {/* The table is one screen — only the forge is split into tabs. */}
        {mode === 'forge' && <Tabs tabs={FORGE_TABS} active={forgeTab} onChange={setForgeTab} />}
      </header>

      <div className="editor-bar">
        <div className="mode-switch" role="tablist" aria-label="Screen mode">
          <button
            className={`mode-btn${mode === 'table' ? ' mode-active' : ''}`}
            onClick={() => setMode('table')}
            role="tab"
            aria-selected={mode === 'table'}
          >
            At the table
          </button>
          <button
            className={`mode-btn${mode === 'forge' ? ' mode-active' : ''}`}
            onClick={() => setMode('forge')}
            role="tab"
            aria-selected={mode === 'forge'}
          >
            Build the game
          </button>
        </div>

        {mode === 'forge' && (
          <span className={`dirty-badge${draft.isDirty ? ' dirty-yes' : ''}`}>
            <Icon name={draft.isDirty ? 'scroll' : 'book'} size={13} />
            {draft.isDirty ? 'Unpublished changes' : 'Matches the live game'}
          </span>
        )}

        <div className="bar-links">
          <a className="live-link" href="../" target="_blank" rel="noreferrer">
            View the live game
          </a>
          <button
            className="live-link lock-btn"
            onClick={() => {
              forgetUnlock();
              setUnlocked(false);
            }}
          >
            Lock
          </button>
        </div>
      </div>

      <main className="editor-main">
        {mode === 'table' && (
          <TablePanel
            onLog={logRoll}
            rolls={rolls}
            onClearRolls={() => setRolls([])}
            incomingCode={incoming}
          />
        )}

        {mode === 'forge' && forgeTab === 'races' && (
          <RaceEditor races={draft.pack.races} onChange={draft.setRaces} selectedId={raceId} onSelect={setRaceId} />
        )}
        {mode === 'forge' && forgeTab === 'classes' && (
          <ClassEditor
            classes={draft.pack.classes}
            onChange={draft.setClasses}
            selectedId={classId}
            onSelect={setClassId}
          />
        )}
        {mode === 'forge' && forgeTab === 'rules' && (
          <RulesEditor mechanics={draft.pack.mechanics} onChange={draft.setMechanics} />
        )}
        {mode === 'forge' && forgeTab === 'fields' && (
          <FieldsEditor
            fields={draft.pack.characterFields}
            onChange={draft.setFields}
            selectedId={fieldId}
            onSelect={setFieldId}
          />
        )}
        {mode === 'forge' && forgeTab === 'codex' && (
          <CodexEditor
            codex={draft.pack.codex}
            onChange={draft.setCodex}
            selectedStat={codexStat}
            onSelect={setCodexStat}
          />
        )}
        {mode === 'forge' && forgeTab === 'publish' && (
          <PublishPanel
            pack={draft.pack}
            isDirty={draft.isDirty}
            onLabelChange={draft.setLabel}
            onImport={handleImport}
            onReset={draft.reset}
          />
        )}
      </main>
    </div>
  );
}
