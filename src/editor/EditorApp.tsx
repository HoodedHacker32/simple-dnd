import { useState } from 'react';
import { TextureDefs } from '../theme/TextureDefs';
import { Tabs, type TabDef } from '../components/Tabs';
import { Icon } from '../components/Icon';
import type { ContentPack } from '../content';
import { PasswordGate } from './PasswordGate';
import { useContentDraft } from './useContentDraft';
import { RaceEditor } from './RaceEditor';
import { ClassEditor } from './ClassEditor';
import { CodexEditor } from './CodexEditor';
import { RulesEditor } from './RulesEditor';
import { FieldsEditor } from './FieldsEditor';
import { PublishPanel } from './PublishPanel';
import './EditorApp.css';

const TABS: TabDef[] = [
  { id: 'races', label: 'Races', icon: 'star' },
  { id: 'classes', label: 'Classes', icon: 'sword' },
  { id: 'rules', label: 'Rules', icon: 'table' },
  { id: 'fields', label: 'Fields', icon: 'document' },
  { id: 'codex', label: 'Codex', icon: 'book' },
  { id: 'publish', label: 'Publish', icon: 'scroll' },
];

export function EditorApp() {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState('races');
  const [raceId, setRaceId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [codexStat, setCodexStat] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);

  const draft = useContentDraft();

  const handleImport = (pack: ContentPack) => {
    draft.replace(pack);
    setRaceId(null);
    setClassId(null);
    setCodexStat(null);
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
          <p className="brand-sub">Rewrite the races, the classes and the rules</p>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </header>

      <div className="editor-bar">
        <span className={`dirty-badge${draft.isDirty ? ' dirty-yes' : ''}`}>
          <Icon name={draft.isDirty ? 'scroll' : 'book'} size={13} />
          {draft.isDirty ? 'Unpublished changes' : 'Matches the live game'}
        </span>
        <a className="live-link" href="../" target="_blank" rel="noreferrer">
          View the live game
        </a>
      </div>

      <main className="editor-main">
        {tab === 'races' && (
          <RaceEditor
            races={draft.pack.races}
            onChange={draft.setRaces}
            selectedId={raceId}
            onSelect={setRaceId}
          />
        )}

        {tab === 'classes' && (
          <ClassEditor
            classes={draft.pack.classes}
            onChange={draft.setClasses}
            selectedId={classId}
            onSelect={setClassId}
          />
        )}

        {tab === 'rules' && (
          <RulesEditor mechanics={draft.pack.mechanics} onChange={draft.setMechanics} />
        )}

        {tab === 'fields' && (
          <FieldsEditor
            fields={draft.pack.characterFields}
            onChange={draft.setFields}
            selectedId={fieldId}
            onSelect={setFieldId}
          />
        )}

        {tab === 'codex' && (
          <CodexEditor
            codex={draft.pack.codex}
            onChange={draft.setCodex}
            selectedStat={codexStat}
            onSelect={setCodexStat}
          />
        )}

        {tab === 'publish' && (
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
