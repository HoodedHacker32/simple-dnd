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
        {
          title: 'Mana',
          intro:
            'Most spells cost mana. You can carry a limited amount and get it back by sleeping, by taking it from monsters that drop it, or by meditating.',
          columns: ['Source', 'Mana'],
          rows: [
            { key: 'Carried at a time', value: String(m.mana.max) },
            { key: 'Sleeping', value: 'Full restore' },
            { key: 'Killing monsters', value: 'Monsters can drop mana' },
            {
              key: 'Meditating',
              value: `+${m.mana.meditationPerTurn} per turn — takes the whole turn, no moving or defending`,
            },
          ],
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
          title: 'Protect throws — dodging and defending',
          intro:
            'After you are attacked you may dodge or defend. Defending keeps you where you are; dodging moves you one square. Without a shield they are about equally effective. What you need depends on how fast the attack is, not on your own Speed.',
          columns: ['Attack speed', 'You need'],
          rows: m.protectThrows.map((row) => ({
            key: `${row.label} (${row.speed})`,
            value: row.target >= 21 ? 'Impossible' : `${row.target} or higher`,
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
