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
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--teal-soft)] text-[var(--teal-deep)]">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
