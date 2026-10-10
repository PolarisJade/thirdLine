import { useCallback, useMemo, useRef, useState } from 'react'
import { ToastContext, type ToastContextValue, type ToastItem, type ToastType } from './ToastContext'
import { Icon, type IconName } from './Icon'

const ICONS: Record<ToastType, IconName> = {
  success: 'check',
  error: 'close',
  warning: 'alert',
  info: 'info',
}

const DURATION = 3600

/**
 * 轻量 Toast。用于所有接口调用的结果反馈，
 * 文案直接使用后端 Result.message（例如 "该用户名已被占用"）。
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const [leaving, setLeaving] = useState<number[]>([])
  const seedRef = useRef(0)

  const remove = useCallback((id: number) => {
    // 先播放退出动画，再真正移除
    setLeaving((prev) => [...prev, id])
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id))
      setLeaving((prev) => prev.filter((item) => item !== id))
    }, 220)
  }, [])

  const push = useCallback(
    (type: ToastType, message: string) => {
      seedRef.current += 1
      const id = seedRef.current
      setItems((prev) => [...prev, { id, type, message }])
      window.setTimeout(() => remove(id), DURATION)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message: string) => push('success', message),
      error: (message: string) => push('error', message),
      warning: (message: string) => push('warning', message),
      info: (message: string) => push('info', message),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport">
        {items.map((item) => (
          <div
            key={item.id}
            className={`toast glass glass--strong toast--${item.type}${leaving.includes(item.id) ? ' toast--out' : ''}`}
            role="status"
          >
            <span className="toast__icon">
              <Icon name={ICONS[item.type]} size={17} strokeWidth={2.2} />
            </span>
            <span className="toast__content">{item.message}</span>
            <button className="toast__close" onClick={() => remove(item.id)} aria-label="关闭提示" type="button">
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
