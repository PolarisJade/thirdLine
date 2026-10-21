import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ResultCode, wallApi, type WallNoteVO } from '@/api'
import { ApiError } from '@/api/client'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { EmptyState } from '@/components/Feedback'
import { useToast } from '@/components/ToastContext'
import { WallDraft, type WallDraftState } from '@/components/wall/WallDraft'
import { WallPaper } from '@/components/wall/WallPaper'
import { WallReportModal } from '@/components/wall/WallReportModal'
import { useAuth } from '@/contexts/AuthContext'
import { useAsync } from '@/hooks/useAsync'
import { cx, errorMessage } from '@/utils/format'
import {
  clampPosition,
  placeNote,
  toPoints,
  type WallGeometry,
  type WallPoint,
} from '@/utils/wallLayout'

/** 前台信纸 */
type WallNoteItem = WallNoteVO

interface ConfirmState {
  id: number
  /** 拖动前的位置，点「×」时回到这里 */
  originX: number
  originY: number
  /** 点「√」时要提交的位置 */
  targetX: number
  targetY: number
  version: number
}

interface DragState {
  id: number | 'draft'
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  lastX: number
  lastY: number
  element: HTMLDivElement
  moved: boolean
}

interface PanDragState {
  pointerId: number
  startClientX: number
  startClientY: number
  originX: number
  originY: number
  lastX: number
  lastY: number
  moved: boolean
}

const DRAG_THRESHOLD = 3
/** 背景平移的触发阈值要比信纸拖动大：双击时手抖几像素不能变成平移 */
const PAN_THRESHOLD = 6
/** 自己判定双击的时间窗口 / 位置容差 */
const DOUBLE_CLICK_MS = 500
const DOUBLE_CLICK_DISTANCE = 8
const POLL_INTERVAL = 60_000
const MIN_ZOOM = 0.6
const MAX_ZOOM = 1.8
const ZOOM_STEP = 1.15

/**
 * 留言墙页面。
 *
 * 布局是一块比屏幕大得多的逻辑画布（默认 3200×2000）：
 *  - 按住空白处拖动 = 平移整面墙，上下左右都能看；
 *  - 鼠标滚轮 = 以光标为中心缩放（60%–180%），右下角也有 +/− 控件；
 *  - 双击空白处 = 在当前视口位置长出一张草稿信纸；
 *  - 草稿点「√」提交（POST），点「×」丢弃；
 *  - 已上墙的信纸拖动松手后出现「√ / ×」：√ 提交位置，× 回原位。
 *
 * 墙面上方不再有标题和白色底板，审核提示是固定在页面上的悬浮框。
 */
