import { format } from 'date-fns';
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  ListTodo,
  Rocket,
  Target,
  Wallet,
} from 'lucide-react';
import { useMemo, type CSSProperties } from 'react';
import { useStore } from '../store';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';
import { Heading, Text } from './catalyst';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatCard,
} from './ui';

export function Dashboard() {
  const { state, setActivePageId, toggleHabitToday } = useStore();
  const today = format(new Date(), 'EEEE, MMMM d');

  const stats = useMemo(() => {
    const items = state.pages.flatMap((p) =>
      p.items.map((i) => ({ ...i, pageId: p.id, pageTitle: p.title })),
    );
    const open = items.filter((i) => i.status !== 'done');
    const dueToday = open.filter(
      (i) => i.dueDate === new Date().toISOString().slice(0, 10),
    );
    const learning = open.filter(
      (i) =>
        state.pages.find((p) => p.id === i.pageId)?.space === 'learning',
    );
    const career = open.filter(
      (i) => state.pages.find((p) => p.id === i.pageId)?.space === 'career',
    );
    const habitDone = state.habits.filter((h) =>
      h.days.some(
        (d) => d.date === new Date().toISOString().slice(0, 10) && d.done,
      ),
    ).length;
    const pendingPay = (state.payments ?? [])
      .filter(
        (p) =>
          p.status === 'sent' || p.status === 'overdue' || p.status === 'draft',
      )
      .reduce((sum, p) => sum + p.amount, 0);
    const overduePay = (state.payments ?? []).filter(
      (p) => p.status === 'overdue',
    ).length;
    return {
      open: open.length,
      dueToday,
      learning,
      career,
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

  const money =
    stats.pendingPay > 0
      ? new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(stats.pendingPay)
      : '₹0';

  return (
    <div className="dashboard mx-auto max-w-5xl">
      <header className="dash-hero mb-4">
        <Text className="!text-xs !font-semibold tracking-wide text-zinc-500">
          {today}
        </Text>
        <Heading className="mt-1 !text-[clamp(1.8rem,4vw,2.4rem)] !text-zinc-950 font-[family-name:var(--font-display)] dark:!text-zinc-950">
          Orbit
        </Heading>
        <Text className="mt-1.5 max-w-lg">
          Tasks, learning, career, projects, money, and goals — one workspace.
        </Text>
      </header>

      <section
        className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4"
        aria-label="Overview"
      >
        <StatCard
          label="Open items"
          value={stats.open}
          icon={<ListTodo size={16} aria-hidden />}
        />
        <StatCard
          label="Due today"
          value={stats.dueToday.length}
          icon={<CheckCircle2 size={16} aria-hidden />}
        />
        <StatCard
          label="Payments pending"
          value={money}
          hint={
            stats.overduePay
              ? `${stats.overduePay} overdue`
              : 'Advances & dues'
          }
          icon={<Wallet size={16} aria-hidden />}
        />
        <StatCard
          label="Habits today"
          value={`${stats.habitDone}/${stats.habitTotal}`}
          icon={<Flame size={16} aria-hidden />}
        />
      </section>

      <section
        className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4"
        aria-label="Spaces"
      >
        {shortcuts.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActivePageId(s.id)}
            className="group flex items-center gap-2.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left shadow-[var(--shadow-sm)] transition hover:border-[#cbd5e1] hover:shadow-[var(--shadow)]"
          >
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)]">
              <s.icon size={15} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--ink)]">
                {s.label}
              </span>
              <span className="block truncate text-xs text-[var(--muted)]">
                {s.hint}
              </span>
            </span>
            <ArrowRight
              size={14}
              className="text-[var(--muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--teal)]"
              aria-hidden
            />
          </button>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-[var(--teal)]" aria-hidden />
              <CardTitle>Focus now</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {stats.focus.length === 0 ? (
              <p className="empty m-0">No high-priority open items. Nice calm day.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {stats.focus.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-1 rounded-xl border border-transparent bg-[var(--surface-solid)] px-3 py-2.5 text-left transition hover:border-[var(--line)] hover:bg-white"
                      onClick={() => setActivePageId(item.pageId)}
                    >
                      <span className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.priority === 'urgent' ? 'danger' : 'warning'
                          }
                        >
                          {PRIORITY_LABELS[item.priority]}
                        </Badge>
                        <span className="truncate font-semibold text-[var(--ink)]">
                          {item.title}
                        </span>
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {STATUS_LABELS[item.status]} · {item.pageTitle}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex w-full items-center gap-2">
              <Flame size={16} className="text-[var(--amber)]" aria-hidden />
              <CardTitle>Today’s habits</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setActivePageId('page-habits')}
              >
                Open
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {state.habits.length === 0 ? (
              <p className="empty m-0">No habits yet — add some in Habits.</p>
            ) : (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {state.habits.map((h) => {
                  const done = h.days.some(
                    (d) =>
                      d.date === new Date().toISOString().slice(0, 10) &&
                      d.done,
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
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[var(--sky)]" aria-hidden />
              <CardTitle>Learning & career in flight</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="m-0 mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Learning
                </h3>
                {stats.learning.length === 0 ? (
                  <p className="empty m-0">Nothing open — add a study item.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {stats.learning.slice(0, 4).map((i) => (
                      <li key={i.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--surface-solid)]"
                          onClick={() => setActivePageId(i.pageId)}
                        >
                          <span className="truncate font-medium">{i.title}</span>
                          <Badge variant="info">{i.progress}%</Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="m-0 mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--muted)]">
                  Career
                </h3>
                {stats.career.length === 0 ? (
                  <p className="empty m-0">No open career items.</p>
                ) : (
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {stats.career.slice(0, 4).map((i) => (
                      <li key={i.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-[var(--surface-solid)]"
                          onClick={() => setActivePageId(i.pageId)}
                        >
                          <span className="truncate font-medium">{i.title}</span>
                          <Badge variant="brand">
                            {STATUS_LABELS[i.status]}
                          </Badge>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
