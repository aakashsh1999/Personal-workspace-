import { Building2, Mail, Phone, Plus, Trash2, User } from 'lucide-react'
import { clientFinancialRollup, formatCurrency } from '../../lib/money'
import type { Client, Payment, Project } from '../../types'
import { Button } from '../ui'

export function ClientsView({
  clients,
  projects,
  payments,
  onAdd,
  onEdit,
  onDelete,
  onAddProject,
}: {
  clients: Client[]
  projects: Project[]
  payments: Payment[]
  onAdd: () => void
  onEdit: (client: Client) => void
  onDelete: (id: string) => void
  onAddProject: (client: Client) => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-sm text-zinc-500">
          {clients.length} client{clients.length === 1 ? '' : 's'}
        </p>
        <Button size="sm" onClick={onAdd}>
          <Plus size={14} /> Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
          <User className="mx-auto mb-3 text-zinc-400" size={28} />
          <p className="m-0 text-sm text-zinc-500">No clients yet.</p>
          <Button className="mt-4" size="sm" onClick={onAdd}>
            <Plus size={14} /> Add client
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => {
            const rollup = clientFinancialRollup(client.id, projects, payments)
            return (
              <article
                key={client.id}
                className="rounded-2xl border border-zinc-950/10 bg-white p-4 shadow-sm"
              >
                <h3 className="m-0 text-base font-semibold text-zinc-950">
                  {client.name}
                </h3>
                {client.company && (
                  <p className="m-0 mt-1 flex items-center gap-1 text-xs text-zinc-500">
                    <Building2 size={12} /> {client.company}
                  </p>
                )}
                <div className="mt-2 space-y-1 text-xs text-zinc-500">
                  {client.email && (
                    <p className="m-0 flex items-center gap-1">
                      <Mail size={12} /> {client.email}
                    </p>
                  )}
                  {client.phone && (
                    <p className="m-0 flex items-center gap-1">
                      <Phone size={12} /> {client.phone}
                    </p>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-zinc-50 p-2.5 text-center">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatCurrency(rollup.billed)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Billed</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-700">
                      {formatCurrency(rollup.received)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Received</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-700">
                      {formatCurrency(rollup.pending)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Pending</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-zinc-400">
                  {rollup.projectCount} project
                  {rollup.projectCount === 1 ? '' : 's'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onAddProject(client)}
                  >
                    <Plus size={13} /> Project
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onEdit(client)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Delete “${client.name}”?`)) onDelete(client.id)
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
