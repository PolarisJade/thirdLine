
import { useEffect, useState } from 'react'
import ArticleFeed from './ArticleFeed'
import Reveal from '@/components/Reveal'
import SiteSidebar from '@/components/SiteSidebar'
import { listCategories } from '@/api/category'
import type { CategoryVO } from '@/types'
import heroBg from '@/assets/首页背景.jpg'

/** Hero 背景图（本地资源，Vite 构建时自动处理） */
const HERO_IMAGE = heroBg

/** Hero 主文案，进入首页后逐字打印，循环播放 */
const HERO_TEXTS = [
   '影子是落在地上的旧时光，走一步，碎一寸。',
   '俱往矣，数风流人物，还看今朝。',
  '雄关漫道真如铁，而今迈步从头越。',
  '为有牺牲多壮志，敢教日月换新天。',
]
const TYPE_SPEED = 180
const DELETE_SPEED = 80
const HOLD_MS = 2500

/** 用于预留固定宽高：取最长的一句做隐形占位，避免逐字打印时框体尺寸变化导致页面抖动 */
const HERO_PLACEHOLDER = HERO_TEXTS.reduce((a, b) => (b.length > a.length ? b : a), '')
const HERO_TEXT_STYLE: React.CSSProperties = {
  fontSize: 'clamp(1.9rem, 4.2vw, 3rem)',
  lineHeight: 1.7,
  letterSpacing: '0.14em',
  fontWeight: 500,
}

/** 前台首页：固定背景图 hero + 波浪白色面板（滚动时遮挡背景）+ 文章列表 */
export default function Home() {
  const [categories, setCategories] = useState<CategoryVO[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [typed, setTyped] = useState('')
  const [textIndex, setTextIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listCategories()
      .then((data) => setCategories(data || []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const full = HERO_TEXTS[textIndex]
    let timer: number
    if (!deleting) {
      if (typed.length < full.length) {
        // 逐字打印
        timer = window.setTimeout(() => setTyped(full.slice(0, typed.length + 1)), TYPE_SPEED)
      } else {
        // 打印完成后停留，再开始删除
        timer = window.setTimeout(() => setDeleting(true), HOLD_MS)
      }
    } else {
      if (typed.length > 0) {
        // 逐字删除
        timer = window.setTimeout(() => setTyped(full.slice(0, typed.length - 1)), DELETE_SPEED)
      } else {
        // 删空后切换到下一句
        timer = window.setTimeout(() => {
          setTextIndex((i) => (i + 1) % HERO_TEXTS.length)
          setDeleting(false)
        }, 400)
      }
    }
    return () => clearTimeout(timer)
  }, [typed, deleting, textIndex])

  return (
    <div>
      {/* 固定背景图：钉在视口不随滚动移动，滑动时被下方白色面板遮挡 */}
      <div
        className="fixed inset-0 z-0 bg-charcoal bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden="true"
      >
        {/* 轻压暗遮罩，保证白字可读 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/10 to-black/20" />
      </div>

      {/* Hero 文案：透明底，随页面正常滚走；高度为原来一半，缩短背景图与波浪的距离 */}
      <section className="relative -mt-16 flex min-h-[max(39vh,280px)] flex-col">
        <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-16 text-center">
          <Reveal delay={80}>
            {/* 外层 relative 容器：由隐形占位撑出固定区域，锁定页面布局不抖动 */}
            <div className="relative mt-10 inline-block">
              {/* 隐形占位：最长句 + 与灰框一致的内边距，决定区域尺寸（不可见、不干扰视觉） */}
              <span
                aria-hidden="true"
                className="invisible whitespace-pre-wrap px-8 py-3 font-serif"
                style={HERO_TEXT_STYLE}
              >
                {HERO_PLACEHOLDER}
              </span>
              {/* 灰色输入框：绝对定位居中叠加，宽度随已打印字数自动伸缩 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="inline-flex max-w-full items-center whitespace-pre-wrap rounded-lg border border-white/25 bg-gray-500/40 px-8 py-3 backdrop-blur-sm"
                  style={{ boxShadow: '0 2px 24px rgba(0,0,0,0.25)' }}
                >
                  <span
                    className="font-serif text-white"
                    style={{ ...HERO_TEXT_STYLE, textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}
                  >
                    {typed}
                  </span>
                  <span className="ml-1 animate-pulse" style={{ ...HERO_TEXT_STYLE }}>
                    ▍
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 波浪 + 文章列表：白色面板，滚动时整体滑过并遮挡固定背景 */}
      <section className="relative">
        {/* 朝上的波浪：透明底上的白色浪形，随面板一起滑过固定背景图 */}
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-20 w-full md:h-28"
          aria-hidden="true"
        >
          <path
            d="M0,80 C160,118 340,42 560,62 C780,82 920,118 1120,90 C1280,68 1380,82 1440,62 L1440,120 L0,120 Z"
            fill="rgba(255,255,255,0.45)"
          />
          <path
            d="M0,96 C220,58 440,112 660,92 C880,72 1060,104 1260,84 C1340,76 1400,86 1440,94 L1440,120 L0,120 Z"
            fill="#FFFFFF"
          />
        </svg>
        <div className="bg-canvas">
          {/* 分类栏：滚到文章列表时滑入视野，吸顶停在导航下方；点击即时过滤列表 */}
          <Reveal className="sticky top-16 z-30 border-b border-line bg-canvas/90 backdrop-blur">
            <div className="mx-auto flex max-w-[1440px] items-center gap-1 overflow-x-auto px-6 py-3">
              <button
                onClick={() => setActiveId(null)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
                  activeId === null ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                全部
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition ${
                    activeId === c.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </Reveal>
          <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-6 md:pb-20 md:pt-8">
            <div className="flex items-start gap-8">
              {/* 左列：文章列表 */}
              <div className="min-w-0 flex-1">
                <div className="mb-6 flex items-baseline justify-between border-b border-line pb-4">
                  <h2 className="font-serif text-2xl font-semibold text-ink">最新文章</h2>
                  <span className="font-mono text-xs uppercase tracking-widest text-muted">Latest</span>
                </div>
                <ArticleFeed query={{ categoryId: activeId ?? undefined }} size={9} />
              </div>
              {/* 右列：博主介绍 + 站点统计，吸顶跟随滚动，小屏隐藏 */}
              <aside className="sticky top-32 hidden w-72 shrink-0 lg:block">
                <SiteSidebar />
              </aside>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
