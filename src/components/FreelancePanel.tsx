import { useMemo, useState } from 'react';
import { Plus, Trash2, Wallet } from 'lucide-react';
import { useStore } from '../store';
import type {
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../types';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
} from '../types';

const PAY_STATUSES: PaymentStatus[] = [
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled',
];
const PAY_METHODS: PaymentMethod[] = [
  'upi',
  'bank',
  'paypal',
  'card',
  'cash',
  'other',
];
const PAY_TYPES: PaymentType[] = ['advance', 'due', 'refund', 'return'];

function isOutflow(type: PaymentType | undefined) {
  return type === 'refund' || type === 'return';
}

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

type PayRow = {
  type?: PaymentType;
  amount: number;
  status: PaymentStatus;
  projectId?: string;
  clientId: string;
};

function projectBreakdown(
  projectId: string,
  totalPrice: number,
  payments: PayRow[],
) {
  const related = payments.filter(
    (p) => p.projectId === projectId && p.status !== 'cancelled',
  );
  const sum = (type: PaymentType) =>
    related.filter((p) => (p.type ?? 'due') === type).reduce((s, p) => s + p.amount, 0);
  const advance = sum('advance');
  const due = sum('due');
  const refunded =
    sum('refund') + sum('return');
  const collected = related
    .filter((p) => p.status === 'paid' && !isOutflow(p.type))
    .reduce((s, p) => s + p.amount, 0);
  const paidOut = related
    .filter((p) => p.status === 'paid' && isOutflow(p.type))
    .reduce((s, p) => s + p.amount, 0);
  const allocated = advance + due;
  const remainingToPlan = Math.max(0, totalPrice - allocated + refunded);
  const balanceOwed = Math.max(0, totalPrice - collected + paidOut);
  return {
    advance,
    due,
    refunded,
    collected: Math.max(0, collected - paidOut),
    remainingToPlan,
    balanceOwed,
    totalPrice,
  };
}

