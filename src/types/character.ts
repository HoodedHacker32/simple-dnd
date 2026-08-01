export type StatKey = 'strength' | 'magic' | 'speed' | 'dexterity' | 'charisma' | 'health';

export type StatBlock = Record<StatKey, number>;

export interface StatMeta {
  key: StatKey;
  abbr: string;
  label: string;
  blurb: string;
}

export const STAT_ORDER: StatKey[] = [
  'strength',
  'magic',
  'speed',
  'dexterity',
  'charisma',
  'health',
];

export const STATS: Record<StatKey, StatMeta> = {
  strength: {
    key: 'strength',
    abbr: 'St',
    label: 'Strength',
    blurb: 'Which weapons you can lift, swing and hurl.',
  },
  magic: {
    key: 'magic',
    abbr: 'M',
    label: 'Magic',
    blurb: 'How hard your spells hit, if you can cast at all.',
  },
  speed: {
    key: 'speed',
    abbr: 'Sp',
    label: 'Speed',
    blurb: 'How far you move, and how well you dodge.',
  },
  dexterity: {
    key: 'dexterity',
    abbr: 'D',
    label: 'Dexterity',
    blurb: 'Bow range, and how quietly you creep.',
  },
  charisma: {
    key: 'charisma',
    abbr: 'C',
    label: 'Charisma',
    blurb: 'How convincing you are when words matter more than steel.',
  },
  health: {
    key: 'health',
    abbr: 'H',
    label: 'Health',
    blurb: 'How much punishment you soak before you fall.',
  },
};

export interface Ability {
  name: string;
  description: string;
}

/**
 * A mechanical effect a class grants, expressed as data so new classes can
 * carry real rules rather than only descriptive text.
 *
 * - `unarmedDamage` adds a damage multiplier line (the Barbarian's fists)
 * - `bowRange` replaces the Dexterity bow multiplier (the Ranger's Archer)
 * - `spellPower` replaces the Magic multiplier
 * - `movement` replaces the Speed movement multiplier
 * - `socialRolls` replaces the Charisma multiplier
 */
export type ClassEffectKind =
  | 'unarmedDamage'
  | 'bowRange'
  | 'spellPower'
  | 'movement'
  | 'socialRolls';

export interface ClassEffect {
  kind: ClassEffectKind;
  /** Shown on the character sheet next to the computed value. */
  label: string;
  /** Which stat indexes the table below. */
  basedOn: StatKey;
  /** One value per score of `basedOn`, starting at 0. */
  values: (number | null)[];
}

export const EFFECT_KINDS: { kind: ClassEffectKind; label: string; hint: string }[] = [
  { kind: 'unarmedDamage', label: 'Unarmed damage', hint: 'Adds a bare-fist damage multiplier.' },
  { kind: 'bowRange', label: 'Bow range', hint: 'Replaces the normal Dexterity bow multiplier.' },
  { kind: 'spellPower', label: 'Spell power', hint: 'Replaces the normal Magic multiplier.' },
  { kind: 'movement', label: 'Movement', hint: 'Replaces the normal Speed movement multiplier.' },
  { kind: 'socialRolls', label: 'Social rolls', hint: 'Replaces the normal Charisma multiplier.' },
];

export interface Race {
  id: string;
  name: string;
  accent: string;
  modifiers: StatBlock;
  defaultAge: number;
  lifespan: string;
  lore: string;
  traits: string[];
}

export interface DndClass {
  id: string;
  name: string;
  subtitle?: string;
  accent: string;
  modifiers: StatBlock;
  abilities: Ability[];
  /** Mechanical effects the engine applies. Descriptive text lives in `abilities`. */
  effects?: ClassEffect[];
  lore: string;
  /** Alternate narrative state this class can transition into (e.g. Paladin oath break). */
  oathState?: {
    partnerId: string;
    label: string;
    warning: string;
  };
  /** Not yet designed by the GM — shown but unselectable. */
  placeholder?: boolean;
  placeholderNote?: string;
}

export type StatMode = 'raceClass' | 'pointBuy';

export interface Character {
  id: string;
  name: string;
  gender: string;
  age: number | '';
  pronouns: string;
  alignment: string;
  backstory: string;
  raceId: string | null;
  classId: string | null;
  statMode: StatMode;
  /** Reserved for a future point-buy mode; unused while statMode is 'raceClass'. */
  allocatedStats?: Partial<StatBlock>;
  createdAt: string;
  updatedAt: string;
}

export const SAVE_FORMAT = 'dnd-designer-character';
export const SAVE_VERSION = 1;

export interface CharacterSaveFile {
  format: typeof SAVE_FORMAT;
  version: number;
  savedAt: string;
  character: Character;
}
