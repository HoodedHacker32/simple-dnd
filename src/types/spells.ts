import type { StatKey } from './character';

/** How fast an attack comes in, which sets the protect-throw target. */
export type AttackSpeed = 'SS' | 'SN' | 'SF';

export const ATTACK_SPEEDS: { id: AttackSpeed; label: string }[] = [
  { id: 'SS', label: 'Slow' },
  { id: 'SN', label: 'Normal' },
  { id: 'SF', label: 'Fast' },
];

/**
 * One band of a d20 result. Graded spells (Taunt, Wind Blast) have several;
 * a plain "16 or higher" spell has a fail band and a success band.
 */
export interface OutcomeBand {
  min: number;
  max: number;
  text: string;
  /** Marks the band as a miss, so the roller can colour it. */
  fail?: boolean;
}

/** The outcome table at one score of the spell's key stat. */
export interface SpellTier {
  score: number;
  bands: OutcomeBand[];
}

export interface SpellDamage {
  base: number;
  note?: string;
}

/** Healing expressed as a die roll times a multiplier — "5 times the d20". */
export interface SpellHealing {
  die: number;
  multiplier: number;
}

export interface Spell {
  id: string;
  name: string;
  /** Classes that start with this spell. A spell may belong to several. */
  classIds: string[];
  manaCost: number;
  description: string;
  /** Which stat indexes `tiers`. Null when the spell always works. */
  keyStat: StatKey | null;
  tiers: SpellTier[];
  /** True when there is no roll to make. */
  guaranteed: boolean;
  damage?: SpellDamage;
  healing?: SpellHealing;
  speed?: AttackSpeed;
  oncePerDay?: boolean;
  notes: string[];
}

export interface ManaRules {
  max: number;
  /** Gained per whole turn spent meditating. */
  meditationPerTurn: number;
}

/** The d20 you need to dodge or defend, by how fast the incoming attack is. */
export interface ProtectThrow {
  speed: AttackSpeed;
  label: string;
  target: number;
}
