import { Columns3, LayoutList, Table2 } from 'lucide-react';
import { useStore } from '../store';
import type { ViewMode } from '../types';
import { SPACE_META } from '../types';
import { BlockEditor } from './BlockEditor';
import { Dashboard } from './Dashboard';
import { FreelancePanel } from './FreelancePanel';
import { GoalsPanel } from './GoalsPanel';
import { HabitsPanel } from './HabitsPanel';
import { PageIcon } from './icons';
import { TrackerView } from './TrackerView';

export function PageWorkspace() {
  const { activePage, updatePage, setViewMode, addItem } = useStore();

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
              onChange={(e) => updatePage(activePage.id, { title: e.target.value })}
              aria-label="Page title"
            />
          </div>
        </div>

        {activePage.isTracker && (
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
              Add item
            </button>
          </div>
        )}
      </header>

      <BlockEditor pageId={activePage.id} blocks={activePage.blocks} />

      {activePage.space === 'habits' && <HabitsPanel />}

      {activePage.isTracker && (
        <section className="tracker-section">
          <div className="tracker-head">
            <h2>Tracker</h2>
            <p>Status, priority, progress, due dates, and tags.</p>
          </div>
          <TrackerView page={activePage} />
        </section>
      )}
    </div>
  );
}
