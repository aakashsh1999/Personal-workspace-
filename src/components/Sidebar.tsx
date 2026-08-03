import { useMemo, useState, type DragEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useStore } from '../store';
import { SPACE_META } from '../types';
import { PageIcon } from './icons';

export function Sidebar() {
  const {
    state,
    setActivePageId,
    toggleSidebar,
    setSearchQuery,
    addPage,
    deletePage,
    reorderPages,
    resetData,
  } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const searching = state.searchQuery.trim().length > 0;

  const filtered = useMemo(() => {
    const q = state.searchQuery.trim().toLowerCase();
    if (!q) return state.pages;
    const goalHit = (state.goals ?? []).some(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.why.toLowerCase().includes(q) ||
        g.notes.toLowerCase().includes(q),
    );
    return state.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.blocks.some((b) => b.content.toLowerCase().includes(q)) ||
        p.items.some((i) => i.title.toLowerCase().includes(q)) ||
        (goalHit && (p.id === 'page-goals' || p.space === 'goals')),
    );
  }, [state.pages, state.searchQuery, state.goals]);

  function onDragStart(e: DragEvent, id: string) {
    if (searching) {
      e.preventDefault();
      return;
    }
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }

  function onDragOver(e: DragEvent, id: string) {
    if (!dragId || dragId === id || searching) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverId(id);
  }

  function onDrop(e: DragEvent, id: string) {
    e.preventDefault();
    const from = e.dataTransfer.getData('text/plain') || dragId;
    if (from) reorderPages(from, id);
    setDragId(null);
    setOverId(null);
  }

  function onDragEnd() {
    setDragId(null);
    setOverId(null);
  }

  if (state.sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={18} />
        </button>
        <div className="sidebar-rail">
          {state.pages.slice(0, 10).map((p) => (
            <button
              key={p.id}
              type="button"
              className={`rail-btn ${state.activePageId === p.id ? 'is-active' : ''}`}
              onClick={() => setActivePageId(p.id)}
              title={p.title}
              aria-label={p.title}
            >
              <PageIcon name={p.icon} size={18} />
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand px-1">
        <div className="brand-mark" aria-hidden>
          <span />
        </div>
        <div className="min-w-0">
          <div className="brand-name tracking-tight">Orbit</div>
          <div className="brand-sub">Personal workspace</div>
        </div>
        <button
          type="button"
          className="icon-btn ml-auto"
          onClick={toggleSidebar}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <label className="search-field rounded-xl border border-[var(--line)] bg-[var(--surface-solid)]">
        <Search size={15} aria-hidden />
        <input
          type="search"
          placeholder="Search pages & items…"
          value={state.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </label>

      <div className="sidebar-actions">
        <div className="new-menu">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Plus size={15} />
            New
          </button>
          {menuOpen && (
            <div className="menu-popover" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  addPage('notes', false);
                  setMenuOpen(false);
                }}
              >
                Page
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  addPage('custom', true);
                  setMenuOpen(false);
                }}
              >
                Tracker board
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  addPage('tasks', true);
                  setMenuOpen(false);
                }}
              >
                Task list
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  addPage('learning', true);
                  setMenuOpen(false);
                }}
              >
                Learning tracker
              </button>
            </div>
          )}
        </div>
        {!searching && (
          <p className="sidebar-hint">Drag items to reorder</p>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Pages">
        {filtered.map((page) => {
          const canDrag = !searching;
          return (
            <div
              key={page.id}
              className={[
                'nav-item',
                state.activePageId === page.id ? 'is-active' : '',
                dragId === page.id ? 'is-dragging' : '',
                overId === page.id && dragId !== page.id ? 'is-drop-target' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={canDrag}
              onDragStart={(e) => onDragStart(e, page.id)}
              onDragOver={(e) => onDragOver(e, page.id)}
              onDrop={(e) => onDrop(e, page.id)}
              onDragEnd={onDragEnd}
            >
              {canDrag && (
                <span className="nav-grip" aria-hidden title="Drag to reorder">
                  <GripVertical size={14} />
                </span>
              )}
              <button
                type="button"
                className="nav-item-btn"
                onClick={() => setActivePageId(page.id)}
              >
                <PageIcon name={page.icon} size={15} />
                <span className="nav-item-text">
                  <span className="nav-item-title">{page.title}</span>
                  <span className="nav-item-space">
                    {SPACE_META[page.space]?.label ?? page.space}
                  </span>
                </span>
              </button>
              {page.id !== 'page-home' && page.id !== 'page-finance' && (
                <button
                  type="button"
                  className="nav-delete"
                  aria-label={`Delete ${page.title}`}
                  onClick={() => {
                    if (confirm(`Delete “${page.title}”?`)) deletePage(page.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="empty sidebar-empty">No matching pages.</p>
        )}
      </nav>

      <button
        type="button"
        className="btn btn-ghost btn-sm sidebar-reset"
        onClick={() => {
          if (confirm('Clear all your data and start with an empty workspace?'))
            resetData();
        }}
      >
        <RotateCcw size={14} />
        Clear workspace
      </button>
    </aside>
  );
}
