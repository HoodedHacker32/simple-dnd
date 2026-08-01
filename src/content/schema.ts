import type { Ability, ClassEffect, ClassEffectKind, DndClass, Race, StatBlock, StatKey } from '../types/character';
import { EFFECT_KINDS, STAT_ORDER } from '../types/character';
import type { DodgeRow, Mechanics, RuleSection, Rounding, TierValues } from '../types/rules';

export const PACK_FORMAT = 'chroniclers-table-content';
export const PACK_VERSION = 1;

export interface ContentPack {
  format: typeof PACK_FORMAT;
  version: number;
  /** Free-text note shown in the editor and used as the commit subject. */
  label: string;
  updatedAt: string;
  races: Race[];
  classes: DndClass[];
  codex: RuleSection[];
  mechanics: Mechanics;
}

export class PackError extends Error {}

/* ------------------------------------------------------------------ utils */

function fail(path: string, message: string): never {
  throw new PackError(`${path} ${message}`);
}

function str(value: unknown, path: string, { allowEmpty = false } = {}): string {
  if (typeof value !== 'string') fail(path, 'must be text.');
  if (!allowEmpty && !value.trim()) fail(path, 'cannot be empty.');
  return value;
}

function num(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'must be a number.');
  return value;
}

function arr(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'must be a list.');
  return value;
}

function obj(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) fail(path, 'must be an object.');
  return value as Record<string, unknown>;
}

/** IDs are referenced by saved characters, so they must stay URL-safe and stable. */
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function id(value: unknown, path: string): string {
  const raw = str(value, path);
  if (!ID_PATTERN.test(raw)) {
    fail(path, 'must be lowercase letters, numbers and hyphens only (it is stored inside saved characters).');
  }
  return raw;
}

function statBlock(value: unknown, path: string): StatBlock {
  const source = obj(value, path);
  const block = {} as StatBlock;
  for (const key of STAT_ORDER) {
    const raw = source[key];
    const n = raw === undefined ? 0 : num(raw, `${path}.${key}`);
    if (!Number.isInteger(n)) fail(`${path}.${key}`, 'must be a whole number.');
    if (n < -5 || n > 5) fail(`${path}.${key}`, 'must be between -5 and 5.');
    block[key as StatKey] = n;
  }
  return block;
}

function abilities(value: unknown, path: string): Ability[] {
  return arr(value, path).map((entry, i) => {
    const a = obj(entry, `${path}[${i}]`);
    return {
      name: str(a.name, `${path}[${i}].name`),
      description: str(a.description, `${path}[${i}].description`),
    };
  });
}

/* ----------------------------------------------------------------- parsing */

function parseRace(value: unknown, i: number): Race {
  const path = `races[${i}]`;
  const r = obj(value, path);
  return {
    id: id(r.id, `${path}.id`),
    name: str(r.name, `${path}.name`),
    accent: str(r.accent, `${path}.accent`),
    modifiers: statBlock(r.modifiers, `${path}.modifiers`),
    defaultAge: num(r.defaultAge, `${path}.defaultAge`),
    lifespan: str(r.lifespan, `${path}.lifespan`, { allowEmpty: true }),
    lore: str(r.lore, `${path}.lore`, { allowEmpty: true }),
    traits: arr(r.traits ?? [], `${path}.traits`).map((t, j) => str(t, `${path}.traits[${j}]`)),
  };
}

function parseClass(value: unknown, i: number): DndClass {
  const path = `classes[${i}]`;
  const c = obj(value, path);
  const oath = c.oathState === undefined || c.oathState === null ? undefined : obj(c.oathState, `${path}.oathState`);

  return {
    id: id(c.id, `${path}.id`),
    name: str(c.name, `${path}.name`),
    subtitle: c.subtitle ? str(c.subtitle, `${path}.subtitle`) : undefined,
    accent: str(c.accent, `${path}.accent`),
    modifiers: statBlock(c.modifiers, `${path}.modifiers`),
    abilities: abilities(c.abilities ?? [], `${path}.abilities`),
    effects: parseEffects(c.effects ?? [], `${path}.effects`),
    lore: str(c.lore, `${path}.lore`, { allowEmpty: true }),
    oathState: oath
      ? {
          partnerId: id(oath.partnerId, `${path}.oathState.partnerId`),
          label: str(oath.label, `${path}.oathState.label`),
          warning: str(oath.warning, `${path}.oathState.warning`),
        }
      : undefined,
    placeholder: Boolean(c.placeholder),
    placeholderNote: c.placeholderNote ? str(c.placeholderNote, `${path}.placeholderNote`) : undefined,
  };
}

