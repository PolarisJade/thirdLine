import { useCallback, useEffect, useRef, useState } from 'react'
import { danmakuApi, type DanmakuPoolVO } from '@/api'
import { getToken } from '@/api/token'
import { errorMessage } from '@/utils/format'
import { useToast } from '@/components/ToastContext'

/** 弹幕一行的高度，用于分配轨道避免重叠 */
const TRACK_HEIGHT = 42
/** 最多使用的轨道数，超出的弹幕复用轨道 */
const MAX_TRACKS = 6
/**
 * 第一条弹幕距容器顶部的偏移。
 * 用 CSS 变量控制，便于窄屏（Hero 高度变小）时压缩轨道空间。
 */
function baseTop(): number {
  if (typeof window === 'undefined') return 20
  const value = getComputedStyle(document.documentElement).getPropertyValue('--danmaku-top').trim()
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 20
}

export interface FlyingDanmaku {
  /** 唯一 key：同一个 id 可能因为刷新重复出现，加随机后缀 */
  key: string
  id: number
  content: string
  color: string
  nickname: string | null
  userId: number | null
  /** 距顶部的像素偏移 */
  top: number
  /** 动画时长（秒），速度略有差异更自然 */
  duration: number
}

/**
 * 弹幕池 + 发射逻辑。
 *
 * 数据来源：GET /user/danmaku/pool（含全局开关与可见弹幕列表）
 * 发送：POST /user/danmaku/send（需登录，后端 5 秒限频，内容含敏感词会被拒绝）
 */
export function useDanmaku(options: { autoLoad?: boolean } = {}) {
  const { autoLoad = true } = options
  const toast = useToast()

  const [pool, setPool] = useState<DanmakuPoolVO | null>(null)
  const [flying, setFlying] = useState<FlyingDanmaku[]>([])
  const trackRef = useRef(0)
  const seedRef = useRef(0)

  const load = useCallback(async () => {
    try {
      const data = await danmakuApi.pool(60)
      setPool(data)
      return data
    } catch (error) {
      // 弹幕是锦上添花的功能，拉取失败静默处理，不打扰用户
      console.warn('[danmaku] 弹幕池加载失败：', errorMessage(error))
      return null
    }
  }, [])

  useEffect(() => {
    if (autoLoad) void load()
  }, [autoLoad, load])

  /** 往屏幕上发射一条弹幕 */
  const launch = useCallback((item: { id: number; content: string; color?: string | null; nickname?: string | null; userId?: number | null }) => {
    seedRef.current += 1
    const track = trackRef.current % MAX_TRACKS
    trackRef.current += 1

    const flyingItem: FlyingDanmaku = {
      key: `${item.id}-${seedRef.current}`,
      id: item.id,
      content: item.content,
      color: item.color || '#FFFFFF',
      nickname: item.nickname ?? null,
      userId: item.userId ?? null,
      top: baseTop() + track * TRACK_HEIGHT,
      // 时长与内容长度相关，快慢交错看起来更自然
      duration: Math.min(17, Math.max(9, 9 + item.content.length * 0.18)),
    }

    setFlying((prev) => [...prev, flyingItem])
  }, [])

  /** 动画结束由调用方移除，避免元素堆积 */
  const removeFlying = useCallback((key: string) => {
    setFlying((prev) => prev.filter((item) => item.key !== key))
  }, [])

  /** 定时从弹幕池里取内容循环发射 */
  useEffect(() => {
    if (!pool?.enabled || !pool.items?.length) return

    // 首次进入先发射一部分，避免空屏等待
    const initial = pool.items.slice(-6)
    initial.forEach((item, index) => {
      window.setTimeout(() => launch(item), index * 900)
    })

    const timer = window.setInterval(() => {
      const items = pool.items
      if (!items.length) return
      launch(items[Math.floor(Math.random() * items.length)])
    }, 4200)

    return () => window.clearInterval(timer)
  }, [pool, launch])

  /** 发送弹幕：未登录先提示，成功后立即上屏 */
  const send = useCallback(
    async (content: string, color: string): Promise<boolean> => {
      const text = content.trim()
      if (!text) {
        toast.warning('弹幕内容不能为空')
        return false
      }
      if (text.length > 100) {
        toast.warning('弹幕内容不能超过 100 个字符')
        return false
      }
      if (!getToken()) {
        toast.warning('登录后才能发送弹幕')
        return false
      }

      try {
        const created = await danmakuApi.send({ content: text, color })
        launch(created)
        // 同步进本地池，保证下次拉取前也能循环播放
        setPool((prev) => (prev ? { ...prev, items: [...prev.items, created] } : prev))
        toast.success('弹幕已发送')
        return true
      } catch (error) {
        toast.error(errorMessage(error))
        return false
      }
    },
    [launch, toast],
  )

  /** 举报弹幕 */
  const report = useCallback(
    async (danmakuId: number, reason: string): Promise<boolean> => {
      if (!getToken()) {
        toast.warning('登录后才能举报')
        return false
      }
      try {
        await danmakuApi.report({ danmakuId, reason: reason.trim() || '内容不当' })
        toast.success('举报已提交，感谢你的反馈')
        return true
      } catch (error) {
        toast.error(errorMessage(error))
        return false
      }
    },
    [toast],
  )

  return {
    /** 全局开关，false 时不展示弹幕层与发送框 */
    enabled: pool?.enabled ?? false,
    total: pool?.items?.length ?? 0,
    flying,
    launch,
    removeFlying,
    send,
    report,
    reload: load,
  }
}
