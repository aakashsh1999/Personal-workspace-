import { useMemo, useState } from 'react'
import {
  CheckSquare,
  Clock,
  FolderKanban,
  Plus,
  Search,
  Square,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  getProjectFinancialSummary,
} from '../../lib/money'
import type { Client, Project, ProjectStatus } from '../../types'
import { PROJECT_STATUS_LABELS } from '../../types'
import { Button } from '../ui'

const STATUSES: Array<ProjectStatus | 'all'> = [
  'all',
  'planning',
  'in_progress',
  'completed',
  'on_hold',
]

export function ProjectsView({
  projects,
  clients,
  payments,
  onAdd,
  onEdit,
  onDelete,
  onAddPayment,
  onToggleDeliverable,
}: {
  projects: Project[]
  clients: Client[]
  payments: Parameters<typeof getProjectFinancialSummary>[1]
  onAdd: () => void
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
  onAddPayment: (project: Project) => void
  onToggleDeliverable: (projectId: string, deliverableId: string) => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const client = clients.find((c) => c.id === p.clientId)?.name ?? ''
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q) ||
        client.toLowerCase().includes(q)
      )
    })
  }, [projects, clients, search, status])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <input
            className="w-full rounded-xl border border-zinc-950/10 bg-white py-2.5 pr-3 pl-9 text-sm"
            placeholder="Search projects or clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold capitalize ${
                  status === s
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {s === 'all' ? 'All' : PROJECT_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={onAdd}>
            <Plus size={14} /> Project
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <FolderKanban className="mx-auto mb-3 text-zinc-400" size={28} />
          <p className="m-0 text-sm text-zinc-500">No projects yet.</p>
          <Button className="mt-4" size="sm" onClick={onAdd}>
            <Plus size={14} /> Add project
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((project) => {
            const client = clients.find((c) => c.id === project.clientId)
            const summary = getProjectFinancialSummary(project, payments)
            const done = (project.deliverables ?? []).filter((d) => d.completed)
              .length
            const total = (project.deliverables ?? []).length
            return (
              <article
                key={project.id}
                className="rounded-2xl border border-zinc-950/10 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="m-0 truncate text-base font-semibold text-zinc-950">
                      {project.title}
                    </h3>
                    <p className="m-0 mt-1 flex items-center gap-1 text-xs text-zinc-500">
                      <User size={12} /> {client?.name || 'No client'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800">
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>

                {project.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
                    {project.description}
                  </p>
                )}

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {formatCurrency(summary.totalPaid, project.currency)} /{' '}
                      {formatCurrency(project.budget, project.currency)}
                    </span>
                    <span>{summary.paidPct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-teal-600"
                      style={{ width: `${summary.paidPct}%` }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-zinc-500">
                    <span>Advance pending {formatCurrency(summary.pendingAdvance)}</span>
                    <span>Due {formatCurrency(summary.pendingBalance)}</span>
                    {project.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {formatDate(project.deadline)}
                      </span>
                    )}
                  </div>
                </div>

                {total > 0 && (
                  <ul className="mt-3 space-y-1.5 border-t border-zinc-100 pt-3">
                    {(project.deliverables ?? []).slice(0, 5).map((d) => (
                      <li key={d.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 text-left text-sm text-zinc-700"
                          onClick={() => onToggleDeliverable(project.id, d.id)}
                        >
                          {d.completed ? (
                            <CheckSquare size={14} className="text-teal-600" />
                          ) : (
                            <Square size={14} className="text-zinc-400" />
                          )}
                          <span
                            className={
                              d.completed ? 'text-zinc-400 line-through' : ''
                            }
                          >
                            {d.title}
                          </span>
                        </button>
                      </li>
                    ))}
                    <li className="text-[11px] text-zinc-400">
                      {done}/{total} deliverables
                    </li>
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onAddPayment(project)}
                  >
                    <Wallet size={13} /> Payment
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(project)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete “${project.title}”?`)) onDelete(project.id)
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
