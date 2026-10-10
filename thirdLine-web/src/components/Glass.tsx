import type { CSSProperties, ElementType, ReactNode } from 'react'
import { cx } from '@/utils/format'

type GlassVariant = 'default' | 'weak' | 'strong' | 'subtle' | 'inset' | 'active'
type GlassRadius = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'pill'

export interface GlassProps {
  children?: ReactNode
  /** 玻璃强度：weak 更透（大容器）、strong 更实（保证文字可读）、subtle 轻量（chip/按钮） */
  variant?: GlassVariant
  radius?: GlassRadius
  /** 悬浮抬起 + 液面反光，用于可点击卡片 */
  hoverable?: boolean
  className?: string
  style?: CSSProperties
  onClick?: () => void
  as?: ElementType
}

/**
 * 液态玻璃容器。
 * 视觉由 styles/glass.css 中的 .glass 系列类实现（backdrop-filter + 多层高光）。
 */
export function Glass({
  children,
  variant = 'default',
  radius = 'lg',
  hoverable = false,
  className,
  style,
  onClick,
  as,
}: GlassProps) {
  const Component: ElementType = as ?? (onClick ? 'button' : 'div')

  return (
    <Component
      className={cx(
        'glass',
        variant !== 'default' && `glass--${variant}`,
        radius !== 'lg' && `glass--r-${radius}`,
        hoverable && 'glass--hoverable',
        className,
      )}
      style={onClick && Component === 'button' ? { textAlign: 'left', width: '100%', ...style } : style}
      onClick={onClick}
      type={Component === 'button' ? 'button' : undefined}
    >
      {children}
    </Component>
  )
}
