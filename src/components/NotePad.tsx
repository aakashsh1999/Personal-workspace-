import { formatDistanceToNow } from 'date-fns'
import { FilePlus2, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  htmlToPlainPreview,
  migrateSavedNotes,
} from '../lib/blocksToHtml'
import { useStore } from '../store'
import type { Page } from '../types'
import { RichTextEditor } from './RichTextEditor'
import { Button } from './ui'

export function NotePad({ page }: { page: Page }) {
  const {
    updatePage,
    addNote,
    updateNote,
    deleteNote,
    setActiveNoteId,
  } = useStore()

  useEffect(() => {
    const migrated = migrateSavedNotes(page)
    if (migrated) updatePage(page.id, migrated)
  }, [page, updatePage])

  const notes = page.savedNotes ?? []
  const activeId =
    page.activeNoteId && notes.some((n) => n.id === page.activeNoteId)
      ? page.activeNoteId
      : notes[0]?.id
  const active = useMemo(
    () => notes.find((n) => n.id === activeId),
    [notes, activeId],
  )

  useEffect(() => {
    if (notes.length && page.activeNoteId !== activeId) {
      setActiveNoteId(page.id, activeId)
    }
  }, [notes.length, page.activeNoteId, activeId, page.id, setActiveNoteId])

  if (!page.savedNotes) {
    return (
      <div className="notes-pad notes-pad--loading" aria-busy="true">
        Preparing notes…
      </div>
    )
  }

  return (
    <div className="notes-pad">
      <aside className="notes-list" aria-label="Saved notes">
        <div className="notes-list-head">
          <h3>Your notes</h3>
          <Button
            variant="primary"
            size="sm"
            onClick={() => addNote(page.id)}
            aria-label="New note"
          >
            <FilePlus2 size={14} aria-hidden /> New
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="notes-list-empty">
            <p>No notes yet.</p>
            <Button variant="secondary" size="sm" onClick={() => addNote(page.id)}>
              Create your first note
            </Button>
          </div>
        ) : (
          <ul className="notes-list-items">
            {notes.map((note) => {
              const selected = note.id === activeId
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`notes-list-item${selected ? ' is-active' : ''}`}
                    onClick={() => setActiveNoteId(page.id, note.id)}
                  >
                    <span className="notes-list-title">
                      {note.title.trim() || 'Untitled note'}
                    </span>
                    <span className="notes-list-preview">
                      {htmlToPlainPreview(note.content)}
                    </span>
                    <span className="notes-list-time">
                      {formatDistanceToNow(new Date(note.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      <div className="notes-editor">
        {active ? (
          <>
            <div className="notes-editor-head">
              <input
                className="notes-title-input"
                value={active.title}
                placeholder="Note title"
                aria-label="Note title"
                onChange={(e) =>
                  updateNote(page.id, active.id, { title: e.target.value })
                }
              />
              <Button
                variant="danger"
                size="sm"
                aria-label="Delete note"
                onClick={() => {
                  if (
                    confirm(
                      `Delete “${active.title.trim() || 'this note'}”?`,
                    )
                  ) {
                    deleteNote(page.id, active.id)
                  }
                }}
              >
                <Trash2 size={14} aria-hidden /> Delete
              </Button>
            </div>
            <RichTextEditor
              key={active.id}
              content={active.content}
              onChange={(html) =>
                updateNote(page.id, active.id, { content: html })
              }
              placeholder="Start writing your note…"
            />
          </>
        ) : (
          <div className="notes-editor-empty">
            <p>Pick a note on the left, or create a new one.</p>
            <Button variant="primary" onClick={() => addNote(page.id)}>
              <FilePlus2 size={16} aria-hidden /> New note
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
