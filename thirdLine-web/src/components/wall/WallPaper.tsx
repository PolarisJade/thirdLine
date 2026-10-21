import type { PointerEvent as ReactPointerEvent } from 'react'
import { Icon } from '@/components/Icon'
import { cx, formatMonthDay } from '@/utils/format'
import type { WallGeometry } from '@/utils/wallLayout'
import type { WallNoteVO } from '@/api'

export interface WallPaperProps {
  note: WallNoteVO
  geometry: WallGeometry
  /** 信纸底色，由色板 key 映射得到 */
  background: string
  zIndex: number
  /** 正在拖动（抬起阴影、提高层级） */
  dragging: boolean
  /** 自己刚提交、还没通过审核的留言 */
  pending: boolean
  /** 拖动后等待确认 */
  confirmOpen: boolean
  /** 是否展示举报按钮（自己的留言不展示） */
  canReport: boolean
  /** 已经举报过 */
  reported: boolean
  /** 正在提交位置，确认按钮暂时禁用 */
  busy: boolean
  /** 确认条是否放到信纸上方（靠近视口底部时由页面计算） */
  confirmAbove: boolean
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>, id: number) => void
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void
  onConfirm: () => void
  onCancel: () => void
  onReport: () => void
}

/**
 * 墙面上的一张信纸。
 *
 * 结构分三层：外层负责定位与拖动（不旋转，坐标就是碰撞用的矩形），
 * 内层负责纸面旋转与视觉，确认条独立于纸面，保证它始终水平可点。
 */
export function WallPaper({
  note,
  geometry,
  background,
  zIndex,
  dragging,
  pending,
  confirmOpen,
  canReport,
  reported,
  busy,
  confirmAbove,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onConfirm,
  onCancel,
  onReport,
}: WallPaperProps) {
  // 信纸高度固定，长留言靠缩小字号来保证能完整放进纸里：
  // 45 字以内用正常字号，之后逐级降到 11.5px，120 字也能在 6 行内放下
  const charCount = Array.from(note.content).length
  const contentFontSize = charCount <= 45 ? 15 : charCount <= 75 ? 13.5 : charCount <= 100 ? 12.5 : 11.5

  return (
    <div
      className={cx(
        'wall-note',
        note.owned && 'wall-note--mine',
        dragging && 'is-dragging',
        pending && 'is-pending',
        confirmOpen && 'is-confirming',
      )}
      style={{
        left: note.posX,
        top: note.posY,
        width: geometry.paperWidth,
        height: geometry.paperHeight,
        zIndex: dragging ? 900 : confirmOpen ? 800 : zIndex,
      }}
      role="article"
      aria-label="留言"
      title={note.owned ? '按住可以拖动这张信纸' : '别人贴的留言，只有作者能拖动'}
      onPointerDown={(event) => onPointerDown(event, note.id)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="wall-note__paper"
        style={{ background, transform: `rotate(${note.rotateDeg ?? 0}deg)` }}
      >
        <span className="wall-note__fold" aria-hidden="true" />
        <p className="wall-note__content" style={{ fontSize: contentFontSize }}>
          {note.content}
        </p>

        <div className="wall-note__foot">
          <time className="wall-note__date" dateTime={note.createTime || undefined}>
            {formatMonthDay(note.createTime)}
          </time>

          {canReport && (
            <button
              type="button"
              className={cx('wall-note__flag', reported && 'is-reported')}
              title={reported ? '已经举报过' : '举报这条留言'}
              aria-label={reported ? '已经举报过' : '举报这条留言'}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation()
                if (!reported) onReport()
              }}
            >
              <Icon name="flag" size={13} />
            </button>
          )}
        </div>

        {pending && <span className="wall-note__badge">审核中</span>}
      </div>

      {confirmOpen && (
        <div
          className={cx('wall-confirm', confirmAbove && 'wall-confirm--above')}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="wall-confirm__btn wall-confirm__btn--ok"
            aria-label="确认放在这里"
            title="确认放在这里"
            disabled={busy}
            onClick={onConfirm}
          >
            <Icon name="check" size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="wall-confirm__btn wall-confirm__btn--cancel"
            aria-label="取消，回到原来的位置"
            title="取消，回到原来的位置"
            disabled={busy}
            onClick={onCancel}
          >
            <Icon name="close" size={15} strokeWidth={2.2} />
          </button>
        </div>
      )}
    </div>
  )
}
