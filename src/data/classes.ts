import type { DndClass } from '../types/character';
import { CONTENT } from '../content';

export const CLASSES = CONTENT.classes;

export const CLASS_BY_ID = new Map(CLASSES.map((cls) => [cls.id, cls]));

export const SELECTABLE_CLASSES = CLASSES.filter((cls) => !cls.placeholder);

export function classDisplayName(cls: DndClass): string {
  return cls.subtitle ? `${cls.name} (${cls.subtitle})` : cls.name;
}
