import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, SpinnerGap } from '@phosphor-icons/react'
import { getArticleDetail } from '@/api/article'
import type { ArticleVO } from '@/types'
import RichTextView from '@/components/RichTextView'
import Pill from '@/components/Pill'
import Reveal from '@/components/Reveal'
import { formatDate } from '@/utils/format'

/** 前台文章详情：max-w-4xl 阅读区 */
export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>()
  const [article, setArticle] = useState<ArticleVO | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getArticleDetail(Number(id))
      .then((data) => {
        setArticle(data)
        window.scrollTo({ top: 0 })
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

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
      <div className="mx-auto max-w-4xl px-6 py-16">
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
          <div className="mt-10">
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
    </article>
  )
}
