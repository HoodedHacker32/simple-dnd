import type { DndClass, StatBlock } from '../types/character';

const stats = (
  strength: number,
  magic: number,
  speed: number,
  dexterity: number,
  charisma: number,
  health: number,
): StatBlock => ({ strength, magic, speed, dexterity, charisma, health });

export const CLASSES: DndClass[] = [
  {
    id: 'barbarian',
    name: 'Barbarian',
    accent: '#c0392b',
    modifiers: stats(2, 0, 1, 0, 0, 2),
    lore: 'A warrior who fights on fury rather than form. Barbarians come from the places where survival was the only lesson worth teaching, and they bring that directly into battle — no stance, no technique, just an overwhelming amount of force applied at speed. Armour is optional. Restraint is not on the menu.',
    abilities: [
      {
        name: 'Barbaric Strength',
        description:
          'Increased damage when attacking with bare fists. For every point in your Strength stat you gain +1 to the damage multiplier: 0 = 1x, 1 = 2x, 2 = 3x, 3 = 4x. This multiplier can be increased further by equipping rings.',
      },
    ],
  },
  {
    id: 'fighter',
    name: 'Fighter',
    accent: '#8d6e3f',
    modifiers: stats(1, 0, 1, 1, 1, 1),
    lore: 'The complete soldier. Fighters train with everything, drill until it is instinct, and win by being reliably better at the fundamentals than whoever is in front of them. No tricks, no bloodline, no pact — just a professional who is good at every part of the job.',
    abilities: [
      {
        name: 'None',
        description:
          'The Fighter has no special ability. Instead they get a solid bonus in almost every stat — the most well-rounded class in the game, and the easiest one to learn on.',
      },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    accent: '#3f7d3f',
    modifiers: stats(0, 0, 1, 2, 1, 0),
    lore: 'A hunter and tracker who does their best work before the enemy knows they are there. Rangers live on the border between the wild and the settled, and they treat a longbow the way a scholar treats a pen. Get close to one and you have already made a mistake several hundred paces ago.',
    abilities: [
      {
        name: 'Archer',
        description:
          'Increased range on bows. Add +0.5 to whatever your existing Dexterity range multiplier is: 0 = 0.5x, 1 = 1x, 2 = 1.5x, 3 = 2x.',
      },
    ],
  },
  {
    id: 'paladin-oathsworn',
    name: 'Paladin',
    subtitle: 'Oath Sworn',
    accent: '#d4af37',
    modifiers: stats(2, 1, 1, 1, 1, 2),
    lore: 'A holy warrior bound by a sworn oath, granted real divine power in exchange for real divine restrictions. The Paladin is the strongest class in the game on paper — and carries the heaviest obligation. The power flows from the oath, which means the oath is not a suggestion.',
    abilities: [
      {
        name: 'Lay on Hands',
        description:
          'Has a magic satchel that replenishes with max heal potions every day. It replenishes exactly enough for 1 serving per party member.',
      },
      {
        name: 'Spellcaster',
        description:
          'Has access to spells such as elemental blade, light blade and basic heal from the very beginning.',
      },
      {
        name: 'Oath to Pacifism',
        description:
          'Swear an oath to never kill any sentient being. If this oath is broken, the player becomes an Oath Broken Paladin.',
      },
    ],
    oathState: {
      partnerId: 'paladin-oathbroken',
      label: 'Break the oath',
      warning:
        'Breaking the oath is permanent. The character loses all spellcasting and every other ability, and their stats drop to the Oath Broken block.',
    },
  },
  {
    id: 'paladin-oathbroken',
    name: 'Paladin',
    subtitle: 'Oath Broken',
    accent: '#6b6b6b',
    modifiers: stats(1, 0, 0, 1, 1, 1),
    lore: 'What is left of a Paladin after the oath goes. The divine connection is severed, the satchel stays empty, and the spells simply do not come any more. They keep the training and the scars — everything else was on loan.',
    abilities: [
      {
        name: 'Oathbroken',
        description:
          'Cannot cast any spells, even using innate magic. Loses access to any and all other abilities.',
      },
    ],
    oathState: {
      partnerId: 'paladin-oathsworn',
      label: 'Restore the oath',
      warning:
        'Only do this if your GM has ruled that the oath is restored. It returns the full Oath Sworn stats and abilities.',
    },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    accent: '#4b4453',
    modifiers: stats(0, 0, 0, 0, 0, 0),
    lore: 'Thief, scout, spy and knife-in-the-dark. Rogues win fights they were never seen entering, and their traditional strengths are stealth, precision and picking exactly the right moment. In this ruleset the Rogue has not been written up yet.',
    abilities: [
      {
        name: 'Not yet written',
        description:
          'The Rogue\'s stat block and ability have not been designed yet. This card is a placeholder and cannot be selected until the numbers are filled in.',
      },
    ],
    placeholder: true,
    placeholderNote: 'Stat block pending — the GM has not designed this class yet.',
  },
];

export const CLASS_BY_ID = new Map(CLASSES.map((cls) => [cls.id, cls]));

export const SELECTABLE_CLASSES = CLASSES.filter((cls) => !cls.placeholder);

export function classDisplayName(cls: DndClass): string {
  return cls.subtitle ? `${cls.name} (${cls.subtitle})` : cls.name;
}
