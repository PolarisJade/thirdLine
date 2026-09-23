import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import dayjs from 'dayjs'
import { Camera, SpinnerGap, X } from '@phosphor-icons/react'
import { listPhotos } from '@/api/photo'
import { formatDate, formatFileSize } from '@/utils/format'
import type { PhotoVO } from '@/types'

/** 不同年份的时间轴配色：有区分度又克制，契合 minimalist-ui */
const YEAR_COLORS = [
  '#1f6c9f',
  '#346538',
  '#9f2f2d',
  '#956400',
  '#5b4b8a',
  '#2f6f6a',
  '#b0563a',
  '#4a6fa5',
]

/**
 * 相册：横向可拖拽时间线。
 * - 以 createTime 为时间节点，左旧右新，初始定位在最左
 * - 照片沿轴上下交错排布，节点标注 MM-DD
 * - 以年为分界：每年轴线用不同颜色，年份切换处标年份徽标
 * - 按住鼠标拖动时间轴浏览更多照片
 * - 点击照片居中放大 + 背景虚化；再次点击照片翻转看描述；点击背景关闭
 */
export default function Album() {
  const [photos, setPhotos] = useState<PhotoVO[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PhotoVO | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [dragging, setDragging] = useState(false)

  const vpRef = useRef<HTMLDivElement>(null)
  // 拖拽状态用 ref 保存，避免频繁 re-render；moved 用于区分「拖动」与「点击」
  const drag = useRef({ down: false, moved: false, startX: 0, startScroll: 0 })

  useEffect(() => {
    listPhotos()
      .then((list) => setPhotos(list || []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false))
  }, [])

  // 按创建时间升序（左旧 → 右新）
  const sorted = useMemo(
    () => [...photos].sort((a, b) => dayjs(a.createTime).valueOf() - dayjs(b.createTime).valueOf()),
    [photos],
  )

  // 出现过的年份（升序），用于稳定分配颜色
  const years = useMemo(() => {
    const list: number[] = []
    sorted.forEach((p) => {
      const y = dayjs(p.createTime).year()
      if (!list.includes(y)) list.push(y)
    })
    return list.sort((a, b) => a - b)
  }, [sorted])

  const colorOfYear = (y: number) => {
    const idx = years.indexOf(y)
    return YEAR_COLORS[(idx < 0 ? 0 : idx) % YEAR_COLORS.length]
  }

  // 按住拖动时间轴横向滚动；位移小于阈值时视为点击，不抑制照片放大
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const vp = vpRef.current
    if (!vp) return
    drag.current = { down: true, moved: false, startX: e.clientX, startScroll: vp.scrollLeft }
    setDragging(true)
    const onMove = (ev: PointerEvent) => {
      if (!drag.current.down) return
      const dx = ev.clientX - drag.current.startX
      if (Math.abs(dx) > 4) drag.current.moved = true
      vp.scrollLeft = drag.current.startScroll - dx
    }
    const onUp = () => {
      drag.current.down = false
      setDragging(false)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      // click 在 pointerup 之后同步触发，延迟一拍再复位，保证拖拽后不误触放大
      window.setTimeout(() => {
        drag.current.moved = false
      }, 0)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const openPhoto = (p: PhotoVO) => {
    if (drag.current.moved) return
    setSelected(p)
    setFlipped(false)
  }

  const closePhoto = () => {
    setSelected(null)
    setFlipped(false)
  }

  // 放大时锁定背景滚动，并支持 ESC 关闭
  useEffect(() => {
    if (!selected) return undefined
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePhoto()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [selected])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SpinnerGap size={28} className="animate-spin text-muted" />
      </div>
    )
  }

  if (sorted.length === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 px-6 py-40 text-center">
        <Camera size={40} weight="thin" className="text-muted" />
        <h1 className="font-serif text-3xl font-semibold text-ink">相册空空如也</h1>
        <p className="text-sm text-muted">还没有照片，去后台上传第一张吧。</p>
      </div>
    )
  }

  return (
    <div className="album-tl">
      <div className="album-tl-head">
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Album</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tightest text-ink">相册</h1>
        <p className="mt-3 text-sm text-muted">
          按住拖动时间轴浏览 · 点击照片放大，再次点击翻到背面看描述
        </p>
      </div>

      <div
        ref={vpRef}
        className={`tl-viewport${dragging ? ' is-dragging' : ''}`}
        onPointerDown={onPointerDown}
      >
        <div className="tl-track">
          {sorted.map((p, i) => {
            const year = dayjs(p.createTime).year()
            const color = colorOfYear(year)
            const upper = i % 2 === 0
            const prevYear = i > 0 ? dayjs(sorted[i - 1].createTime).year() : null
            const isFirstOfYear = prevYear !== year
            return (
              <div className="tl-item" key={p.id} style={{ '--c': color } as CSSProperties}>
                {/* 年份分界：每年第一张照片处标注年份 */}
                {isFirstOfYear && (
                  <div className="tl-year">
                    <span className="tl-year-badge">{year}</span>
                    <span className="tl-year-line" />
                  </div>
                )}

                <span className="tl-axis-seg" />
                <span className="tl-node" />
                <span className={`tl-stem ${upper ? 'tl-stem-up' : 'tl-stem-down'}`} />
                <span className={`tl-date ${upper ? 'tl-date-below' : 'tl-date-above'}`}>
                  {formatDate(p.createTime, 'MM-DD')}
                </span>

                {/* 照片卡片：上下交错 */}
                <div
                  className={`tl-card ${upper ? 'tl-upper' : 'tl-lower'}`}
                  onClick={() => openPhoto(p)}
                  role="button"
                  tabIndex={0}
                  aria-label={`放大查看 ${p.title || '照片'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openPhoto(p)
                    }
                  }}
                >
                  <span className="tl-card-accent" />
                  <div className="tl-thumb">
                    <img src={p.url} alt={p.title || '照片'} draggable={false} />
                  </div>
                  <div className="tl-card-title">{p.title || '未命名'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 放大查看：背景虚化，点击照片翻转看描述，点击背景关闭 */}
      {selected && (
        <div className="lb-overlay" onClick={closePhoto}>
          <button className="lb-close" onClick={closePhoto} aria-label="关闭">
            <X size={20} weight="bold" />
          </button>
          <div className="lb-card" onClick={(e) => e.stopPropagation()}>
            <div
              className={`lb-flip${flipped ? ' is-flipped' : ''}`}
              onClick={() => setFlipped((f) => !f)}
            >
              {/* 正面：大图 */}
              <div className="lb-face lb-front">
                <div className="lb-img">
                  <img src={selected.url} alt={selected.title || '照片'} />
                </div>
                <div className="lb-front-bar">
                  <span className="lb-title">{selected.title || '未命名'}</span>
                  <span className="lb-flip-hint">点击翻面看描述 →</span>
                </div>
              </div>
              {/* 背面：描述 */}
              <div className="lb-face lb-back">
                <div className="lb-back-title">{selected.title || '未命名'}</div>
                <div className="lb-back-desc">
                  {selected.description || '这张照片还没有描述。'}
                </div>
                <div className="lb-back-meta">
                  {selected.width && selected.height ? (
                    <span>
                      {selected.width} × {selected.height}
                    </span>
                  ) : null}
                  {selected.fileSize ? <span>{formatFileSize(selected.fileSize)}</span> : null}
                  <span>{formatDate(selected.createTime)}</span>
                </div>
                <div className="lb-back-hint">← 点击翻回正面</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
