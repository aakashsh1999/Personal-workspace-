import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import type { Page, Priority, Status, TrackerItem } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';

const STATUSES: Status[] = ['backlog', 'todo', 'in_progress', 'done', 'blocked'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

function ItemEditor({
  pageId,
  item,
}: {
  pageId: string;
  item: TrackerItem;
}) {
  const { updateItem, deleteItem } = useStore();

  return (
    <article className="item-card">
      <div className="item-card-top">
        <input
          className="item-title"
          value={item.title}
          placeholder="What needs to get done?"
          onChange={(e) => updateItem(pageId, item.id, { title: e.target.value })}
          aria-label="Item title"
        />
        <button
          type="button"
          className="icon-btn"
          aria-label="Delete item"
          onClick={() => deleteItem(pageId, item.id)}
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="item-fields">
        <label>
          Status
          <select
            value={item.status}
            onChange={(e) =>
              updateItem(pageId, item.id, { status: e.target.value as Status })
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
            value={item.priority}
            onChange={(e) =>
              updateItem(pageId, item.id, { priority: e.target.value as Priority })
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
            value={item.dueDate ?? ''}
            onChange={(e) =>
              updateItem(pageId, item.id, { dueDate: e.target.value || undefined })
            }
          />
        </label>
        <label>
          Progress
          <input
            type="range"
            min={0}
            max={100}
            value={item.progress}
            onChange={(e) =>
              updateItem(pageId, item.id, {
                progress: Number(e.target.value),
                status:
                  Number(e.target.value) === 100
                    ? 'done'
                    : item.status === 'done'
                      ? 'in_progress'
                      : item.status,
              })
            }
          />
          <span className="progress-val">{item.progress}%</span>
        </label>
      </div>
      <label className="item-notes">
        Notes
        <textarea
          value={item.notes}
          rows={2}
          placeholder="Details, links, outcomes…"
          onChange={(e) => updateItem(pageId, item.id, { notes: e.target.value })}
        />
      </label>
      <label className="item-tags">
        Tags (comma separated)
        <input
          value={item.tags.join(', ')}
          onChange={(e) =>
            updateItem(pageId, item.id, {
              tags: e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
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
                          confirm(
                            `Delete “${item.title || 'this item'}”?`,
                          )
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
          <ItemEditor key={item.id} pageId={page.id} item={item} />
        ))}
      </div>
    </div>
  );
}
