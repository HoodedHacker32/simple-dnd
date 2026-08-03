import type { Ability, CharacterField, ClassEffect, ClassEffectKind, DndClass, FieldType, Race, StatBlock, StatKey } from '../types/character';
import { EFFECT_KINDS, FIELD_TYPES, STAT_ORDER } from '../types/character';
import type { Mechanics, RuleSection, Rounding, TierValues } from '../types/rules';
import type { AttackSpeed, ProtectThrow, Spell, SpellTier } from '../types/spells';
import { ATTACK_SPEEDS } from '../types/spells';

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
  characterFields: CharacterField[];
  spells: Spell[];
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
    minAge: r.minAge === undefined || r.minAge === null ? undefined : num(r.minAge, `${path}.minAge`),
    maxAge: r.maxAge === undefined || r.maxAge === null ? undefined : num(r.maxAge, `${path}.maxAge`),
    lifespan: str(r.lifespan, `${path}.lifespan`, { allowEmpty: true }),
    lore: str(r.lore, `${path}.lore`, { allowEmpty: true }),
    traits: arr(r.traits ?? [], `${path}.traits`).map((t, j) => str(t, `${path}.traits[${j}]`)),
    abilities: abilities(r.abilities ?? [], `${path}.abilities`),
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

  const speeds = new Set(ATTACK_SPEEDS.map((s) => s.id));
  const protectThrows: ProtectThrow[] = arr(m.protectThrows, 'mechanics.protectThrows').map((r, i) => {
    const row = obj(r, `mechanics.protectThrows[${i}]`);
    const speed = str(row.speed, `mechanics.protectThrows[${i}].speed`);
    if (!speeds.has(speed as AttackSpeed)) {
      fail(`mechanics.protectThrows[${i}].speed`, `must be one of: ${[...speeds].join(', ')}.`);
    }
    return {
      speed: speed as AttackSpeed,
      label: str(row.label, `mechanics.protectThrows[${i}].label`),
      target: d20([row.target], `mechanics.protectThrows[${i}].target`)[0],
    };
  });
  if (protectThrows.length === 0) fail('mechanics.protectThrows', 'needs at least one row.');

  const mana = obj(m.mana, 'mechanics.mana');

  return {
    baseHp: num(m.baseHp, 'mechanics.baseHp'),
    hpPerPoint: num(m.hpPerPoint, 'mechanics.hpPerPoint'),
    maxTier,
    movement: {
      die,
      multipliers: tierValues(movement.multipliers, 'mechanics.movement.multipliers'),
      rounding: rounding(movement.rounding ?? 'floor', 'mechanics.movement.rounding'),
    },
    magic: {
      multipliers: tierValues(magic.multipliers, 'mechanics.magic.multipliers'),
      spellsPerDay: num(magic.spellsPerDay ?? 3, 'mechanics.magic.spellsPerDay'),
    },
    bow: {
      multipliers: tierValues(bow.multipliers, 'mechanics.bow.multipliers'),
      rounding: rounding(bow.rounding ?? 'ceil', 'mechanics.bow.rounding'),
    },
    charisma: { multipliers: tierValues(charisma.multipliers, 'mechanics.charisma.multipliers') },
    weaponAccess,
    protectThrows,
    stealth: {
      likely: d20(stealth.likely, 'mechanics.stealth.likely'),
      unlikely: d20(stealth.unlikely, 'mechanics.stealth.unlikely'),
    },
    mana: {
      max: num(mana.max, 'mechanics.mana.max'),
      meditationPerTurn: num(mana.meditationPerTurn, 'mechanics.mana.meditationPerTurn'),
    },
  };
}

/* ------------------------------------------------------------------ spells */

