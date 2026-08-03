import type { Block } from '../types';

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