export function WallPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const configState = useAsync(() => wallApi.config(), [])
  const config = configState.data

  const [notes, setNotes] = useState<WallNoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [draft, setDraft] = useState<WallDraftState | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [draggingId, setDraggingId] = useState<number | 'draft' | null>(null)
  const [saving, setSaving] = useState(false)

  const [reportTarget, setReportTarget] = useState<WallNoteItem | null>(null)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportedIds, setReportedIds] = useState<number[]>([])

  /** 画布平移量（屏幕像素） */
  const [pan, setPan] = useState<WallPoint>({ x: 0, y: 0 })
  /** 画布缩放比例，1 = 100% */
  const [scale, setScale] = useState(1)
  /** 平移/缩放的实时值：滚轮连续触发时，下一帧渲染前也能拿到最新值 */
  const viewStateRef = useRef({ pan, scale })
  viewStateRef.current = { pan, scale }
  const [panning, setPanning] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)

  const viewportRef = useRef<HTMLDivElement>(null)
  const worldRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const panDragRef = useRef<PanDragState | null>(null)
  /** 滚轮处理函数：每帧更新，保证读到最新的 pan/scale */
  const wheelHandlerRef = useRef<(event: WheelEvent) => void>(() => {})
  /** 只接受最后一次列表请求的结果，避免旧响应覆盖刚提交的留言 */
  const loadSeqRef = useRef(0)
  /** 首次载入后把视口居中到已有留言（之后轮询不再打断用户） */
  const centeredRef = useRef(false)
  /** 空白处上一次单击的时间和位置，用于自己判定双击 */
  const lastBlankClickRef = useRef<{ time: number; x: number; y: number } | null>(null)
  /** 用户 ID 变化（登录 / 切换账号）时重新拉列表，刷新 owned 标记 */
  const lastUserIdRef = useRef<number | null>(user?.id ?? null)

  const geometry = useMemo<WallGeometry | null>(() => {
    if (!config) return null
    return {
      canvasWidth: config.canvasWidth,
      canvasHeight: config.canvasHeight,
      paperWidth: config.paperWidth,
      paperHeight: config.paperHeight,
      gap: config.gap,
      grid: config.grid,
    }
  }, [config])

  const palette = config?.palette ?? []
  const colorMap = useMemo(() => new Map(palette.map((item) => [item.key, item.color])), [palette])

  /* ------------------------------------------------------- 页面级样式开关 */

  useLayoutEffect(() => {
    // 留言墙是全屏画布：隐藏页脚、清掉 main 的上下留白，避免页面出现滚动条
    document.body.classList.add('wall-page-open')
    return () => document.body.classList.remove('wall-page-open')
  }, [])

  /* ------------------------------------------------------------ 载入与轮询 */

  const load = useCallback(async (silent = false) => {
    const seq = ++loadSeqRef.current
    if (!silent) setLoading(true)
    try {
      const data = await wallApi.list()
      if (seq !== loadSeqRef.current) return
      // 后端会把「自己的待审核留言」一并返回，这里直接用服务端结果，
      // 避免本地残留一条已经被拒绝的留言
      setNotes(data.notes)
      setListError(null)
    } catch (error) {
      if (seq === loadSeqRef.current && !silent) setListError(errorMessage(error))
    } finally {
      if (seq === loadSeqRef.current && !silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const timer = window.setInterval(() => void load(true), POLL_INTERVAL)
    return () => window.clearInterval(timer)
  }, [load])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  // 登录 / 登出 / 切换账号后重新拉一次列表：
  // 后端按当前 token 计算每条留言的 owned 标记，登录前加载的列表会把 owned 留成 false，
  // 表现为「自己的留言拖不动」
  useEffect(() => {
    const currentUserId = user?.id ?? null
    if (lastUserIdRef.current === currentUserId) return
    lastUserIdRef.current = currentUserId
    void load(true)
  }, [user?.id, load])

  /* ------------------------------------------------------------ 画布平移 */

  /**
   * 把平移量夹在合理范围内；缩放后的画布比视口小的时候居中显示。
   * zoom 默认取当前缩放比例，滚轮缩放时显式传入目标比例。
   */
  function clampPan(
    x: number,
    y: number,
    viewportWidth: number,
    viewportHeight: number,
    zoom = scale,
  ): WallPoint {
    if (!config) return { x: 0, y: 0 }
    const worldWidth = config.canvasWidth * zoom
    const worldHeight = config.canvasHeight * zoom
    const minX = Math.min(0, viewportWidth - worldWidth)
    const minY = Math.min(0, viewportHeight - worldHeight)
    const nextX =
      worldWidth <= viewportWidth ? (viewportWidth - worldWidth) / 2 : Math.min(0, Math.max(minX, x))
    const nextY =
      worldHeight <= viewportHeight ? (viewportHeight - worldHeight) / 2 : Math.min(0, Math.max(minY, y))
    // 取整，避免半像素平移把信纸文字渲染糊
    return { x: Math.round(nextX), y: Math.round(nextY) }
  }

  /**
   * 以视口内某个点为锚点缩放：锚点下面的画布内容保持不动。
   * 这是滚轮缩放和 +/− 按钮共用的入口。
   */
  function applyZoom(nextScale: number, anchorX: number, anchorY: number) {
    const viewport = viewportRef.current
    if (!viewport || !config) return

    // 用实时值而不是本轮渲染的 state：滚轮可能在一帧内触发多次
    const current = viewStateRef.current
    const currentScale = current.scale
    const currentPan = current.pan
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextScale))
    if (Math.abs(clamped - currentScale) < 0.001) return

    const worldX = (anchorX - currentPan.x) / currentScale
    const worldY = (anchorY - currentPan.y) / currentScale
    const nextPan = clampPan(
      anchorX - worldX * clamped,
      anchorY - worldY * clamped,
      viewport.clientWidth,
      viewport.clientHeight,
      clamped,
    )
    viewStateRef.current = { pan: nextPan, scale: clamped }
    setPan(nextPan)
    setScale(clamped)
  }

  /** 以视口中心为锚点缩放（+/− 按钮、点击百分比复位用） */
  function zoomAtCenter(nextScale: number) {
    const viewport = viewportRef.current
    if (!viewport) return
    applyZoom(nextScale, viewport.clientWidth / 2, viewport.clientHeight / 2)
  }

  /** 画布中心对应的平移量（保持当前缩放） */
  function centerPan(viewportWidth: number, viewportHeight: number, zoom = scale): WallPoint {
    if (!config) return { x: 0, y: 0 }
    return clampPan(
      viewportWidth / 2 - (config.canvasWidth / 2) * zoom,
      viewportHeight / 2 - (config.canvasHeight / 2) * zoom,
      viewportWidth,
      viewportHeight,
      zoom,
    )
  }

  /** 当前位置是否还留有向上下左右继续平移的余量 */
  function hasPanRoom(
    target: WallPoint,
    viewportWidth: number,
    viewportHeight: number,
    zoom: number,
  ): boolean {
    if (!config) return false
    const minX = Math.min(0, viewportWidth - config.canvasWidth * zoom)
    const minY = Math.min(0, viewportHeight - config.canvasHeight * zoom)
    const margin = 24
    return (
      target.x > minX + margin &&
      target.x < -margin &&
      target.y > minY + margin &&
      target.y < -margin
    )
  }

  /** 回到画布中心：保持当前缩放，只重置平移 */
  function centerView() {
    const viewport = viewportRef.current
    if (!viewport) return
    const zoom = viewStateRef.current.scale
    const nextPan = centerPan(viewport.clientWidth, viewport.clientHeight, zoom)
    viewStateRef.current = { pan: nextPan, scale: zoom }
    setPan(nextPan)
  }

  // pan / scale 变化时同步到 DOM；拖动过程中直接改 transform，不触发整面墙重渲染
  useLayoutEffect(() => {
    const world = worldRef.current
    if (!world) return
    world.style.transform = `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`
    // config / listError 变化会让画布重新挂载，需要重新应用一次平移和缩放
  }, [pan, scale, config, listError])

  // 滚轮缩放：处理函数每帧更新，保证渲染完成前也能读到最新的 pan/scale
  useEffect(() => {
    wheelHandlerRef.current = (event: WheelEvent) => {
      if (dragRef.current || panDragRef.current) {
        event.preventDefault()
        return
      }
      const viewport = viewportRef.current
      if (!viewport || !config) return

      const target = event.target as HTMLElement | null
      // 草稿输入框里的滚轮留给它自己滚，不抢
      if (target?.closest('textarea')) return

      event.preventDefault()
      const rect = viewport.getBoundingClientRect()
      const anchorX = event.clientX - rect.left
      const anchorY = event.clientY - rect.top
      const deltaY =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1)
      const factor = Math.min(1.35, Math.max(0.75, Math.exp(-deltaY * 0.0015)))
      applyZoom(viewStateRef.current.scale * factor, anchorX, anchorY)
    }
  })

  // 必须用非 passive 监听，才能 preventDefault 阻止浏览器自己的 Ctrl + 滚轮缩放
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onWheel = (event: WheelEvent) => wheelHandlerRef.current(event)
    viewport.addEventListener('wheel', onWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', onWheel)
  }, [config, listError])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const update = () => setViewportHeight(viewport.clientHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [config, listError])

  // 首次载入完成后居中：优先对准已有留言，但必须留出上下左右都能平移的余量；
  // 留言贴近画布边缘时退回画布中心，避免一进来就顶死在角落
  useLayoutEffect(() => {
    if (centeredRef.current || !config || loading) return
    const viewport = viewportRef.current
    if (!viewport) return
    const width = viewport.clientWidth
    const height = viewport.clientHeight
    if (!width || !height) return

    const target =
      notes.length > 0
        ? {
            x:
              notes.reduce((sum, note) => sum + note.posX + config.paperWidth / 2, 0) /
              notes.length,
            y:
              notes.reduce((sum, note) => sum + note.posY + config.paperHeight / 2, 0) /
              notes.length,
          }
        : { x: config.canvasWidth / 2, y: config.canvasHeight / 2 }

    const desired = clampPan(
      width / 2 - target.x * scale,
      height / 2 - target.y * scale,
      width,
      height,
      scale,
    )
    setPan(hasPanRoom(desired, width, height, scale) ? desired : centerPan(width, height, scale))
    centeredRef.current = true
  }, [config, loading, notes, listError, scale])

  function handleViewportPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    // 信纸拖动进行中，背景不要再抢事件
    if (dragRef.current) return
    const target = event.target as HTMLElement
    if (target.closest('.wall-note')) return
    const viewport = viewportRef.current
    if (!viewport) return

    panDragRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX: pan.x,
      originY: pan.y,
      lastX: pan.x,
      lastY: pan.y,
      moved: false,
    }
    // 先不 setPointerCapture：单击/双击时捕获指针会让原生 dblclick 变得不可靠。
    // 等确认是拖动（超过阈值）之后再捕获。
    setPanning(true)
  }

  function handleViewportPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = panDragRef.current
    const viewport = viewportRef.current
    // dragRef 非空说明正在拖信纸，背景平移必须让路
    if (!drag || !viewport || dragRef.current) return

    const deltaX = event.clientX - drag.startClientX
    const deltaY = event.clientY - drag.startClientY
    if (!drag.moved && Math.abs(deltaX) <= PAN_THRESHOLD && Math.abs(deltaY) <= PAN_THRESHOLD) {
      return
    }
    if (!drag.moved) {
      drag.moved = true
      try {
        viewport.setPointerCapture(drag.pointerId)
      } catch {
        // 指针已经释放时忽略，不影响后续 move/up 的正常处理
      }
    }

    const next = clampPan(drag.originX + deltaX, drag.originY + deltaY, viewport.clientWidth, viewport.clientHeight)
    drag.lastX = next.x
    drag.lastY = next.y
    if (worldRef.current) {
      worldRef.current.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${scale})`
    }
  }

  function handleViewportPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    // 正常情况下信纸自己的 pointerup 会先执行并清空 dragRef；
    // 如果这里还看到 dragRef，说明信纸没收到 up（例如捕获失败），补一次收尾，
    // 避免信纸停在半路、后续点击也被吞掉
    if (dragRef.current) {
      handleDragEnd()
      return
    }
    const drag = panDragRef.current
    if (!drag) return
    panDragRef.current = null
    setPanning(false)

    if (drag.moved) {
      setPan({ x: drag.lastX, y: drag.lastY })
      // 拖过背景之后，前面那次空白单击不再参与双击配对
      lastBlankClickRef.current = null
      return
    }

    // 没移动 = 单击空白。这里自己判定双击，避免依赖原生 dblclick：
    // 距离上次单击 400ms 内、位置相差 8px 以内，就当成双击新建留言。
    const now = Date.now()
    const last = lastBlankClickRef.current
    if (
      last &&
      now - last.time <= DOUBLE_CLICK_MS &&
      Math.hypot(event.clientX - last.x, event.clientY - last.y) <= DOUBLE_CLICK_DISTANCE
    ) {
      lastBlankClickRef.current = null
      startDraftFromClient(event.clientX, event.clientY)
      return
    }
    lastBlankClickRef.current = { time: now, x: event.clientX, y: event.clientY }
  }

  function handleViewportPointerCancel() {
    panDragRef.current = null
    setPanning(false)
    lastBlankClickRef.current = null
  }

  /* ---------------------------------------------------------------- 新建草稿 */

  function canWrite(): boolean {
    if (!config) return false
    if (!config.enabled) {
      toast.warning('留言墙暂未开放')
      return false
    }
    if (loading) {
      toast.info('正在加载留言，稍等一下')
      return false
    }
    if (listError) {
      toast.warning('留言加载失败，请先重试')
      return false
    }
    if (!user) {
      toast.info('登录后才能留言')
      navigate(`/login?redirect=${encodeURIComponent('/wall')}`)
      return false
    }
    if (draft) {
      // 空草稿可能已经被平移到视口外：直接丢掉，别让它一直挡住新建
      if (!draft.content.trim()) {
        setDraft(null)
      } else {
        // 有内容：把视口移回这张草稿，提示用户先完成它
        if (geometry) {
          const viewport = viewportRef.current
          if (viewport) {
            const zoom = viewStateRef.current.scale
            const nextPan = clampPan(
              viewport.clientWidth / 2 - (draft.posX + geometry.paperWidth / 2) * zoom,
              viewport.clientHeight / 2 - (draft.posY + geometry.paperHeight / 2) * zoom,
              viewport.clientWidth,
              viewport.clientHeight,
              zoom,
            )
            viewStateRef.current = { pan: nextPan, scale: zoom }
            setPan(nextPan)
          }
        }
        toast.info('已定位到未完成的留言，先把它贴上墙')
        return false
      }
    }
    return true
  }

  function openDraftAt(position: WallPoint) {
    if (!config) return
    setDraft({
      posX: position.x,
      posY: position.y,
      content: '',
      color: palette[0]?.key ?? 'pink',
    })
  }

  function startDraftFromClient(clientX: number, clientY: number) {
    if (!canWrite() || !geometry) return
    if (confirm) revertConfirm()
    const viewport = viewportRef.current
    if (!viewport) return

    // 屏幕坐标 → 画布坐标：减去平移量，再除以缩放比例
    const rect = viewport.getBoundingClientRect()
    const desired = {
      x: (clientX - rect.left - pan.x) / scale - geometry.paperWidth / 2,
      y: (clientY - rect.top - pan.y) / scale - geometry.paperHeight / 2,
    }
    const occupied = toPoints(notes.filter((note) => !note.pending))
    const position = placeNote(desired, occupied, geometry)
    if (!position) {
      toast.warning('这面墙已经贴满了，等站主整理后再来')
      return
    }
    openDraftAt(position)
  }

  function startDraftAtCenter() {
    if (!canWrite() || !geometry) return
    if (confirm) revertConfirm()
    const viewport = viewportRef.current
    if (!viewport) return

    const desired = {
      x: (viewport.clientWidth / 2 - pan.x) / scale - geometry.paperWidth / 2,
      y: (viewport.clientHeight / 2 - pan.y) / scale - geometry.paperHeight / 2,
    }
    const occupied = toPoints(notes.filter((note) => !note.pending))
    const position = placeNote(desired, occupied, geometry)
    if (!position) {
      toast.warning('这面墙已经贴满了，等站主整理后再来')
      return
    }
    openDraftAt(position)
  }

  /* ------------------------------------------------------------------ 拖动 */

  function handleDragStart(event: ReactPointerEvent<HTMLDivElement>, id: number | 'draft') {
    // 信纸上的按下不要再冒泡到画布：否则背景平移会抢走 pointer capture，
    // 信纸就完全拖不动了
    event.stopPropagation()
    lastBlankClickRef.current = null
    // 如果上次背景平移的 pointerup 没有落到画布上（比如在悬浮框上松手），
    // 这里把残留状态清掉，否则信纸拖动时背景会跟着一起动
    panDragRef.current = null
    setPanning(false)

    if (saving) return
    const target = event.target as HTMLElement
    if (target.closest('button, textarea, input, .wall-confirm')) return

    const note = id === 'draft' ? null : notes.find((item) => item.id === id)
    if (id !== 'draft' && !note?.owned) return
    const source: WallNoteItem | WallDraftState | null = id === 'draft' ? draft : note ?? null
    if (!source) return

    // 如果这张信纸正悬着一次未确认的移动，从「原位置」开始拖，
    // 不要从悬着的位置开始，否则松手时会跳一下
    let originX = source.posX
    let originY = source.posY
    if (confirm) {
      if (confirm.id === id) {
        originX = confirm.originX
        originY = confirm.originY
      }
      // 开始拖另一张时，先把上一次未确认的移动撤回
      revertConfirm()
    }

    dragRef.current = {
      id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      originX,
      originY,
      lastX: originX,
      lastY: originY,
      element: event.currentTarget,
      moved: false,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // 某些浏览器/指针状态下捕获会失败；不阻断拖动，指针在信纸上时仍能收到 move
    }
    setDraggingId(id)
    event.preventDefault()
  }

  function handleDragMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || !geometry) return
    const screenDeltaX = event.clientX - drag.startClientX
    const screenDeltaY = event.clientY - drag.startClientY
    if (Math.abs(screenDeltaX) > DRAG_THRESHOLD || Math.abs(screenDeltaY) > DRAG_THRESHOLD) {
      drag.moved = true
    }
    const next = clampPosition(
      drag.originX + screenDeltaX / scale,
      drag.originY + screenDeltaY / scale,
      geometry,
    )
    drag.lastX = next.x
    drag.lastY = next.y
    // 直接改 DOM，拖动过程中不触发整面墙重渲染
    drag.element.style.transform = `translate(${next.x - drag.originX}px, ${next.y - drag.originY}px)`
  }

  function handleDragEnd() {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    drag.element.style.transform = ''
    setDraggingId(null)
    if (!drag.moved || !geometry) return

    const occupied = toPoints(
      notes.filter((note) => !note.pending && note.id !== (drag.id === 'draft' ? -1 : drag.id)),
    )
    const position = placeNote({ x: drag.lastX, y: drag.lastY }, occupied, geometry)
    if (!position) {
      toast.warning('这面墙已经贴满了')
      return
    }

    if (drag.id === 'draft') {
      setDraft((prev) => (prev ? { ...prev, posX: position.x, posY: position.y } : prev))
      return
    }

    const original = notes.find((note) => note.id === drag.id)
    if (!original) return
    setNotes((prev) =>
      prev.map((note) =>
        note.id === drag.id ? { ...note, posX: position.x, posY: position.y } : note,
      ),
    )
    setConfirm({
      id: drag.id,
      originX: original.posX,
      originY: original.posY,
      targetX: position.x,
      targetY: position.y,
      version: original.version,
    })
  }

  /* -------------------------------------------------------------- 确认 / 撤销 */

  function revertConfirm() {
    if (!confirm) return
    const current = confirm
    setNotes((prev) =>
      prev.map((note) =>
        note.id === current.id ? { ...note, posX: current.originX, posY: current.originY } : note,
      ),
    )
    setConfirm(null)
  }

  async function confirmPosition() {
    if (!confirm || saving) return
    const current = confirm
    setSaving(true)
    try {
      const result = await wallApi.move(current.id, {
        posX: current.targetX,
        posY: current.targetY,
        version: current.version,
      })
      setNotes((prev) =>
        prev.map((note) =>
          note.id === current.id
            ? { ...note, posX: result.posX, posY: result.posY, version: result.version }
            : note,
        ),
      )
      setConfirm(null)
      if (result.adjusted) toast.info('这个位置刚被占了，已经贴到旁边')
    } catch (error) {
      toast.error(errorMessage(error))
      setConfirm(null)
      await load(true)
    } finally {
      setSaving(false)
    }
  }

  /* -------------------------------------------------------------- 草稿提交 */

  async function submitDraft() {
    if (!draft || !config || saving) return
    const content = draft.content.trim()
    const count = Array.from(content).length
    if (!content) {
      toast.warning('写点什么再贴上墙吧')
      return
    }
    if (count > config.maxLength) {
      toast.warning(`最多 ${config.maxLength} 个字，现在 ${count} 个`)
      return
    }

    setSaving(true)
    try {
      const note = await wallApi.create({
        content,
        paperColor: draft.color,
        posX: draft.posX,
        posY: draft.posY,
      })
      setNotes((prev) => [...prev, { ...note, pending: true }])
      setDraft(null)
      toast.success('已贴上墙，审核通过后大家就能看到')
      // 以服务端为准再拉一次：确认这条待审核留言已进入自己的列表
      await load(true)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function cancelDraft() {
    if (!draft || saving) return
    const hadContent = draft.content.trim().length > 0
    setDraft(null)
    if (hadContent) toast.info('已放弃这条留言')
  }

  /* ------------------------------------------------------------------ 举报 */

  function openReport(note: WallNoteItem) {
    if (!user) {
      toast.info('登录后才能举报')
      navigate(`/login?redirect=${encodeURIComponent('/wall')}`)
      return
    }
    setReportTarget(note)
  }

  async function submitReport(reasonType: number, reason: string) {
    if (!reportTarget) return
    const target = reportTarget
    setReportSubmitting(true)
    try {
      await wallApi.report(target.id, { reasonType, reason: reason || undefined })
      setReportedIds((prev) => [...prev, target.id])
      setReportTarget(null)
      toast.success('举报已提交，我会尽快核实')
      // 触达阈值时后端会自动隐藏这条留言，刷新一下让墙面同步
      await load(true)
    } catch (error) {
      // 已经举报过也视为「已收到」，不用让用户反复点
      if (error instanceof ApiError && error.code === ResultCode.WALL_REPORT_DUPLICATE) {
        setReportedIds((prev) => [...prev, target.id])
        setReportTarget(null)
        toast.info('这条留言你已经举报过了')
        return
      }
      toast.error(errorMessage(error))
    } finally {
      setReportSubmitting(false)
    }
  }

  /* ------------------------------------------------------------------ 渲染 */

  if (configState.loading) {
    return (
      <div className="wall-page">
        <div className="wall-status">
          <div className="wall-loading">
            <span className="wall-spinner" aria-hidden="true" />
            正在把留言搬上墙…
          </div>
        </div>
      </div>
    )
  }

  if (configState.error || !config || !geometry) {
    return (
      <div className="wall-page">
        <div className="wall-status">
          <EmptyState
            icon="alert"
            title="留言墙加载失败"
            desc={configState.error ?? '配置读取失败，请稍后重试'}
            action={
              <Button type="button" variant="primary" icon="refresh" onClick={configState.reload}>
                重新加载
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="wall-page">
      <div className="wall-notice">
        <span className="wall-notice__icon">
          <Icon name="info" size={16} />
        </span>
        <div className="wall-notice__body">
          <span className="wall-notice__text">{config.notice}</span>
          <span className="wall-notice__hint">
            {user
              ? '双击空白留言 · 按住空白拖动 · 滚轮缩放'
              : '登录后即可留言，并拖动自己贴的信纸'}
          </span>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon="plus"
          className="wall-notice__action"
          disabled={!config.enabled || loading || Boolean(listError)}
          title={
            !config.enabled
              ? '留言墙暂未开放'
              : !user
                ? '登录后才能留言和拖动信纸'
                : draft
                  ? '先完成当前留言'
                  : loading
                    ? '正在加载留言'
                    : listError
                      ? '留言加载失败，请先重试'
                      : '写一条留言'
          }
          onClick={startDraftAtCenter}
        >
          {user ? '写留言' : '登录后留言'}
        </Button>
      </div>

      {listError ? (
        <div className="wall-status">
          <EmptyState
            icon="alert"
            title="留言加载失败"
            desc={listError}
            action={
              <Button type="button" variant="primary" icon="refresh" onClick={() => void load()}>
                重试
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div
            className={cx('wall-viewport', panning && 'is-panning')}
            ref={viewportRef}
            role="region"
            aria-label="留言墙"
            onPointerDown={handleViewportPointerDown}
            onPointerMove={handleViewportPointerMove}
            onPointerUp={handleViewportPointerUp}
            onPointerCancel={handleViewportPointerCancel}
          >
          <div
            className="wall-canvas"
            ref={worldRef}
            style={{ width: config.canvasWidth, height: config.canvasHeight }}
          >
            {notes.map((note, index) => (
              <WallPaper
                key={note.id}
                note={note}
                geometry={geometry}
                background={colorMap.get(note.paperColor) ?? '#FFD9E3'}
                zIndex={index + 1}
                dragging={draggingId === note.id}
                pending={note.pending}
                confirmOpen={confirm?.id === note.id}
                confirmAbove={
                  pan.y + (note.posY + geometry.paperHeight) * scale + 64 * scale > viewportHeight
                }
                canReport={!note.owned && !note.pending}
                reported={reportedIds.includes(note.id)}
                busy={saving}
                onPointerDown={handleDragStart}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onConfirm={() => void confirmPosition()}
                onCancel={revertConfirm}
                onReport={() => openReport(note)}
              />
            ))}

            {draft && (
              <WallDraft
                draft={draft}
                geometry={geometry}
                palette={palette}
                maxLength={config.maxLength}
                dragging={draggingId === 'draft'}
                saving={saving}
                confirmAbove={
                  pan.y + (draft.posY + geometry.paperHeight) * scale + 64 * scale > viewportHeight
                }
                onContentChange={(value) =>
                  setDraft((prev) => (prev ? { ...prev, content: value } : prev))
                }
                onColorChange={(key) =>
                  setDraft((prev) => (prev ? { ...prev, color: key } : prev))
                }
                onPointerDown={(event) => handleDragStart(event, 'draft')}
                onPointerMove={handleDragMove}
                onPointerUp={handleDragEnd}
                onSubmit={() => void submitDraft()}
                onCancel={cancelDraft}
              />
            )}
          </div>

          {!loading && notes.length === 0 && !draft && (
            <div className="wall-empty" aria-hidden="true">
              <span className="wall-empty__icon">
                <Icon name="message" size={30} strokeWidth={1.5} />
              </span>
              <p className="wall-empty__title">这面墙还是空的</p>
              <span className="wall-empty__desc">双击任意空白处，写下第一张</span>
            </div>
          )}

          {loading && (
            <div className="wall-loading wall-loading--board">
              <span className="wall-spinner" aria-hidden="true" />
              正在加载留言…
            </div>
          )}
        </div>

        <div className="wall-zoom" role="group" aria-label="画布视图">
          <button
            type="button"
            className="wall-zoom__btn"
            aria-label="回到中心"
            title="回到中心"
            onClick={centerView}
          >
            <Icon name="crosshair" size={16} />
          </button>
          <span className="wall-zoom__divider" aria-hidden="true" />
          <button
            type="button"
            className="wall-zoom__btn"
            aria-label="缩小"
            title="缩小"
            onClick={() => zoomAtCenter(viewStateRef.current.scale / ZOOM_STEP)}
          >
            −
          </button>
          <button
            type="button"
            className="wall-zoom__value"
            title="恢复 100%"
            aria-label={`当前缩放 ${Math.round(scale * 100)}%，点击恢复 100%`}
            onClick={() => zoomAtCenter(1)}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="wall-zoom__btn"
            aria-label="放大"
            title="放大"
            onClick={() => zoomAtCenter(viewStateRef.current.scale * ZOOM_STEP)}
          >
            +
          </button>
        </div>
        </>
      )}

      <WallReportModal
        open={reportTarget !== null}
        noteContent={reportTarget?.content ?? ''}
        submitting={reportSubmitting}
        onClose={() => setReportTarget(null)}
        onSubmit={(reasonType, reason) => void submitReport(reasonType, reason)}
      />
    </div>
  )
}
