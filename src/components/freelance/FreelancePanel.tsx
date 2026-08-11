import { useMemo, useState } from 'react'
import {
  FolderKanban,
  Plus,
  Users,
  Wallet,
} from 'lucide-react'
import { useStore } from '../../store'
import {
  calculateFinancialStats,
  formatCurrency,
  formatDate,
} from '../../lib/money'
import type {
  Client,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
  Project,
  ProjectStatus,
} from '../../types'
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../types'
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogTitle,
} from '../catalyst'
import { Button } from '../ui'
import { ClientsView } from './ClientsView'
import { PaymentsView, type PaymentSubFilter } from './PaymentsView'
import { ProjectsView } from './ProjectsView'

type Tab = 'projects' | 'clients' | 'payments'
type Modal =
  | { kind: 'client'; client?: Client }
  | { kind: 'project'; project?: Project; clientId?: string }
  | { kind: 'payment'; payment?: Payment; project?: Project }
  | { kind: 'receipt'; payment: Payment }
  | null

const PAY_METHODS: PaymentMethod[] = [
  'upi',
  'bank',
  'paypal',
  'card',
  'cash',
  'other',
]
const PAY_STATUSES: PaymentStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
]
const PAY_TYPES: PaymentType[] = ['advance', 'due', 'refund', 'return']
const PROJECT_STATUSES: ProjectStatus[] = [
  'planning',
  'in_progress',
  'completed',
  'on_hold',
]

