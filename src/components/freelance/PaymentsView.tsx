import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Plus,
  Search,
  Trash2,
  Wallet,
} from 'lucide-react'
import { formatCurrency, formatDate, isOverdue } from '../../lib/money'
import type { Client, Payment, PaymentType, Project } from '../../types'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from '../../types'
import { Badge, Button } from '../ui'

export type PaymentSubFilter = 'all' | PaymentType

export function PaymentsView({
  payments,
  projects,
  clients,
  subFilter,
  onSubFilterChange,
  onAdd,
  onEdit,
  onDelete,
  onMarkPaid,
  onViewReceipt,
}: {
  payments: Payment[]
  projects: Project[]
  clients: Client[]
  subFilter: PaymentSubFilter
  onSubFilterChange: (f: PaymentSubFilter) => void
  onAdd: () => void
  onEdit: (payment: Payment) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string) => void
  onViewReceipt: (payment: Payment) => void
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (subFilter !== 'all' && (p.type ?? 'due') !== subFilter) return false
      if (statusFilter === 'paid' && p.status !== 'paid') return false
      if (statusFilter === 'pending' && !['draft', 'sent'].includes(p.status))
        return false
      if (
        statusFilter === 'overdue' &&
        !(p.status === 'overdue' || isOverdue(p.dueDate, p.status))
      )
        return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      const client = clients.find((c) => c.id === p.clientId)?.name ?? ''
      const project = projects.find((pr) => pr.id === p.projectId)?.title ?? ''
      return (
        p.title.toLowerCase().includes(q) ||
        client.toLowerCase().includes(q) ||
        project.toLowerCase().includes(q)
      )
    })
  }, [payments, projects, clients, subFilter, statusFilter, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-zinc-100 p-1">
          {(
            [
              ['all', 'All'],
              ['advance', 'Advance'],
              ['due', 'Due'],
              ['refund', 'Refund'],
              ['return', 'Return'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSubFilterChange(id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                subFilter === id
                  ? 'bg-teal-700 text-white'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={onAdd}>
          <Plus size={14} /> Payment
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <input
            className="w-full rounded-xl border border-zinc-950/10 bg-white py-2.5 pr-3 pl-9 text-sm"
            placeholder="Search payments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-zinc-950/10 bg-white px-3 py-2.5 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <Wallet className="mx-auto mb-3 text-zinc-400" size={28} />
          <p className="m-0 text-sm text-zinc-500">No payments match.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-950/10 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const client = clients.find((c) => c.id === p.clientId)
                const project = projects.find((pr) => pr.id === p.projectId)
                const overdue =
                  p.status === 'overdue' || isOverdue(p.dueDate, p.status)
                return (
                  <tr key={p.id} className="border-b border-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{p.title}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1.5 text-[11px] text-zinc-500">
                        <Badge variant="brand">
                          {PAYMENT_TYPE_LABELS[p.type ?? 'due']}
                        </Badge>
                        {project && <span>{project.title}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {client?.name || '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === 'paid'
                            ? 'success'
                            : overdue
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {overdue && p.status !== 'paid'
                          ? 'Overdue'
                          : PAYMENT_STATUS_LABELS[p.status]}
                      </Badge>
                      <div className="mt-1 text-[11px] text-zinc-400">
                        {PAYMENT_METHOD_LABELS[p.method]}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {formatDate(p.dueDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        {p.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onMarkPaid(p.id)}
                          >
                            <CheckCircle2 size={13} /> Paid
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewReceipt(p)}
                        >
                          <FileText size={13} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Delete “${p.title}”?`)) onDelete(p.id)
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
