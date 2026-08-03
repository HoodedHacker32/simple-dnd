import { saveAs } from 'file-saver';
import type { Character } from '../types/character';
import { migrateCharacter, parseCharacterFile } from './saveFile';

export const PARTY_FORMAT = 'chroniclers-table-party';
export const PARTY_VERSION = 1;

export interface PartyFile {
  format: typeof PARTY_FORMAT;
  version: number;
  name: string;
  savedAt: string;
  members: Character[];
}

export function serialiseParty(name: string, members: Character[]): string {
  const file: PartyFile = {
    format: PARTY_FORMAT,
    version: PARTY_VERSION,
    name,
    savedAt: new Date().toISOString(),
    members,
  };
  return JSON.stringify(file, null, 2);
}

export function parsePartyFile(text: string): { name: string; members: Character[] } {
  let file: PartyFile;
  try {
    file = JSON.parse(text) as PartyFile;
  } catch {
    throw new Error('That file is not readable — it may be damaged.');
  }
  if (file?.format !== PARTY_FORMAT) throw new Error('That is not a party file.');
  if (typeof file.version !== 'number' || file.version > PARTY_VERSION) {
    throw new Error('That party was saved by a newer version of this app.');
  }
  if (!Array.isArray(file.members)) throw new Error('That party file has no members in it.');
  return {
    name: typeof file.name === 'string' ? file.name : 'The Party',
    members: file.members.map((m) => migrateCharacter(m as unknown as Record<string, unknown>)),
  };
}

export function downloadParty(name: string, members: Character[]): void {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'party';
  saveAs(new Blob([serialiseParty(name, members)], { type: 'application/json;charset=utf-8' }), `${slug}.dndparty`);
}

/**
 * Accepts either a single character or a whole party, so the DM can drop in
 * whatever a player sent without having to know which it is.
 */
export function readAnyFile(text: string): { name?: string; members: Character[] } {
  try {
    return parsePartyFile(text);
  } catch {
    return { members: [parseCharacterFile(text)] };
  }
}
