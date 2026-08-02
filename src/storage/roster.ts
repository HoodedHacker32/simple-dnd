import type { Character } from '../types/character';
import { migrateCharacter } from '../export/saveFile';

const KEY = 'chroniclers-table.roster.v1';

export function loadRoster(): Character[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(migrateCharacter) : [];
  } catch {
    return [];
  }
}

export function saveRoster(roster: Character[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(roster));
  } catch {
    // Storage full or blocked (private browsing) — the in-memory roster still works.
  }
}
