import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { compressImage } from '../lib/images';
import { cn } from '../lib/cn';
import { Button } from './ui';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              (element as HTMLElement).style.fontSize?.replace(/['"]+/g, '') ||
              null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run(),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const COLORS = [
  '#0f172a',
  '#334155',
  '#0f766e',
  '#0369a1',
  '#b45309',
  '#be123c',
  '#7c3aed',
  '#15803d',
];

const SIZES = [
  { label: 'S', value: '0.9rem' },
  { label: 'M', value: '1rem' },
  { label: 'L', value: '1.25rem' },
  { label: 'XL', value: '1.6rem' },
  { label: '2XL', value: '2rem' },
];

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing…',
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dropActive, setDropActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: 'rte-image' },
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'rte-link' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'rte-prose',
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) void addImage(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(_view, event) {
        const file = event.dataTransfer?.files?.[0];
        if (file?.type.startsWith('image/')) {
          event.preventDefault();
          void addImage(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getHTML());
    },
  });

  async function addImage(file: Blob) {
    if (!editor) return;
    setError(null);
    try {
      const src = await compressImage(file);
      editor.chain().focus().setImage({ src }).run();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add image.');
    }
  }

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content || '<p></p>', { emitUpdate: false });
    }
  }, [content, editor]);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void addImage(file);
    e.target.value = '';
  }

  function onDragOver(e: DragEvent) {
    if ([...e.dataTransfer.types].includes('Files')) {
      e.preventDefault();
      setDropActive(true);
    }
  }

  if (!editor) return null;

  return (
    <div
      className={cn('rte', dropActive && 'is-drop-active')}
      onDragOver={onDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={() => setDropActive(false)}
    >
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
        <div className="rte-group">
          <ToolBtn
            label="Undo"
            active={false}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 size={15} />
          </ToolBtn>
          <ToolBtn
            label="Redo"
            active={false}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 size={15} />
          </ToolBtn>
        </div>

        <div className="rte-group">
          <ToolBtn
            label="Title"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1 size={15} />
          </ToolBtn>
          <ToolBtn
            label="Subtitle"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 size={15} />
          </ToolBtn>
          <ToolBtn
            label="Subheading"
            active={editor.isActive('heading', { level: 3 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3 size={15} />
          </ToolBtn>
        </div>

        <div className="rte-group">
          {SIZES.map((s) => (
            <ToolBtn
              key={s.value}
              label={`Size ${s.label}`}
              active={editor.getAttributes('textStyle').fontSize === s.value}
              onClick={() => editor.chain().focus().setFontSize(s.value).run()}
            >
              {s.label}
            </ToolBtn>
          ))}
        </div>

        <div className="rte-group">
          <ToolBtn
            label="Bold"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold size={15} />
          </ToolBtn>
          <ToolBtn
            label="Italic"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic size={15} />
          </ToolBtn>
          <ToolBtn
            label="Underline"
            active={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon size={15} />
          </ToolBtn>
          <ToolBtn
            label="Strike"
            active={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough size={15} />
          </ToolBtn>
          <ToolBtn
            label="Highlight"
            active={editor.isActive('highlight')}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHighlight({ color: '#fef08a' })
                .run()
            }
          >
            <Highlighter size={15} />
          </ToolBtn>
        </div>

        <div className="rte-group rte-colors" aria-label="Text color">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                'rte-swatch',
                editor.isActive('textStyle', { color: c }) && 'is-active',
              )}
              style={{ background: c }}
              aria-label={`Color ${c}`}
              title="Text color"
              onClick={() => editor.chain().focus().setColor(c).run()}
            />
          ))}
        </div>

        <div className="rte-group">
          <ToolBtn
            label="Bullet list"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List size={15} />
          </ToolBtn>
          <ToolBtn
            label="Numbered list"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={15} />
          </ToolBtn>
        </div>

        <div className="rte-group">
          <ToolBtn
            label="Align left"
            active={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <AlignLeft size={15} />
          </ToolBtn>
          <ToolBtn
            label="Align center"
            active={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <AlignCenter size={15} />
          </ToolBtn>
          <ToolBtn
            label="Align right"
            active={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <AlignRight size={15} />
          </ToolBtn>
        </div>

        <div className="rte-group">
          <ToolBtn
            label="Link"
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link').href as
                | string
                | undefined;
              const url = window.prompt('Link URL', prev || 'https://');
              if (url === null) return;
              if (!url) {
                editor.chain().focus().unsetLink().run();
                return;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run();
            }}
          >
            <Link2 size={15} />
          </ToolBtn>
          <ToolBtn
            label="Add image"
            active={false}
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus size={15} />
          </ToolBtn>
        </div>
      </div>

      {error && <p className="rte-error">{error}</p>}

      <EditorContent editor={editor} />

      <div className="rte-footer">
        <p className="rte-hint">
          Select text to change size, color, and style. Paste or drop images
          anywhere.
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus size={15} aria-hidden /> Add image
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileChange}
      />
    </div>
  );
}

function ToolBtn({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn('rte-btn', active && 'is-active')}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
