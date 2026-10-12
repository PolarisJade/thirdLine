import type { CSSProperties, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import * as RadixSelect from '@radix-ui/react-select'
import { Icon, type IconName } from './Icon'
import { cx } from '@/utils/format'

/* ================================================================== 表单字段 */

export interface FieldProps {
  label?: string
  required?: boolean
  hint?: string
  error?: string
  children: ReactNode
  /** 让 label 与控件同一行（用于开关类） */
  inline?: boolean
}

/** 表单字段外壳：label + 控件 + 提示/错误文案 */
export function Field({ label, required, hint, error, children, inline = false }: FieldProps) {
  return (
    <label className="field" style={inline ? { flexDirection: 'row', alignItems: 'center', gap: 12 } : undefined}>
      {label && <span className={cx('field__label', required && 'field__label--required')}>{label}</span>}
      {inline ? (
        <>
          {children}
          <span className="grow" />
        </>
      ) : (
        children
      )}
      {error ? <span className="field__error">{error}</span> : hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  )
}

/* ===================================================================== 输入框 */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: IconName
  /** 右侧插槽，例如验证码倒计时按钮 */
  suffix?: ReactNode
}

export function Input({ icon, suffix, className, ...rest }: InputProps) {
  if (!icon && !suffix) {
    return <input className={cx('input', className)} {...rest} />
  }

  return (
    <div className="input-group">
      {icon && (
        <span className="input-group__icon">
          <Icon name={icon} size={16} />
        </span>
      )}
      <input className={cx('input', className)} {...rest} />
      {suffix && <span className="input-group__suffix">{suffix}</span>}
    </div>
  )
}

/* ===================================================================== 文本域 */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 显示字数统计 */
  showCount?: boolean
  maxLength?: number
}

export function Textarea({ showCount, maxLength, value, className, ...rest }: TextareaProps) {
  const length = typeof value === 'string' ? value.length : 0

  return (
    <div className="stack" style={{ gap: 4 }}>
      <textarea className={cx('textarea', className)} maxLength={maxLength} value={value} {...rest} />
      {showCount && (
        <span className="field__hint" style={{ textAlign: 'right' }}>
          {length}
          {maxLength ? ` / ${maxLength}` : ''}
        </span>
      )}
    </div>
  )
}

/* ===================================================================== 下拉框 */

export interface SelectOption {
  label: string
  value: string | number
}

/** Radix 的 Item 不接受空字符串，用哨兵值表示"未选择"，对外仍然回传空字符串 */
const NONE_VALUE = '__none__'

export interface SelectProps {
  options: SelectOption[]
  /** 未选择时展示的文案；同时作为下拉第一项，选中它即清空选择 */
  placeholder?: string
  value?: string | number
  /**
   * 刻意与原生的 select 保持一致：调用方仍从 event.target.value 取值，
   * 清空选择时拿到空字符串 —— 这样全站调用处一行都不用改。
   */
  onChange?: (event: { target: { value: string } }) => void
  className?: string
  style?: CSSProperties
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

/**
 * 下拉选择框。
 *
 * 触发器沿用 `.select` 的玻璃外观，弹层基于 Radix Select：
 * 键盘操作（↑↓/Enter/Esc/首字母）、焦点管理、aria 语义、点击外部关闭、滚动跟随
 * 都由 Radix 负责；视觉全部在 styles/ui.css 的 `.select-popover*` 里定义。
 */
export function Select({
  options,
  placeholder,
  value,
  onChange,
  className,
  style,
  disabled,
  id,
  ...rest
}: SelectProps) {
  const current = value === undefined || value === null || value === '' ? NONE_VALUE : String(value)

  return (
    <RadixSelect.Root
      value={current}
      disabled={disabled}
      onValueChange={(next) => onChange?.({ target: { value: next === NONE_VALUE ? '' : next } })}
    >
      <RadixSelect.Trigger id={id} className={cx('select', className)} style={style} {...rest}>
        <RadixSelect.Value placeholder={placeholder ?? '请选择'} />
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className="select-popover glass glass--strong" position="popper" sideOffset={6}>
          <RadixSelect.Viewport className="select-popover__viewport">
            {placeholder !== undefined && (
              <RadixSelect.Item value={NONE_VALUE} className="select-popover__item">
                <RadixSelect.ItemText>{placeholder}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="select-popover__check">
                  <Icon name="check" size={14} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            )}

            {options.map((option) => (
              <RadixSelect.Item key={option.value} value={String(option.value)} className="select-popover__item">
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                <RadixSelect.ItemIndicator className="select-popover__check">
                  <Icon name="check" size={14} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

/* ====================================================================== 开关 */

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  'aria-label'?: string
}

export function Switch({ checked, onChange, disabled, label, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest['aria-label'] ?? label}
      disabled={disabled}
      className={cx('switch', checked && 'switch--on')}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__thumb" />
    </button>
  )
}

/** 带标题与说明的开关行，管理端表单复用 */
export function SwitchRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="switch-row">
      <div className="stack">
        <span className="switch-row__label">{label}</span>
        {desc && <span className="switch-row__desc">{desc}</span>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

/* ====================================================================== 徽章 */

export type BadgeTone = 'default' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export function Badge({ tone = 'default', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cx('badge', tone !== 'default' && `badge--${tone}`)}>{children}</span>
}

/* ====================================================================== 头像 */

export function Avatar({
  src,
  name,
  size = 'md',
}: {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const initial = name?.trim().charAt(0).toUpperCase() ?? '三'
  const className = cx('avatar', size !== 'md' && `avatar--${size}`)

  return (
    <span className={className}>
      {src?.trim() ? (
        <img
          src={src}
          alt={name ?? '头像'}
          loading="lazy"
          onError={(event) => {
            // 图片失效时退回首字母样式，避免出现破图
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        initial
      )}
    </span>
  )
}
