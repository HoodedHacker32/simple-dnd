import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { saveAs } from 'file-saver';
import type { Character } from '../types/character';
import { slugify } from './saveFile';

const PIXEL_RATIO = 2;

async function renderSheet(node: HTMLElement): Promise<{ dataUrl: string; width: number; height: number }> {
  const dataUrl = await toPng(node, {
    pixelRatio: PIXEL_RATIO,
    cacheBust: true,
    backgroundColor: '#efe0c0',
  });
  return { dataUrl, width: node.offsetWidth, height: node.offsetHeight };
}

export async function exportSheetAsPng(node: HTMLElement, character: Character): Promise<void> {
  const { dataUrl } = await renderSheet(node);
  saveAs(dataUrl, `${slugify(character.name)}.png`);
}

export async function exportSheetAsPdf(node: HTMLElement, character: Character): Promise<void> {
  const { dataUrl, width, height } = await renderSheet(node);
  const orientation = height >= width ? 'portrait' : 'landscape';
  const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height], compress: true });
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height, undefined, 'FAST');
  pdf.save(`${slugify(character.name)}.pdf`);
}
