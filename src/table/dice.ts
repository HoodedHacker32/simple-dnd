import type { Spell } from '../types/spells';

export interface Roll {
  id: string;
  die: number;
  value: number;
  label: string;
  at: number;
  /** Set when the roll resolved a spell or an attack. */
  outcome?: string;
  outcomeFailed?: boolean;
  /** Damage or healing worked out from the roll. */
  total?: number;
  totalLabel?: string;
  critical?: boolean;
  fumble?: boolean;
}

export function rollDie(sides: number): number {
  // A d4 and a d20 are small enough that Math.random is more than fair enough,
  // but crypto costs nothing here and avoids any question of bias.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % sides) + 1;
}

export function makeRoll(die: number, label: string): Roll {
  const value = rollDie(die);
  return {
    id: crypto.randomUUID(),
    die,
    value,
    label,
    at: Date.now(),
    critical: die === 20 && value === 20,
    fumble: die === 20 && value === 1,
  };
}

/** The outcome band a d20 result falls into, at a given score of the key stat. */
export function resolveSpell(spell: Spell, score: number, value: number) {
  if (spell.guaranteed) return { text: 'Succeeds automatically', failed: false };

  // Tiers are written for the scores the rules actually cover. Anything above
  // the highest uses that highest row; anything below has no table at all.
  const scores = spell.tiers.map((t) => t.score).sort((a, b) => a - b);
  if (scores.length === 0) return null;

  const usable = scores.filter((s) => s <= score);
  if (usable.length === 0) {
    return {
      text: `No table below ${spell.keyStat ?? 'that stat'} ${scores[0]} — the DM decides.`,
      failed: false,
      untabled: true,
    };
  }
  const tier = spell.tiers.find((t) => t.score === usable[usable.length - 1])!;
  const band = tier.bands.find((b) => value >= b.min && value <= b.max);
  if (!band) return { text: 'No result listed for that roll — the DM decides.', failed: false, untabled: true };
  return { text: band.text, failed: Boolean(band.fail), untabled: false };
}

export function healingFrom(spell: Spell, roll: number): number | null {
  if (!spell.healing) return null;
  return roll * spell.healing.multiplier;
}
