import type { Ability, DndClass, Race, StatBlock, StatKey } from '../types/character';
import { STAT_ORDER } from '../types/character';
import type { RuleSection } from '../types/rules';

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
    tables: arr(s.tables ?? [], `${path}.tables`).map((t, j) => {
      const tp = `${path}.tables[${j}]`;
      const table = obj(t, tp);
      const columns = arr(table.columns, `${tp}.columns`);
      if (columns.length !== 2) fail(`${tp}.columns`, 'must have exactly two column headings.');
      return {
        title: str(table.title, `${tp}.title`),
        intro: table.intro ? str(table.intro, `${tp}.intro`) : undefined,
        columns: [str(columns[0], `${tp}.columns[0]`), str(columns[1], `${tp}.columns[1]`)] as [string, string],
        rows: arr(table.rows ?? [], `${tp}.rows`).map((r, k) => {
          const rp = `${tp}.rows[${k}]`;
          const row = obj(r, rp);
          return {
            key: str(row.key, `${rp}.key`, { allowEmpty: true }),
            value: str(row.value, `${rp}.value`, { allowEmpty: true }),
            note: row.note ? str(row.note, `${rp}.note`) : undefined,
          };
        }),
        footnote: table.footnote ? str(table.footnote, `${tp}.footnote`) : undefined,
      };
    }),
  };
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
  };
}

function assertUniqueIds(items: { id: string }[], kind: string): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new PackError(`Two ${kind}s share the id "${item.id}". Ids must be unique.`);
    seen.add(item.id);
  }
}
