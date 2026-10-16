import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from 'react'
import { chatApi } from '@/api'

const SPRITE_URL = '/nezuko-sprite.webp'
const FRAME_WIDTH = 192
const FRAME_HEIGHT = 208
const DISPLAY_WIDTH = 144
const DISPLAY_HEIGHT = Math.round((DISPLAY_WIDTH / FRAME_WIDTH) * FRAME_HEIGHT)

/** 打开气泡时先说一句，不占用模型调用 */
const GREETING = '唔唔！（朝你挥手）'

/** 聊完静置多久自动收起，别一直挡着页面 */
const AUTO_CLOSE_MS = 20_000

/** 与后端 tl.chat.max-input-length 保持一致，超长在前端就拦住，省一次请求 */
const MAX_INPUT_LENGTH = 200

type Action = 'idle' | 'walk' | 'wave' | 'cheer' | 'sit'

/** 一步 = 先取雪碧图里的第 frame 格，再停留 hold 毫秒 */
type Step = readonly [frame: number, hold: number]

interface ActionDef {
  row: number
  steps: readonly Step[]
  /** steps 播满几轮后自动回到待机；Infinity 表示一直播下去 */
  rounds: number
}

/**
 * 雪碧图帧表。
 *
 * 图集 1536×1872，按 192×208 切正好是 8 列 × 9 行，但并不是每格都有内容，
 * 而且每一格的节奏也不均匀，所以这里逐帧写清楚「取哪一格、停多久」：
 *
 *   row 0  待机 6 格：0/2/4 是睁眼的两套身体姿态（A、B），1/3/5 只是 A 的闭眼版
 *   row 1  走路 8 格：完整的一个步态循环，第 7 格接回第 0 格最顺
 *   row 2  跑步 8 格（未使用）
 *   row 3  挥手 4 格：0 手放胸前 → 1 抬手 → 2 高举 → 3 手放下
 *   row 4  开心 5 格：0 站定 → 1/2 双手举起来回晃 → 3 收手 → 4 回到站定（和 0 同一格）
 *   row 5  8 格：0-3 站着哭、4-5 趴倒、6-7 坐着（本项目只取 6/7 当坐姿）
 *   row 6  待机 6 格（备用）
 *   row 7  奔跑 6 格（未使用）
 *   row 8  表情 6 格（未使用）
 */
const ACTIONS: Record<Action, ActionDef> = {
  // 身体在 A、B 两套姿态之间慢慢交替，就是很轻的重心起伏；
  // 一整个周期只在 A 上插一次闭眼格当眨眼（约 4 秒一次）。
  // 如果照原样把 6 格按 5fps 循环，眼睛每 0.2 秒睁闭一次，看着像在抽搐。
  idle: {
    row: 0,
    steps: [
      [0, 950],
      [1, 110],
      [2, 950],
      [0, 950],
      [2, 950],
    ],
    rounds: Infinity,
  },
  // row 1 是完整的 8 格步态循环，之前只取了 0-5，会停在半步上再弹回待机。
  // 走满 3 轮（约 2.5 秒）再自己停下。
  walk: {
    row: 1,
    steps: [
      [0, 105],
      [1, 105],
      [2, 105],
      [3, 105],
      [4, 105],
      [5, 105],
      [6, 105],
      [7, 105],
    ],
    rounds: 3,
  },
  // 抬手 → 挥两下 → 收手，首尾都落在接近待机的姿势上，切进切出不会跳。
  wave: {
    row: 3,
    steps: [
      [0, 170],
      [1, 150],
      [2, 150],
      [1, 150],
      [2, 150],
      [0, 230],
    ],
    rounds: 1,
  },
  // row 4：站定 → 双手举起来回晃两下 → 收手 → 回到站定。
  // 首尾是同一格，播完自己回待机的过程不会停在半路上。
  cheer: {
    row: 4,
    steps: [
      [0, 140],
      [1, 150],
      [2, 150],
      [1, 150],
      [2, 150],
      [3, 160],
      [4, 220],
    ],
    rounds: 1,
  },
  // row 5 只有 6/7 是坐姿，0-5 是「站着哭 → 瘫倒 → 趴地上」，
  // 之前把 0-5 当坐姿播了出来，所以点「坐下」会看到人物哭完趴下再站起来。
  // 6 低头闭眼、7 抬头睁眼，两者慢速交替就是坐着打盹；坐约 9 秒后回待机。
  sit: {
    row: 5,
    steps: [
      [7, 1500],
      [6, 1500],
    ],
    rounds: 3,
  },
}

