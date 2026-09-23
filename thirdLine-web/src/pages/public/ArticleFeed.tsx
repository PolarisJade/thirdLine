import { useCallback, useEffect, useState } from 'react'
import { pageArticles } from '@/api/article'
import type { ArticleQuery, ArticleVO } from '@/types'
import { ARTICLE_STATUS } from '@/types'
import ArticleCard from '@/components/ArticleCard'
import Reveal from '@/components/Reveal'
import { SpinnerGap } from '@phosphor-icons/react'

interface ArticleFeedProps {
  /** 基础查询条件（分类 / 标签 / 关键词），变化时自动重新加载 */
  query: Omit<ArticleQuery, 'cursor' | 'size' | 'status'>
  /** 每页条数 */
  size?: number
  emptyText?: string
}

/** 游标分页文章流：bento 网格 + 加载更多 */
export default function ArticleFeed({ query, size = 9, emptyText = '暂无文章' }: ArticleFeedProps) {
  const [records, setRecords] = useState<ArticleVO[]>([])
  const [cursor, setCursor] = useState<number | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // query 序列化，避免对象引用变化导致重复请求
  const queryKey = JSON.stringify(query)

  const load = useCallback(
    async (nextCursor: number | null, append: boolean) => {
      setLoading(true)
      try {
        const parsed = JSON.parse(queryKey) as ArticleFeedProps['query']
        const page = await pageArticles({
          ...parsed,
          status: ARTICLE_STATUS.PUBLISHED,
          cursor: nextCursor,
          size,
        })
        setRecords((prev) => (append ? [...prev, ...page.records] : page.records))
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      } catch {
        if (!append) setRecords([])
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    },
    [queryKey, size],
  )

  useEffect(() => {
    setRecords([])
    setInitialized(false)
    load(null, false)
  }, [load])

  return (
    <div>
      {records.length > 0 && (
        <div className="flex flex-col gap-6">
          {records.map((article, index) => (
            <Reveal key={article.id} delay={(index % size) * 60}>
              <ArticleCard article={article} />
            </Reveal>
          ))}
        </div>
      )}

      {initialized && records.length === 0 && !loading && (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-ink">这里还很安静</p>
          <p className="mt-2 font-mono text-sm text-muted">{emptyText}</p>
        </div>
      )}

      <div className="mt-14 flex justify-center">
        {loading ? (
          <span className="flex items-center gap-2 font-mono text-sm text-muted">
            <SpinnerGap size={16} className="animate-spin" /> 加载中
          </span>
        ) : hasMore ? (
          <button className="mui-btn-primary" onClick={() => load(cursor, true)}>
            加载更多
          </button>
        ) : records.length > 0 ? (
          <span className="font-mono text-xs uppercase tracking-widest text-muted">
            — 已经到底了 —
          </span>
        ) : null}
      </div>
    </div>
  )
}
