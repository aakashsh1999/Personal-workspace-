import { useEffect, useState } from 'react';
import { Columns3, LayoutList, NotebookPen, Table2 } from 'lucide-react';
import { useStore } from '../store';
import type { SpaceKind, ViewMode } from '../types';
import { SPACE_META } from '../types';
import { BlockEditor } from './BlockEditor';
import { Dashboard } from './Dashboard';
import { FinanceEmbed } from './FinanceEmbed';
import { FreelancePanel } from './FreelancePanel';
import { GoalsPanel } from './GoalsPanel';
import { HabitsPanel } from './HabitsPanel';
import { NotePad } from './NotePad';
import { PageIcon } from './icons';
import { TrackerView } from './TrackerView';

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

  useEffect(() => {
    setTrackerTab('tasks');
  }, [activePage?.id]);

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
        <header className="page-header">
          <div className="page-title-row">
            <span className="page-icon-wrap" aria-hidden>
              <PageIcon name={activePage.icon} size={24} />
            </span>
            <div className="page-title-fields">
              <p className="page-space">Side Project</p>
              <input
                className="page-title-input"
                value={
                  activePage.title === 'Freelance'
                    ? 'Side Project'
                    : activePage.title
                }
                onChange={(e) =>
                  updatePage(activePage.id, { title: e.target.value })
                }
                aria-label="Page title"
              />
            </div>
          </div>
        </header>
        <p className="page-lead">
          Manage clients, side projects, and payments in one window.
        </p>
        <FreelancePanel pageId={activePage.id} />
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
        <header className="page-header">
          <div className="page-title-row">
            <span className="page-icon-wrap" aria-hidden>
              <PageIcon name={activePage.icon} size={24} />
            </span>
            <div className="page-title-fields">
              <p className="page-space">Goals</p>
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
        <p className="page-lead">
          Track life goals — house, car, marriage, travel, and more — with
          amounts, timelines, and progress.
        </p>
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

          {trackerTab === 'tasks' && (
            <div className="page-toolbar">
              <div className="view-switch" role="group" aria-label="View mode">
                {views.map((v) => (
                  <button
                    key={v.mode}
                    type="button"
                    className={activePage.viewMode === v.mode ? 'is-active' : ''}
                    onClick={() => setViewMode(activePage.id, v.mode)}
                  >
                    <v.icon size={15} aria-hidden />
                    {v.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => addItem(activePage.id)}
              >
                Add {copy.tasksLabel === 'Tasks' ? 'task' : 'item'}
              </button>
            </div>
          )}
        </header>

        <p className="page-lead">{copy.lead}</p>

        <div
          className="tracker-tabs freelance-tabs"
          role="tablist"
          aria-label="Page sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={trackerTab === 'tasks'}
            className={trackerTab === 'tasks' ? 'is-active' : ''}
            onClick={() => setTrackerTab('tasks')}
          >
            <LayoutList size={15} aria-hidden />
            {copy.tasksLabel}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={trackerTab === 'notes'}
            className={trackerTab === 'notes' ? 'is-active' : ''}
            onClick={() => setTrackerTab('notes')}
          >
            <NotebookPen size={15} aria-hidden />
            Notes
          </button>
        </div>

        {trackerTab === 'tasks' ? (
          <section className="tracker-section" aria-label={copy.tasksLabel}>
            {activePage.items.length === 0 ? (
              <div className="tracker-empty">
                <p>{copy.empty}</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => addItem(activePage.id)}
                >
                  Add {copy.tasksLabel === 'Tasks' ? 'task' : 'item'}
                </button>
              </div>
            ) : (
              <TrackerView page={activePage} />
            )}
          </section>
        ) : (
          <section className="notes-section" aria-label="Notes">
            <div className="tracker-head">
              <h2>Notes</h2>
              <p>
                Rich notepad — size, color, style, lists, and images. Not your
                task list.
              </p>
            </div>
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
            Rich notepad — change text size, color, and style. Paste or drop
            images anywhere.
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
