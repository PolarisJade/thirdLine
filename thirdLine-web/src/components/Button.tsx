import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { cx } from '@/utils/format'

type ButtonVariant = 'primary' | 'glass' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** 左侧图标 */
  icon?: IconName
  /** 右侧图标 */
  iconRight?: IconName
  loading?: boolean
  block?: boolean
  /** 仅图标按钮（正方形） */
  iconOnly?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'glass',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  block = false,
  iconOnly = false,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const iconSize = size === 'sm' ? 14 : 16

  return (
    <button
      className={cx(
        'btn',
        `btn--${variant}`,
        size === 'sm' && 'btn--sm',
        size === 'lg' && 'btn--lg',
        block && 'btn--block',
        iconOnly && 'btn--icon',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="btn__spinner" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {!iconOnly && children}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  )
}
