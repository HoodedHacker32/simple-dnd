import type { StatKey } from './character';

export interface RuleRow {
  /** Left-hand label — usually the stat value, sometimes a comparison. */
  key: string;
  value: string;
  note?: string;
}

export interface RuleTable {
  title: string;
  intro?: string;
  columns: [string, string];
  rows: RuleRow[];
  footnote?: string;
}

export interface RuleSection {
  stat: StatKey;
  headline: string;
  plainEnglish: string;
  tables: RuleTable[];
}
