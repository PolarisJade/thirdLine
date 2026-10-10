import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { articleApi, categoryApi, tagApi, type ArticleVO } from '@/api'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { Icon } from '@/components/Icon'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Input } from '@/components/Form'
import { ArticleCard } from '@/components/ArticleCard'
import { ArticleCardSkeleton, EmptyState } from '@/components/Feedback'
import { cx, errorMessage } from '@/utils/format'

/**
 * 文章列表页。
 *
 * 后端为游标分页（GET /user/article/page）：用上一页最后一条的 id 作为 cursor，
 * 因此这里采用「加载更多」而非页码。筛选变化时清空列表重新拉取。
 * 支持的筛选参数全部来自 ArticleQuery：keyword / categoryId / tagId。
 */
export function ArticleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  /** 初始筛选条件可以从 URL 读取，便于从文章详情页跳回来保留上下文 */
  const [keyword, setKeyword] = useState(() => searchParams.get('keyword') ?? '')
  const [categoryId, setCategoryId] = useState<number | undefined>(() => {
    const value = searchParams.get('categoryId')
    return value ? Number(value) : undefined
  })
  const [tagId, setTagId] = useState<number | undefined>(() => {
    const value = searchParams.get('tagId')
    return value ? Number(value) : undefined
  })

  const [records, setRecords] = useState<ArticleVO[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 防止筛选快速切换时旧请求覆盖新结果 */
  const requestIdRef = useRef(0)

  const debouncedKeyword = useDebounced(keyword, 420)

  const categories = useAsync(() => categoryApi.list(), [])
  const tags = useAsync(() => tagApi.list(), [])

  /** 拉取一页数据；reset 为 true 时替换列表，否则追加 */
  const fetchPage = useCallback(
    async (nextCursor: number | undefined, reset: boolean) => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (reset) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      try {
        const page = await articleApi.page({
          status: 1,
          size: 9,
          keyword: debouncedKeyword.trim() || undefined,
          categoryId,
          tagId,
          cursor: nextCursor,
        })

        // 已有更新的请求发出，丢弃这次结果
        if (requestId !== requestIdRef.current) return

        setRecords((prev) => (reset ? page.records : [...prev, ...page.records]))
        setCursor(page.nextCursor ?? undefined)
        setHasMore(Boolean(page.hasMore))
      } catch (fetchError) {
        if (requestId === requestIdRef.current) setError(errorMessage(fetchError))
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
          setLoadingMore(false)
        }
      }
    },
    [debouncedKeyword, categoryId, tagId],
  )

  /** 筛选条件变化：重置并拉第一页 */
  useEffect(() => {
    void fetchPage(undefined, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, categoryId, tagId])

  /** 同步筛选条件到 URL，便于分享与回退 */
  useEffect(() => {
    const params: Record<string, string> = {}
    if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim()
    if (categoryId) params.categoryId = String(categoryId)
    if (tagId) params.tagId = String(tagId)
    setSearchParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, categoryId, tagId])

  const resetFilters = () => {
    setKeyword('')
    setCategoryId(undefined)
    setTagId(undefined)
  }

  const hasFilter = Boolean(keyword.trim() || categoryId || tagId)

  return (
    <div className="container">
      <div className="page__header">
        <h1 className="page__title">文章</h1>
        <p className="page__desc">
          共 {records.length} 篇{hasMore ? '（还有更多）' : ''} · 关于代码、设计与生活的思考
        </p>
      </div>

      {/* ------------------------------------------------------------ 筛选 */}
      <Glass className="filter-panel" variant="strong">
        <div className="filter-panel__row">
          <Input
            icon="search"
            placeholder="搜索标题或摘要…"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ maxWidth: 340 }}
          />

          <span className="grow" />

          {hasFilter && (
            <Button variant="ghost" size="sm" icon="close" onClick={resetFilters}>
              清除筛选
            </Button>
          )}

          <span className="result-count">
            {loading ? '正在检索…' : `匹配到 ${records.length} 条结果`}
          </span>
        </div>

        {/* 分类筛选 */}
        <div className="filter-panel__row">
          <span className="filter-panel__label">分类</span>
          <button
            type="button"
            className={cx('tag-chip', !categoryId && 'tag-chip--active')}
            onClick={() => setCategoryId(undefined)}
          >
            全部
          </button>
          {(categories.data ?? []).map((category) => (
            <button
              type="button"
              key={category.id}
              className={cx('tag-chip', categoryId === category.id && 'tag-chip--active')}
              onClick={() => setCategoryId(categoryId === category.id ? undefined : category.id)}
            >
              <Icon name="folder" size={12} />
              {category.name}
            </button>
          ))}
          {categories.loading && <span className="text-xs text-muted">分类加载中…</span>}
        </div>

        {/* 标签筛选 */}
        <div className="filter-panel__row">
          <span className="filter-panel__label">标签</span>
          <button type="button" className={cx('tag-chip', !tagId && 'tag-chip--active')} onClick={() => setTagId(undefined)}>
            全部
          </button>
          {(tags.data ?? []).map((tag) => (
            <button
              type="button"
              key={tag.id}
              className={cx('tag-chip', tagId === tag.id && 'tag-chip--active')}
              onClick={() => setTagId(tagId === tag.id ? undefined : tag.id)}
            >
              <Icon name="tag" size={12} />
              {tag.name}
            </button>
          ))}
          {tags.loading && <span className="text-xs text-muted">标签加载中…</span>}
        </div>
      </Glass>

      {/* ------------------------------------------------------------ 列表 */}
      {loading ? (
        <div className="grid-cards">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <Glass className="panel">
          <EmptyState
            icon="alert"
            title="加载失败了"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={() => void fetchPage(undefined, true)}>
                重试
              </Button>
            }
          />
        </Glass>
      ) : records.length === 0 ? (
        <Glass className="panel">
          <EmptyState
            icon={hasFilter ? 'search' : 'article'}
            title={hasFilter ? '没有找到匹配的文章' : '还没有文章'}
            desc={hasFilter ? '试试换个关键词，或者清除筛选条件。' : '等站主写下第一篇内容吧。'}
            action={
              hasFilter ? (
                <Button variant="glass" icon="close" onClick={resetFilters}>
                  清除筛选
                </Button>
              ) : undefined
            }
          />
        </Glass>
      ) : (
        <>
          <div className="grid-cards">
            {records.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {(hasMore || loadingMore) && (
            <div className="load-more">
              <Button
                variant="glass"
                size="lg"
                loading={loadingMore}
                icon={loadingMore ? undefined : 'chevronDown'}
                onClick={() => void fetchPage(cursor, false)}
              >
                {loadingMore ? '正在加载…' : '加载更多文章'}
              </Button>
            </div>
          )}

          {!hasMore && records.length > 0 && (
            <p className="text-center text-muted text-sm" style={{ padding: 'var(--space-6) 0' }}>
              —— 已经到底啦，共 {records.length} 篇 ——
            </p>
          )}
        </>
      )}
    </div>
  )
}