export function FreelancePanel() {
  const {
    state,
    addClient,
    updateClient,
    deleteClient,
    addProject,
    updateProject,
    deleteProject,
    toggleProjectDeliverable,
    addPayment,
    updatePayment,
    deletePayment,
  } = useStore()

  const clients = state.clients ?? []
  const projects = state.projects ?? []
  const payments = state.payments ?? []

  const [tab, setTab] = useState<Tab>('payments')
  const [subFilter, setSubFilter] = useState<PaymentSubFilter>('all')
  const [modal, setModal] = useState<Modal>(null)

  const stats = useMemo(() => calculateFinancialStats(payments), [payments])

  function openPaymentsFiltered(filter: PaymentSubFilter) {
    setTab('payments')
    setSubFilter(filter)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl border border-teal-100 bg-teal-50 p-3.5 text-teal-700 shadow-sm">
            <Wallet size={28} />
          </div>
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
              Side Project
            </div>
            <h2 className="m-0 text-3xl font-extrabold tracking-tight text-zinc-950">
              Clients, projects & payments
            </h2>
            <p className="mt-1 max-w-xl text-sm font-normal text-zinc-500">
              Track advances, dues, refunds, and project deliverables in one
              place.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setModal({ kind: 'client' })}
          >
            <Plus size={14} /> Client
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setModal({ kind: 'project' })}
          >
            <Plus size={14} /> Project
          </Button>
          <Button size="sm" onClick={() => setModal({ kind: 'payment' })}>
            <Plus size={14} /> Payment
          </Button>
        </div>
      </div>

      <section
        className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6"
        aria-label="Money overview"
      >
        {[
          {
            label: 'Net received',
            value: formatCurrency(stats.netReceived),
            onClick: () => openPaymentsFiltered('all'),
          },
          {
            label: 'Advance pending',
            value: formatCurrency(stats.advancePending),
            onClick: () => openPaymentsFiltered('advance'),
          },
          {
            label: 'Due pending',
            value: formatCurrency(stats.duePending),
            onClick: () => openPaymentsFiltered('due'),
          },
          {
            label: 'Refunded',
            value: formatCurrency(stats.refundedReturned),
            onClick: () => openPaymentsFiltered('refund'),
          },
          {
            label: 'Refund pending',
            value: formatCurrency(stats.refundPending),
            onClick: () => openPaymentsFiltered('refund'),
          },
          {
            label: 'Overdue',
            value: `${stats.overdueCount}`,
            hint: formatCurrency(stats.overdueAmount),
            onClick: () => openPaymentsFiltered('all'),
          },
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={card.onClick}
            className="rounded-2xl border border-zinc-950/10 bg-white p-4 text-left shadow-sm transition hover:border-teal-200 hover:shadow-md"
          >
            <div className="text-2xl font-extrabold tracking-tight text-zinc-950">
              {card.value}
            </div>
            <div className="mt-1 text-xs font-medium text-zinc-500">
              {card.label}
            </div>
            {'hint' in card && card.hint && (
              <div className="mt-0.5 text-[11px] text-zinc-400">{card.hint}</div>
            )}
          </button>
        ))}
      </section>

      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        {(
          [
            ['payments', 'Payments', Wallet],
            ['projects', 'Projects', FolderKanban],
            ['clients', 'Clients', Users],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              tab === id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <ProjectsView
          projects={projects}
          clients={clients}
          payments={payments}
          onAdd={() => setModal({ kind: 'project' })}
          onEdit={(project) => setModal({ kind: 'project', project })}
          onDelete={deleteProject}
          onAddPayment={(project) => setModal({ kind: 'payment', project })}
          onToggleDeliverable={toggleProjectDeliverable}
        />
      )}
      {tab === 'clients' && (
        <ClientsView
          clients={clients}
          projects={projects}
          payments={payments}
          onAdd={() => setModal({ kind: 'client' })}
          onEdit={(client) => setModal({ kind: 'client', client })}
          onDelete={deleteClient}
          onAddProject={(client) =>
            setModal({ kind: 'project', clientId: client.id })
          }
        />
      )}
      {tab === 'payments' && (
        <PaymentsView
          payments={payments}
          projects={projects}
          clients={clients}
          subFilter={subFilter}
          onSubFilterChange={setSubFilter}
          onAdd={() => setModal({ kind: 'payment' })}
          onEdit={(payment) => setModal({ kind: 'payment', payment })}
          onDelete={deletePayment}
          onMarkPaid={(id) =>
            updatePayment(id, {
              status: 'paid',
              paidDate: new Date().toISOString().slice(0, 10),
            })
          }
          onViewReceipt={(payment) => setModal({ kind: 'receipt', payment })}
        />
      )}

      {modal?.kind === 'client' && (
        <ClientModal
          client={modal.client}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal.client) updateClient(modal.client.id, data)
            else addClient(data)
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'project' && (
        <ProjectModal
          project={modal.project}
          clients={clients}
          defaultClientId={modal.clientId}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal.project) updateProject(modal.project.id, data)
            else addProject(data)
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'payment' && (
        <PaymentModal
          payment={modal.payment}
          project={modal.project}
          clients={clients}
          projects={projects}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal.payment) updatePayment(modal.payment.id, data)
            else addPayment(data)
            setModal(null)
          }}
        />
      )}
      {modal?.kind === 'receipt' && (
        <ReceiptModal
          payment={modal.payment}
          client={clients.find((c) => c.id === modal.payment.clientId) ?? null}
          project={
            projects.find((p) => p.id === modal.payment.projectId) ?? null
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function fieldClass() {
  return 'mt-1.5 w-full rounded-xl border border-zinc-950/10 bg-white px-3 py-2.5 text-sm'
}

function ClientModal({
  client,
  onClose,
  onSave,
}: {
  client?: Client
  onClose: () => void
  onSave: (data: Partial<Client>) => void
}) {
  const [name, setName] = useState(client?.name ?? '')
  const [company, setCompany] = useState(client?.company ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')

  return (
    <Dialog open onClose={onClose} size="md">
      <DialogTitle>{client ? 'Edit client' : 'New client'}</DialogTitle>
      <DialogBody>
        <form
          id="client-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onSave({
              name: name.trim(),
              company: company.trim() || undefined,
              email: email.trim() || undefined,
              phone: phone.trim() || undefined,
              notes: notes.trim() || undefined,
            })
          }}
        >
          <label className="block text-sm font-medium text-zinc-700">
            Name
            <input
              className={fieldClass()}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Company
            <input
              className={fieldClass()}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Email
            <input
              type="email"
              className={fieldClass()}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Phone
            <input
              className={fieldClass()}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Notes
            <textarea
              className={fieldClass()}
              rows={3}
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
        <Button type="submit" form="client-form">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ProjectModal({
  project,
  clients,
  defaultClientId,
  onClose,
  onSave,
}: {
  project?: Project
  clients: Client[]
  defaultClientId?: string
  onClose: () => void
  onSave: (data: Partial<Project>) => void
}) {
  const [title, setTitle] = useState(project?.title ?? '')
  const [clientId, setClientId] = useState(
    project?.clientId || defaultClientId || clients[0]?.id || '',
  )
  const [budget, setBudget] = useState(String(project?.budget ?? 0))
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? 'planning',
  )
  const [deadline, setDeadline] = useState(project?.deadline ?? '')
  const [description, setDescription] = useState(project?.description ?? '')

  return (
    <Dialog open onClose={onClose} size="md">
      <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
      <DialogBody>
        <form
          id="project-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            onSave({
              title: title.trim(),
              clientId,
              budget: Number(budget) || 0,
              status,
              deadline: deadline || undefined,
              description: description.trim() || undefined,
            })
          }}
        >
          <label className="block text-sm font-medium text-zinc-700">
            Title
            <input
              className={fieldClass()}
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Client
            <select
              className={fieldClass()}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-zinc-700">
              Budget
              <input
                type="number"
                min={0}
                className={fieldClass()}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Status
              <select
                className={fieldClass()}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-zinc-700">
            Deadline
            <input
              type="date"
              className={fieldClass()}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Description
            <textarea
              className={fieldClass()}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </form>
      </DialogBody>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="project-form">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function PaymentModal({
  payment,
  project,
  clients,
  projects,
  onClose,
  onSave,
}: {
  payment?: Payment
  project?: Project
  clients: Client[]
  projects: Project[]
  onClose: () => void
  onSave: (data: Partial<Payment>) => void
}) {
  const [title, setTitle] = useState(payment?.title ?? 'Payment')
  const [amount, setAmount] = useState(String(payment?.amount ?? 0))
  const [type, setType] = useState<PaymentType>(payment?.type ?? 'advance')
  const [status, setStatus] = useState<PaymentStatus>(payment?.status ?? 'draft')
  const [method, setMethod] = useState<PaymentMethod>(payment?.method ?? 'upi')
  const [clientId, setClientId] = useState(
    payment?.clientId || project?.clientId || clients[0]?.id || '',
  )
  const [projectId, setProjectId] = useState(
    payment?.projectId || project?.id || '',
  )
  const [dueDate, setDueDate] = useState(
    payment?.dueDate ?? new Date().toISOString().slice(0, 10),
  )
  const [notes, setNotes] = useState(payment?.notes ?? '')

  return (
    <Dialog open onClose={onClose} size="md">
      <DialogTitle>{payment ? 'Edit payment' : 'New payment'}</DialogTitle>
      <DialogBody>
        <form
          id="payment-form"
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            onSave({
              title: title.trim() || 'Payment',
              amount: Number(amount) || 0,
              type,
              status,
              method,
              clientId,
              projectId: projectId || undefined,
              dueDate: dueDate || undefined,
              notes: notes.trim() || undefined,
              paidDate:
                status === 'paid'
                  ? payment?.paidDate ?? new Date().toISOString().slice(0, 10)
                  : payment?.paidDate,
            })
          }}
        >
          <label className="block text-sm font-medium text-zinc-700">
            Title
            <input
              className={fieldClass()}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-zinc-700">
              Amount
              <input
                type="number"
                min={0}
                className={fieldClass()}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Type
              <select
                className={fieldClass()}
                value={type}
                onChange={(e) => setType(e.target.value as PaymentType)}
              >
                {PAY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {PAYMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-zinc-700">
              Status
              <select
                className={fieldClass()}
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              >
                {PAY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-zinc-700">
              Method
              <select
                className={fieldClass()}
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                {PAY_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABELS[m]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-zinc-700">
            Client
            <select
              className={fieldClass()}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Project
            <select
              className={fieldClass()}
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                const pr = projects.find((p) => p.id === e.target.value)
                if (pr?.clientId) setClientId(pr.clientId)
              }}
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Due date
            <input
              type="date"
              className={fieldClass()}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-700">
            Notes
            <textarea
              className={fieldClass()}
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
        <Button type="submit" form="payment-form">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function ReceiptModal({
  payment,
  client,
  project,
  onClose,
}: {
  payment: Payment
  client: Client | null
  project: Project | null
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const amount = formatCurrency(payment.amount, payment.currency)

  function copy() {
    const text = `PAYMENT RECEIPT
Title: ${payment.title}
Client: ${client?.name || 'N/A'}
Project: ${project?.title || 'General'}
Amount: ${amount}
Type: ${(payment.type ?? 'due').toUpperCase()}
Status: ${payment.status.toUpperCase()}
Due: ${formatDate(payment.dueDate)}
Paid: ${payment.paidDate ? formatDate(payment.paidDate) : 'Pending'}
Method: ${PAYMENT_METHOD_LABELS[payment.method]}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onClose={onClose} size="md">
      <DialogTitle>Payment receipt</DialogTitle>
      <DialogBody>
        <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-bold text-zinc-900">Orbit · Side Project</div>
              <div className="text-xs text-zinc-500">Transaction summary</div>
            </div>
            <span className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
              {PAYMENT_STATUS_LABELS[payment.status]}
            </span>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-zinc-950">{amount}</div>
            <div className="mt-1 text-sm text-zinc-600">{payment.title}</div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-400">Client</dt>
              <dd className="m-0 font-medium text-zinc-800">
                {client?.name || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">Project</dt>
              <dd className="m-0 font-medium text-zinc-800">
                {project?.title || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">Type</dt>
              <dd className="m-0 font-medium text-zinc-800">
                {PAYMENT_TYPE_LABELS[payment.type ?? 'due']}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-400">Due</dt>
              <dd className="m-0 font-medium text-zinc-800">
                {formatDate(payment.dueDate)}
              </dd>
            </div>
          </dl>
        </div>
      </DialogBody>
      <DialogActions>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          Print
        </Button>
        <Button onClick={copy}>{copied ? 'Copied' : 'Copy'}</Button>
      </DialogActions>
    </Dialog>
  )
}
