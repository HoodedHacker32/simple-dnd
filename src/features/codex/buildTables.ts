import type { StatKey } from '../../types/character';
import type { Mechanics, TierValues } from '../../types/rules';

export interface BuiltRow {
  key: string;
  value: string;
}

export interface BuiltTable {
  title: string;
  intro?: string;
  columns: [string, string];
  rows: BuiltRow[];
}

const times = (n: number | null, cannot: string): string => (n === null ? cannot : `${n}x`);

function tierRows(values: TierValues, render: (n: number | null) => string): BuiltRow[] {
  return values.map((v, i) => ({ key: String(i), value: render(v) }));
}

/**
 * The Codex tables are derived from the same numbers the engine calculates
 * with, so what a player reads can never disagree with what the app does.
 */
export function buildTables(stat: StatKey, m: Mechanics): BuiltTable[] {
  switch (stat) {
    case 'strength':
      return [
        {
          title: 'Weapon access',
          columns: ['Strength', 'What you can wield'],
          rows: m.weaponAccess.map((text, i) => ({ key: String(i), value: text })),
        },
      ];

    case 'magic':
      return [
        {
          title: 'Spell power',
          columns: ['Magic', 'Effect'],
          rows: tierRows(m.magic.multipliers, (n) => times(n, 'No magic at all')),
        },
      ];

    case 'speed':
      return [
        {
          title: `Movement — roll a d${m.movement.die}, multiply, round ${m.movement.rounding === 'ceil' ? 'up' : m.movement.rounding === 'round' ? 'to nearest' : 'down'}`,
          columns: ['Speed', 'Movement'],
          rows: tierRows(m.movement.multipliers, (n) => (n === null ? 'Cannot move' : `${n}x the roll`)),
        },
        {
          title: 'Agility — dodging with a d20',
          intro:
            'Enemies and attacks have set Speeds. Work out how your Speed compares to theirs, then roll a d20 and try to hit the number.',
          columns: ['Your Speed vs theirs', 'You need'],
          rows: m.dodge.map((row) => ({
            key:
              row.delta === 0
                ? 'Equal'
                : `${Math.abs(row.delta)}${row.delta < -1 ? ' or more' : ''} ${row.delta > 0 ? 'higher' : 'lower'}`,
            value: row.target >= 21 ? 'Impossible' : row.target === 20 ? 'Roll a 20' : `${row.target} or higher`,
          })),
        },
      ];

    case 'dexterity':
      return [
        {
          title: `Bow range — multiply, round ${m.bow.rounding === 'floor' ? 'down' : m.bow.rounding === 'round' ? 'to nearest' : 'up'}`,
          columns: ['Dexterity', 'Range'],
          rows: tierRows(m.bow.multipliers, (n) => (n === null ? 'Cannot use bows' : `${n}x range`)),
        },
        {
          title: 'Stealth — d20, situation "Unlikely"',
          intro: 'Use this column when the odds are against you — open ground, bright light, alert guards.',
          columns: ['Dexterity', 'You need'],
          rows: m.stealth.unlikely.map((t, i) => ({
            key: String(i),
            value: t >= 21 ? 'Impossible' : t === 20 ? 'Roll a 20' : `${t} or higher`,
          })),
        },
        {
          title: 'Stealth — d20, situation "Likely"',
          intro: 'Use this column when conditions favour you — darkness, cover, distracted enemies.',
          columns: ['Dexterity', 'You need'],
          rows: m.stealth.likely.map((t, i) => ({
            key: String(i),
            value: t >= 21 ? 'Impossible' : t === 20 ? 'Roll a 20' : `${t} or higher`,
          })),
        },
      ];

    case 'charisma':
      return [
        {
          title: 'Social rolls',
          columns: ['Charisma', 'Effect'],
          rows: tierRows(m.charisma.multipliers, (n) => times(n, 'Cannot try')),
        },
      ];

    case 'health':
      return [
        {
          title: 'Hit points',
          columns: ['Health', 'Total HP'],
          rows: [
            { key: 'Base', value: `${m.baseHp} HP` },
            { key: 'Each +1', value: `+${m.hpPerPoint} HP` },
            { key: 'Each -1', value: `-${m.hpPerPoint} HP` },
          ],
        },
      ];
  }
}
