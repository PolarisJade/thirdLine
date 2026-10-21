import { useEffect, useState } from 'react'
import { Button } from '@/components/Button'
import { Field, Textarea } from '@/components/Form'
import { Modal } from '@/components/Modal'
import { cx } from '@/utils/format'

/** 举报类型与后端 WallNoteReport 的 REASON_* 常量一一对应 */
const REASONS = [
  { value: 1, label: '垃圾广告', desc: '推广链接、二维码、拉群' },
  { value: 2, label: '辱骂攻击', desc: '人身攻击、恶意嘲讽' },
  { value: 3, label: '色情低俗', desc: '露骨内容、擦边信息' },
  { value: 4, label: '政治敏感', desc: '不当的政治言论' },
  { value: 5, label: '违法信息', desc: '诈骗、赌博、违禁品' },
  { value: 6, label: '其他', desc: '以上都不是，补充说明' },
] as const

export interface WallReportModalProps {
  open: boolean
  /** 被举报留言的正文，用于二次确认举报对象 */
  noteContent: string
  submitting: boolean
  onClose: () => void
  onSubmit: (reasonType: number, reason: string) => void
}

/**
 * 举报弹窗。
 * 只让用户选一个固定类型 + 可选补充说明，不收集自由文本之外的信息。
 */
export function WallReportModal({ open, noteContent, submitting, onClose, onSubmit }: WallReportModalProps) {
  const [reasonType, setReasonType] = useState(0)
  const [reason, setReason] = useState('')

  // 每次打开都重置，避免上一次的选项残留
  useEffect(() => {
    if (open) {
      setReasonType(0)
      setReason('')
    }
  }, [open])

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose()
      }}
      title="举报留言"
      size="md"
      maskClosable={!submitting}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button
            type="button"
            variant="danger"
            icon="flag"
            loading={submitting}
            disabled={reasonType === 0}
            onClick={() => onSubmit(reasonType, reason.trim())}
          >
            提交举报
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 'var(--space-4)' }}>
        <div className="wall-report__quote">
          <span className="wall-report__quote-label">被举报的留言</span>
          <p className="wall-report__quote-text">{noteContent}</p>
        </div>

        <div className="wall-report__reasons" role="radiogroup" aria-label="举报原因">
          {REASONS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={reasonType === item.value}
              className={cx('wall-report__reason', reasonType === item.value && 'is-active')}
              onClick={() => setReasonType(item.value)}
            >
              <span className="wall-report__dot" aria-hidden="true" />
              <span className="wall-report__reason-text">
                <span className="wall-report__reason-label">{item.label}</span>
                <span className="wall-report__reason-desc">{item.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <Field label="补充说明" hint="选填，最多 200 字；恶意举报同样会被记录">
          <Textarea
            rows={3}
            maxLength={200}
            showCount
            value={reason}
            placeholder="可以补充具体问题，方便我判断…"
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>

        <p className="wall-report__note">举报会进入后台待处理队列，由站主统一核实；处理结果不会公开。</p>
      </div>
    </Modal>
  )
}
