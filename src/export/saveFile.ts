import { saveAs } from 'file-saver';
import type { Character, CharacterSaveFile } from '../types/character';
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

  return file.character;
}

export function readCharacterFile(file: File): Promise<Character> {
  return file.text().then(parseCharacterFile);
}
