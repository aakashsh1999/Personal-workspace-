import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer border',
  {
    variants: {
      variant: {
        primary:
          'border-transparent bg-[var(--teal)] text-white shadow-sm hover:bg-[var(--teal-deep)]',
        secondary:
          'border-[var(--line)] bg-white text-[var(--ink)] shadow-sm hover:bg-[var(--surface-solid)]',
        ghost:
          'border-transparent bg-transparent text-[var(--ink-soft)] hover:bg-black/[0.04] hover:text-[var(--ink)]',
        danger:
          'border-transparent bg-[#fee2e2] text-[#991b1b] hover:bg-[#fecaca]',
      },
      size: {
        sm: 'h-9 px-3 text-[0.82rem]',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
