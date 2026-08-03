import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-lg px-2 py-0.5 text-[0.72rem] font-bold tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-[var(--surface-solid)] text-[var(--ink-soft)]',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-800',
        danger: 'bg-rose-50 text-rose-700',
        info: 'bg-sky-50 text-sky-800',
        brand: 'bg-[var(--teal-soft)] text-[var(--teal-deep)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
