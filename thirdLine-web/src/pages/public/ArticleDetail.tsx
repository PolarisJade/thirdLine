import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, List, SpinnerGap } from '@phosphor-icons/react'
import { getArticleDetail } from '@/api/article'
import type { ArticleVO } from '@/types'
import RichTextView from '@/components/RichTextView'
import Pill from '@/components/Pill'
import Reveal from '@/components/Reveal'
import { formatDate } from '@/utils/format'

/** 滚动定位时预留粘性头部的高度 */
const SCROLL_OFFSET = 88

interface TocItem {
  id: string
  text: string
  level: number
}

/** 前台文章详情：max-w-4xl 阅读区，大屏右侧悬浮文章目录 */
export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setToc([])
    setActiveId('')
    getArticleDetail(Number(id))
      .then((data) => {
        setArticle(data)
        window.scrollTo({ top: 0 })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  // 正文渲染完成后，扫描 h1-h4 标题生成目录并补充锚点 id
  useEffect(() => {
    if (!article?.content) return
    const root = contentRef.current
    if (!root) return
    const headings = Array.from(root.querySelectorAll<HTMLElement>('h1, h2, h3, h4'))
    const items: TocItem[] = headings.map((el, i) => {
      if (!el.id) el.id = `article-heading-${i}`
      return { id: el.id, text: el.textContent?.trim() || '', level: Number(el.tagName[1]) }
    })
    setToc(items.filter((item) => item.text))
  }, [article])

  // 滚动监听：高亮当前阅读位置对应的目录项
  useEffect(() => {
    if (toc.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: `-${SCROLL_OFFSET}px 0px -65% 0px` },
    )
    toc.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [toc])

  const minLevel = useMemo(
    () => (toc.length > 0 ? Math.min(...toc.map((t) => t.level)) : 1),
    [toc],
  )

  const scrollToHeading = (headingId: string) => {
    const el = document.getElementById(headingId)
    if (!el) return
    setActiveId(headingId)
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
      behavior: 'smooth',
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32 text-muted">
        <SpinnerGap size={24} className="animate-spin" />
      </div>
    )
  }

  if (notFound || !article) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-32 text-center">
        <p className="font-serif text-3xl text-ink">文章不存在或已下线</p>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-ink">
          <ArrowLeft size={16} /> 返回首页
        </Link>
      </div>
    )
  }

  return (
    <article>
      <div className="mx-auto flex max-w-7xl justify-center gap-12 px-6 py-16">
        <div className="w-full max-w-4xl">
          <Reveal>
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted transition hover:text-ink"
            >
              <ArrowLeft size={14} /> 返回
            </Link>

            <div className="mb-5 flex flex-wrap items-center gap-2">
              {article.isTop === 1 && (
                <span className="mui-pill" style={{ background: '#FBF3DB', color: '#956400' }}>
                  置顶
                </span>
              )}
              {article.isOriginal === 1 && (
                <span className="mui-pill" style={{ background: '#EDF3EC', color: '#346538' }}>
                  原创
                </span>
              )}
              {article.categoryName && (
                <Link to={`/category/${article.categoryId}`}>
                  <Pill label={article.categoryName} seed={article.categoryId} />
                </Link>
              )}
            </div>

            <h1
              className="font-serif font-semibold text-ink"
              style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.15, letterSpacing: '-0.03em' }}
            >
              {article.title}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line pb-8 font-mono text-xs text-muted">
              <span>{article.authorName || '匿名'}</span>
              <span>·</span>
              <span>{formatDate(article.publishedTime || article.createdTime, 'YYYY-MM-DD HH:mm')}</span>
            </div>
          </Reveal>

          {article.summary && (
            <Reveal delay={80}>
              <p className="mt-8 border-l-2 border-line pl-5 font-serif text-lg italic text-muted">
                {article.summary}
              </p>
            </Reveal>
          )}

          <Reveal delay={120}>
            <div ref={contentRef} className="mt-10">
              <RichTextView content={article.content} />
            </div>
          </Reveal>

          {(article.tags?.length ?? 0) > 0 && (
            <div className="mt-14 flex flex-wrap items-center gap-2 border-t border-line pt-8">
              <span className="mr-2 font-mono text-xs uppercase tracking-widest text-muted">Tags</span>
              {article.tags.map((tag) => (
                <Link key={tag.id} to={`/tag/${tag.id}`}>
                  <Pill label={tag.name} seed={tag.id} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {toc.length >= 2 && (
          <aside className="hidden w-72 shrink-0 xl:block">
            <nav className="sticky top-24" aria-label="文章目录">
              <p className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted">
                <List size={14} /> 目录
              </p>
              <ul className="space-y-1 border-l border-line">
                {toc.map((item) => {
                  const active = activeId === item.id
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => scrollToHeading(item.id)}
                        className="-ml-px block w-full cursor-pointer rounded-r-md border-l-2 bg-transparent py-1 pr-2 text-left text-sm leading-snug transition-colors hover:bg-[#F0F0EF]"
                        style={{
                          paddingLeft: 12 + (item.level - minLevel) * 14,
                          borderColor: active ? '#111111' : 'transparent',
                          color: active ? '#111111' : '#787774',
                        }}
                        title={item.text}
                      >
                        {item.text}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>
        )}
      </div>
    </article>
  )
}
