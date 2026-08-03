import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Card } from './card';

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
  ...props
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden px-4 py-4 transition-shadow duration-200 hover:shadow-[var(--shadow)]',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
            {label}
          </p>
          <p className="m-0 mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {value}
          </p>
          {hint && (
            <p className="m-0 mt-1 text-xs text-[var(--muted)]">{hint}</p>
          )}
        </div>
        {icon && (
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--teal-soft)] text-[var(--teal-deep)]">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
