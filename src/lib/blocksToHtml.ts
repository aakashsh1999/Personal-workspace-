import type { Block, Page, SavedNote } from '../types';
import { createId } from '../data/seed';

/** Convert legacy block notes into HTML for the rich text editor. */
export function blocksToHtml(blocks: Block[]): string {
  if (!blocks.length) return '<p></p>';

  const parts = blocks.map((block) => {
    const text = escapeHtml(block.content || '');
    const indent = Math.min(2, Math.max(0, block.indent ?? 0));
    const pad = indent > 0 ? ` style="margin-left:${indent * 1.25}rem"` : '';

    switch (block.type) {
      case 'heading1':
        return `<h1>${text || '<br>'}</h1>`;
      case 'heading2':
        return `<h2>${text || '<br>'}</h2>`;
      case 'heading3':
        return `<h3>${text || '<br>'}</h3>`;
      case 'bullet':
        return `<ul${pad}><li>${text || '<br>'}</li></ul>`;
      case 'numbered':
        return `<ol${pad}><li>${text || '<br>'}</li></ol>`;
      case 'todo':
        return `<ul data-type="taskList"><li data-checked="${block.checked ? 'true' : 'false'}">${text || '<br>'}</li></ul>`;
      case 'quote':
        return `<blockquote><p>${text || '<br>'}</p></blockquote>`;
      case 'callout':
        return `<p><mark>${text || '<br>'}</mark></p>`;
      case 'divider':
        return '<hr>';
      case 'image':
        return block.content
          ? `<p><img src="${escapeAttr(block.content)}" alt="" /></p>`
          : '';
      default:
        return `<p>${text || '<br>'}</p>`;
    }
  });

  return parts.filter(Boolean).join('') || '<p></p>';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function initialRichContent(page: {
  richContent?: string;
  blocks: Block[];
}): string {
  if (page.richContent && page.richContent.trim()) return page.richContent;
  return blocksToHtml(page.blocks);
}

export function htmlToPlainPreview(html: string, max = 72): string {
  const text = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return 'Empty note';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function contentLooksEmpty(html: string): boolean {
  const plain = htmlToPlainPreview(html, 1000);
  return plain === 'Empty note' || !plain.trim();
}

/** One-time migrate of legacy single notepad into savedNotes[]. */
export function migrateSavedNotes(page: Page): {
  savedNotes: SavedNote[];
  activeNoteId?: string;
} | null {
  if (page.savedNotes) return null;

  const content = initialRichContent(page);
  const now = new Date().toISOString();

  if (contentLooksEmpty(content)) {
    return { savedNotes: [], activeNoteId: undefined };
  }

  const note: SavedNote = {
    id: createId(),
    title: 'Untitled note',
    content,
    createdAt: now,
    updatedAt: now,
  };

  return { savedNotes: [note], activeNoteId: note.id };
}