function parseSpell(value: unknown, i: number, classIds: Set<string>): Spell {
  const path = `spells[${i}]`;
  const sp = obj(value, path);
  const speeds = new Set(ATTACK_SPEEDS.map((s) => s.id));

  const owners = arr(sp.classIds, `${path}.classIds`).map((c, j) => id(c, `${path}.classIds[${j}]`));
  for (const owner of owners) {
    if (!classIds.has(owner)) fail(`${path}.classIds`, `names class "${owner}", which does not exist.`);
  }

  const keyStat = sp.keyStat === null || sp.keyStat === undefined ? null : str(sp.keyStat, `${path}.keyStat`);
  if (keyStat !== null && !STAT_ORDER.includes(keyStat as StatKey)) {
    fail(`${path}.keyStat`, `must be null or one of: ${STAT_ORDER.join(', ')}.`);
  }

  const tiers: SpellTier[] = arr(sp.tiers ?? [], `${path}.tiers`).map((t, j) => {
    const tp = `${path}.tiers[${j}]`;
    const tier = obj(t, tp);
    return {
      score: num(tier.score, `${tp}.score`),
      bands: arr(tier.bands, `${tp}.bands`).map((b, k) => {
        const bp = `${tp}.bands[${k}]`;
        const band = obj(b, bp);
        const min = num(band.min, `${bp}.min`);
        const max = num(band.max, `${bp}.max`);
        if (min > max) fail(bp, 'has a minimum above its maximum.');
        return { min, max, text: str(band.text, `${bp}.text`), fail: Boolean(band.fail) };
      }),
    };
  });

  const speed = sp.speed === null || sp.speed === undefined ? undefined : str(sp.speed, `${path}.speed`);
  if (speed !== undefined && !speeds.has(speed as AttackSpeed)) {
    fail(`${path}.speed`, `must be one of: ${[...speeds].join(', ')}.`);
  }

  const damage = sp.damage ? obj(sp.damage, `${path}.damage`) : undefined;
  const healing = sp.healing ? obj(sp.healing, `${path}.healing`) : undefined;

  return {
    id: id(sp.id, `${path}.id`),
    name: str(sp.name, `${path}.name`),
    classIds: owners,
    manaCost: num(sp.manaCost, `${path}.manaCost`),
    description: str(sp.description, `${path}.description`, { allowEmpty: true }),
    keyStat: keyStat as StatKey | null,
    tiers,
    guaranteed: Boolean(sp.guaranteed),
    damage: damage
      ? { base: num(damage.base, `${path}.damage.base`), note: damage.note ? str(damage.note, `${path}.damage.note`) : undefined }
      : undefined,
    healing: healing
      ? { die: num(healing.die, `${path}.healing.die`), multiplier: num(healing.multiplier, `${path}.healing.multiplier`) }
      : undefined,
    speed: speed as AttackSpeed | undefined,
    oncePerDay: Boolean(sp.oncePerDay),
    notes: arr(sp.notes ?? [], `${path}.notes`).map((n, j) => str(n, `${path}.notes[${j}]`)),
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
  const characterFields = arr(pack.characterFields, 'characterFields').map(parseField);
  assertUniqueIds(characterFields, 'character field');

  const classIdSet = new Set(classes.map((c) => c.id));
  const spells = arr(pack.spells ?? [], 'spells').map((sp, i) => parseSpell(sp, i, classIdSet));
  assertUniqueIds(spells, 'spell');

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
    characterFields,
    spells,
  };
}

function parseField(value: unknown, i: number): CharacterField {
  const path = `characterFields[${i}]`;
  const f = obj(value, path);
  const type = str(f.type, `${path}.type`);
  if (!FIELD_TYPES.some((t) => t.type === type)) {
    fail(`${path}.type`, `must be one of: ${FIELD_TYPES.map((t) => t.type).join(', ')}.`);
  }
  const width = str(f.width ?? 'half', `${path}.width`);
  if (width !== 'half' && width !== 'full') fail(`${path}.width`, 'must be "half" or "full".');

  const options =
    f.options === undefined ? undefined : arr(f.options, `${path}.options`).map((o, j) => str(o, `${path}.options[${j}]`));
  if (type === 'select' && (!options || options.length === 0)) {
    fail(`${path}.options`, 'is required for a choice field — add at least one option.');
  }

  return {
    id: id(f.id, `${path}.id`),
    label: str(f.label, `${path}.label`),
    type: type as FieldType,
    placeholder: f.placeholder ? str(f.placeholder, `${path}.placeholder`) : undefined,
    help: f.help ? str(f.help, `${path}.help`) : undefined,
    options,
    min: f.min === undefined || f.min === null ? undefined : num(f.min, `${path}.min`),
    max: f.max === undefined || f.max === null ? undefined : num(f.max, `${path}.max`),
    fillFromRaceAge: Boolean(f.fillFromRaceAge),
    showOnSheet: f.showOnSheet !== false,
    width: width as 'half' | 'full',
  };
}

function assertUniqueIds(items: { id: string }[], kind: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new PackError(`Two ${kind}s share the id "${item.id}". Ids must be unique.`);
    seen.add(item.id);
  }
}
