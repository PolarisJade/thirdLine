import { useState } from 'react'
import { useDanmaku, type FlyingDanmaku } from '@/hooks/useDanmaku'
import { Icon } from './Icon'
import { Button } from './Button'
import { Modal, ConfirmDialog } from './Modal'
import { Textarea } from './Form'
import { useAuth } from '@/contexts/AuthContext'
import { cx } from '@/utils/format'

/** 弹幕可选颜色，默认白色为首选 */
const COLORS = ['#FFFFFF', '#FFD98E', '#FFB7A0', '#F7A8B8', '#A8D5BA', '#9EC5FE']

const REPORT_REASONS = ['内容不当', '广告推广', '人身攻击', '违法违规', '其他']

/* ================================================================= 飞行层 */

function DanmakuItem({ item, onEnd, onReport }: { item: FlyingDanmaku; onEnd: () => void; onReport: () => void }) {
  return (
    <div
      className="danmaku-layer__item"
      style={{ top: item.top, color: item.color, animationDuration: `${item.duration}s` }}
      onAnimationEnd={onEnd}
    >
      {item.nickname && <span className="danmaku-layer__nickname">{item.nickname}</span>}
      <span>{item.content}</span>
      <button
        type="button"
        className="danmaku-layer__report"
        onClick={(event) => {
          event.stopPropagation()
          onReport()
        }}
        aria-label="举报这条弹幕"
        title="举报"
      >
        <Icon name="flag" size={12} />
      </button>
    </div>
  )
}

/* =============================================================== 发送输入框 */

function DanmakuSender({ onSend, disabled }: { onSend: (content: string, color: string) => Promise<boolean>; disabled?: boolean }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [showColors, setShowColors] = useState(false)
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (sending) return
    setSending(true)
    const ok = await onSend(content, color)
    setSending(false)
    if (ok) setContent('')
  }

  return (
    <div className="danmaku-sender glass glass--strong">
      <button
        type="button"
        className="danmaku-sender__color"
        style={{ background: color, width: 18, height: 18 }}
        onClick={() => setShowColors((prev) => !prev)}
        aria-label="选择弹幕颜色"
        title="选择颜色"
      />

      {showColors && (
        <div className="danmaku-sender__colors">
          {COLORS.map((item) => (
            <button
              type="button"
              key={item}
              className={cx('danmaku-sender__color', item === color && 'danmaku-sender__color--active')}
              style={{ background: item }}
              onClick={() => {
                setColor(item)
                setShowColors(false)
              }}
              aria-label={`使用颜色 ${item}`}
            />
          ))}
        </div>
      )}

      <input
        className="danmaku-sender__input"
        placeholder={disabled ? '弹幕功能已关闭' : user ? '发一条弹幕吧…' : '登录后可发送弹幕'}
        value={content}
        maxLength={100}
        disabled={disabled}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') void submit()
        }}
      />

      <Button
        variant="primary"
        size="sm"
        icon="send"
        loading={sending}
        disabled={disabled || !content.trim()}
        onClick={() => void submit()}
      >
        发送
      </Button>
    </div>
  )
}

/* ============================================================= 举报弹窗 */

function ReportDialog({
  danmakuId,
  onClose,
  onSubmit,
}: {
  danmakuId: number | null
  onClose: () => void
  onSubmit: (id: number, reason: string) => Promise<boolean>
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0])
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (danmakuId === null) return
    setSubmitting(true)
    const finalReason = reason === '其他' && detail.trim() ? detail.trim() : reason
    const ok = await onSubmit(danmakuId, finalReason)
    setSubmitting(false)
    if (ok) {
      setDetail('')
      setReason(REPORT_REASONS[0])
      onClose()
    }
  }

  return (
    <Modal
      open={danmakuId !== null}
      onClose={onClose}
      title="举报弹幕"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button variant="danger" onClick={() => void submit()} loading={submitting}>
            提交举报
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 14 }}>
        <div className="tag-list">
          {REPORT_REASONS.map((item) => (
            <button
              type="button"
              key={item}
              className={cx('tag-chip', item === reason && 'tag-chip--active')}
              onClick={() => setReason(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <Textarea
          value={detail}
          maxLength={200}
          showCount
          placeholder="补充说明（选填，最多 200 字）"
          onChange={(event) => setDetail(event.target.value)}
        />
      </div>
    </Modal>
  )
}

/* ================================================================ 弹幕总控 */

/**
 * 弹幕舞台：飞行弹幕层 + 悬浮开关 + 发送输入框 + 举报弹窗。
 *
 * 默认以 `contained` 模式使用：外层需要是一个 `position: relative` 的容器
 * （首页放在 Hero 卡片内部），这样弹幕只在 Hero 区域内飘过，
 * 既不会盖住顶部导航，也不会在长页面上与内容抢注意力。
 */
export function DanmakuStage({ sender = true, contained = true }: { sender?: boolean; contained?: boolean }) {
  const { enabled, total, flying, removeFlying, send, report } = useDanmaku()
  const [visible, setVisible] = useState(true)
  const [reportId, setReportId] = useState<number | null>(null)
  const [reportingSelf, setReportingSelf] = useState(false)
  const { user } = useAuth()

  const handleReportClick = (item: FlyingDanmaku) => {
    // 不能举报自己发的弹幕（后端也会校验：DANMAKU_REPORT_SELF）
    if (user && item.userId === user.id) {
      setReportingSelf(true)
      return
    }
    setReportId(item.id)
  }

  const showLayer = enabled && visible

  return (
    <>
      {showLayer && (
        <div className={cx('danmaku-layer', contained && 'danmaku-layer--contained')} aria-hidden="true">
          {flying.map((item) => (
            <DanmakuItem
              key={item.key}
              item={item}
              onEnd={() => removeFlying(item.key)}
              onReport={() => handleReportClick(item)}
            />
          ))}
        </div>
      )}

      {/* 弹幕开关 */}
      <button
        type="button"
        className={cx(
          'danmaku-toggle glass glass--strong',
          contained && 'danmaku-toggle--contained',
          !enabled && 'danmaku-toggle--off',
        )}
        onClick={() => setVisible((prev) => !prev)}
        disabled={!enabled}
        title={enabled ? (visible ? '隐藏弹幕' : '显示弹幕') : '管理员已关闭弹幕功能'}
      >
        <Icon name={visible && enabled ? 'message' : 'eyeOff'} size={15} />
        {enabled ? `弹幕 ${total}` : '弹幕已关闭'}
      </button>

      {/* 发送输入框：容器内模式贴在 Hero 底部，避免悬浮层遮挡正文 */}
      {sender && enabled && (
        <div className={contained ? 'danmaku-sender--inline' : 'danmaku-sender-wrap'}>
          <DanmakuSender onSend={send} disabled={!enabled} />
        </div>
      )}

      <ReportDialog danmakuId={reportId} onClose={() => setReportId(null)} onSubmit={report} />

      <ConfirmDialog
        open={reportingSelf}
        title="无法举报"
        message="这是你自己发送的弹幕，不能举报自己哦。"
        confirmText="知道了"
        cancelText="关闭"
        danger={false}
        onConfirm={() => setReportingSelf(false)}
        onCancel={() => setReportingSelf(false)}
      />
    </>
  )
}
