import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { articleApi, siteApi, type ArticleVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Icon } from '@/components/Icon'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Avatar } from '@/components/Form'
import { EmptyState, Loading } from '@/components/Feedback'
import { ArticleCard } from '@/components/ArticleCard'
import { cx, formatDate, stripHtml } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'
interface TocEntry {
  id: string
  text: string
  level: number
}

/**
 * 文章详情页。
 * 数据来自 GET /user/article/{id}（含正文 HTML 与标签）。
 * 正文由富文本编辑器生成，这里直接渲染并补充：
 *  - 自动为 h1~h4 生成锚点 id
 *  - 基于标题构建右侧浮动目录 + 滚动高亮
 *  - 估算阅读时长
 */
export function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const articleId = Number(id)
  const navigate = useNavigate()

  const { data: article, loading, error, reload } = useAsync<ArticleVO>(() => articleApi.detail(articleId), [articleId])
  const { data: profile } = useAsync(() => siteApi.profile(), [])
  /** 同分类的更多文章，作为底部「相关阅读」 */
  const related = useAsync(
    () => (article?.categoryId ? articleApi.page({ status: 1, categoryId: article.categoryId, size: 4 }) : Promise.resolve(null)),
    [article?.categoryId],
  )

  const contentRef = useRef<HTMLDivElement>(null)
  const [toc, setToc] = useState<TocEntry[]>([])
  const [activeId, setActiveId] = useState<string>('')

  /** 正文渲染完成后：给标题加 id 并收集目录 */
  useEffect(() => {
    const container = contentRef.current
    if (!container || !article?.content) {
      setToc([])
      return
    }

    const headings = Array.from(container.querySelectorAll<HTMLHeadingElement>('h1, h2, h3, h4'))
    const entries: TocEntry[] = headings.map((heading, index) => {
      const text = heading.textContent?.trim() ?? `小节 ${index + 1}`
      // 用序号 + 文本生成稳定 id，避免中文标题转义带来的兼容问题
      const anchor = `heading-${index + 1}`
      heading.id = anchor
      return { id: anchor, text, level: Number(heading.tagName.slice(1)) }
    })

    setToc(entries)
    setActiveId(entries[0]?.id ?? '')
  }, [article?.content])

  /** 滚动时高亮当前所在小节 */
  useEffect(() => {
    if (toc.length === 0) return

    const container = contentRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    )

    container.querySelectorAll('h1, h2, h3, h4').forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [toc])

  /** 阅读时长与字数：基于纯文本估算（中文按 350 字/分钟） */
  const stats = useMemo(() => {
    const text = stripHtml(article?.content)
    const chars = text.replace(/\s/g, '').length
    return { chars, minutes: Math.max(1, Math.round(chars / 350)) }
  }, [article?.content])

  const scrollToHeading = (anchor: string) => {
    const target = document.getElementById(anchor)
    if (!target) return
    const top = target.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top, behavior: 'smooth' })
  }

  if (loading) return <Loading text="正在打开这篇文章…" />

  if (error || !article) {
    return (
      <div className="container container--narrow">
        <Glass className="panel">
          <EmptyState
            icon="alert"
            title="文章打不开了"
            desc={error ?? '这篇文章可能已被删除。'}
            action={
              <div className="row" style={{ gap: 12 }}>
                <Button variant="primary" icon="refresh" onClick={reload}>
                  重试
                </Button>
                <Button variant="glass" icon="chevronLeft" onClick={() => navigate('/articles')}>
                  返回列表
                </Button>
              </div>
            }
          />
        </Glass>
      </div>
    )
  }

  const otherArticles = (related.data?.records ?? []).filter((item) => item.id !== article.id).slice(0, 3)

  return (
    <div className="container">
      {/* 面包屑 */}
      <nav className="row wrap text-sm text-muted" style={{ gap: 8, marginBottom: 'var(--space-4)' }}>
        <Link to="/" className="row" style={{ gap: 5 }}>
          <Icon name="home" size={14} />
          首页
        </Link>
        <Icon name="chevronRight" size={13} />
        <Link to="/articles">文章</Link>
        {article.categoryName && (
          <>
            <Icon name="chevronRight" size={13} />
            <Link to={`/articles?categoryId=${article.categoryId}`}>{article.categoryName}</Link>
          </>
        )}
      </nav>

      <div className="article-detail">
        {/* ---------------------------------------------------------- 正文 */}
        <div className="article-detail__main">
          <article className="article-header glass glass--strong">
            <div className="row wrap" style={{ gap: 8, marginBottom: 'var(--space-3)' }}>
              {article.isTop === 1 && (
                <span className="badge">
                  <Icon name="award" size={12} />
                  置顶
                </span>
              )}
              {article.categoryName && (
                <Link to={`/articles?categoryId=${article.categoryId}`} className="badge badge--neutral">
                  <Icon name="folder" size={12} />
                  {article.categoryName}
                </Link>
              )}
              {article.isOriginal === 1 && (
                <span className="badge badge--success">
                  <Icon name="sparkles" size={12} />
                  原创
                </span>
              )}
            </div>

            <h1 className="article-header__title">{article.title}</h1>

            <div className="article-header__meta">
              <span className="article-header__meta-item">
                <Avatar size="sm" src={withFallback(profile?.avatar, avatarPlaceholder(article.authorName))} name={article.authorName} />
                {article.authorName || profile?.nickname || '站主'}
              </span>
              <span className="article-header__meta-item">
                <Icon name="calendar" size={14} />
                {formatDate(article.publishedTime || article.createdTime)}
              </span>
              <span className="article-header__meta-item">
                <Icon name="clock" size={14} />
                约 {stats.minutes} 分钟读完
              </span>
              <span className="article-header__meta-item">
                <Icon name="file" size={14} />
                {stats.chars} 字
              </span>
            </div>

            {(article.tags?.length ?? 0) > 0 && (
              <div className="tag-list" style={{ marginTop: 'var(--space-4)' }}>
                {article.tags?.map((tag) => (
                  <Link to={`/articles?tagId=${tag.id}`} className="tag-chip" key={tag.id}>
                    <Icon name="tag" size={11} />
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}
          </article>

          {article.coverImage && (
            <div className="article-hero">
              <img src={article.coverImage} alt={article.title} />
            </div>
          )}

          <div className="article-body glass glass--strong">
            {article.content?.trim() ? (
              <div className="rich-text" ref={contentRef} dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <EmptyState icon="file" title="这篇还没有正文" desc="作者可能还在写。" />
            )}
          </div>

          {/* 底部操作 */}
          <div className="row wrap" style={{ gap: 12, marginTop: 'var(--space-5)' }}>
            <Button variant="glass" icon="chevronLeft" onClick={() => navigate('/articles')}>
              返回文章列表
            </Button>
            <Button
              variant="glass"
              icon="arrowUp"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              回到顶部
            </Button>
          </div>

          {/* 相关阅读 */}
          {otherArticles.length > 0 && (
            <section style={{ marginTop: 'var(--space-7)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 'var(--space-4)' }}>
                同分类下还有这些
              </h2>
              <div className="grid-cards">
                {otherArticles.map((item) => (
                  <ArticleCard key={item.id} article={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---------------------------------------------------------- 侧栏 */}
        <aside className="article-side">
          {toc.length > 1 && (
            <Glass className="side-card" variant="strong">
              <h3 className="side-card__title">目录</h3>
              <div className="toc">
                {toc.map((entry) => (
                  <button
                    type="button"
                    key={entry.id}
                    className={cx(
                      'toc__item',
                      entry.level >= 3 && `toc__item--h${entry.level}`,
                      activeId === entry.id && 'toc__item--active',
                    )}
                    onClick={() => scrollToHeading(entry.id)}
                  >
                    {entry.text}
                  </button>
                ))}
              </div>
            </Glass>
          )}

          <Glass className="side-card" variant="strong">
            <div className="side-card__author">
              <Avatar size="lg" src={withFallback(profile?.avatar, avatarPlaceholder(article.authorName))} name={article.authorName} />
              <div className="stack">
                <span className="side-card__author-name">{article.authorName || profile?.nickname || '站主'}</span>
                <span className="text-xs text-muted">本站作者</span>
              </div>
            </div>

            <div className="side-card__stats">
              <div className="side-card__stat">
                <span className="side-card__stat-label">
                  <Icon name="folder" size={14} />
                  分类
                </span>
                <span className="side-card__stat-value">{article.categoryName || '未分类'}</span>
              </div>
              <div className="side-card__stat">
                <span className="side-card__stat-label">
                  <Icon name="calendar" size={14} />
                  发布于
                </span>
                <span className="side-card__stat-value">{formatDate(article.publishedTime || article.createdTime)}</span>
              </div>
              <div className="side-card__stat">
                <span className="side-card__stat-label">
                  <Icon name="clock" size={14} />
                  阅读时长
                </span>
                <span className="side-card__stat-value">{stats.minutes} 分钟</span>
              </div>
              <div className="side-card__stat">
                <span className="side-card__stat-label">
                  <Icon name="refresh" size={14} />
                  最后更新
                </span>
                <span className="side-card__stat-value">{formatDate(article.updatedTime)}</span>
              </div>
            </div>
          </Glass>

          {profile?.github && (
            <Glass className="side-card" variant="strong">
              <h3 className="side-card__title">保持联系</h3>
              <div className="stack" style={{ gap: 8 }}>
                <a href={profile.github} target="_blank" rel="noreferrer noopener" className="about-contact">
                  <Icon name="github" size={16} />
                  GitHub
                  <span className="about-contact__value">@{profile.nickname}</span>
                </a>
                {profile.email && (
                  <a href={`mailto:${profile.email}`} className="about-contact">
                    <Icon name="mail" size={16} />
                    邮箱
                    <span className="about-contact__value">{profile.email}</span>
                  </a>
                )}
              </div>
            </Glass>
          )}
        </aside>
      </div>
    </div>
  )
}
