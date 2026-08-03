import { useEffect, useState } from 'react';
import { TextureDefs } from '../theme/TextureDefs';
import { Tabs, type TabDef } from '../components/Tabs';
import { Icon } from '../components/Icon';
import type { ContentPack } from '../content';
import type { Roll } from '../table/dice';
import { TablePanel } from '../table/TablePanel';
import { DiceRoller } from '../table/DiceRoller';
import { PasswordGate } from './PasswordGate';
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

const TABLE_TABS: TabDef[] = [
  { id: 'party', label: 'Party', icon: 'sword' },
  { id: 'dice', label: 'Dice', icon: 'table' },
];

const FORGE_TABS: TabDef[] = [
  { id: 'races', label: 'Races', icon: 'star' },
  { id: 'classes', label: 'Classes', icon: 'sword' },
  { id: 'rules', label: 'Rules', icon: 'table' },
  { id: 'fields', label: 'Fields', icon: 'document' },
  { id: 'codex', label: 'Codex', icon: 'book' },
  { id: 'publish', label: 'Publish', icon: 'scroll' },
];

const UNLOCK_KEY = 'chroniclers-table.unlocked';
const ROLLS_KEY = 'chroniclers-table.rolls.v1';

export function EditorApp() {
  // Persisted so a mid-session refresh does not lock the DM out of their own table.
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(UNLOCK_KEY) === 'yes');
  const [mode, setMode] = useState<Mode>('table');
  const [tableTab, setTableTab] = useState('party');
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
        <PasswordGate
          onUnlock={() => {
            sessionStorage.setItem(UNLOCK_KEY, 'yes');
            setUnlocked(true);
          }}
        />
      </div>
    );
  }

  const tabs = mode === 'table' ? TABLE_TABS : FORGE_TABS;
  const activeTab = mode === 'table' ? tableTab : forgeTab;
  const setActiveTab = mode === 'table' ? setTableTab : setForgeTab;

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
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
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

        <a className="live-link" href="../" target="_blank" rel="noreferrer">
          View the live game
        </a>
      </div>

      <main className="editor-main">
        {mode === 'table' && tableTab === 'party' && <TablePanel onLog={logRoll} />}
        {mode === 'table' && tableTab === 'dice' && (
          <DiceRoller history={rolls} onRoll={logRoll} onClear={() => setRolls([])} />
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
