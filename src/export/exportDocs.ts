import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Character, DndClass, Race, StatBlock } from '../types/character';
import { STATS, STAT_ORDER } from '../types/character';
import { classDisplayName } from '../data/classes';
import { formatModifier, type DerivedStats } from '../engine/statCalculator';
import { slugify } from './saveFile';

export interface ExportPayload {
  character: Character;
  race: Race | null;
  dndClass: DndClass | null;
  stats: StatBlock;
  derived: DerivedStats;
}

const INK = '2B1A0E';
const BLOOD = '8C2F24';
const GOLD = '8A6D1F';

function multiplierText(value: number | null): string {
  return value === null ? 'Unable' : `${value}x`;
}

function derivedRows({ derived }: ExportPayload): [string, string][] {
  const rows: [string, string][] = [
    ['Hit Points', String(derived.hitPoints)],
    ['Weapons', derived.weaponAccess],
    ['Spell power', multiplierText(derived.magicMultiplier)],
    [
      'Movement (d4)',
      `${derived.movementMultiplier}x — ${derived.movementRange.min}–${derived.movementRange.max}`,
    ],
    [
      derived.overrides.bowRange ? `Bow range (${derived.overrides.bowRange})` : 'Bow range',
      multiplierText(derived.bowMultiplier),
    ],
    ['Social rolls', `${derived.charismaMultiplier}x`],
    ['Stealth (likely)', `${derived.stealthLikely}+`],
    ['Stealth (unlikely)', `${derived.stealthUnlikely}+`],
  ];
  for (const effect of derived.extraEffects) {
    rows.push([effect.label, effect.value === null ? 'Unable' : `${effect.value}x`]);
  }
  return rows;
}

/* ---------------------------------------------------------------- DOCX --- */

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 320, after: 140 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 4 } },
    children: [
      new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: BLOOD, font: 'Georgia' }),
    ],
  });
}

function labelValueTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, color: INK, font: 'Georgia', size: 20 })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: value, color: INK, font: 'Georgia', size: 20 })],
                }),
              ],
            }),
          ],
        }),
    ),
  });
}

export async function exportCharacterAsDocx(payload: ExportPayload): Promise<void> {
  const { character, race, dndClass, stats, derived } = payload;

  const identity = [
    character.age !== '' ? `Age ${character.age}` : null,
    character.gender || null,
    character.pronouns || null,
    character.alignment || null,
  ]
    .filter(Boolean)
    .join('  •  ');

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: character.name || 'Unnamed Wanderer',
          bold: true,
          size: 52,
          color: INK,
          font: 'Georgia',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: [race?.name, dndClass ? classDisplayName(dndClass) : null].filter(Boolean).join(' · '),
          size: 24,
          color: BLOOD,
          font: 'Georgia',
          allCaps: true,
        }),
      ],
    }),
  ];

  if (identity) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: identity, italics: true, size: 20, color: INK, font: 'Georgia' })],
      }),
    );
  }

  children.push(heading('Attributes'));
  children.push(
    labelValueTable(STAT_ORDER.map((key) => [STATS[key].label, formatModifier(stats[key])] as [string, string])),
  );

  children.push(heading('What that means in play'));
  children.push(labelValueTable(derivedRows(payload)));

  children.push(heading('Dodging — roll a d20'));
  children.push(labelValueTable(derived.dodgeTable.map((r) => [r.comparison, `${r.target}+`] as [string, string])));

  if (dndClass) {
    children.push(heading('Abilities'));
    for (const ability of dndClass.abilities) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [new TextRun({ text: ability.name, bold: true, color: BLOOD, font: 'Georgia', size: 20 })],
        }),
        new Paragraph({
          children: [new TextRun({ text: ability.description, color: INK, font: 'Georgia', size: 20 })],
        }),
      );
    }
  }

  if (character.backstory.trim()) {
    children.push(heading('Backstory'));
    for (const para of character.backstory.split(/\n{2,}/)) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun({ text: para.trim(), color: INK, font: 'Georgia', size: 20 })],
        }),
      );
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slugify(character.name)}.docx`);
}

/* ---------------------------------------------------------------- XLSX --- */

export async function exportCharacterAsXlsx(payload: ExportPayload): Promise<void> {
  const { character, race, dndClass, stats, derived } = payload;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "The Chronicler's Table";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Character', {
    properties: { defaultRowHeight: 18 },
  });
  sheet.columns = [{ width: 30 }, { width: 46 }];

  const titleRow = sheet.addRow([character.name || 'Unnamed Wanderer']);
  titleRow.font = { name: 'Georgia', size: 18, bold: true, color: { argb: 'FF2B1A0E' } };
  sheet.mergeCells(titleRow.number, 1, titleRow.number, 2);

  const subtitleRow = sheet.addRow([
    [race?.name, dndClass ? classDisplayName(dndClass) : null].filter(Boolean).join(' · '),
  ]);
  subtitleRow.font = { name: 'Georgia', size: 12, italic: true, color: { argb: 'FF8C2F24' } };
  sheet.mergeCells(subtitleRow.number, 1, subtitleRow.number, 2);

  const addSection = (title: string, rows: [string, string][]) => {
    sheet.addRow([]);
    const header = sheet.addRow([title]);
    header.font = { name: 'Georgia', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8A6D1F' } };
    sheet.mergeCells(header.number, 1, header.number, 2);
    for (const [label, value] of rows) {
      const row = sheet.addRow([label, value]);
      row.getCell(1).font = { name: 'Georgia', bold: true };
      row.getCell(2).font = { name: 'Georgia' };
    }
  };

  addSection('Identity', [
    ['Race', race?.name ?? '—'],
    ['Class', dndClass ? classDisplayName(dndClass) : '—'],
    ['Age', character.age === '' ? '—' : String(character.age)],
    ['Gender', character.gender || '—'],
    ['Pronouns', character.pronouns || '—'],
    ['Alignment', character.alignment || '—'],
  ]);

  addSection(
    'Attributes',
    STAT_ORDER.map((key) => [STATS[key].label, formatModifier(stats[key])] as [string, string]),
  );

  addSection('In play', derivedRows(payload));

  addSection(
    'Dodging (d20)',
    derived.dodgeTable.map((r) => [r.comparison, `${r.target}+`] as [string, string]),
  );

  if (dndClass) {
    addSection(
      'Abilities',
      dndClass.abilities.map((a) => [a.name, a.description] as [string, string]),
    );
  }

  if (character.backstory.trim()) {
    addSection('Backstory', [['Text', character.backstory]]);
    sheet.lastRow!.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${slugify(character.name)}.xlsx`,
  );
}
