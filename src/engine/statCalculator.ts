import type { Character, ClassEffectKind, DndClass, Race, StatBlock, StatKey, StatMode } from '../types/character';
import { STAT_ORDER } from '../types/character';
import type { Mechanics, Rounding, TierValues } from '../types/rules';
import { CONTENT } from '../content';

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

/**
 * Clamps a score to a row that exists in the tables. A character can exceed the
 * top score — a Half-Orc Barbarian reaches Strength 4 — and the rules only go
 * as far as `maxTier`, so anything above reuses the top row.
 */
function tier(value: number, mechanics: Mechanics, table?: TierValues | unknown[]): number {
  const ceiling = Math.min(mechanics.maxTier, (table?.length ?? mechanics.maxTier + 1) - 1);
  return Math.max(0, Math.min(ceiling, value));
}

function lookup(table: TierValues, value: number, mechanics: Mechanics): number | null {
  return table[tier(value, mechanics, table)] ?? null;
}

export function applyRounding(value: number, mode: Rounding): number {
  if (mode === 'ceil') return Math.ceil(value);
  if (mode === 'round') return Math.round(value);
  return Math.floor(value);
}

export interface EffectResult {
  kind: ClassEffectKind;
  label: string;
  value: number | null;
}

export interface DerivedStats {
  hitPoints: number;
  weaponAccess: string;
  magicMultiplier: number | null;
  bowMultiplier: number | null;
  charismaMultiplier: number;
  movementMultiplier: number;
  movementDie: number;
  movementRange: { min: number; max: number };
  stealthUnlikely: number;
  stealthLikely: number;
  /** How many spells any caster may cast in a day. */
  spellsPerDay: number;
  dodgeTable: { comparison: string; target: number }[];
  /** Class effects that add a line rather than replacing a base value. */
  extraEffects: EffectResult[];
  /** Labels for base values a class effect overrode, keyed by what it replaced. */
  overrides: Partial<Record<ClassEffectKind, string>>;
}

function dodgeLabel(delta: number): string {
  if (delta === 0) return 'Same speed';
  const n = Math.abs(delta);
  const direction = delta > 0 ? 'faster' : 'slower';
  const suffix = delta < -1 ? '+ ' : ' ';
  return `${n}${suffix}${direction} than them`;
}

export function deriveStats(
  stats: StatBlock,
  dndClass: DndClass | null,
  mechanics: Mechanics = CONTENT.mechanics,
): DerivedStats {
  const effects = dndClass?.effects ?? [];
  const byKind = new Map(effects.map((e) => [e.kind, e]));

  /** A class effect wins over the base table when it targets the same value. */
  const resolve = (kind: ClassEffectKind, base: number | null): { value: number | null; label?: string } => {
    const effect = byKind.get(kind);
    if (!effect) return { value: base };
    return { value: lookup(effect.values, stats[effect.basedOn], mechanics), label: effect.label };
  };

  const magic = resolve('spellPower', lookup(mechanics.magic.multipliers, stats.magic, mechanics));
  const bow = resolve('bowRange', lookup(mechanics.bow.multipliers, stats.dexterity, mechanics));
  const social = resolve('socialRolls', lookup(mechanics.charisma.multipliers, stats.charisma, mechanics));
  const move = resolve('movement', lookup(mechanics.movement.multipliers, stats.speed, mechanics));

  const movementMultiplier = move.value ?? 1;
  const die = mechanics.movement.die;

  const overrides: Partial<Record<ClassEffectKind, string>> = {};
  for (const [kind, result] of [
    ['spellPower', magic],
    ['bowRange', bow],
    ['socialRolls', social],
    ['movement', move],
  ] as const) {
    if (result.label) overrides[kind] = result.label;
  }

  const stealthTier = (table: number[]) => table[tier(stats.dexterity, mechanics, table)] ?? 21;

  // A stealth effect replaces the harder column, which is how the Rogue is
  // "always treated as favourable" — its effect table is the favourable one.
  const stealthEffect = byKind.get('stealth');
  if (stealthEffect) overrides.stealth = stealthEffect.label;
  const unlikelyTable = stealthEffect
    ? stealthEffect.values.map((v) => v ?? 21)
    : mechanics.stealth.unlikely;

  return {
    hitPoints: mechanics.baseHp + stats.health * mechanics.hpPerPoint,
    weaponAccess: mechanics.weaponAccess[tier(stats.strength, mechanics, mechanics.weaponAccess)] ?? '—',
    magicMultiplier: magic.value,
    bowMultiplier: bow.value,
    charismaMultiplier: social.value ?? 0,
    movementMultiplier,
    movementDie: die,
    movementRange: {
      min: applyRounding(1 * movementMultiplier, mechanics.movement.rounding),
      max: applyRounding(die * movementMultiplier, mechanics.movement.rounding),
    },
    stealthUnlikely: stealthTier(unlikelyTable),
    stealthLikely: stealthTier(mechanics.stealth.likely),
    spellsPerDay: mechanics.magic.spellsPerDay,
    dodgeTable: mechanics.dodge.map((row) => ({
      comparison: dodgeLabel(row.delta),
      target: row.target,
    })),
    extraEffects: effects
      .filter((e) => e.kind === 'unarmedDamage')
      .map((e) => ({
        kind: e.kind,
        label: e.label,
        value: lookup(e.values, stats[e.basedOn], mechanics),
      })),
    overrides,
  };
}

export function formatModifier(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function statLabel(key: StatKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}
