import { useMemo, useState } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import { useStore } from '../store';
import type { GoalCategory, GoalStatus, Priority } from '../types';
import {
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  PRIORITY_LABELS,
} from '../types';

const CATEGORIES: GoalCategory[] = [
  'vehicle',
  'home',
  'family',
  'financial',
  'career',
  'education',
  'travel',
  'health',
  'personal',
  'other',
];

const STATUSES: GoalStatus[] = [
  'planning',
  'in_progress',
  'on_track',
  'at_risk',
  'paused',
  'achieved',
  'cancelled',
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

function money(amount: number, currency = 'INR') {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function moneyProgress(saved: number, target: number) {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((saved / target) * 100));
}

export function GoalsPanel() {
  const { state, addGoal, updateGoal, deleteGoal } = useStore();
  const [filter, setFilter] = useState<'all' | GoalStatus | 'active'>('active');

  const goals = state.goals ?? [];

  const summary = useMemo(() => {
    const open = goals.filter(
      (g) => g.status !== 'achieved' && g.status !== 'cancelled',
    );
    const achieved = goals.filter((g) => g.status === 'achieved').length;
    const target = open.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
    const saved = open.reduce((sum, g) => sum + (g.savedAmount || 0), 0);
    const avg =
      open.length === 0
        ? 0
        : Math.round(
            open.reduce((sum, g) => {
              const fromMoney = moneyProgress(g.savedAmount, g.targetAmount);
              return sum + (g.targetAmount > 0 ? fromMoney : g.progress);
            }, 0) / open.length,
          );
    return { open: open.length, achieved, target, saved, avg };
  }, [goals]);

  const visible = useMemo(() => {
    if (filter === 'all') return goals;
    if (filter === 'active') {
      return goals.filter(
        (g) => g.status !== 'achieved' && g.status !== 'cancelled',
      );
    }
    return goals.filter((g) => g.status === filter);
  }, [goals, filter]);

  return (
    <div className="goals-panel freelance-panel">
      <section className="stat-row freelance-stats" aria-label="Goals overview">
        <div className="stat">
          <span className="stat-value">{summary.open}</span>
          <span className="stat-label">Active goals</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.target)}</span>
          <span className="stat-label">Target amount</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.saved)}</span>
          <span className="stat-label">Saved so far</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.avg}%</span>
          <span className="stat-label">Avg progress</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.achieved}</span>
          <span className="stat-label">Achieved</span>
        </div>
      </section>

      <section className="freelance-section" aria-label="Life goals">
        <div className="freelance-section-head">
          <h2>
            <Target size={18} aria-hidden /> Goals
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => addGoal()}
          >
            <Plus size={16} aria-hidden /> Add goal
          </button>
        </div>

        <div className="pay-type-filter" role="group" aria-label="Filter goals">
          {(
            [
              ['active', 'Active'],
              ['all', 'All'],
              ['achieved', 'Achieved'],
              ['planning', 'Planning'],
              ['at_risk', 'At risk'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={filter === id ? 'is-active' : ''}
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="list-items">
          {visible.map((goal) => {
            const funded = moneyProgress(goal.savedAmount, goal.targetAmount);
            const shownProgress =
              goal.targetAmount > 0 ? funded : goal.progress;
            return (
              <article key={goal.id} className="item-card goal-card">
                <div className="item-card-top">
                  <input
                    className="item-title"
                    value={goal.title}
                    aria-label="Goal name"
                    placeholder="e.g. Buy a car, Marriage, House…"
                    onChange={(e) =>
                      updateGoal(goal.id, { title: e.target.value })
                    }
                  />
                  <span className={`goal-status-badge status-${goal.status}`}>
                    {GOAL_STATUS_LABELS[goal.status]}
                  </span>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete ${goal.title || 'goal'}`}
                    onClick={() => {
                      if (
                        confirm(
                          `Delete “${goal.title || 'this goal'}”?`,
                        )
                      ) {
                        deleteGoal(goal.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="item-fields freelance-project-fields goal-fields">
                  <label>
                    Category
                    <select
                      value={goal.category}
                      aria-label="Goal category"
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          category: e.target.value as GoalCategory,
                        })
                      }
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {GOAL_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Status
                    <select
                      value={goal.status}
                      aria-label="Goal status"
                      onChange={(e) => {
                        const status = e.target.value as GoalStatus;
                        updateGoal(goal.id, {
                          status,
                          achievedDate:
                            status === 'achieved'
                              ? goal.achievedDate ||
                                new Date().toISOString().slice(0, 10)
                              : goal.achievedDate,
                          progress:
                            status === 'achieved' ? 100 : goal.progress,
                        });
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {GOAL_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Priority
                    <select
                      value={goal.priority}
                      aria-label="Priority"
                      onChange={(e) =>
                        updateGoal(goal.id, {
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
                  </label>
                  <label>
                    Target amount
                    <input
                      type="number"
                      min={0}
                      value={goal.targetAmount}
                      aria-label="Target amount"
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          targetAmount: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <label>
                    Saved / invested
                    <input
                      type="number"
                      min={0}
                      value={goal.savedAmount}
                      aria-label="Saved amount"
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          savedAmount: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </label>
                  <label>
                    Start date
                    <input
                      type="date"
                      value={goal.startDate ?? ''}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          startDate: e.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Complete by
                    <input
                      type="date"
                      value={goal.targetDate ?? ''}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          targetDate: e.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Achieved on
                    <input
                      type="date"
                      value={goal.achievedDate ?? ''}
                      onChange={(e) =>
                        updateGoal(goal.id, {
                          achievedDate: e.target.value || undefined,
                        })
                      }
                    />
                  </label>
                  <label>
                    Progress
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={shownProgress}
                      aria-label="Progress"
                      onChange={(e) => {
                        const progress = Number(e.target.value);
                        if (goal.targetAmount > 0) {
                          updateGoal(goal.id, {
                            progress,
                            savedAmount: Math.round(
                              (progress / 100) * goal.targetAmount,
                            ),
                          });
                        } else {
                          updateGoal(goal.id, { progress });
                        }
                      }}
                    />
                    <span className="progress-val">{shownProgress}%</span>
                  </label>
                </div>

                {goal.targetAmount > 0 && (
                  <div className="goal-money-bar" aria-hidden>
                    <div
                      className="goal-money-fill"
                      style={{ width: `${funded}%` }}
                    />
                    <span>
                      {money(goal.savedAmount, goal.currency)} of{' '}
                      {money(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                )}

                <label className="item-notes">
                  Why this goal
                  <textarea
                    rows={2}
                    value={goal.why}
                    onChange={(e) =>
                      updateGoal(goal.id, { why: e.target.value })
                    }
                    placeholder="What does this mean for you? Why does it matter?"
                  />
                </label>
                <label className="item-notes">
                  Notes / next steps
                  <textarea
                    rows={2}
                    value={goal.notes}
                    onChange={(e) =>
                      updateGoal(goal.id, { notes: e.target.value })
                    }
                    placeholder="Milestones, research, EMIs, documents…"
                  />
                </label>
              </article>
            );
          })}
          {visible.length === 0 && (
            <p className="empty">
              {goals.length === 0
                ? 'No goals yet. Add something you want to work toward — a car, marriage, house, trip, or anything else.'
                : 'No goals in this filter.'}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
