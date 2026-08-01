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
