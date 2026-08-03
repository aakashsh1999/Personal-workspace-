import { format } from 'date-fns';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  Rocket,
  Target,
  Wallet,
} from 'lucide-react';

import { useMemo, type CSSProperties } from 'react';
import { useStore } from '../store';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';

export function Dashboard() {
  const { state, setActivePageId, toggleHabitToday } = useStore();
  const today = format(new Date(), 'EEEE, MMMM d');

  const stats = useMemo(() => {
    const items = state.pages.flatMap((p) =>
      p.items.map((i) => ({ ...i, pageId: p.id, pageTitle: p.title })),
    );
    const open = items.filter((i) => i.status !== 'done');
    const dueToday = open.filter((i) => i.dueDate === new Date().toISOString().slice(0, 10));
    const learning = open.filter((i) =>
      state.pages.find((p) => p.id === i.pageId)?.space === 'learning',
    );
    const career = open.filter((i) =>
      state.pages.find((p) => p.id === i.pageId)?.space === 'career',
    );
    const done = items.filter((i) => i.status === 'done').length;
    const habitDone = state.habits.filter((h) =>
      h.days.some(
        (d) => d.date === new Date().toISOString().slice(0, 10) && d.done,
      ),
    ).length;
    const pendingPay = (state.payments ?? [])
      .filter((p) => p.status === 'sent' || p.status === 'overdue' || p.status === 'draft')
      .reduce((sum, p) => sum + p.amount, 0);
    const overduePay = (state.payments ?? []).filter((p) => p.status === 'overdue').length;
    return {
      open: open.length,
      dueToday,
      learning,
      career,
      done,
      habitDone,
      habitTotal: state.habits.length,
      pendingPay,
      overduePay,
      focus: open
        .filter((i) => i.priority === 'urgent' || i.priority === 'high')
        .slice(0, 6),
    };
  }, [state.pages, state.habits, state.payments]);

  const shortcuts = [
    { id: 'page-tasks', label: 'Tasks', icon: CheckCircle2, hint: 'Daily execution' },
    { id: 'page-learning', label: 'Learning', icon: BookOpen, hint: 'Skills & study' },
    { id: 'page-career', label: 'Career', icon: Rocket, hint: 'Growth path' },
    { id: 'page-office', label: 'Office', icon: Briefcase, hint: 'Work projects' },
    { id: 'page-freelance', label: 'Side Project', icon: Wallet, hint: 'Clients & payments' },
    { id: 'page-finance', label: 'Finances', icon: CircleDollarSign, hint: 'Expenses & EMIs' },
    { id: 'page-goals', label: 'Goals', icon: Target, hint: 'Life milestones' },
  ];

  return (
    <div className="dashboard">
      <header className="dash-hero">
        <p className="dash-kicker">{today}</p>
        <h1 className="dash-title">Orbit</h1>
        <p className="dash-lead">
          Tasks, learning, career, office, side projects, finances, and life goals — all in one place.
        </p>
      </header>

      <section className="stat-row" aria-label="Overview">
        <div className="stat">
          <span className="stat-value">{stats.open}</span>
          <span className="stat-label">Open items</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats.dueToday.length}</span>
          <span className="stat-label">Due today</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.pendingPay > 0
              ? new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(stats.pendingPay)
              : '₹0'}
          </span>
          <span className="stat-label">
            Payments pending{stats.overduePay ? ` · ${stats.overduePay} overdue` : ''}
          </span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {stats.habitDone}/{stats.habitTotal}
          </span>
          <span className="stat-label">Habits today</span>
        </div>
      </section>

      <section className="shortcut-row" aria-label="Spaces">
        {shortcuts.map((s) => (
          <button
            key={s.id}
            type="button"
            className="shortcut"
            onClick={() => setActivePageId(s.id)}
          >
            <s.icon size={18} aria-hidden />
            <div>
              <div className="shortcut-label">{s.label}</div>
              <div className="shortcut-hint">{s.hint}</div>
            </div>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden />
          </button>
        ))}
      </section>

      <div className="dash-grid">
        <section className="panel">
          <div className="panel-head">
            <Target size={16} aria-hidden />
            <h2>Focus now</h2>
          </div>
          {stats.focus.length === 0 ? (
            <p className="empty">No high-priority open items. Nice calm day.</p>
          ) : (
            <ul className="focus-list">
              {stats.focus.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="focus-item"
                    onClick={() => setActivePageId(item.pageId)}
                  >
                    <span className={`prio prio-${item.priority}`}>
                      {PRIORITY_LABELS[item.priority]}
                    </span>
                    <span className="focus-title">{item.title}</span>
                    <span className="focus-meta">
                      {STATUS_LABELS[item.status]} · {item.pageTitle}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <Flame size={16} aria-hidden />
            <h2>Today’s habits</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm ml-auto"
              onClick={() => setActivePageId('page-habits')}
            >
              Open
            </button>
          </div>
          <ul className="habit-quick">
            {state.habits.map((h) => {
              const done = h.days.some(
                (d) =>
                  d.date === new Date().toISOString().slice(0, 10) && d.done,
              );
              return (
                <li key={h.id}>
                  <button
                    type="button"
                    className={`habit-chip ${done ? 'is-done' : ''}`}
                    onClick={() => toggleHabitToday(h.id)}
                    style={{ '--habit': h.color } as CSSProperties}
                  >
                    <span className="habit-dot" />
                    {h.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <BookOpen size={16} aria-hidden />
            <h2>Learning & career in flight</h2>
          </div>
          <div className="split-lists">
            <div>
              <h3>Learning</h3>
              {stats.learning.length === 0 ? (
                <p className="empty">Nothing open — add a study item.</p>
              ) : (
                <ul>
                  {stats.learning.slice(0, 4).map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => setActivePageId(i.pageId)}>
                        {i.title}
                        <span>{i.progress}%</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Career</h3>
              {stats.career.length === 0 ? (
                <p className="empty">No open career items.</p>
              ) : (
                <ul>
                  {stats.career.slice(0, 4).map((i) => (
                    <li key={i.id}>
                      <button type="button" onClick={() => setActivePageId(i.pageId)}>
                        {i.title}
                        <span>{STATUS_LABELS[i.status]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