export function FreelancePanel({ pageId }: { pageId: string }) {
  const {
    state,
    activePage,
    addClient,
    updateClient,
    deleteClient,
    addPayment,
    updatePayment,
    deletePayment,
    updateItem,
    addItem,
    deleteItem,
  } = useStore();
  const [tab, setTab] = useState<'projects' | 'clients' | 'payments'>('projects');
  const [payFilter, setPayFilter] = useState<'all' | PaymentType>('all');
  /** Draft advance amounts for the project payment planner. */
  const [advanceDraft, setAdvanceDraft] = useState<Record<string, string>>({});

  const summary = useMemo(() => {
    const payments = state.payments ?? [];
    const unpaid = (p: (typeof payments)[number]) =>
      p.status === 'sent' || p.status === 'overdue' || p.status === 'draft';
    const paidIn = payments
      .filter((p) => p.status === 'paid' && !isOutflow(p.type))
      .reduce((sum, p) => sum + p.amount, 0);
    const refunded = payments
      .filter((p) => p.status === 'paid' && isOutflow(p.type))
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAdvance = payments
      .filter((p) => (p.type ?? 'due') === 'advance' && unpaid(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingDue = payments
      .filter((p) => (p.type ?? 'due') === 'due' && unpaid(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingRefund = payments
      .filter((p) => isOutflow(p.type) && unpaid(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const overdue = payments.filter((p) => p.status === 'overdue').length;
    return {
      paid: Math.max(0, paidIn - refunded),
      refunded,
      pendingAdvance,
      pendingDue,
      pendingRefund,
      overdue,
      clients: state.clients.length,
    };
  }, [state.payments, state.clients]);

  const visiblePayments = useMemo(() => {
    const list = state.payments ?? [];
    if (payFilter === 'all') return list;
    return list.filter((p) => (p.type ?? 'due') === payFilter);
  }, [state.payments, payFilter]);

  const projects = activePage?.items ?? [];
  const payments = state.payments ?? [];

  function createSplitPlan(
    project: (typeof projects)[number],
    advanceAmount: number,
  ) {
    if (!project.clientId) {
      alert('Pick a client on the project first.');
      return;
    }
    const total = project.budget ?? 0;
    if (total <= 0) {
      alert('Set the total project price first.');
      return;
    }
    const existing = projectBreakdown(project.id, total, payments);
    if (existing.advance + existing.due > 0) {
      const ok = confirm(
        'This project already has advance/due payments. Create another pair from the amounts below?',
      );
      if (!ok) return;
    }
    const advance = Math.max(0, Math.min(advanceAmount, total));
    const due = Math.max(0, total - advance);
    addPayment({
      clientId: project.clientId,
      projectId: project.id,
      type: 'advance',
      title: `${project.title} — advance`,
      amount: advance,
      status: 'draft',
    });
    if (due > 0) {
      addPayment({
        clientId: project.clientId,
        projectId: project.id,
        type: 'due',
        title: `${project.title} — due / balance`,
        amount: due,
        status: 'draft',
      });
    }
    setTab('payments');
  }

  return (
    <div className="freelance-panel">
      <section className="stat-row freelance-stats" aria-label="Side project money overview">
        <div className="stat">
          <span className="stat-value">{money(summary.paid)}</span>
          <span className="stat-label">Net received</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.pendingAdvance)}</span>
          <span className="stat-label">Advance pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.pendingDue)}</span>
          <span className="stat-label">Due / balance pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.refunded)}</span>
          <span className="stat-label">Refunded / returned</span>
        </div>
        <div className="stat">
          <span className="stat-value">{money(summary.pendingRefund)}</span>
          <span className="stat-label">Refund pending</span>
        </div>
        <div className="stat">
          <span className="stat-value">{summary.overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      </section>

      <div className="freelance-tabs" role="tablist" aria-label="Side project sections">
        {(
          [
            ['projects', 'Projects'],
            ['clients', 'Clients'],
            ['payments', 'Payments'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-active' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'clients' && (
        <section className="freelance-section" aria-label="Clients">
          <div className="freelance-section-head">
            <h2>Clients</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => addClient({ name: 'New client' })}
            >
              <Plus size={16} aria-hidden /> Add client
            </button>
          </div>
          <div className="client-grid">
            {state.clients.map((client) => (
              <article key={client.id} className="client-card">
                <div className="item-card-top">
                  <input
                    className="item-title"
                    value={client.name}
                    aria-label="Client name"
                    onChange={(e) =>
                      updateClient(client.id, { name: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete ${client.name}`}
                    onClick={() => {
                      if (confirm(`Delete client “${client.name}” and their payments?`)) {
                        deleteClient(client.id);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="client-fields">
                  <label>
                    Company
                    <input
                      value={client.company ?? ''}
                      onChange={(e) =>
                        updateClient(client.id, { company: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email
                    <input
                      type="email"
                      value={client.email ?? ''}
                      onChange={(e) =>
                        updateClient(client.id, { email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={client.phone ?? ''}
                      onChange={(e) =>
                        updateClient(client.id, { phone: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label className="item-notes">
                  Notes
                  <textarea
                    rows={2}
                    value={client.notes ?? ''}
                    onChange={(e) =>
                      updateClient(client.id, { notes: e.target.value })
                    }
                    placeholder="Preferences, timezone, billing notes…"
                  />
                </label>
              </article>
            ))}
            {state.clients.length === 0 && (
              <p className="empty">No clients yet. Add one to start tracking work.</p>
            )}
          </div>
        </section>
      )}

      {tab === 'payments' && (
        <section className="freelance-section" aria-label="Payments">
          <div className="freelance-section-head">
            <h2>
              <Wallet size={18} aria-hidden /> Payments
            </h2>
            <div className="payment-actions">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setPayFilter('all');
                  addPayment({
                    type: 'advance',
                    title: 'New payment',
                    amount: 0,
                    status: 'draft',
                  });
                }}
                disabled={state.clients.length === 0}
              >
                <Plus size={16} aria-hidden /> Add payment
              </button>
            </div>
          </div>

          <div className="pay-type-filter" role="group" aria-label="Filter by payment type">
            {(
              [
                ['all', 'All'],
                ['advance', 'Advance only'],
                ['due', 'Due only'],
                ['refund', 'Refund only'],
                ['return', 'Return only'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={payFilter === id ? 'is-active' : ''}
                aria-pressed={payFilter === id}
                onClick={() => setPayFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {state.clients.length === 0 ? (
            <p className="empty">Add a client first, then log payments.</p>
          ) : (
            <div className="payment-cards">
              {visiblePayments.map((pay) => {
                const linked = projects.find((p) => p.id === pay.projectId);
                const breakdown = linked
                  ? projectBreakdown(linked.id, linked.budget ?? 0, payments)
                  : null;
                return (
                <article
                  key={pay.id}
                  className={`payment-card type-${pay.type ?? 'due'}`}
                >
                  <div className="item-card-top">
                    <input
                      className="item-title"
                      value={pay.title}
                      aria-label="Payment title"
                      onChange={(e) =>
                        updatePayment(pay.id, { title: e.target.value })
                      }
                    />
                    <span className={`pay-type-badge pay-type-${pay.type ?? 'due'}`}>
                      {PAYMENT_TYPE_LABELS[pay.type ?? 'due']}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Delete payment"
                      onClick={() => deletePayment(pay.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {breakdown && (
                    <div className="pay-project-context" aria-label="Project payment summary">
                      <span>
                        Total <strong>{money(breakdown.totalPrice)}</strong>
                      </span>
                      <span>
                        Advance <strong>{money(breakdown.advance)}</strong>
                      </span>
                      <span>
                        Due <strong>{money(breakdown.due)}</strong>
                      </span>
                      <span>
                        Left to plan{' '}
                        <strong>{money(breakdown.remainingToPlan)}</strong>
                      </span>
                    </div>
                  )}
                  <div className="payment-card-grid">
                    <label>
                      Type
                      <select
                        value={pay.type ?? 'due'}
                        aria-label="Payment type"
                        onChange={(e) => {
                          const type = e.target.value as PaymentType;
                          const defaultTitles = [
                            'New payment',
                            'Advance payment',
                            'Due payment',
                            'Refund payment',
                            'Return payment',
                          ];
                          const patch: {
                            type: PaymentType;
                            title?: string;
                          } = { type };
                          if (
                            defaultTitles.includes(pay.title) ||
                            / — (advance|due \/ balance|due|refund|return)$/i.test(
                              pay.title,
                            )
                          ) {
                            const project = projects.find(
                              (p) => p.id === pay.projectId,
                            );
                            const label = PAYMENT_TYPE_LABELS[type];
                            patch.title = project
                              ? `${project.title} — ${label.toLowerCase()}`
                              : `${label} payment`;
                          }
                          updatePayment(pay.id, patch);
                        }}
                      >
                        {PAY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {PAYMENT_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Client
                      <select
                        value={pay.clientId}
                        aria-label="Client"
                        onChange={(e) =>
                          updatePayment(pay.id, { clientId: e.target.value })
                        }
                      >
                        {state.clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.company ? ` — ${c.company}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Project
                      <select
                        value={pay.projectId ?? ''}
                        aria-label="Linked project"
                        onChange={(e) => {
                          const projectId = e.target.value || undefined;
                          const project = projects.find((p) => p.id === projectId);
                          const type = pay.type ?? 'due';
                          const label = PAYMENT_TYPE_LABELS[type];
                          const isDefault =
                            [
                              'New payment',
                              'Advance payment',
                              'Due payment',
                              'Refund payment',
                              'Return payment',
                            ].includes(pay.title) ||
                            / — (advance|due \/ balance|due|refund|return)$/i.test(
                              pay.title,
                            );
                          updatePayment(pay.id, {
                            projectId,
                            ...(project?.clientId
                              ? { clientId: project.clientId }
                              : {}),
                            ...(project && isDefault
                              ? {
                                  title: `${project.title} — ${label.toLowerCase()}`,
                                }
                              : {}),
                          });
                        }}
                      >
                        <option value="">No project</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                            {p.budget ? ` — ${money(p.budget)}` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Amount
                      <input
                        type="number"
                        min={0}
                        value={pay.amount}
                        aria-label="Amount"
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            amount: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </label>
                    <label>
                      Status
                      <select
                        value={pay.status}
                        className={`pay-status pay-status-${pay.status}`}
                        aria-label="Payment status"
                        onChange={(e) => {
                          const status = e.target.value as PaymentStatus;
                          updatePayment(pay.id, {
                            status,
                            paidDate:
                              status === 'paid'
                                ? pay.paidDate ||
                                  new Date().toISOString().slice(0, 10)
                                : pay.paidDate,
                          });
                        }}
                      >
                        {PAY_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {PAYMENT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Method
                      <select
                        value={pay.method}
                        aria-label="Payment method"
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            method: e.target.value as PaymentMethod,
                          })
                        }
                      >
                        {PAY_METHODS.map((m) => (
                          <option key={m} value={m}>
                            {PAYMENT_METHOD_LABELS[m]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Due date
                      <input
                        type="date"
                        value={pay.dueDate ?? ''}
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            dueDate: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label>
                      Paid date
                      <input
                        type="date"
                        value={pay.paidDate ?? ''}
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            paidDate: e.target.value || undefined,
                          })
                        }
                      />
                    </label>
                    <label>
                      Invoice #
                      <input
                        value={pay.invoiceNumber ?? ''}
                        placeholder="INV-…"
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            invoiceNumber: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  {linked && (linked.budget ?? 0) > 0 && (
                    <div className="pay-quick-fills" role="group" aria-label="Fill amount from project">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updatePayment(pay.id, {
                            amount: Math.round((linked.budget ?? 0) / 2),
                            type: 'advance',
                            title: pay.title.includes('—')
                              ? pay.title
                              : `${linked.title} — advance`,
                          })
                        }
                      >
                        50% advance
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          updatePayment(pay.id, {
                            amount: Math.max(
                              0,
                              (linked.budget ?? 0) -
                                projectBreakdown(
                                  linked.id,
                                  linked.budget ?? 0,
                                  payments.filter((p) => p.id !== pay.id),
                                ).advance,
                            ),
                            type: 'advance',
                          })
                        }
                      >
                        Rest as advance
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => {
                          const others = projectBreakdown(
                            linked.id,
                            linked.budget ?? 0,
                            payments.filter((p) => p.id !== pay.id),
                          );
                          updatePayment(pay.id, {
                            amount: Math.max(
                              0,
                              (linked.budget ?? 0) - others.advance - others.due,
                            ),
                            type: 'due',
                            title: pay.title.includes('—')
                              ? pay.title
                              : `${linked.title} — due / balance`,
                          });
                        }}
                      >
                        Fill remaining due
                      </button>
                    </div>
                  )}
                </article>
                );
              })}
              {visiblePayments.length === 0 && (
                <p className="empty">No payments in this filter.</p>
              )}
            </div>
          )}
        </section>
      )}

      {tab === 'projects' && (
        <section className="freelance-section" aria-label="Side projects">
          <div className="freelance-section-head">
            <h2>Projects</h2>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() =>
                addItem(pageId, 'New side project')
              }
            >
              <Plus size={16} aria-hidden /> Add project
            </button>
          </div>
          <div className="list-items">
            {projects.map((item) => {
              const total = item.budget ?? 0;
              const breakdown = projectBreakdown(item.id, total, payments);
              const defaultAdvance =
                advanceDraft[item.id] ??
                String(total > 0 ? Math.round(total / 2) : 0);
              const advanceNum = Number(defaultAdvance) || 0;
              const duePreview = Math.max(0, total - Math.min(advanceNum, total));
              return (
              <article key={item.id} className="item-card">
                <div className="item-card-top">
                  <input
                    className="item-title"
                    value={item.title}
                    aria-label="Project title"
                    onChange={(e) =>
                      updateItem(pageId, item.id, { title: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Delete ${item.title || 'project'}`}
                    title="Delete project"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete “${item.title || 'this project'}”?`,
                        )
                      ) {
                        deleteItem(pageId, item.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="item-fields freelance-project-fields">
                  <label>
                    Client
                    <select
                      value={item.clientId ?? ''}
                      onChange={(e) =>
                        updateItem(pageId, item.id, {
                          clientId: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">No client</option>
                      {state.clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {c.company ? ` — ${c.company}` : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Total project price
                    <input
                      type="number"
                      min={0}
                      value={item.budget ?? 0}
                      aria-label="Total project price"
                      onChange={(e) => {
                        const budget = Number(e.target.value) || 0;
                        updateItem(pageId, item.id, { budget });
                        if (!(item.id in advanceDraft)) {
                          setAdvanceDraft((d) => ({
                            ...d,
                            [item.id]: String(
                              budget > 0 ? Math.round(budget / 2) : 0,
                            ),
                          }));
                        }
                      }}
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={item.status}
                      onChange={(e) =>
                        updateItem(pageId, item.id, {
                          status: e.target.value as typeof item.status,
                        })
                      }
                    >
                      <option value="backlog">Backlog</option>
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </label>
                  <label>
                    Due
                    <input
                      type="date"
                      value={item.dueDate ?? ''}
                      onChange={(e) =>
                        updateItem(pageId, item.id, {
                          dueDate: e.target.value || undefined,
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
                      value={item.progress}
                      onChange={(e) =>
                        updateItem(pageId, item.id, {
                          progress: Number(e.target.value),
                        })
                      }
                    />
                    <span className="progress-val">{item.progress}%</span>
                  </label>
                </div>

                {total > 0 && (
                  <div className="pay-project-context" aria-label="Project money summary">
                    <span>
                      Total <strong>{money(total)}</strong>
                    </span>
                    <span>
                      Advance logged <strong>{money(breakdown.advance)}</strong>
                    </span>
                    <span>
                      Due logged <strong>{money(breakdown.due)}</strong>
                    </span>
                    <span>
                      Still owed <strong>{money(breakdown.balanceOwed)}</strong>
                    </span>
                  </div>
                )}

                <div className="project-pay-plan">
                  <div className="project-pay-plan-head">
                    <h3>Payment plan</h3>
                    <p>Set total price, enter advance — due balance fills in automatically.</p>
                  </div>
                  <div className="project-pay-plan-fields">
                    <label>
                      Advance amount
                      <input
                        type="number"
                        min={0}
                        max={total || undefined}
                        value={defaultAdvance}
                        aria-label="Advance amount"
                        onChange={(e) =>
                          setAdvanceDraft((d) => ({
                            ...d,
                            [item.id]: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      Due / balance
                      <input
                        type="text"
                        readOnly
                        value={money(duePreview)}
                        aria-label="Due balance preview"
                      />
                    </label>
                    <div className="project-pay-plan-presets" role="group" aria-label="Advance presets">
                      {[25, 50, 70, 100].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={total <= 0}
                          onClick={() =>
                            setAdvanceDraft((d) => ({
                              ...d,
                              [item.id]: String(Math.round((total * pct) / 100)),
                            }))
                          }
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={!item.clientId || total <= 0}
                    onClick={() => createSplitPlan(item, advanceNum)}
                  >
                    <Wallet size={14} aria-hidden /> Create advance + due
                  </button>
                </div>

                <label className="item-notes">
                  Project notes
                  <textarea
                    rows={2}
                    value={item.notes}
                    onChange={(e) =>
                      updateItem(pageId, item.id, { notes: e.target.value })
                    }
                    placeholder="Scope, deliverables, links…"
                  />
                </label>
                {item.clientId && (
                  <div className="project-pay-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        addPayment({
                          clientId: item.clientId,
                          projectId: item.id,
                          type: 'advance',
                          title: `${item.title} — advance`,
                          amount: advanceNum || (total ? Math.round(total / 2) : 0),
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log advance only
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        addPayment({
                          clientId: item.clientId,
                          projectId: item.id,
                          type: 'due',
                          title: `${item.title} — due / balance`,
                          amount:
                            duePreview ||
                            breakdown.remainingToPlan ||
                            (total ? Math.round(total / 2) : 0),
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log due only
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        addPayment({
                          clientId: item.clientId,
                          projectId: item.id,
                          type: 'refund',
                          title: `${item.title} — refund`,
                          amount: 0,
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log refund
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        addPayment({
                          clientId: item.clientId,
                          projectId: item.id,
                          type: 'return',
                          title: `${item.title} — return`,
                          amount: 0,
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log return
                    </button>
                  </div>
                )}
              </article>
              );
            })}
            {projects.length === 0 && (
              <p className="empty">No projects yet. Add your first side project.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
