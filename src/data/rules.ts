import { CONTENT } from '../content';

export type { RuleSection, Mechanics } from '../types/rules';

/**
 * The prose and lookup tables shown in the Codex. Authored content, edited via
 * the DM Screen editor.
 */
export const RULE_SECTIONS = CONTENT.codex;

/*
 * The constants below are the mechanics the engine actually computes with.
 * They stay in code because changing them changes how the game resolves, not
 * merely what the Codex says — keep them in step with the Codex tables above.
 */

export const BASE_HP = 100;
export const HP_PER_POINT = 20;

export const MOVEMENT_MULTIPLIERS: Record<number, number> = { 0: 1, 1: 1.25, 2: 1.5, 3: 2 };
export const MAGIC_MULTIPLIERS: Record<number, number | null> = { 0: null, 1: 0.5, 2: 1, 3: 1.5 };
export const BOW_MULTIPLIERS: Record<number, number | null> = { 0: null, 1: 0.75, 2: 1, 3: 1.5 };
export const CHARISMA_MULTIPLIERS: Record<number, number> = { 0: 0.5, 1: 1, 2: 1.25, 3: 1.5 };

export const WEAPON_ACCESS: Record<number, string> = {
  0: 'Light weapons',
  1: 'Light + normal weapons',
  2: 'All weapons',
  3: 'All weapons, heavy can be thrown',
};

/** Dodge target by (your speed - their speed). */
export const DODGE_TARGETS: Record<number, number> = {
  [-2]: 20,
  [-1]: 16,
  0: 11,
  1: 8,
  2: 5,
  3: 3,
};

export const STEALTH_UNLIKELY: Record<number, number> = { 0: 20, 1: 16, 2: 11, 3: 8 };
export const STEALTH_LIKELY: Record<number, number> = { 0: 16, 1: 11, 2: 7, 3: 4 };
