import { useMemo, useState, type FormEvent } from 'react'
import {
  Plus,
  Target,
  Trash2,
} from 'lucide-react'
import { formatCurrency } from '../lib/money'
import { useStore } from '../store'
import type { Goal, GoalCategory, GoalStatus, Priority } from '../types'
import {
  GOAL_CATEGORY_LABELS,
  GOAL_STATUS_LABELS,
  PRIORITY_LABELS,
} from '../types'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from './catalyst'
import { Button } from './ui'

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
]

const STATUSES: GoalStatus[] = [
  'planning',
  'in_progress',
  'on_track',
  'at_risk',
  'paused',
  'achieved',
  'cancelled',
]

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

const FILTERS = [
  'active',
  'all',
  'achieved',
  'planning',
  'at_risk',
] as const

type Filter = (typeof FILTERS)[number]

function moneyProgress(saved: number, target: number) {
  if (!target || target <= 0) return 0
  return Math.min(100, Math.round((saved / target) * 100))
}

function categoryBadge(cat: GoalCategory) {
  const map: Record<GoalCategory, string> = {
    vehicle: 'bg-blue-50 text-blue-800 border-blue-200',
    home: 'bg-amber-50 text-amber-800 border-amber-200',
    family: 'bg-rose-50 text-rose-800 border-rose-200',
    financial: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    career: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    education: 'bg-violet-50 text-violet-800 border-violet-200',
    travel: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    health: 'bg-teal-50 text-teal-800 border-teal-200',
    personal: 'bg-zinc-50 text-zinc-800 border-zinc-200',
    other: 'bg-zinc-50 text-zinc-800 border-zinc-200',
  }
  return map[cat]
}

