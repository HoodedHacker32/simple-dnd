import type { StatKey } from './character';

/** How a multiplied result is turned back into a whole number. */
export type Rounding = 'floor' | 'ceil' | 'round';

/**
 * One row per stat score, starting at 0. `null` means "cannot do this at all"
 * — Magic 0 casts nothing, Dexterity 0 cannot draw a bow.
 */
export type TierValues = (number | null)[];

export interface DodgeRow {
  /** Your speed minus theirs. */
  delta: number;
  /** Lowest d20 roll that succeeds. */
  target: number;
}

export interface Mechanics {
  baseHp: number;
  hpPerPoint: number;
  /**
   * Scores above this reuse the top row of every table. The stat block still
   * shows the true total; only lookups are capped.
   */
  maxTier: number;

  movement: { die: number; multipliers: TierValues; rounding: Rounding };
  /** `spellsPerDay` is a standing limit on every caster, not a per-class one. */
  magic: { multipliers: TierValues; spellsPerDay: number };
  bow: { multipliers: TierValues; rounding: Rounding };
  charisma: { multipliers: TierValues };

  /** What you may wield at each Strength score. */
  weaponAccess: string[];

  dodge: DodgeRow[];
  stealth: { likely: number[]; unlikely: number[] };
}

/** Prose for one Codex section. The tables beneath it are generated from Mechanics. */
export interface RuleSection {
  stat: StatKey;
  headline: string;
  plainEnglish: string;
  footnote?: string;
}
