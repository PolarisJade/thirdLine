import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Modal, Space, Tooltip, Typography, message } from 'antd'
import { ChatDots, Flag, Pause, Play, PaperPlaneRight } from '@phosphor-icons/react'
import { getDanmakuPool, reportDanmaku, sendDanmaku } from '@/api/danmaku'
import { useAuthStore } from '@/store/authStore'
import type { DanmakuVO } from '@/types'
import heroBg from '@/assets/首页背景.jpg'

const { Text } = Typography

/** 弹幕轨道数量与配色预设 */
const LANES = 8
const COLOR_PRESETS = ['#FFFFFF', '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C780FA']

/** 当前用户「是否展示弹幕」的本地记忆键（仅对本人浏览器生效） */
const VISIBLE_KEY = 'thirdline_danmaku_visible'

/** 为一条弹幕计算滚动样式：按索引分配到轨道，速度/起始位置随轨道变化 */
function bulletStyle(index: number) {
  const lane = index % LANES
  // 每条轨道时长不同（越大越慢），同轨道靠起始负延迟错开
  const duration = 13 + lane * 1.6
  const delay = -((index * 1.7) % duration)
  const top = 6 + lane * (86 / LANES)
  return {
    top: `${top}%`,
    left: '100%',
    color: undefined,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
  } as React.CSSProperties
}

export default function Danmaku() {
  const navigate = useNavigate()
  const isLoggedIn = useAuthStore((s) => !!s.token)

  const [pool, setPool] = useState<DanmakuVO[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  // 当前用户的弹幕展示开关（本地记忆，默认展示）
  const [visible, setVisible] = useState<boolean>(() => localStorage.getItem(VISIBLE_KEY) !== '0')

  const [content, setContent] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [sending, setSending] = useState(false)

  // 举报弹窗
  const [reportTarget, setReportTarget] = useState<DanmakuVO | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [reporting, setReporting] = useState(false)

  const loadPool = useCallback(() => {
    setLoading(true)
    getDanmakuPool(50)
      .then((data) => {
        setEnabled(data?.enabled ?? true)
        setPool(data?.items ?? [])
      })
      .catch(() => {
        // 拦截器已提示
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadPool()
  }, [loadPool])

  // 同步个人展示偏好到本地
  useEffect(() => {
    localStorage.setItem(VISIBLE_KEY, visible ? '1' : '0')
  }, [visible])

  const bullets = useMemo(() => pool, [pool])

  const requireLogin = () => {
    message.info('登录后才能参与弹幕')
    navigate('/login', { state: { from: { pathname: '/danmaku' } } })
  }

  const onSend = async () => {
    if (!isLoggedIn) {
      requireLogin()
      return
    }
    const text = content.trim()
    if (!text) {
      message.warning('弹幕内容不能为空')
      return
    }
    setSending(true)
    try {
      const created = await sendDanmaku({ content: text, color })
      // 乐观追加，避免整池闪烁重排；随后静默刷新以对齐服务端
      setPool((prev) => [...prev, created])
      setContent('')
      message.success('发送成功')
      loadPool()
    } catch {
      // 敏感词 / 频率 / 未登录等错误由拦截器统一提示
    } finally {
      setSending(false)
    }
  }

  const openReport = (item: DanmakuVO) => {
    if (!isLoggedIn) {
      requireLogin()
      return
    }
    setReportTarget(item)
    setReportReason('')
  }

  const submitReport = async () => {
    if (!reportTarget) return
    setReporting(true)
    try {
      await reportDanmaku({ danmakuId: reportTarget.id, reason: reportReason.trim() || undefined })
      message.success('举报已提交，感谢反馈')
      setReportTarget(null)
    } catch {
      // 重复举报 / 举报自己等错误由拦截器统一提示
    } finally {
      setReporting(false)
    }
  }

  const showBullets = enabled && visible

  return (
    <div
      className="danmaku-stage"
      style={{
        minHeight: 'calc(100vh - 4rem)',
        backgroundImage: `linear-gradient(rgba(10,10,12,0.35), rgba(10,10,12,0.55)), url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* 顶部控制条 */}
      <div className="flex items-center justify-between px-6 pt-6 sm:px-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
            <ChatDots size={20} weight="bold" />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold text-white">弹幕广场</h2>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {!enabled ? '弹幕功能已关闭' : loading ? '正在加载弹幕…' : `共 ${pool.length} 条弹幕在滚动`}
            </Text>
          </div>
        </div>
        {/* 针对当前用户的展示开关 */}
        <Tooltip title={visible ? '点击隐藏弹幕（仅对你自己生效）' : '点击显示弹幕'}>
          <button
            type="button"
            disabled={!enabled}
            onClick={() => setVisible((v) => !v)}
            style={{ opacity: enabled ? 1 : 0.4 }}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-white/50 bg-white/15 px-3 py-1.5 text-sm text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed"
          >
            {visible ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
            {visible ? '隐藏弹幕' : '显示弹幕'}
          </button>
        </Tooltip>
      </div>

      {/* 弹幕滚动区 */}
      {enabled ? (
        <div
          style={{ position: 'absolute', inset: 0 }}
        >
          {showBullets &&
            bullets.map((item, i) => {
              const style = bulletStyle(i)
              return (
                <div
                  key={item.id}
                  className="danmaku-item"
                  style={{ ...style, color: item.color || '#FFFFFF' }}
                >
                  {item.content}
                  <span
                    className="danmaku-report"
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      openReport(item)
                    }}
                  >
                    <Flag size={14} weight="fill" style={{ verticalAlign: -2 }} /> 举报
                  </span>
                </div>
              )
            })}
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="rounded-xl border border-white/30 bg-black/40 px-8 py-6 text-center backdrop-blur">
            <div className="font-serif text-lg text-white">弹幕功能当前已关闭</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
              站长暂时关闭了全站弹幕，稍后再来看看吧
            </div>
          </div>
        </div>
      )}

      {/* 底部发送栏 */}
      {enabled && (
        <div className="absolute inset-x-0 bottom-0 px-4 pb-6 sm:px-10">
          <div className="mx-auto max-w-3xl rounded-2xl border border-white/25 bg-black/40 p-4 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>颜色</span>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
                  }}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
            <Space.Compact className="w-full">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPressEnter={onSend}
                placeholder={isLoggedIn ? '友善发一条弹幕，回车或点击发送…' : '登录后即可发送弹幕'}
                maxLength={100}
                showCount
                disabled={sending}
              />
              <Button
                type="primary"
                loading={sending}
                icon={<PaperPlaneRight size={16} weight="fill" />}
                onClick={onSend}
              >
                发送
              </Button>
            </Space.Compact>
          </div>
        </div>
      )}

      {/* 举报弹窗 */}
      <Modal
        title="举报弹幕"
        open={!!reportTarget}
        onOk={submitReport}
        onCancel={() => setReportTarget(null)}
        okText="提交举报"
        cancelText="取消"
        confirmLoading={reporting}
        forceRender
      >
        {reportTarget && (
          <>
            <div className="mb-2 text-sm text-muted">
              举报内容：
              <span className="ml-1 rounded bg-bone px-2 py-0.5 text-charcoal">
                {reportTarget.content}
              </span>
            </div>
            <Input.TextArea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="补充举报理由（选填）"
              rows={3}
              maxLength={200}
              showCount
            />
          </>
        )}
      </Modal>
    </div>
  )
}
