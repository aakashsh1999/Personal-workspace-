import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Columns3, LayoutList, NotebookPen, Table2 } from 'lucide-react';
import { useStore } from '../store';
import type { SpaceKind, ViewMode } from '../types';
import { SPACE_META } from '../types';
import { BlockEditor } from './BlockEditor';
import { Dashboard } from './Dashboard';
import { FinanceEmbed } from './FinanceEmbed';
import { FreelancePanel } from './freelance';
import { GoalsPanel } from './GoalsPanel';
import { HabitsPanel } from './HabitsPanel';
import { NotePad } from './NotePad';
import { PageIcon } from './icons';
import { TrackerView } from './TrackerView';
import { Button } from './ui';

const TRACKER_COPY: Partial<
  Record<SpaceKind, { lead: string; tasksLabel: string; empty: string }>
> = {
  tasks: {
    lead: 'Add the things you need to finish today. Switch List, Board, or Table anytime.',
    tasksLabel: 'Tasks',
    empty: 'No tasks yet. Add your first one to get started.',
  },
  learning: {
    lead: 'Track courses, books, and skills you’re working on.',
    tasksLabel: 'Items',
    empty: 'No learning items yet. Add something you’re studying.',
  },
  career: {
    lead: 'Track career milestones, applications, and growth actions.',
    tasksLabel: 'Items',
    empty: 'No career items yet. Add a milestone or next step.',
  },
  office: {
    lead: 'Track office projects, meetings, and deliverables.',
    tasksLabel: 'Items',
    empty: 'No office items yet. Add a project or follow-up.',
  },
  custom: {
    lead: 'Your custom board — add items and move them through status.',
    tasksLabel: 'Items',
    empty: 'No items yet. Add one to start tracking.',
  },
};

export function PageWorkspace() {
  const { activePage, updatePage, setViewMode, addItem } = useStore();
  const [trackerTab, setTrackerTab] = useState<'tasks' | 'notes'>('tasks');
  const [quickTitle, setQuickTitle] = useState('');

  useEffect(() => {
    setTrackerTab('tasks');
    setQuickTitle('');
  }, [activePage?.id]);

  function submitQuickAdd(e: FormEvent) {
    e.preventDefault();
    if (!activePage || !quickTitle.trim()) return;
    addItem(activePage.id, quickTitle.trim());
    setQuickTitle('');
  }

  if (!activePage) {
    return (
      <div className="empty-page" role="status">
        Choose a page from the left menu.
      </div>
    );
  }

  if (activePage.id === 'page-home') {
    return (
      <div className="workspace">
        <Dashboard />
      </div>
    );
  }

  if (activePage.space === 'freelance' || activePage.id === 'page-freelance') {
    return (
      <div className="workspace">
        <FreelancePanel />
      </div>
    );
  }

  if (activePage.space === 'finance' || activePage.id === 'page-finance') {
    return (
      <div className="workspace workspace--finance">
        <FinanceEmbed />
      </div>
    );
  }

  if (activePage.space === 'goals' || activePage.id === 'page-goals') {
    return (
      <div className="workspace">
        <GoalsPanel />
      </div>
    );
  }

  const views: { mode: ViewMode; icon: typeof LayoutList; label: string }[] = [
    { mode: 'list', icon: LayoutList, label: 'List' },
    { mode: 'board', icon: Columns3, label: 'Board' },
    { mode: 'table', icon: Table2, label: 'Table' },
  ];

  const copy =
    TRACKER_COPY[activePage.space] ??
    TRACKER_COPY.custom ?? {
      lead: 'Track items with status, priority, and due dates.',
      tasksLabel: 'Items',
      empty: 'No items yet. Add one to get started.',
    };

  if (activePage.isTracker) {
    const isTasks = activePage.space === 'tasks';
    return (
      <div className="workspace space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="shrink-0 rounded-2xl border border-teal-100 bg-teal-50 p-3.5 text-teal-700 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                {SPACE_META[activePage.space].label}
              </div>
              <input
                className="page-title-input mt-0.5 !text-3xl"
                value={activePage.title}
                onChange={(e) =>
                  updatePage(activePage.id, { title: e.target.value })
                }
                aria-label="Page title"
              />
              <p className="mt-1 max-w-xl text-sm text-zinc-500">{copy.lead}</p>
            </div>
          </div>

          {trackerTab === 'tasks' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
                {views.map((v) => (
                  <button
                    key={v.mode}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      activePage.viewMode === v.mode
                        ? 'bg-zinc-900 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                    onClick={() => setViewMode(activePage.id, v.mode)}
                  >
                    <v.icon size={14} aria-hidden />
                    {v.label}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => addItem(activePage.id)}
              >
                Add {isTasks ? 'task' : 'item'}
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              trackerTab === 'tasks'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
            onClick={() => setTrackerTab('tasks')}
          >
            <LayoutList size={14} />
            {copy.tasksLabel}
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              trackerTab === 'notes'
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
            onClick={() => setTrackerTab('notes')}
          >
            <NotebookPen size={14} />
            Notes
          </button>
        </div>

        {trackerTab === 'tasks' ? (
          <section className="space-y-4" aria-label={copy.tasksLabel}>
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={submitQuickAdd}
            >
              <input
                className="min-w-0 flex-1 rounded-xl border border-zinc-950/10 bg-white px-3.5 py-2.5 text-sm"
                placeholder={
                  isTasks
                    ? 'Quick add a task for today…'
                    : 'Quick add an item…'
                }
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={!quickTitle.trim()}>
                Add
              </Button>
            </form>

            {activePage.items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
                <p className="m-0 text-sm text-zinc-500">{copy.empty}</p>
                <Button
                  className="mt-4"
                  size="sm"
                  onClick={() => addItem(activePage.id)}
                >
                  Add {isTasks ? 'task' : 'item'}
                </Button>
              </div>
            ) : (
              <TrackerView page={activePage} />
            )}
          </section>
        ) : (
          <section className="notes-section" aria-label="Notes">
            <NotePad page={activePage} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="workspace">
      <header className="page-header">
        <div className="page-title-row">
          <span className="page-icon-wrap" aria-hidden>
            <PageIcon name={activePage.icon} size={22} />
          </span>
          <div className="page-title-fields">
            <p className="page-space">{SPACE_META[activePage.space].label}</p>
            <input
              className="page-title-input"
              value={activePage.title}
              onChange={(e) =>
                updatePage(activePage.id, { title: e.target.value })
              }
              aria-label="Page title"
            />
          </div>
        </div>
      </header>

      {activePage.space === 'notes' ? (
        <>
          <p className="page-lead">
            Create multiple notes, name them, and write with rich text — size,
            color, style, lists, and images.
          </p>
          <NotePad page={activePage} />
        </>
      ) : (
        <>
          <BlockEditor pageId={activePage.id} blocks={activePage.blocks} />
          {activePage.space === 'habits' && <HabitsPanel />}
        </>
      )}
    </div>
  );
}
