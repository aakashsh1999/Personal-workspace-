import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useStore } from '../store';
import type { SpaceKind } from '../types';
import { SPACE_META } from '../types';
import { PageIcon } from './icons';

const SPACE_ORDER: SpaceKind[] = [
  'home',
  'tasks',
  'learning',
  'career',
  'office',
  'freelance',
  'goals',
  'habits',
  'notes',
  'custom',
];

export function Sidebar() {
  const {
    state,
    setActivePageId,
    toggleSidebar,
    setSearchQuery,
    addPage,
    deletePage,
    resetData,
  } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const bySpace = useMemo(() => {
    const map = new Map<SpaceKind, typeof filtered>();
    for (const space of SPACE_ORDER) map.set(space, []);
    for (const page of filtered) {
      const list = map.get(page.space) ?? [];
      list.push(page);
      map.set(page.space, list);
    }
    return map;
  }, [filtered]);

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
          {state.pages.slice(0, 8).map((p) => (
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
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden>
          <span />
        </div>
        <div>
          <div className="brand-name">Orbit</div>
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

      <label className="search-field">
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
      </div>

      <nav className="sidebar-nav" aria-label="Spaces">
        {SPACE_ORDER.map((space) => {
          const pages = bySpace.get(space) ?? [];
          if (!pages.length && space !== 'custom') return null;
          if (space === 'custom' && !pages.length) return null;
          return (
            <div key={space} className="nav-group">
              <div className="nav-group-label">{SPACE_META[space].label}</div>
              {pages.map((page) => (
                <div
                  key={page.id}
                  className={`nav-item ${state.activePageId === page.id ? 'is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="nav-item-btn"
                    onClick={() => setActivePageId(page.id)}
                  >
                    <PageIcon name={page.icon} size={15} />
                    <span>{page.title}</span>
                  </button>
                  {page.id !== 'page-home' && (
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
              ))}
            </div>
          );
        })}
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
