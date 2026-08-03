import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Card } from './card'

export type IconTone =
  | 'sky'
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'orange'
  | 'rose'
  | 'violet'
  | 'blue'
  | 'zinc'

export const iconToneClass: Record<IconTone, string> = {
  sky: 'bg-sky-50 text-sky-700',
  teal: 'bg-teal-50 text-teal-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  rose: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
  blue: 'bg-blue-50 text-blue-700',
  zinc: 'bg-zinc-100 text-zinc-700',
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconTone = 'teal',
  className,
  ...props
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  iconTone?: IconTone
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden px-3 py-2.5 transition-shadow duration-200 hover:shadow-[var(--shadow)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="m-0 text-[0.68rem] font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
            {label}
          </p>
          <p className="m-0 mt-0.5 font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-[var(--ink)]">
            {value}
          </p>
          {hint && (
            <p className="m-0 text-[0.7rem] text-[var(--muted)]">{hint}</p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              iconToneClass[iconTone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}
