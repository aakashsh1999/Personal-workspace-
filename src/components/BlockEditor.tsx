import {
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import {
  GripVertical,
  Heading1,
  Heading2,
  ImagePlus,
  List,
  ListOrdered,
  ListTree,
  Type,
} from 'lucide-react';
import { compressImage } from '../lib/images';
import { useStore } from '../store';
import type { Block, BlockType } from '../types';

const TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: 'heading1', label: 'Title' },
  { value: 'heading2', label: 'Subtitle' },
  { value: 'heading3', label: 'Subheading' },
  { value: 'paragraph', label: 'Text' },
  { value: 'bullet', label: 'List' },
  { value: 'numbered', label: 'Numbered' },
  { value: 'todo', label: 'To-do' },
  { value: 'quote', label: 'Quote' },
  { value: 'callout', label: 'Callout' },
  { value: 'image', label: 'Image' },
  { value: 'divider', label: 'Divider' },
];

const PLACEHOLDER: Partial<Record<BlockType, string>> = {
  heading1: 'Title',
  heading2: 'Subtitle',
  heading3: 'Subheading',
  paragraph: 'Start typing…',
  bullet: 'List item',
  numbered: 'Numbered item',
  todo: 'To-do',
  quote: 'Quote',
  callout: 'Callout',
};

function listDepth(block: Block) {
  return Math.min(2, Math.max(0, block.indent ?? 0));
}

