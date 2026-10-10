import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'
import { Button } from './Button'
import { cx } from '@/utils/format'

/* ==================================================================== 模态框 */

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** 点击遮罩是否关闭，默认关闭（表单类不建议开） */
  maskClosable?: boolean
}

export function Modal({ open, onClose, title, children, footer, size = 'md', maskClosable = true }: ModalProps) {
  // Esc 关闭 + 打开时锁定页面滚动
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-mask" onMouseDown={maskClosable ? (event) => event.target === event.currentTarget && onClose() : undefined}>
      <div className={cx('modal glass glass--strong', `modal--${size}`)} role="dialog" aria-modal="true">
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <Button variant="ghost" iconOnly icon="close" size="sm" onClick={onClose} aria-label="关闭" />
          </div>
        )}
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

/* ================================================================= 确认对话框 */

export interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 二次确认弹窗，所有删除操作都走这里，避免误删 */
export function ConfirmDialog({
  open,
  title = '确认操作',
  message,
  confirmText = '确定',
  cancelText = '取消',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      maskClosable={!loading}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 38,
            height: 38,
            borderRadius: 12,
            flexShrink: 0,
            color: danger ? 'var(--danger)' : 'var(--warning)',
            background: danger ? 'var(--danger-soft)' : 'var(--warning-soft)',
          }}
        >
          <Icon name="alert" size={19} />
        </span>
        <div style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--text-secondary)', paddingTop: 6 }}>{message}</div>
      </div>
    </Modal>
  )
}
