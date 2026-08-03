import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useStore } from '../store';
import type { Page, Priority, Status, TrackerItem } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';
import { Badge, Button } from './ui';

const STATUSES: Status[] = ['backlog', 'todo', 'in_progress', 'done', 'blocked'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

type Draft = {
  title: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  progress: number;
  notes: string;
  tags: string;
};

function toDraft(item: TrackerItem): Draft {
  return {
    title: item.title,
    status: item.status,
    priority: item.priority,
    dueDate: item.dueDate ?? '',
    progress: item.progress,
    notes: item.notes,
    tags: item.tags.join(', '),
  };
}

function priorityVariant(
  priority: Priority,
): 'default' | 'warning' | 'danger' | 'info' | 'brand' {
  if (priority === 'urgent') return 'danger';
  if (priority === 'high') return 'warning';
  if (priority === 'low') return 'default';
  return 'info';
}

function statusVariant(
  status: Status,
): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' {
  if (status === 'done') return 'success';
  if (status === 'blocked') return 'danger';
  if (status === 'in_progress') return 'brand';
  if (status === 'backlog') return 'default';
  return 'info';
}

function ItemRow({
  pageId,
  item,
}: {
  pageId: string;
  item: TrackerItem;
}) {
  const { updateItem, deleteItem } = useStore();
  const isBrandNew =
    item.title === 'New item' ||
    item.title === 'New task' ||
    item.title.trim() === '';
  const [editing, setEditing] = useState(isBrandNew);
  const [draft, setDraft] = useState(() => toDraft(item));

  useEffect(() => {
    if (!editing) setDraft(toDraft(item));
  }, [item, editing]);

  function save() {
    const progress = draft.progress;
    updateItem(pageId, item.id, {
      title: draft.title.trim() || 'Untitled',
      status:
        progress === 100
          ? 'done'
          : draft.status === 'done' && progress < 100
            ? 'in_progress'
            : draft.status,
      priority: draft.priority,
      dueDate: draft.dueDate || undefined,
      progress,
      notes: draft.notes,
      tags: draft.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditing(false);
  }

  function cancel() {
    setDraft(toDraft(item));
    setEditing(false);
  }

  if (!editing) {
    return (
      <article className="item-row">
        <button
          type="button"
          className="item-row-main"
          onClick={() => setEditing(true)}
          aria-label={`Edit ${item.title || 'item'}`}
        >
          <div className="item-row-top">
            <h3 className="item-row-title">{item.title || 'Untitled'}</h3>
            <div className="item-row-badges">
              <Badge variant={statusVariant(item.status)}>
                {STATUS_LABELS[item.status]}
              </Badge>
              <Badge variant={priorityVariant(item.priority)}>
                {PRIORITY_LABELS[item.priority]}
              </Badge>
              {item.dueDate && (
                <span className="item-row-due">{item.dueDate}</span>
              )}
            </div>
          </div>
          <div className="item-row-progress" aria-label={`${item.progress}%`}>
            <span style={{ width: `${item.progress}%` }} />
          </div>
          {(item.notes || item.tags.length > 0) && (
            <div className="item-row-meta">
              {item.notes && (
                <p className="item-row-notes">{item.notes}</p>
              )}
              {item.tags.length > 0 && (
                <div className="item-row-tags">
                  {item.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </button>
        <div className="item-row-actions">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete"
            onClick={() => {
              if (confirm(`Delete “${item.title || 'this item'}”?`)) {
                deleteItem(pageId, item.id);
              }
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </article>
    );
  }

  return (
    <article className="item-card is-editing">
      <div className="item-card-top">
        <input
          className="item-title"
          value={draft.title}
          placeholder="What needs to get done?"
          autoFocus
          aria-label="Item title"
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        />
        <div className="item-edit-actions">
          <Button variant="secondary" size="sm" onClick={cancel}>
            <X size={14} aria-hidden /> Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={save}>
            <Check size={14} aria-hidden /> Save
          </Button>
        </div>
      </div>
      <div className="item-fields">
        <label>
          Status
          <select
            value={draft.status}
            onChange={(e) =>
              setDraft((d) => ({ ...d, status: e.target.value as Status }))
            }
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select
            value={draft.priority}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                priority: e.target.value as Priority,
              }))
            }
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due
          <input
            type="date"
            value={draft.dueDate}
            onChange={(e) =>
              setDraft((d) => ({ ...d, dueDate: e.target.value }))
            }
          />
        </label>
        <label>
          Progress
          <input
            type="range"
            min={0}
            max={100}
            value={draft.progress}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                progress: Number(e.target.value),
              }))
            }
          />
          <span className="progress-val">{draft.progress}%</span>
        </label>
      </div>
      <label className="item-notes">
        Notes
        <textarea
          value={draft.notes}
          rows={2}
          placeholder="Details, links, outcomes…"
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
        />
      </label>
      <label className="item-tags">
        Tags (comma separated)
        <input
          value={draft.tags}
          onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
        />
      </label>
    </article>
  );
}

function BoardView({ page }: { page: Page }) {
  const { updateItem, addItem, deleteItem } = useStore();

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const col = page.items.filter((i) => i.status === status);
        return (
          <section key={status} className="board-col">
            <header>
              <h3>{STATUS_LABELS[status]}</h3>
              <span>{col.length}</span>
            </header>
            <div className="board-cards">
              {col.map((item) => (
                <div key={item.id} className="board-card">
                  <div className="board-card-top">
                    <textarea
                      className="item-title board-title"
                      value={item.title}
                      rows={2}
                      aria-label="Item title"
                      onChange={(e) =>
                        updateItem(page.id, item.id, { title: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn board-delete"
                      aria-label={`Delete ${item.title || 'item'}`}
                      title="Delete item"
                      onClick={() => {
                        if (
                          confirm(`Delete “${item.title || 'this item'}”?`)
                        ) {
                          deleteItem(page.id, item.id);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="board-meta">
                    <span className={`prio prio-${item.priority}`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                    {item.dueDate && <span className="due">{item.dueDate}</span>}
                  </div>
                  <div className="progress-bar" aria-hidden>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                  <label className="board-move">
                    <span>Move</span>
                    <select
                      value={item.status}
                      aria-label={`Move ${item.title}`}
                      onChange={(e) =>
                        updateItem(page.id, item.id, {
                          status: e.target.value as Status,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => addItem(page.id, 'New item')}
            >
              <Plus size={14} /> Add
            </button>
          </section>
        );
      })}
    </div>
  );
}

function TableView({ page }: { page: Page }) {
  const { updateItem, deleteItem, addItem } = useStore();

  return (
    <div className="table-wrap">
      <table className="tracker-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Progress</th>
            <th>Due</th>
            <th>Tags</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {page.items.map((item) => (
            <tr key={item.id}>
              <td>
                <input
                  value={item.title}
                  onChange={(e) =>
                    updateItem(page.id, item.id, { title: e.target.value })
                  }
                />
              </td>
              <td>
                <select
                  value={item.status}
                  onChange={(e) =>
                    updateItem(page.id, item.id, {
                      status: e.target.value as Status,
                    })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  value={item.priority}
                  onChange={(e) =>
                    updateItem(page.id, item.id, {
                      priority: e.target.value as Priority,
                    })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={item.progress}
                  onChange={(e) =>
                    updateItem(page.id, item.id, {
                      progress: Number(e.target.value),
                    })
                  }
                />
              </td>
              <td>
                <input
                  type="date"
                  value={item.dueDate ?? ''}
                  onChange={(e) =>
                    updateItem(page.id, item.id, {
                      dueDate: e.target.value || undefined,
                    })
                  }
                />
              </td>
              <td>
                <input
                  value={item.tags.join(', ')}
                  onChange={(e) =>
                    updateItem(page.id, item.id, {
                      tags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </td>
              <td>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Delete"
                  onClick={() => deleteItem(page.id, item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => addItem(page.id)}
      >
        <Plus size={14} /> Add row
      </button>
    </div>
  );
}

export function TrackerView({ page }: { page: Page }) {
  if (page.viewMode === 'board') return <BoardView page={page} />;
  if (page.viewMode === 'table') return <TableView page={page} />;

  return (
    <div className="list-view">
      <div className="list-items">
        {page.items.map((item) => (
          <ItemRow key={item.id} pageId={page.id} item={item} />
        ))}
      </div>
    </div>
  );
}