function parseCodex(value: unknown, i: number): RuleSection {
  const path = `codex[${i}]`;
  const s = obj(value, path);
  const stat = str(s.stat, `${path}.stat`);
  if (!STAT_ORDER.includes(stat as StatKey)) {
    fail(`${path}.stat`, `must be one of: ${STAT_ORDER.join(', ')}.`);
  }

  return {
    stat: stat as StatKey,
    headline: str(s.headline, `${path}.headline`, { allowEmpty: true }),
    plainEnglish: str(s.plainEnglish, `${path}.plainEnglish`, { allowEmpty: true }),
    footnote: s.footnote ? str(s.footnote, `${path}.footnote`) : undefined,
  };
}

/* --------------------------------------------------------------- mechanics */

/** A per-tier table. `null` entries mean the character cannot do it at all. */
function tierValues(value: unknown, path: string, { allowNull = true } = {}): TierValues {
  const list = arr(value, path);
  if (list.length < 1) fail(path, 'needs at least one entry (the value at score 0).');
  return list.map((entry, i) => {
    if (entry === null) {
      if (!allowNull) fail(`${path}[${i}]`, 'must be a number.');
      return null;
    }
    return num(entry, `${path}[${i}]`);
  });
}

function rounding(value: unknown, path: string): Rounding {
  const raw = str(value, path);
  if (raw !== 'floor' && raw !== 'ceil' && raw !== 'round') {
    fail(path, 'must be "floor", "ceil" or "round".');
  }
  return raw;
}

function parseMechanics(value: unknown): Mechanics {
  const m = obj(value, 'mechanics');

  const maxTier = num(m.maxTier ?? 3, 'mechanics.maxTier');
  if (!Number.isInteger(maxTier) || maxTier < 0) fail('mechanics.maxTier', 'must be a whole number of 0 or more.');

  const movement = obj(m.movement, 'mechanics.movement');
  const magic = obj(m.magic, 'mechanics.magic');
  const bow = obj(m.bow, 'mechanics.bow');
  const charisma = obj(m.charisma, 'mechanics.charisma');
  const stealth = obj(m.stealth, 'mechanics.stealth');

  const die = num(movement.die ?? 4, 'mechanics.movement.die');
  if (!Number.isInteger(die) || die < 2) fail('mechanics.movement.die', 'must be a whole number of 2 or more.');

  const weaponAccess = arr(m.weaponAccess, 'mechanics.weaponAccess').map((w, i) =>
    str(w, `mechanics.weaponAccess[${i}]`, { allowEmpty: true }),
  );
  if (weaponAccess.length === 0) fail('mechanics.weaponAccess', 'needs at least one entry.');

  const d20 = (list: unknown, path: string): number[] =>
    arr(list, path).map((t, i) => {
      const n = num(t, `${path}[${i}]`);
      if (!Number.isInteger(n) || n < 1 || n > 21) {
        fail(`${path}[${i}]`, 'must be a whole number between 1 and 21 (21 means impossible).');
      }
      return n;
    });

  const dodge: DodgeRow[] = arr(m.dodge, 'mechanics.dodge').map((r, i) => {
    const row = obj(r, `mechanics.dodge[${i}]`);
    return {
      delta: num(row.delta, `mechanics.dodge[${i}].delta`),
      target: d20([row.target], `mechanics.dodge[${i}].target`)[0],
    };
  });
  if (dodge.length === 0) fail('mechanics.dodge', 'needs at least one row.');

  return {
    baseHp: num(m.baseHp, 'mechanics.baseHp'),
    hpPerPoint: num(m.hpPerPoint, 'mechanics.hpPerPoint'),
    maxTier,
    movement: {
      die,
      multipliers: tierValues(movement.multipliers, 'mechanics.movement.multipliers'),
      rounding: rounding(movement.rounding ?? 'floor', 'mechanics.movement.rounding'),
    },
    magic: { multipliers: tierValues(magic.multipliers, 'mechanics.magic.multipliers') },
    bow: {
      multipliers: tierValues(bow.multipliers, 'mechanics.bow.multipliers'),
      rounding: rounding(bow.rounding ?? 'ceil', 'mechanics.bow.rounding'),
    },
    charisma: { multipliers: tierValues(charisma.multipliers, 'mechanics.charisma.multipliers') },
    weaponAccess,
    dodge: [...dodge].sort((a, b) => a.delta - b.delta),
    stealth: {
      likely: d20(stealth.likely, 'mechanics.stealth.likely'),
      unlikely: d20(stealth.unlikely, 'mechanics.stealth.unlikely'),
    },
  };
}

