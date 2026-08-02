import { useEffect, useRef, useState } from 'react';
import type { Character } from './types/character';
import { TextureDefs } from './theme/TextureDefs';
import { Tabs, type TabDef } from './components/Tabs';
import { Creator } from './features/creator/Creator';
import { Codex } from './features/codex/Codex';
import { Roster } from './features/roster/Roster';
import { readCharacterFile } from './export/saveFile';
import { loadRoster, saveRoster } from './storage/roster';
import './App.css';

const TABS: TabDef[] = [
  { id: 'creator', label: 'Character', icon: 'sword' },
  { id: 'codex', label: 'Codex', icon: 'book' },
];

export function newCharacter(): Character {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: '',
    fields: {},
    raceId: null,
    classId: null,
    statMode: 'raceClass',
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [tab, setTab] = useState('creator');
  const [roster, setRoster] = useState<Character[]>(() => loadRoster());
  const [character, setCharacter] = useState<Character>(() => loadRoster()[0] ?? newCharacter());
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveRoster(roster);
  }, [roster]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const updateCharacter = (patch: Partial<Character>) => {
    setCharacter((prev) => {
      const next = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      setRoster((list) => {
        const index = list.findIndex((c) => c.id === next.id);
        if (index === -1) return [...list, next];
        const copy = [...list];
        copy[index] = next;
        return copy;
      });
      return next;
    });
  };

  const handleNew = () => {
    const fresh = newCharacter();
    setCharacter(fresh);
    setRoster((list) => [...list, fresh]);
    setTab('creator');
  };

  const handleSelect = (id: string) => {
    const found = roster.find((c) => c.id === id);
    if (found) {
      setCharacter(found);
      setTab('creator');
    }
  };

  const handleDelete = (id: string) => {
    setRoster((list) => {
      const remaining = list.filter((c) => c.id !== id);
      if (character.id === id) {
        setCharacter(remaining[0] ?? newCharacter());
      }
      return remaining;
    });
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await readCharacterFile(file);
      // Re-key on import so loading the same file twice does not overwrite the original.
      const adopted: Character = { ...imported, id: crypto.randomUUID(), updatedAt: new Date().toISOString() };
      setRoster((list) => [...list, adopted]);
      setCharacter(adopted);
      setTab('creator');
      setNotice(`Loaded ${adopted.name || 'an unnamed wanderer'}.`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'That file could not be read.');
    }
  };

  return (
    <div className="app wood-surface">
      <TextureDefs />

      <header className="app-header">
        <div className="brand">
          <h1 className="display-title brand-title">The Chronicler's Table</h1>
          <p className="brand-sub">A character forge for a simpler kind of adventure</p>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </header>

      <div className="app-body">
        <Roster
          characters={roster}
          activeId={character.id}
          onSelect={handleSelect}
          onNew={handleNew}
          onDelete={handleDelete}
          onImportClick={() => fileInputRef.current?.click()}
        />

        <main className="app-main">
          {tab === 'creator' ? <Creator character={character} onChange={updateCharacter} /> : <Codex />}
        </main>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
          e.target.value = '';
        }}
      />

      {notice && <div className="notice rise-in">{notice}</div>}
    </div>
  );
}
