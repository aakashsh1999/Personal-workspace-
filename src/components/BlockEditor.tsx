import type { KeyboardEvent } from 'react';
import { useStore } from '../store';
import type { Block, BlockType } from '../types';

const TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: 'paragraph', label: 'Text' },
  { value: 'heading1', label: 'Heading 1' },
  { value: 'heading2', label: 'Heading 2' },
  { value: 'heading3', label: 'Heading 3' },
  { value: 'todo', label: 'To-do' },
  { value: 'bullet', label: 'Bullet' },
  { value: 'numbered', label: 'Numbered' },
  { value: 'quote', label: 'Quote' },
  { value: 'callout', label: 'Callout' },
  { value: 'divider', label: 'Divider' },
];

export function BlockEditor({ pageId, blocks }: { pageId: string; blocks: Block[] }) {
  const { updateBlock, addBlock, deleteBlock } = useStore();

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, block: Block) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(pageId, 'paragraph', block.id);
    }
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(pageId, block.id);
    }
  }

  return (
    <div className="block-editor">
      {blocks.map((block, index) => (
        <div key={block.id} className={`block block-${block.type}`}>
          <select
            className="block-type"
            value={block.type}
            aria-label="Block type"
            title="Change block type"
            onChange={(e) =>
              updateBlock(pageId, block.id, { type: e.target.value as BlockType })
            }
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {block.type === 'divider' ? (
            <hr className="block-divider" />
          ) : (
            <div className="block-body">
              {block.type === 'todo' && (
                <input
                  type="checkbox"
                  checked={!!block.checked}
                  onChange={(e) =>
                    updateBlock(pageId, block.id, { checked: e.target.checked })
                  }
                  aria-label="Toggle to-do"
                />
              )}
              {block.type === 'bullet' && <span className="bullet-mark">•</span>}
              {block.type === 'numbered' && (
                <span className="bullet-mark">{index + 1}.</span>
              )}
              <textarea
                className={`block-input ${block.checked ? 'is-checked' : ''}`}
                value={block.content}
                rows={1}
                placeholder={
                  block.type.startsWith('heading')
                    ? 'Heading'
                    : block.type === 'todo'
                      ? 'To-do'
                      : 'Type something…'
                }
                onChange={(e) => {
                  updateBlock(pageId, block.id, { content: e.target.value });
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={(e) => onKeyDown(e, block)}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="btn btn-ghost btn-sm add-block"
        onClick={() => addBlock(pageId, 'paragraph')}
      >
        + Add block
      </button>
    </div>
  );
}
