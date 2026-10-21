import type { PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/components/Icon'
import { cx } from '@/utils/format'
import type { WallGeometry } from '@/utils/wallLayout'
import type { WallColorVO } from '@/api'

export interface WallDraftState {
  posX: number
  posY: number
  content: string
  color: string
}

export interface WallDraftProps {
  draft: WallDraftState
  geometry: WallGeometry
  palette: WallColorVO[]
  maxLength: number
  dragging: boolean
  saving: boolean
  /** 操作条是否放到信纸上方（靠近视口底部时由页面计算） */
  confirmAbove: boolean
  onContentChange: (value: string) => void
  onColorChange: (key: string) => void
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onSubmit: () => void
  onCancel: () => void
}

/**
 * 还没上墙的草稿信纸。
 *
 * 双击空白后直接长在墙上，可以边写边拖；点「√」才真正提交（发 POST），
 * 点「×」直接丢弃 —— 也就是需求里的「这张本来就不存在，说明用户不要这条留言」。
 */
export function WallDraft({
  draft,
  geometry,
  palette,
  maxLength,
  dragging,
  saving,
  confirmAbove,
  onContentChange,
  onColorChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSubmit,
  onCancel,
}: WallDraftProps) {
  const count = Array.from(draft.content).length
  const overLimit = count > maxLength
  const background = palette.find((item) => item.key === draft.color)?.color ?? palette[0]?.color ?? '#FFD9E3'

  return (
    <div
      className={cx('wall-note', 'wall-note--draft', dragging && 'is-dragging')}
      style={{
        left: draft.posX,
        top: draft.posY,
        width: geometry.paperWidth,
        height: geometry.paperHeight,
        zIndex: 950,
      }}
      role="group"
      aria-label="写留言"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="wall-note__paper wall-draft__paper" style={{ background }}>
        <span className="wall-note__fold" aria-hidden="true" />

        <textarea
          className="wall-draft__input"
          value={draft.content}
          onChange={(event) => onContentChange(event.target.value)}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              onSubmit()
            }
          }}
          placeholder="写点什么，然后点 √ 贴上墙…"
          aria-label="留言内容"
          autoFocus
          spellCheck={false}
        />

        <div className="wall-draft__bar" onPointerDown={(event) => event.stopPropagation()}>
          <div className="wall-draft__colors" role="group" aria-label="选择信纸颜色">
            {palette.map((item) => (
              <button
                key={item.key}
                type="button"
                className={cx('wall-draft__color', item.key === draft.color && 'is-active')}
                style={{ background: item.color }}
                title={item.label}
                aria-label={item.label}
                aria-pressed={item.key === draft.color}
                onClick={() => onColorChange(item.key)}
              />
            ))}
          </div>
          <span className={cx('wall-draft__count', overLimit && 'is-over')}>
            {count}/{maxLength}
          </span>
        </div>
      </div>

      <div
        className={cx('wall-confirm', 'wall-confirm--draft', confirmAbove && 'wall-confirm--above')}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="wall-confirm__btn wall-confirm__btn--ok"
          aria-label="贴上墙"
          title="贴上墙（Ctrl/⌘ + Enter）"
          disabled={saving || overLimit}
          onClick={onSubmit}
        >
          {saving ? <span className="wall-spinner" /> : <Icon name="check" size={16} strokeWidth={2.2} />}
        </button>
        <button
          type="button"
          className="wall-confirm__btn wall-confirm__btn--cancel"
          aria-label="放弃这条留言"
          title="放弃这条留言"
          disabled={saving}
          onClick={onCancel}
        >
          <Icon name="close" size={15} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  )
}
