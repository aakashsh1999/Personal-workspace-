import { useMemo } from 'react';
import { initialRichContent } from '../lib/blocksToHtml';
import { useStore } from '../store';
import type { Page } from '../types';
import { RichTextEditor } from './RichTextEditor';

export function NotePad({ page }: { page: Page }) {
  const { updatePage } = useStore();
  // Seed once per page; editor owns live edits after that.
  const seed = useMemo(
    () => initialRichContent(page),
    // page.id is enough — remount via key when switching pages
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page.id],
  );

  return (
    <RichTextEditor
      key={page.id}
      content={seed}
      onChange={(html) => updatePage(page.id, { richContent: html })}
      placeholder="Start writing your note…"
    />
  );
}
