import type { Character, DndClass, Race, StatBlock, StatKey, StatMode } from '../types/character';
import { STAT_ORDER } from '../types/character';
import {
  BASE_HP,
  BOW_MULTIPLIERS,
  CHARISMA_MULTIPLIERS,
  DODGE_TARGETS,
  HP_PER_POINT,
  MAGIC_MULTIPLIERS,
  MOVEMENT_MULTIPLIERS,
  STEALTH_LIKELY,
  STEALTH_UNLIKELY,
  WEAPON_ACCESS,
} from '../data/rules';

export const ZERO_STATS: StatBlock = {
  strength: 0,
  magic: 0,
  speed: 0,
  dexterity: 0,
  charisma: 0,
  health: 0,
};

export function addStats(...blocks: (StatBlock | undefined)[]): StatBlock {
  const total = { ...ZERO_STATS };
  for (const block of blocks) {
    if (!block) continue;
    for (const key of STAT_ORDER) total[key] += block[key] ?? 0;
  }
  return total;
}

interface StatModeStrategy {
  id: StatMode;
  label: string;
  compute(input: { race: Race | null; dndClass: DndClass | null; character?: Character }): StatBlock;
}

const raceClassStrategy: StatModeStrategy = {
  id: 'raceClass',
  label: 'Race + Class',
  compute: ({ race, dndClass }) => addStats(race?.modifiers, dndClass?.modifiers),
};

const pointBuyStrategy: StatModeStrategy = {
  id: 'pointBuy',
  label: 'Race + Class + Point Buy',
  compute: ({ race, dndClass, character }) =>
    addStats(race?.modifiers, dndClass?.modifiers, character?.allocatedStats as StatBlock | undefined),
};

const STRATEGIES: Record<StatMode, StatModeStrategy> = {
  raceClass: raceClassStrategy,
  pointBuy: pointBuyStrategy,
};

export function calculateStats(
  race: Race | null,
  dndClass: DndClass | null,
  mode: StatMode = 'raceClass',
  character?: Character,
): StatBlock {
  return STRATEGIES[mode].compute({ race, dndClass, character });
}

/** Clamp to the 0-3 band the rule tables are written for, so lookups never fall off the end. */
function tier(value: number): number {
  return Math.max(0, Math.min(3, value));
}

export interface DerivedStats {
  hitPoints: number;
  weaponAccess: string;
  magicMultiplier: number | null;
  bowMultiplier: number | null;
  charismaMultiplier: number;
  movementMultiplier: number;
  movementRange: { min: number; max: number };
  stealthUnlikely: number;
  stealthLikely: number;
  dodgeTable: { comparison: string; target: number }[];
  /** Barbarian bare-fist damage multiplier, null for every other class. */
  bareFistMultiplier: number | null;
  /** Ranger's Archer ability adds +0.5 on top of the base bow multiplier. */
  archerBowMultiplier: number | null;
}

// The Ranger card's "+0.5 to the existing modifier" wording disagrees with its own worked table at
// Dexterity 1 (0.75 + 0.5 = 1.25, but the card says 1x). The explicit table wins.
const ARCHER_BOW_MULTIPLIERS: Record<number, number> = { 0: 0.5, 1: 1, 2: 1.5, 3: 2 };

// Object key order puts integer-like keys before negative ones, so the order is stated explicitly.
const DODGE_DELTAS = [-2, -1, 0, 1, 2, 3];

const DODGE_LABELS: Record<number, string> = {
  [-2]: '2+ slower than them',
  [-1]: '1 slower than them',
  0: 'Same speed',
  1: '1 faster than them',
  2: '2 faster than them',
  3: '3 faster than them',
};

export function deriveStats(stats: StatBlock, dndClass: DndClass | null): DerivedStats {
  const movementMultiplier = MOVEMENT_MULTIPLIERS[tier(stats.speed)];
  const baseBow = BOW_MULTIPLIERS[tier(stats.dexterity)];
  const isRanger = dndClass?.id === 'ranger';
  const isBarbarian = dndClass?.id === 'barbarian';

  return {
    hitPoints: BASE_HP + stats.health * HP_PER_POINT,
    weaponAccess: WEAPON_ACCESS[tier(stats.strength)],
    magicMultiplier: MAGIC_MULTIPLIERS[tier(stats.magic)],
    bowMultiplier: baseBow,
    charismaMultiplier: CHARISMA_MULTIPLIERS[tier(stats.charisma)],
    movementMultiplier,
    movementRange: {
      min: Math.floor(1 * movementMultiplier),
      max: Math.floor(4 * movementMultiplier),
    },
    stealthUnlikely: STEALTH_UNLIKELY[tier(stats.dexterity)],
    stealthLikely: STEALTH_LIKELY[tier(stats.dexterity)],
    dodgeTable: DODGE_DELTAS.map((delta) => ({
      comparison: DODGE_LABELS[delta],
      target: DODGE_TARGETS[delta],
    })),
    bareFistMultiplier: isBarbarian ? tier(stats.strength) + 1 : null,
    archerBowMultiplier: isRanger ? ARCHER_BOW_MULTIPLIERS[tier(stats.dexterity)] : null,
  };
}

export function formatModifier(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function statLabel(key: StatKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
