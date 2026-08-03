import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button as CatalystButton } from '../catalyst/button'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const sizeClass: Record<Size, string> = {
  sm: 'sm:!px-2.5 sm:!py-1 !text-xs',
  md: '',
  lg: 'sm:!px-4 sm:!py-2.5',
  icon: '!size-8 !p-0 sm:!size-8',
}

export type ButtonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'color'>

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = clsx(sizeClass[size], 'cursor-pointer', className)
  const shared = { className: classes, type, children, ...props }

  if (variant === 'secondary') {
    return <CatalystButton outline {...shared} />
  }

  if (variant === 'ghost') {
    return <CatalystButton plain {...shared} />
  }

  if (variant === 'danger') {
    return <CatalystButton color="red" {...shared} />
  }

  return <CatalystButton color="teal" {...shared} />
}