export function GoalsPanel() {
  const { state, addGoal, updateGoal, deleteGoal } = useStore()
  const [filter, setFilter] = useState<Filter>('active')
  const [editing, setEditing] = useState<Goal | null | 'new'>(null)
  const [depositId, setDepositId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  const goals = state.goals ?? []

  const summary = useMemo(() => {
    const open = goals.filter(
      (g) => g.status !== 'achieved' && g.status !== 'cancelled',
    )
    const achieved = goals.filter((g) => g.status === 'achieved').length
    const target = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0)
    const saved = goals.reduce((sum, g) => sum + (g.savedAmount || 0), 0)
    const avg =
      goals.length === 0
        ? 0
        : Math.round(
            goals.reduce((sum, g) => {
              const fromMoney = moneyProgress(g.savedAmount, g.targetAmount)
              return sum + (g.targetAmount > 0 ? fromMoney : g.progress)
            }, 0) / goals.length,
          )
    return { open: open.length, achieved, target, saved, avg }
  }, [goals])

  const visible = useMemo(() => {
    if (filter === 'all') return goals
    if (filter === 'active') {
      return goals.filter(
        (g) => g.status !== 'achieved' && g.status !== 'cancelled',
      )
    }
    if (filter === 'achieved') return goals.filter((g) => g.status === 'achieved')
    if (filter === 'planning') return goals.filter((g) => g.status === 'planning')
    return goals.filter((g) => g.status === 'at_risk')
  }, [goals, filter])

  function applyDeposit(goalId: string) {
    const amt = parseFloat(depositAmount)
    if (Number.isNaN(amt) || amt <= 0) return
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return
    const savedAmount = Math.max(0, (goal.savedAmount || 0) + amt)
    const progress = moneyProgress(savedAmount, goal.targetAmount)
    const patch: Partial<Goal> = {
      savedAmount,
      progress,
    }
    if (goal.targetAmount > 0 && savedAmount >= goal.targetAmount) {
      patch.status = 'achieved'
      patch.achievedDate = new Date().toISOString().slice(0, 10)
      patch.progress = 100
    } else if (goal.status === 'achieved' && savedAmount < goal.targetAmount) {
      patch.status = 'in_progress'
      patch.achievedDate = undefined
    }
    updateGoal(goalId, patch)
    setDepositId(null)
    setDepositAmount('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-2xl border border-teal-100 bg-teal-50 p-3.5 text-teal-700 shadow-sm">
          <Target size={28} />
        </div>
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
            Goals
          </div>
          <h2 className="m-0 text-3xl font-extrabold tracking-tight text-zinc-950">
            Life Goals
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Track life goals — house, car, marriage, travel, and more — with
            amounts, timelines, and savings deposits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: 'Active goals', value: String(summary.open) },
          { label: 'Target amount', value: formatCurrency(summary.target) },
          { label: 'Saved so far', value: formatCurrency(summary.saved) },
          { label: 'Avg progress', value: `${summary.avg}%` },
          { label: 'Achieved', value: String(summary.achieved) },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-zinc-950/10 bg-white p-4 shadow-sm"
          >
            <div className="text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
              {card.value}
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-500">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
          {FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                filter === st
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus size={14} /> Add goal
        </Button>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <Target className="mx-auto mb-3 text-zinc-400" size={28} />
          <p className="m-0 text-sm text-zinc-500">No goals in this filter.</p>
          <Button className="mt-4" size="sm" onClick={() => setEditing('new')}>
            <Plus size={14} /> Add goal
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? moneyProgress(goal.savedAmount, goal.targetAmount)
                : goal.progress
            return (
              <article
                key={goal.id}
                className="rounded-2xl border border-zinc-950/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="m-0 text-base font-semibold text-zinc-950">
                      {goal.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${categoryBadge(goal.category)}`}
                      >
                        {GOAL_CATEGORY_LABELS[goal.category]}
                      </span>
                      <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {GOAL_STATUS_LABELS[goal.status]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-extrabold text-zinc-950">
                      {pct}%
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-zinc-500">
                    <span>
                      {formatCurrency(goal.savedAmount, goal.currency)} saved
                    </span>
                    <span>
                      of {formatCurrency(goal.targetAmount, goal.currency)}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 100 ? 'bg-emerald-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {goal.targetDate && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Target {goal.targetDate}
                  </p>
                )}

                {depositId === goal.id ? (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      applyDeposit(goal.id)
                    }}
                  >
                    <input
                      type="number"
                      min={1}
                      className="min-w-0 flex-1 rounded-xl border border-zinc-950/10 px-3 py-2 text-sm"
                      placeholder="Deposit amount"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      autoFocus
                    />
                    <Button type="submit" size="sm">
                      Add
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDepositId(null)
                        setDepositAmount('')
                      }}
                    >
                      Cancel
                    </Button>
                  </form>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setDepositId(goal.id)
                        setDepositAmount('')
                      }}
                    >
                      <Plus size={13} /> Add savings
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(goal)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        if (confirm(`Delete “${goal.title}”?`))
                          deleteGoal(goal.id)
                      }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {editing !== null && (
        <GoalModal
          goal={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') addGoal(data)
            else updateGoal(editing.id, data)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function GoalModal({
  goal,
  onClose,
  onSave,
}: {
  goal?: Goal
  onClose: () => void
  onSave: (data: Partial<Goal>) => void
}) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [category, setCategory] = useState<GoalCategory>(
    goal?.category ?? 'home',
  )
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'planning')
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? 'medium')
  const [targetAmount, setTargetAmount] = useState(
    String(goal?.targetAmount ?? 0),
  )
  const [savedAmount, setSavedAmount] = useState(String(goal?.savedAmount ?? 0))
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [why, setWhy] = useState(goal?.why ?? '')
  const [notes, setNotes] = useState(goal?.notes ?? '')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const target = Number(targetAmount) || 0
    const saved = Number(savedAmount) || 0
    const progress = moneyProgress(saved, target)
    onSave({
      title: title.trim(),
      category,
      status:
        target > 0 && saved >= target ? 'achieved' : status,
      priority,
      targetAmount: target,
      savedAmount: saved,
      targetDate: targetDate || undefined,
      progress: target > 0 && saved >= target ? 100 : progress,
      why: why.trim(),
      notes: notes.trim(),
      achievedDate:
        target > 0 && saved >= target
          ? goal?.achievedDate ?? new Date().toISOString().slice(0, 10)
          : goal?.achievedDate,
    })
  }

  return (
    <Dialog open onClose={onClose} size="lg">
      <DialogTitle>{goal ? 'Edit goal' : 'New goal'}</DialogTitle>
      <DialogBody>
        <form id="goal-form" className="space-y-3" onSubmit={submit}>
          <label className="block text-sm font-medium text-zinc-700">
            Title
            <input
              className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium text-zinc-700">
              Category
              <select
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value as GoalCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {GOAL_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Status
              <select
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as GoalStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {GOAL_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Priority
              <select
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Target date
              <input
                type="date"
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Target amount
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Saved amount
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
                value={savedAmount}
                onChange={(e) => setSavedAmount(e.target.value)}
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-zinc-700">
            Why it matters
            <textarea
              className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Notes / plan
            <textarea
              className="mt-1.5 w-full rounded-xl border border-zinc-950/10 px-3 py-2.5 text-sm"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </form>
      </DialogBody>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="goal-form">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
