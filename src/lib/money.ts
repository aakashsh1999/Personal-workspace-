import type { FinancialStats, Payment, PaymentStatus, Project } from '../types'

export function formatCurrency(amount: number, currency = 'INR'): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)}`
  }
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—'
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString))
  } catch {
    return dateString
  }
}

function isSettled(status: PaymentStatus) {
  return status === 'paid' || status === 'cancelled'
}

export function isPaymentPending(status: PaymentStatus) {
  return status === 'draft' || status === 'sent' || status === 'overdue'
}

export function isOverdue(dueDateString: string | undefined, status: PaymentStatus): boolean {
  if (isSettled(status) || status === 'overdue') {
    if (status === 'overdue') return true
    return false
  }
  if (!dueDateString) return false
  const due = new Date(dueDateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}

export function calculateFinancialStats(payments: Payment[]): FinancialStats {
  let netReceived = 0
  let advancePending = 0
  let duePending = 0
  let refundedReturned = 0
  let refundPending = 0
  let overdueCount = 0
  let overdueAmount = 0

  payments.forEach((p) => {
    const type = p.type ?? 'due'
    const overdue = isOverdue(p.dueDate, p.status)

    if (p.status === 'paid') {
      if (type === 'advance' || type === 'due') netReceived += p.amount
      else if (type === 'refund' || type === 'return') refundedReturned += p.amount
    }

    if (isPaymentPending(p.status) || overdue) {
      if (type === 'advance') advancePending += p.amount
      else if (type === 'due') duePending += p.amount
      else if (type === 'refund' || type === 'return') refundPending += p.amount

      if (overdue || p.status === 'overdue') {
        overdueCount += 1
        overdueAmount += p.amount
      }
    }
  })

  return {
    netReceived,
    advancePending,
    duePending,
    refundedReturned,
    refundPending,
    overdueCount,
    overdueAmount,
  }
}

export function getProjectFinancialSummary(project: Project, payments: Payment[]) {
  const projectPayments = payments.filter((p) => p.projectId === project.id)

  const totalPaid = projectPayments
    .filter(
      (p) =>
        p.status === 'paid' &&
        ((p.type ?? 'due') === 'advance' || (p.type ?? 'due') === 'due'),
    )
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingAdvance = projectPayments
    .filter(
      (p) =>
        (isPaymentPending(p.status) || isOverdue(p.dueDate, p.status)) &&
        (p.type ?? 'due') === 'advance',
    )
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingBalance = projectPayments
    .filter(
      (p) =>
        (isPaymentPending(p.status) || isOverdue(p.dueDate, p.status)) &&
        (p.type ?? 'due') === 'due',
    )
    .reduce((sum, p) => sum + p.amount, 0)

  const totalRefunded = projectPayments
    .filter(
      (p) =>
        p.status === 'paid' &&
        ((p.type ?? 'due') === 'refund' || (p.type ?? 'due') === 'return'),
    )
    .reduce((sum, p) => sum + p.amount, 0)

  const remainingBudget = Math.max(0, project.budget - totalPaid + totalRefunded)
  const paidPct =
    project.budget > 0
      ? Math.min(100, Math.round((totalPaid / project.budget) * 100))
      : 0

  return {
    totalPaid,
    pendingAdvance,
    pendingBalance,
    totalRefunded,
    remainingBudget,
    paidPct,
  }
}

export function clientFinancialRollup(
  clientId: string,
  projects: Project[],
  payments: Payment[],
) {
  const clientProjects = projects.filter((p) => p.clientId === clientId)
  const billed = clientProjects.reduce((s, p) => s + (p.budget || 0), 0)
  const clientPayments = payments.filter((p) => p.clientId === clientId)
  const received = clientPayments
    .filter(
      (p) =>
        p.status === 'paid' &&
        ((p.type ?? 'due') === 'advance' || (p.type ?? 'due') === 'due'),
    )
    .reduce((s, p) => s + p.amount, 0)
  const pending = clientPayments
    .filter((p) => isPaymentPending(p.status) || isOverdue(p.dueDate, p.status))
    .filter((p) => {
      const t = p.type ?? 'due'
      return t === 'advance' || t === 'due'
    })
    .reduce((s, p) => s + p.amount, 0)
  return { billed, received, pending, projectCount: clientProjects.length }
}
