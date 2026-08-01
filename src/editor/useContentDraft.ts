import { useCallback, useState } from 'react';
import type { DndClass, Race, StatBlock } from '../types/character';
import type { RuleSection } from '../types/rules';
import { CONTENT, PACK_FORMAT, PACK_VERSION, parseContentPack, type ContentPack } from '../content';

const DRAFT_KEY = 'chroniclers-table.draft.v1';

const EMPTY_STATS: StatBlock = {
  strength: 0,
  magic: 0,
  speed: 0,
  dexterity: 0,
  charisma: 0,
  health: 0,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function loadDraft(): ContentPack {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return parseContentPack(JSON.parse(raw));
  } catch {
    // A corrupt or outdated draft should never block the editor from opening.
  }
  return clone(CONTENT);
}

export function slugFrom(name: string, taken: Set<string>): string {
  const base =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'new-entry';
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function newRace(taken: Set<string>): Race {
  return {
    id: slugFrom('new race', taken),
    name: 'New Race',
    accent: '#8d6e3f',
    modifiers: { ...EMPTY_STATS },
    defaultAge: 30,
    lifespan: 'Around 80 years',
    lore: '',
    traits: [],
  };
}

export function newClass(taken: Set<string>): DndClass {
  return {
    id: slugFrom('new class', taken),
    name: 'New Class',
    accent: '#8d6e3f',
    modifiers: { ...EMPTY_STATS },
    abilities: [],
    lore: '',
    placeholder: false,
  };
}

export function useContentDraft() {
  const [pack, setPack] = useState<ContentPack>(loadDraft);

  const update = useCallback((patch: Partial<ContentPack>) => {
    setPack((prev) => {
      const next: ContentPack = { ...prev, ...patch, format: PACK_FORMAT, version: PACK_VERSION };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
      } catch {
        // Out of storage — the draft still lives in memory for this session.
      }
      return next;
    });
  }, []);

  const setRaces = useCallback((races: Race[]) => update({ races }), [update]);
  const setClasses = useCallback((classes: DndClass[]) => update({ classes }), [update]);
  const setCodex = useCallback((codex: RuleSection[]) => update({ codex }), [update]);
  const setLabel = useCallback((label: string) => update({ label }), [update]);

  const reset = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setPack(clone(CONTENT));
  }, []);

  const replace = useCallback(
    (incoming: ContentPack) => {
      update({
        races: incoming.races,
        classes: incoming.classes,
        codex: incoming.codex,
        label: incoming.label,
      });
    },
    [update],
  );

  /** True when the draft differs from the content the live app currently ships. */
  const isDirty =
    JSON.stringify({ r: pack.races, c: pack.classes, x: pack.codex }) !==
    JSON.stringify({ r: CONTENT.races, c: CONTENT.classes, x: CONTENT.codex });

  return { pack, setRaces, setClasses, setCodex, setLabel, reset, replace, isDirty };
}
