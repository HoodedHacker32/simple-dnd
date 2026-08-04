import type { Character, StatBlock } from '../types/character';
import type { AttackSpeed, Spell } from '../types/spells';
import { CONTENT } from '../content';
import { RACE_BY_ID } from '../data/races';
import { CLASS_BY_ID } from '../data/classes';
import { calculateStats, deriveStats } from '../engine/statCalculator';

/** An attack a custom entity can make, so the DM has its numbers to hand. */
export interface EntityAttack {
  name: string;
  damage: number;
  speed: AttackSpeed;
}

/**
 * Anything with hit points standing on the board. Player characters keep a link
 * back to their sheet; monsters and props carry their own numbers.
 */
export interface Combatant {
  id: string;
  name: string;
  kind: 'player' | 'monster' | 'prop';
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  /** Drives turn order. Highest goes first. */
  speed: number;
  accent: string;
  /** Set for players — the character this was built from. */
  characterId?: string;
  classId?: string | null;
  subtitle?: string;
  attacks: EntityAttack[];
  notes: string;
  /** Knocked out at 0 HP, but kept on the board. */
  downed: boolean;
}

const uid = () => crypto.randomUUID();

/** Builds a combatant from a player character, reading its real derived stats. */
export function combatantFromCharacter(character: Character): Combatant {
  const race = character.raceId ? (RACE_BY_ID.get(character.raceId) ?? null) : null;
  const dndClass = character.classId ? (CLASS_BY_ID.get(character.classId) ?? null) : null;
  const stats: StatBlock = calculateStats(race, dndClass, character.statMode, character);
  const derived = deriveStats(stats, dndClass);

  // Only casters carry mana, so a barbarian's bar does not sit at a useless zero.
  const casts = derived.magicMultiplier !== null;

  return {
    id: uid(),
    name: character.name || 'Unnamed Wanderer',
    kind: 'player',
    hp: derived.hitPoints,
    maxHp: derived.hitPoints,
    mana: casts ? derived.manaMax : 0,
    maxMana: casts ? derived.manaMax : 0,
    speed: stats.speed,
    accent: dndClass?.accent ?? race?.accent ?? '#d4af37',
    characterId: character.id,
    classId: character.classId,
    subtitle: [race?.name, dndClass?.name].filter(Boolean).join(' · '),
    attacks: [],
    notes: '',
    downed: false,
  };
}

/**
 * A genuinely empty creature. The rules give no monster stat blocks, so the app
 * invents none — the DM fills in every number themselves.
 */
export function blankMonster(): Combatant {
  return {
    id: uid(),
    name: '',
    kind: 'monster',
    hp: 1,
    maxHp: 1,
    mana: 0,
    maxMana: 0,
    speed: 0,
    accent: '#8c2f24',
    subtitle: '',
    attacks: [],
    notes: '',
    downed: false,
  };
}

/** The entities the rules themselves give health to, read out of the spell list. */
export function ruleEntities(): { spellId: string; summon: NonNullable<Spell['summons']> }[] {
  return CONTENT.spells
    .filter((s): s is Spell & { summons: NonNullable<Spell['summons']> } => Boolean(s.summons))
    .map((s) => ({ spellId: s.id, summon: s.summons }));
}

export function combatantFromSummon(summon: NonNullable<Spell['summons']>): Combatant {
  return {
    id: uid(),
    name: summon.name,
    kind: 'prop',
    hp: summon.hp,
    maxHp: summon.hp,
    mana: 0,
    maxMana: 0,
    speed: 0,
    accent: '#5c8a3a',
    subtitle: 'From the rules',
    attacks: summon.retaliation
      ? [{ name: 'Retaliation', damage: summon.retaliation, speed: 'SN' }]
      : [],
    notes: summon.note ?? '',
    downed: false,
  };
}

/**
 * Turn order: highest Speed first. Ties are left in their existing order,
 * because the rules let the players sort those out between themselves.
 */
export function turnOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => b.speed - a.speed);
}

export function clampHp(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function applyDamage(c: Combatant, amount: number): Combatant {
  const hp = clampHp(c.hp - amount, c.maxHp);
  return { ...c, hp, downed: hp === 0 };
}

/**
 * Changes a creature's maximum health. One that has not been hurt yet follows
 * its new maximum, so typing 40 onto a fresh enemy gives 40/40 rather than
 * leaving it on death's door. A wounded one keeps its wounds.
 */
export function setMaxHp(c: Combatant, maxHp: number): Combatant {
  const max = Math.max(1, Math.round(maxHp));
  const untouched = c.hp >= c.maxHp;
  return { ...c, maxHp: max, hp: untouched ? max : Math.min(c.hp, max), downed: false };
}

export function applyHealing(c: Combatant, amount: number): Combatant {
  const hp = clampHp(c.hp + amount, c.maxHp);
  return { ...c, hp, downed: hp === 0 ? c.downed : false };
}

export function spellsFor(combatant: Combatant) {
  if (!combatant.classId) return [];
  return CONTENT.spells.filter((s) => s.classIds.includes(combatant.classId!));
}

/* ---------------------------------------------------------------- bestiary */

const BESTIARY_KEY = 'chroniclers-table.bestiary.v1';

/** A creature the DM built and kept, ready to drop onto the board again. */
export type BestiaryEntry = Omit<Combatant, 'id' | 'hp' | 'mana' | 'downed' | 'characterId' | 'classId'>;

export function loadBestiary(): BestiaryEntry[] {
  try {
    const raw = localStorage.getItem(BESTIARY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BestiaryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveBestiary(entries: BestiaryEntry[]): void {
  try {
    localStorage.setItem(BESTIARY_KEY, JSON.stringify(entries));
  } catch {
    // Out of storage — the bestiary still holds for this session.
  }
}

export function toBestiaryEntry(c: Combatant): BestiaryEntry {
  const { id: _id, hp: _hp, mana: _mana, downed: _downed, characterId: _cid, classId: _clsId, ...rest } = c;
  return rest;
}

export function fromBestiaryEntry(entry: BestiaryEntry): Combatant {
  return { ...entry, id: uid(), hp: entry.maxHp, mana: entry.maxMana, downed: false };
}

/* ------------------------------------------------------------- persistence */

const KEY = 'chroniclers-table.encounter.v1';

export interface EncounterState {
  partyName: string;
  combatants: Combatant[];
  round: number;
  activeIndex: number;
}

export const EMPTY_ENCOUNTER: EncounterState = {
  partyName: 'The Party',
  combatants: [],
  round: 1,
  activeIndex: 0,
};

export function loadEncounter(): EncounterState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_ENCOUNTER;
    const parsed = JSON.parse(raw) as EncounterState;
    if (!Array.isArray(parsed?.combatants)) return EMPTY_ENCOUNTER;
    return { ...EMPTY_ENCOUNTER, ...parsed };
  } catch {
    return EMPTY_ENCOUNTER;
  }
}

export function saveEncounter(state: EncounterState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Out of storage — the encounter still lives in memory for this session.
  }
}
