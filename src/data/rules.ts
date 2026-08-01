import type { StatKey } from '../types/character';

export interface RuleRow {
  /** Left-hand label — usually the stat value, sometimes a comparison. */
  key: string;
  value: string;
  note?: string;
}

export interface RuleTable {
  title: string;
  intro?: string;
  columns: [string, string];
  rows: RuleRow[];
  footnote?: string;
}

export interface RuleSection {
  stat: StatKey;
  headline: string;
  plainEnglish: string;
  tables: RuleTable[];
}

export const RULE_SECTIONS: RuleSection[] = [
  {
    stat: 'strength',
    headline: 'Strength decides what you are allowed to pick up.',
    plainEnglish:
      'No damage maths here — Strength is a gate. Your score tells you which tier of weapon you can actually use. Everything from that tier and below is fair game.',
    tables: [
      {
        title: 'Weapon access',
        columns: ['Strength', 'What you can wield'],
        rows: [
          { key: '0', value: 'Light weapons only' },
          { key: '1', value: 'Light + normal weapons' },
          { key: '2', value: 'All weapons' },
          { key: '3', value: 'All weapons, and heavy weapons can be thrown' },
        ],
        footnote: 'Other uses may arise — ask your GM.',
      },
    ],
  },
  {
    stat: 'magic',
    headline: 'Magic is a straight multiplier on your spells.',
    plainEnglish:
      'Roll your spell as normal, then multiply the result by the number below. At Magic 0 you simply cannot cast.',
    tables: [
      {
        title: 'Spell power',
        columns: ['Magic', 'Effect'],
        rows: [
          { key: '0', value: 'No magic at all' },
          { key: '1', value: '0.5x magic' },
          { key: '2', value: '1x magic' },
          { key: '3', value: '1.5x magic' },
        ],
      },
    ],
  },
  {
    stat: 'speed',
    headline: 'Speed covers how far you move and how well you dodge.',
    plainEnglish:
      'Two jobs. For movement, roll a d4 and multiply by your Speed multiplier, rounding down. For dodging, compare your Speed to the attack or enemy\'s Speed and roll a d20 against the target number.',
    tables: [
      {
        title: 'Movement — roll a d4, multiply, round down',
        columns: ['Speed', 'Movement'],
        rows: [
          { key: '0', value: '1x the roll' },
          { key: '1', value: '1.25x the roll' },
          { key: '2', value: '1.5x the roll' },
          { key: '3', value: '2x the roll' },
        ],
      },
      {
        title: 'Agility — dodging with a d20',
        intro:
          'Enemies and attacks have set Speeds. Work out how your Speed compares to theirs, then roll a d20 and try to hit the number.',
        columns: ['Your Speed vs theirs', 'You need'],
        rows: [
          { key: '2 or more lower', value: 'Roll a 20' },
          { key: '1 lower', value: '16 or higher' },
          { key: 'Equal', value: '11 or higher' },
          { key: '1 higher', value: '8 or higher' },
          { key: '2 higher', value: '5 or higher' },
          { key: '3 higher', value: '3 or higher' },
        ],
      },
    ],
  },
  {
    stat: 'dexterity',
    headline: 'Dexterity handles bows and sneaking.',
    plainEnglish:
      'For bows, multiply the weapon\'s range by your multiplier and round up. At Dexterity 0 you cannot use bows at all. For stealth, your GM decides whether being spotted is Likely or Unlikely, and you roll a d20 against the matching number.',
    tables: [
      {
        title: 'Bow range — multiply, round up',
        columns: ['Dexterity', 'Range'],
        rows: [
          { key: '0', value: 'Cannot use bows' },
          { key: '1', value: '0.75x range' },
          { key: '2', value: '1x range' },
          { key: '3', value: '1.5x range' },
        ],
      },
      {
        title: 'Stealth — d20, situation "Unlikely"',
        intro: 'Use this column when the odds are against you — open ground, bright light, alert guards.',
        columns: ['Dexterity', 'You need'],
        rows: [
          { key: '0', value: 'Roll a 20' },
          { key: '1', value: '16 or higher' },
          { key: '2', value: '11 or higher' },
          { key: '3', value: '8 or higher' },
        ],
      },
      {
        title: 'Stealth — d20, situation "Likely"',
        intro: 'Use this column when conditions favour you — darkness, cover, distracted enemies.',
        columns: ['Dexterity', 'You need'],
        rows: [
          { key: '0', value: '16 or higher' },
          { key: '1', value: '11 or higher' },
          { key: '2', value: '7 or higher' },
          { key: '3', value: '4 or higher' },
        ],
      },
    ],
  },
  {
    stat: 'charisma',
    headline: 'Charisma multiplies your social rolls.',
    plainEnglish:
      'Persuading, lying, haggling, intimidating — roll as normal, then multiply by the number below.',
    tables: [
      {
        title: 'Social rolls',
        columns: ['Charisma', 'Effect'],
        rows: [
          { key: '0', value: '0.5x roll' },
          { key: '1', value: '1x roll' },
          { key: '2', value: '1.25x roll' },
          { key: '3', value: '1.5x roll' },
        ],
        footnote: 'Other uses may arise — ask your GM.',
      },
    ],
  },
  {
    stat: 'health',
    headline: 'Health is flat hit points. No maths beyond adding.',
    plainEnglish:
      'Everyone starts at 100 HP. Each point of Health adds 20, each negative point takes 20 away. That is the whole rule.',
    tables: [
      {
        title: 'Hit points',
        columns: ['Health', 'Total HP'],
        rows: [
          { key: 'Base', value: '100 HP' },
          { key: 'Each +1', value: '+20 HP' },
          { key: 'Each -1', value: '-20 HP' },
        ],
      },
    ],
  },
];

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
