import type { Character } from '../types/character';
import { migrateCharacter } from './saveFile';

/*
 * There is no server behind this app, so a character cannot literally be sent
 * anywhere. A share code is the character itself, squeezed into text the player
 * can paste into any chat window. The DM pastes it back and gets the character.
 *
 * The payload is deflated before encoding, which typically turns a ~1.5 KB
 * character into a code of a few hundred characters.
 */

const PREFIX = 'CT1:';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function squeeze(bytes: Uint8Array, format: 'deflate-raw'): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new CompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unsqueeze(bytes: Uint8Array, format: 'deflate-raw'): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Turns a character into a paste-able code. */
export async function encodeCharacter(character: Character): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(character));
  try {
    return PREFIX + toBase64Url(await squeeze(json, 'deflate-raw'));
  } catch {
    // CompressionStream is missing on older browsers; a longer code still works.
    return PREFIX + toBase64Url(json);
  }
}

/** Reads a code back, tolerating stray whitespace from a chat client. */
export async function decodeCharacter(code: string): Promise<Character> {
  const trimmed = code.trim().replace(/\s+/g, '');
  if (!trimmed) throw new Error('Paste a share code first.');
  if (!trimmed.startsWith(PREFIX)) {
    throw new Error('That does not look like a share code — they begin with "CT1:".');
  }

  const body = trimmed.slice(PREFIX.length);
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(body);
  } catch {
    throw new Error('That code is damaged — it may have been cut short when copied.');
  }

  let json: string;
  try {
    json = new TextDecoder().decode(await unsqueeze(bytes, 'deflate-raw'));
  } catch {
    json = new TextDecoder().decode(bytes);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('That code is damaged — it may have been cut short when copied.');
  }
  if (!raw || typeof raw !== 'object') throw new Error('That code does not contain a character.');

  const character = migrateCharacter(raw as Record<string, unknown>);
  if (!character.name && !character.raceId && !character.classId) {
    throw new Error('That code does not contain a character.');
  }
  return character;
}