function parseEffects(value: unknown, path: string): ClassEffect[] {
  const kinds = new Set(EFFECT_KINDS.map((k) => k.kind));
  return arr(value, path).map((entry, i) => {
    const e = obj(entry, `${path}[${i}]`);
    const kind = str(e.kind, `${path}[${i}].kind`);
    if (!kinds.has(kind as ClassEffectKind)) {
      fail(`${path}[${i}].kind`, `must be one of: ${[...kinds].join(', ')}.`);
    }
    const basedOn = str(e.basedOn, `${path}[${i}].basedOn`);
    if (!STAT_ORDER.includes(basedOn as StatKey)) {
      fail(`${path}[${i}].basedOn`, `must be one of: ${STAT_ORDER.join(', ')}.`);
    }
    return {
      kind: kind as ClassEffectKind,
      label: str(e.label, `${path}[${i}].label`),
      basedOn: basedOn as StatKey,
      values: tierValues(e.values, `${path}[${i}].values`),
    };
  });
}

/**
 * Validates an untrusted content pack and returns a fully typed one.
 * Throws PackError with a human-readable path on the first problem found.
 */
export function parseContentPack(input: unknown): ContentPack {
  const pack = obj(input, 'The file');

  if (pack.format !== PACK_FORMAT) {
    throw new PackError('That file is not a Chronicler\'s Table content pack.');
  }
  const version = num(pack.version, 'version');
  if (version > PACK_VERSION) {
    throw new PackError(`That pack was made by a newer version of the editor (v${version}).`);
  }

  const races = arr(pack.races, 'races').map(parseRace);
  const classes = arr(pack.classes, 'classes').map(parseClass);
  const codex = arr(pack.codex, 'codex').map(parseCodex);
  const mechanics = parseMechanics(pack.mechanics);

  if (races.length === 0) throw new PackError('A pack needs at least one race.');
  if (classes.length === 0) throw new PackError('A pack needs at least one class.');

  assertUniqueIds(races, 'race');
  assertUniqueIds(classes, 'class');

  // A broken oath link would strand a character in a class that cannot be left.
  const classIds = new Set(classes.map((c) => c.id));
  for (const cls of classes) {
    if (cls.oathState && !classIds.has(cls.oathState.partnerId)) {
      throw new PackError(
        `Class "${cls.id}" points its oath state at "${cls.oathState.partnerId}", which does not exist.`,
      );
    }
  }

  return {
    format: PACK_FORMAT,
    version: PACK_VERSION,
    label: pack.label ? str(pack.label, 'label') : 'Untitled change',
    updatedAt: pack.updatedAt ? str(pack.updatedAt, 'updatedAt') : new Date().toISOString(),
    races,
    classes,
    codex,
    mechanics,
  };
}

function assertUniqueIds(items: { id: string }[], kind: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new PackError(`Two ${kind}s share the id "${item.id}". Ids must be unique.`);
    seen.add(item.id);
  }
}
