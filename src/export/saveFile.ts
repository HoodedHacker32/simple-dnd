import { saveAs } from 'file-saver';
import type { Character, CharacterSaveFile, FieldValue } from '../types/character';
import { SAVE_FORMAT, SAVE_VERSION } from '../types/character';

export function slugify(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'unnamed-wanderer';
}

export function serializeCharacter(character: Character): string {
  const payload: CharacterSaveFile = {
    format: SAVE_FORMAT,
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    character,
  };
  return JSON.stringify(payload, null, 2);
}

export function saveCharacterToFile(character: Character): void {
  const blob = new Blob([serializeCharacter(character)], { type: 'application/json;charset=utf-8' });
  saveAs(blob, `${slugify(character.name)}.dndchar.json`);
}

export function parseCharacterFile(text: string): Character {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  if (typeof data !== 'object' || data === null) {
    throw new Error('That file does not contain a character.');
  }

  const file = data as Partial<CharacterSaveFile>;
  if (file.format !== SAVE_FORMAT) {
    throw new Error('That file was not saved by the Chronicler\'s Table.');
  }
  if (typeof file.version !== 'number' || file.version > SAVE_VERSION) {
    throw new Error('That character was saved by a newer version of this app.');
  }
  if (!file.character || typeof file.character !== 'object') {
    throw new Error('That save file is missing its character data.');
  }

  return migrateCharacter(file.character as unknown as Record<string, unknown>);
}

/** Fields used to be fixed columns on Character; fold any legacy ones into `fields`. */
const LEGACY_FIELD_KEYS = ['age', 'gender', 'pronouns', 'alignment', 'backstory'];

export function migrateCharacter(raw: Record<string, unknown>): Character {
  const fields = { ...((raw.fields as Record<string, FieldValue>) ?? {}) };
  for (const key of LEGACY_FIELD_KEYS) {
    if (raw[key] !== undefined && fields[key] === undefined) {
      fields[key] = raw[key] as FieldValue;
    }
  }
  return { ...(raw as unknown as Character), fields };
}

export function readCharacterFile(file: File): Promise<Character> {
  return file.text().then(parseCharacterFile);
}
