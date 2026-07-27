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
const PAY_TYPES: PaymentType[] = ['advance', 'due'];

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

  const summary = useMemo(() => {
    const payments = state.payments ?? [];
    const unpaid = (p: (typeof payments)[number]) =>
      p.status === 'sent' || p.status === 'overdue' || p.status === 'draft';
    const paid = payments
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAdvance = payments
      .filter((p) => (p.type ?? 'due') === 'advance' && unpaid(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingDue = payments
      .filter((p) => (p.type ?? 'due') === 'due' && unpaid(p))
      .reduce((sum, p) => sum + p.amount, 0);
    const overdue = payments.filter((p) => p.status === 'overdue').length;
    return {
      paid,
      pendingAdvance,
      pendingDue,
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

  return (
    <div className="freelance-panel">
      <section className="stat-row freelance-stats" aria-label="Side project money overview">
        <div className="stat">
          <span className="stat-value">{money(summary.paid)}</span>
          <span className="stat-label">Received</span>
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
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  addPayment({ type: 'advance', title: 'Advance payment' })
                }
                disabled={state.clients.length === 0}
              >
                <Plus size={16} aria-hidden /> Advance
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() =>
                  addPayment({ type: 'due', title: 'Due payment' })
                }
                disabled={state.clients.length === 0}
              >
                <Plus size={16} aria-hidden /> Due
              </button>
            </div>
          </div>

          <div className="pay-type-filter" role="group" aria-label="Filter by payment type">
            {(
              [
                ['all', 'All'],
                ['advance', 'Advance only'],
                ['due', 'Due only'],
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
              {visiblePayments.map((pay) => (
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
                  <div className="payment-card-grid">
                    <label>
                      Type
                      <select
                        value={pay.type ?? 'due'}
                        aria-label="Payment type"
                        onChange={(e) =>
                          updatePayment(pay.id, {
                            type: e.target.value as PaymentType,
                          })
                        }
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
                </article>
              ))}
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
            {projects.map((item) => (
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
                    Budget
                    <input
                      type="number"
                      min={0}
                      value={item.budget ?? 0}
                      onChange={(e) =>
                        updateItem(pageId, item.id, {
                          budget: Number(e.target.value) || 0,
                        })
                      }
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
                          type: 'advance',
                          title: `${item.title} — advance`,
                          amount: item.budget ? Math.round(item.budget / 2) : 0,
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log advance
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        addPayment({
                          clientId: item.clientId,
                          type: 'due',
                          title: `${item.title} — due`,
                          amount: item.budget ? Math.round(item.budget / 2) : 0,
                          status: 'draft',
                        })
                      }
                    >
                      <Wallet size={14} aria-hidden /> Log due
                    </button>
                  </div>
                )}
              </article>
            ))}
            {projects.length === 0 && (
              <p className="empty">No projects yet. Add your first side project.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
