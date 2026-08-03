import type { ComponentPropsWithoutRef } from 'react'
import { Badge as CatalystBadge } from '../catalyst/badge'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'

function colorFor(
  variant: Variant,
): 'zinc' | 'green' | 'amber' | 'red' | 'sky' | 'teal' {
  switch (variant) {
    case 'success':
      return 'green'
    case 'warning':
      return 'amber'
    case 'danger':
      return 'red'
    case 'info':
      return 'sky'
    case 'brand':
      return 'teal'
    default:
      return 'zinc'
  }
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: Omit<ComponentPropsWithoutRef<'span'>, 'color'> & { variant?: Variant }) {
  return (
    <CatalystBadge className={className} {...props} color={colorFor(variant)} />
  )
}