export function BlockEditor({
  pageId,
  blocks,
}: {
  pageId: string;
  blocks: Block[];
}) {
  const { updateBlock, addBlock, deleteBlock, reorderBlocks } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const insertAfterRef = useRef<string | undefined>(undefined);

  async function insertImage(file: Blob, afterId?: string) {
    setImageError(null);
    try {
      const dataUrl = await compressImage(file);
      addBlock(pageId, 'image', afterId, { content: dataUrl });
      addBlock(pageId, 'paragraph');
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not add image.');
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, block: Block) {
    const isList =
      block.type === 'bullet' ||
      block.type === 'numbered' ||
      block.type === 'todo';

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!isList) return;
      const indent = listDepth(block);
      updateBlock(pageId, block.id, {
        indent: e.shiftKey ? Math.max(0, indent - 1) : Math.min(2, indent + 1),
      });
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isList && block.content.trim() === '') {
        updateBlock(pageId, block.id, { type: 'paragraph', indent: 0 });
        return;
      }
      addBlock(pageId, isList ? block.type : 'paragraph', block.id, {
        indent: isList ? listDepth(block) : 0,
      });
      return;
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(pageId, block.id);
    }
  }

  async function onPaste(
    e: ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>,
    afterId?: string,
  ) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) await insertImage(file, afterId);
        return;
      }
    }
  }

  async function onEditorDrop(e: DragEvent) {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      await insertImage(file, insertAfterRef.current);
      insertAfterRef.current = undefined;
    }
  }

  function onBlockDragStart(e: DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function onBlockDragOver(e: DragEvent, id: string) {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    e.stopPropagation();
    setOverId(id);
  }

  function onBlockDrop(e: DragEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    const from = e.dataTransfer.getData('text/plain') || dragId;
    if (from) reorderBlocks(pageId, from, id);
    setDragId(null);
    setOverId(null);
  }

  let numberedCounter = 0;

  return (
    <div
      className={`block-editor notepad ${dropActive ? 'is-drop-active' : ''}`}
      onDragOver={(e) => {
        if ([...e.dataTransfer.types].includes('Files')) {
          e.preventDefault();
          setDropActive(true);
        }
      }}
      onDragLeave={() => setDropActive(false)}
      onDrop={(e) => void onEditorDrop(e)}
      onPaste={(e) => void onPaste(e)}
    >
      <div className="notepad-toolbar" role="toolbar" aria-label="Note formatting">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Title"
          onClick={() => addBlock(pageId, 'heading1')}
        >
          <Heading1 size={15} aria-hidden /> Title
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Subtitle"
          onClick={() => addBlock(pageId, 'heading2')}
        >
          <Heading2 size={15} aria-hidden /> Subtitle
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Text"
          onClick={() => addBlock(pageId, 'paragraph')}
        >
          <Type size={15} aria-hidden /> Text
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="List"
          onClick={() => addBlock(pageId, 'bullet', undefined, { indent: 0 })}
        >
          <List size={15} aria-hidden /> List
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Sub-list"
          onClick={() => addBlock(pageId, 'bullet', undefined, { indent: 1 })}
        >
          <ListTree size={15} aria-hidden /> Sub-list
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Numbered list"
          onClick={() => addBlock(pageId, 'numbered')}
        >
          <ListOrdered size={15} aria-hidden /> Numbered
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          title="Add image"
          onClick={() => {
            insertAfterRef.current = undefined;
            fileRef.current?.click();
          }}
        >
          <ImagePlus size={15} aria-hidden /> Image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void insertImage(file, insertAfterRef.current);
            e.target.value = '';
          }}
        />
      </div>

      <p className="notepad-hint">
        Paste or drag images here. Tab / Shift+Tab nests lists. Drag the grip to
        reorder.
      </p>

      {imageError && <p className="notepad-error">{imageError}</p>}

      {blocks.map((block, index) => {
        if (block.type === 'numbered') numberedCounter += 1;
        else if (block.type !== 'bullet' && block.type !== 'todo') {
          numberedCounter = 0;
        }
        const depth = listDepth(block);
        const numberLabel =
          block.type === 'numbered' ? `${numberedCounter}.` : null;

        return (
          <div
            key={block.id}
            className={[
              'block',
              `block-${block.type}`,
              depth > 0 ? `block-indent-${depth}` : '',
              dragId === block.id ? 'is-dragging' : '',
              overId === block.id && dragId !== block.id ? 'is-drop-target' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            draggable
            onDragStart={(e) => onBlockDragStart(e, block.id)}
            onDragOver={(e) => onBlockDragOver(e, block.id)}
            onDrop={(e) => onBlockDrop(e, block.id)}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
          >
            <span className="block-grip" aria-hidden title="Drag to reorder">
              <GripVertical size={14} />
            </span>
            <select
              className="block-type"
              value={block.type}
              aria-label="Block type"
              title="Change block type"
              onChange={(e) =>
                updateBlock(pageId, block.id, {
                  type: e.target.value as BlockType,
                  indent:
                    e.target.value === 'bullet' || e.target.value === 'numbered'
                      ? block.indent ?? 0
                      : 0,
                })
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
            ) : block.type === 'image' ? (
              <div className="block-image-wrap">
                {block.content ? (
                  <img
                    src={block.content}
                    alt=""
                    className="block-image"
                  />
                ) : (
                  <button
                    type="button"
                    className="block-image-empty"
                    onClick={() => {
                      insertAfterRef.current = blocks[index - 1]?.id;
                      fileRef.current?.click();
                    }}
                  >
                    Choose an image…
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => deleteBlock(pageId, block.id)}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div className="block-body">
                {block.type === 'todo' && (
                  <input
                    type="checkbox"
                    checked={!!block.checked}
                    onChange={(e) =>
                      updateBlock(pageId, block.id, {
                        checked: e.target.checked,
                      })
                    }
                    aria-label="Toggle to-do"
                  />
                )}
                {block.type === 'bullet' && (
                  <span className="bullet-mark">{depth > 0 ? '◦' : '•'}</span>
                )}
                {numberLabel && (
                  <span className="bullet-mark">{numberLabel}</span>
                )}
                <textarea
                  className={`block-input ${block.checked ? 'is-checked' : ''}`}
                  value={block.content}
                  rows={1}
                  placeholder={PLACEHOLDER[block.type] ?? 'Type something…'}
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
                  onPaste={(e) => void onPaste(e, block.id)}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="notepad-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => addBlock(pageId, 'paragraph')}
        >
          + Add text
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            insertAfterRef.current = blocks[blocks.length - 1]?.id;
            fileRef.current?.click();
          }}
        >
          + Add image
        </button>
      </div>
    </div>
  );
}
