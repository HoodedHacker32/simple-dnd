import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../components/Icon';
import { RACE_BY_ID } from '../data/races';
import { CLASS_BY_ID } from '../data/classes';
import { calculateStats } from '../engine/statCalculator';
import { downloadParty, readAnyFile } from '../export/partyFile';
import { decodeCharacter } from '../export/shareCode';
import type { Character } from '../types/character';
import type { Roll } from './dice';
import {
  blankMonster,
  combatantFromCharacter,
  loadEncounter,
  saveEncounter,
  turnOrder,
  type Combatant,
  type EncounterState,
} from './encounter';
import { CombatantCard } from './CombatantCard';
import './TablePanel.css';

interface TablePanelProps {
  onLog: (roll: Roll) => void;
}

/** Stat scores for a player, so their spells resolve on the right number. */
function scoresFor(c: Combatant, characters: Map<string, Character>): Record<string, number> {
  const character = c.characterId ? characters.get(c.characterId) : undefined;
  if (!character) return {};
  const race = character.raceId ? (RACE_BY_ID.get(character.raceId) ?? null) : null;
  const dndClass = character.classId ? (CLASS_BY_ID.get(character.classId) ?? null) : null;
  return calculateStats(race, dndClass, character.statMode, character);
}

export function TablePanel({ onLog }: TablePanelProps) {
  const [state, setState] = useState<EncounterState>(loadEncounter);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ text: string; bad?: boolean } | null>(null);
  const [sources, setSources] = useState<Map<string, Character>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveEncounter(state), [state]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const order = useMemo(() => turnOrder(state.combatants), [state.combatants]);
  const active = order[state.activeIndex % Math.max(1, order.length)];

  const update = (patch: Partial<EncounterState>) => setState((s) => ({ ...s, ...patch }));

  const addCharacters = (characters: Character[], via: string) => {
    if (characters.length === 0) return;
    setSources((prev) => {
      const next = new Map(prev);
      for (const c of characters) next.set(c.id, c);
      return next;
    });
    setState((s) => ({ ...s, combatants: [...s.combatants, ...characters.map(combatantFromCharacter)] }));
    setMessage({ text: `Added ${characters.map((c) => c.name || 'an unnamed wanderer').join(', ')} ${via}.` });
  };

  const importFile = async (file: File) => {
    try {
      const { name, members } = readAnyFile(await file.text());
      if (name) update({ partyName: name });
      addCharacters(members, 'from file');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'That file could not be read.', bad: true });
    }
  };

  const importCode = async () => {
    try {
      addCharacters([await decodeCharacter(code)], 'from a share code');
      setCode('');
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'That code could not be read.', bad: true });
    }
  };

  const patchCombatant = (id: string, next: Combatant) =>
    setState((s) => ({ ...s, combatants: s.combatants.map((c) => (c.id === id ? next : c)) }));

  const players = state.combatants.filter((c) => c.kind === 'player');
  const others = state.combatants.filter((c) => c.kind !== 'player');

  return (
    <div className="table-panel">
      {/* ------------------------------------------------------ Party bar */}
      <div className="party-bar">
        <div className="party-name-field">
          <label className="field-label" htmlFor="party-name">
            Party
          </label>
          <input
            id="party-name"
            className="input"
            value={state.partyName}
            onChange={(e) => update({ partyName: e.target.value })}
          />
        </div>

        <div className="party-actions">
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="document" size={14} />
            Load .dndchar / .dndparty
          </button>
          <button
            className="btn"
            disabled={players.length === 0}
            onClick={() => {
              const members = players
                .map((p) => (p.characterId ? sources.get(p.characterId) : undefined))
                .filter((c): c is Character => Boolean(c));
              if (members.length === 0) {
                setMessage({ text: 'Only characters loaded this session can be saved back out.', bad: true });
                return;
              }
              downloadParty(state.partyName, members);
            }}
          >
            <Icon name="save" size={14} />
            Save party
          </button>
        </div>
      </div>

      <div className="code-bar">
        <input
          className="input"
          value={code}
          placeholder="Paste a share code from a player — CT1:…"
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && importCode()}
        />
        <button className="btn btn-primary" disabled={!code.trim()} onClick={importCode}>
          Add to party
        </button>
      </div>

      {message && <div className={`table-message${message.bad ? ' message-bad' : ''}`}>{message.text}</div>}

      {/* --------------------------------------------------- Turn tracker */}
      {state.combatants.length > 0 && (
        <div className="turn-bar">
          <div className="turn-info">
            <span className="turn-round">Round {state.round}</span>
            <span className="turn-active">
              {active ? `${active.name} to act` : 'Nobody on the board'}
              {active && <em> — Speed {active.speed}</em>}
            </span>
          </div>
          <div className="turn-controls">
            <button
              className="btn btn-ghost"
              onClick={() =>
                setState((s) => {
                  const count = Math.max(1, s.combatants.length);
                  const prev = s.activeIndex - 1;
                  return prev < 0
                    ? { ...s, activeIndex: count - 1, round: Math.max(1, s.round - 1) }
                    : { ...s, activeIndex: prev };
                })
              }
            >
              <Icon name="chevronLeft" size={13} />
              Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() =>
                setState((s) => {
                  const count = Math.max(1, s.combatants.length);
                  const next = s.activeIndex + 1;
                  return next >= count
                    ? { ...s, activeIndex: 0, round: s.round + 1 }
                    : { ...s, activeIndex: next };
                })
              }
            >
              Next turn
              <Icon name="chevronRight" size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ The board */}
      {state.combatants.length === 0 ? (
        <div className="empty-state parchment-surface">
          <h3>Nobody at the table yet</h3>
          <p>
            Load a character file a player sent you, paste their share code, or add a creature below. Whatever
            you build here stays in this browser until you clear it.
          </p>
        </div>
      ) : (
        <>
          {players.length > 0 && (
            <>
              <span className="filigree board-filigree">The party</span>
              <div className="board-grid">
                {turnOrder(players).map((c) => (
                  <CombatantCard
                    key={c.id}
                    combatant={c}
                    active={active?.id === c.id}
                    keyScores={scoresFor(c, sources)}
                    onChange={(next) => patchCombatant(c.id, next)}
                    onRemove={() =>
                      setState((s) => ({ ...s, combatants: s.combatants.filter((x) => x.id !== c.id) }))
                    }
                    onLog={onLog}
                  />
                ))}
              </div>
            </>
          )}

          {others.length > 0 && (
            <>
              <span className="filigree board-filigree">Everything else</span>
              <div className="board-grid">
                {turnOrder(others).map((c) => (
                  <CombatantCard
                    key={c.id}
                    combatant={c}
                    active={active?.id === c.id}
                    keyScores={{}}
                    onChange={(next) => patchCombatant(c.id, next)}
                    onRemove={() =>
                      setState((s) => ({ ...s, combatants: s.combatants.filter((x) => x.id !== c.id) }))
                    }
                    onLog={onLog}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="board-tools">
        <button
          className="btn"
          onClick={() => setState((s) => ({ ...s, combatants: [...s.combatants, blankMonster()] }))}
        >
          <Icon name="plus" size={14} />
          Add a creature
        </button>
        <button
          className="btn"
          onClick={() =>
            setState((s) => ({
              ...s,
              combatants: [
                ...s.combatants,
                { ...blankMonster('Thorn Wall'), kind: 'prop', hp: 120, maxHp: 120, speed: 0, accent: '#5c8a3a' },
              ],
            }))
          }
        >
          <Icon name="plus" size={14} />
          Add a prop
        </button>
        {state.combatants.length > 0 && (
          <button
            className="btn btn-ghost danger-btn"
            onClick={() => {
              if (confirm('Clear everyone from the board? Saved character files are untouched.')) {
                setState({ ...state, combatants: [], round: 1, activeIndex: 0 });
              }
            }}
          >
            Clear the board
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".dndchar,.dndparty,.json,application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