/**
 * 右下角宠物（雪碧图逐帧动画）。
 *
 * 播放进度全部放在 ref 里、只有一个常驻的 requestAnimationFrame 循环，
 * 这样切动作不会重启循环，也不会拿到旧闭包里的状态。
 */
export function FloatingPet() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spriteRef = useRef<HTMLImageElement | null>(null)
  const playRef = useRef({ action: 'idle' as Action, step: 0, elapsed: 0, rounds: 0, lastTime: 0 })
  /** 已经画上去的那一格，避免每帧重复绘制 */
  const drawnRef = useRef('')
  /** 系统开了「减少动态效果」时不推进帧 */
  const pausedRef = useRef(false)
  const dragRef = useRef({ active: false, moved: false, offsetX: 0, offsetY: 0 })
  const [action, setAction] = useState<Action>('idle')
  const [collapsed, setCollapsed] = useState(false)
  const [dragged, setDragged] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showActions, setShowActions] = useState(false)
  /** 对话气泡是否展开（点一下人物切换） */
  const [chatOpen, setChatOpen] = useState(false)
  const [draft, setDraft] = useState('')
  /** 人物当前说的这句话；请求进行中显示「唔…」占位 */
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [errorText, setErrorText] = useState('')
  /** 人物被拖到屏幕上边时，把气泡翻到人物下方 */
  const panelBelow = dragged && position.y < 260

  const drawFrame = useCallback((row: number, frame: number, force = false) => {
    const canvas = canvasRef.current
    const image = spriteRef.current
    if (!canvas || !image) return

    const key = `${row}:${frame}:${canvas.width}`
    if (!force && key === drawnRef.current) return

    const context = canvas.getContext('2d')
    if (!context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    // 原图是带抗锯齿的插画（38 万种颜色、256 级 alpha），并不是像素画。
    // 之前关掉平滑再缩到 0.75 倍，细线每一帧丢的像素都不一样，轮廓会一直抖。
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      image,
      frame * FRAME_WIDTH,
      row * FRAME_HEIGHT,
      FRAME_WIDTH,
      FRAME_HEIGHT,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    drawnRef.current = key
  }, [])

  /** 画布按设备像素比开图，高分屏上才不会被拉糊 */
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    const width = Math.round(DISPLAY_WIDTH * dpr)
    const height = Math.round(DISPLAY_HEIGHT * dpr)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      drawnRef.current = ''
    }
  }, [])

  /** 把当前该显示的那一格画出来（重开画布、图片加载完、窗口缩放后都要补一次） */
  const redrawNow = useCallback(() => {
    const play = playRef.current
    const def = ACTIONS[play.action]
    drawFrame(def.row, def.steps[play.step][0], true)
  }, [drawFrame])

  // 雪碧图只加载一次。之前 drawFrame 依赖 action，导致每换一个动作就重新 new 一个
  // Image 再解码一遍，切动作时会顿一下。
  useEffect(() => {
    const image = new Image()
    image.decoding = 'async'
    image.src = SPRITE_URL
    let disposed = false
    image.onload = () => {
      if (disposed) return
      spriteRef.current = image
      redrawNow()
    }
    return () => {
      disposed = true
      image.onload = null
    }
  }, [redrawNow])

  // 收起再展开会重建 <canvas>，这里补一次尺寸和首帧（layout 阶段做，避免闪一下白框）
  useLayoutEffect(() => {
    if (collapsed) return
    resizeCanvas()
    redrawNow()
  }, [collapsed, resizeCanvas, redrawNow])

  useEffect(() => {
    const onResize = () => {
      resizeCanvas()
      redrawNow()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [resizeCanvas, redrawNow])

  // 常驻的播放循环：只有它推进帧，切动作只是改 playRef.action
  useEffect(() => {
    let raf = 0
    const tick = (time: number) => {
      const play = playRef.current
      const def = ACTIONS[play.action]
      // 切到后台再回来时 time 会跳很大，这里夹一下，免得一帧跨过好几格
      const delta = play.lastTime ? Math.min(time - play.lastTime, 250) : 0
      play.lastTime = time

      if (!pausedRef.current) {
        play.elapsed += delta
        let hold = def.steps[play.step][1]
        // 用累加而不是「到点就把步数 +1」，掉帧时不会越播越慢
        while (play.elapsed >= hold) {
          play.elapsed -= hold
          play.step += 1
          if (play.step >= def.steps.length) {
            play.step = 0
            play.rounds += 1
            if (play.rounds >= def.rounds) {
              play.action = 'idle'
              play.step = 0
              play.elapsed = 0
              play.rounds = 0
              setAction('idle')
              break
            }
          }
          hold = ACTIONS[play.action].steps[play.step][1]
        }
        const current = ACTIONS[play.action]
        drawFrame(current.row, current.steps[play.step][0])
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [drawFrame])

  // 尊重系统的「减少动态效果」：停在待机第一格的静态造型上
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      pausedRef.current = media.matches
      if (!media.matches) return
      const play = playRef.current
      play.action = 'idle'
      play.step = 0
      play.elapsed = 0
      play.rounds = 0
      setAction('idle')
      drawFrame(ACTIONS.idle.row, ACTIONS.idle.steps[0][0], true)
    }
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [drawFrame])

  const chooseAction = useCallback(
    (next: Action) => {
      const play = playRef.current
      play.action = next
      play.step = 0
      play.elapsed = 0
      play.rounds = 0
      // 再点一次当前动作也从头播，所以不做「相同就 return」的短路
      drawnRef.current = ''
      setAction(next)
      // 立刻出一帧，不用等下一次 rAF；开了「减少动态效果」时循环不推进，也就靠这一帧
      redrawNow()
    },
    [redrawNow],
  )

  // 待机久了随机做个动作。判断都走 ref，定时器不会因为动作变化而反复重排。
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (pausedRef.current || collapsed || dragRef.current.active) return
      if (playRef.current.action !== 'idle') return
      // 坐着那套图本身是委屈表情，权重压低一点，让角落里多数时候是开心的
      const roll = Math.random()
      chooseAction(roll < 0.4 ? 'cheer' : roll < 0.78 ? 'wave' : 'sit')
    }, 12000)
    return () => window.clearInterval(timer)
  }, [chooseAction, collapsed])

  const inputRef = useRef<HTMLInputElement>(null)

  // 展开时自动聚焦输入框；触屏设备不自动聚焦，免得键盘直接弹出来挡住内容
  useEffect(() => {
    if (!chatOpen) return
    if (!window.matchMedia('(hover: hover)').matches) return
    inputRef.current?.focus()
  }, [chatOpen])

  // 聊完自动收起：没有正在输入、也没有请求在飞时，静置一会儿就收回。
  // 只看 draft 是因为自动聚焦会让「有焦点」永远成立，那样就永远收不起来了。
  useEffect(() => {
    if (!chatOpen || sending || draft.trim()) return
    const timer = window.setTimeout(() => setChatOpen(false), AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
    // reply 入依赖是故意的：每来一句新回复都重新计时
  }, [chatOpen, sending, draft, reply])

  /** 点一下人物：展开 / 收起气泡，展开时先挥个手 */
  const toggleChat = useCallback(() => {
    if (chatOpen) {
      setChatOpen(false)
      return
    }
    setErrorText('')
    setReply((current) => current || GREETING)
    chooseAction('wave')
    setChatOpen(true)
  }, [chatOpen, chooseAction])

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setErrorText('')
    setDraft('')
    try {
      const data = await chatApi.chat(text)
      setReply(data.content)
      // 兜底 / 拦截台词配坐姿更贴，正常回答就开心一下
      chooseAction(data.fallback ? 'sit' : 'cheer')
    } catch (error) {
      // 失败就把输入还回去，别让人白打一遍
      setDraft(text)
      setErrorText(error instanceof Error ? error.message : '没发出去，等一下再试')
      chooseAction('sit')
    } finally {
      setSending(false)
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    const rect = target.getBoundingClientRect()
    dragRef.current = {
      active: true,
      moved: false,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }
    target.style.cursor = 'grabbing'
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return
    const nextX = Math.max(8, Math.min(window.innerWidth - DISPLAY_WIDTH - 8, event.clientX - dragRef.current.offsetX))
    const nextY = Math.max(8, Math.min(window.innerHeight - DISPLAY_HEIGHT - 8, event.clientY - dragRef.current.offsetY))
    if (Math.abs(nextX - position.x) > 3 || Math.abs(nextY - position.y) > 3) dragRef.current.moved = true
    setDragged(true)
    setPosition({ x: nextX, y: nextY })
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const target = event.currentTarget
    if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId)
    target.style.cursor = 'grab'
    const wasMoved = dragRef.current.moved
    dragRef.current.active = false
    if (!wasMoved) toggleChat()
  }

  if (collapsed) {
    return (
      <button
        type="button"
        className="floating-pet floating-pet--collapsed"
        aria-label="展开宠物"
        onClick={() => setCollapsed(false)}
      >
        <span aria-hidden="true">🐾</span>
      </button>
    )
  }

  return (
    <aside
      className={`floating-pet${dragged ? ' floating-pet--dragged' : ''}`}
      style={dragged ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' } : undefined}
      aria-label="博客宠物"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showActions && !chatOpen && (
        <div className="floating-pet__actions" role="toolbar" aria-label="宠物动作">
          <button type="button" className={action === 'idle' ? 'is-active' : ''} onClick={() => chooseAction('idle')}>
            待机
          </button>
          <button type="button" className={action === 'walk' ? 'is-active' : ''} onClick={() => chooseAction('walk')}>
            走路
          </button>
          <button type="button" className={action === 'wave' ? 'is-active' : ''} onClick={() => chooseAction('wave')}>
            挥手
          </button>
          <button type="button" className={action === 'cheer' ? 'is-active' : ''} onClick={() => chooseAction('cheer')}>
            开心
          </button>
          <button type="button" className={action === 'sit' ? 'is-active' : ''} onClick={() => chooseAction('sit')}>
            坐下
          </button>
        </div>
      )}
      {chatOpen && (
        <div className={`floating-pet__chat${panelBelow ? ' floating-pet__chat--below' : ''}`}>
          <p className="floating-pet__say" aria-live="polite">
            {sending ? '唔…' : reply}
          </p>
          <form className="floating-pet__ask" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="floating-pet__input"
              value={draft}
              maxLength={MAX_INPUT_LENGTH}
              placeholder="和我说句话…"
              aria-label="和祢豆子说话"
              autoComplete="off"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setChatOpen(false)
              }}
            />
            <button type="submit" className="floating-pet__send" disabled={sending || !draft.trim()}>
              发送
            </button>
          </form>
          {errorText && <p className="floating-pet__error">{errorText}</p>}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="floating-pet__canvas"
        width={DISPLAY_WIDTH}
        height={DISPLAY_HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="点我说说话，按住可以拖动"
      />
    </aside>
  )
}
