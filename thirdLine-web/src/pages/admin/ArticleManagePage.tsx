import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { articleApi, categoryApi, tagApi, type ArticleVO } from '@/api'
import { useAsync, useDebounced } from '@/hooks/useAsync'
import { useToast } from '@/components/ToastContext'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { Badge, Input, Select } from '@/components/Form'
import { ConfirmDialog } from '@/components/Modal'
import { EmptyState, TableSkeleton } from '@/components/Feedback'
import { errorMessage, formatDateTime, resolveSummary } from '@/utils/format'
import { articleCover, withFallback } from '@/utils/placeholder'

/**
 * 文章管理（后台）。
 * 列表：GET /admin/article/page（游标分页，支持 keyword / status / categoryId / tagId）
 * 删除：DELETE /admin/article/{id}
 * 发布/转草稿：PUT /admin/article（只提交 id 与 status，后端按非 null 字段更新）
 */
export function ArticleManagePage() {
  const toast = useToast()

  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<number | undefined>(undefined)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [tagId, setTagId] = useState<number | undefined>(undefined)

  const [records, setRecords] = useState<ArticleVO[]>([])
  const [cursor, setCursor] = useState<number | undefined>(undefined)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pendingDelete, setPendingDelete] = useState<ArticleVO | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null)

  const requestIdRef = useRef(0)
  const debouncedKeyword = useDebounced(keyword, 420)

  const categories = useAsync(() => categoryApi.adminList(), [])
  const tags = useAsync(() => tagApi.adminList(), [])

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
        const page = await articleApi.adminPage({
          size: 10,
          keyword: debouncedKeyword.trim() || undefined,
          status,
          categoryId,
          tagId,
          cursor: nextCursor,
        })

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
    [debouncedKeyword, status, categoryId, tagId],
  )

  useEffect(() => {
    void fetchPage(undefined, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, status, categoryId, tagId])

  /** 切换发布状态：只提交 id + status，避免覆盖其它字段 */
  const toggleStatus = async (article: ArticleVO) => {
    const nextStatus = article.status === 1 ? 0 : 1
    setStatusUpdating(article.id)
    try {
      await articleApi.update({ id: article.id, status: nextStatus })
      setRecords((prev) =>
        prev.map((item) =>
          item.id === article.id
            ? {
                ...item,
                status: nextStatus,
                publishedTime: nextStatus === 1 && !item.publishedTime ? new Date().toISOString() : item.publishedTime,
              }
            : item,
        ),
      )
      toast.success(nextStatus === 1 ? '已发布' : '已转为草稿')
    } catch (updateError) {
      toast.error(errorMessage(updateError))
    } finally {
      setStatusUpdating(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return

    setDeleting(true)
    try {
      await articleApi.remove(pendingDelete.id)
      toast.success('文章已删除')
      setRecords((prev) => prev.filter((item) => item.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (deleteError) {
      toast.error(errorMessage(deleteError))
    } finally {
      setDeleting(false)
    }
  }

  const resetFilters = () => {
    setKeyword('')
    setStatus(undefined)
    setCategoryId(undefined)
    setTagId(undefined)
  }

  const hasFilter = Boolean(keyword.trim() || status !== undefined || categoryId || tagId)

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">文章管理</h1>
          <p className="admin-page-head__desc">
            共 {records.length} 篇{hasMore ? '（还有更多）' : ''} · 支持草稿与已发布状态切换
          </p>
        </div>
        <Link to="/admin/articles/new" className="btn btn--primary">
          <Icon name="plus" size={16} />
          写新文章
        </Link>
      </div>

      {/* ------------------------------------------------------------ 筛选 */}
      <Glass className="panel" variant="strong" style={{ padding: 'var(--space-4) var(--space-5)' }}>
        <div className="filter-bar">
          <Input
            icon="search"
            placeholder="搜索标题或摘要…"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            style={{ maxWidth: 280 }}
          />

          <Select
            value={status ?? ''}
            placeholder="全部状态"
            style={{ maxWidth: 140 }}
            options={[
              { label: '已发布', value: 1 },
              { label: '草稿', value: 0 },
              { label: '已删除', value: 2 },
            ]}
            onChange={(event) => setStatus(event.target.value === '' ? undefined : Number(event.target.value))}
          />

          <Select
            value={categoryId ?? ''}
            placeholder="全部分类"
            style={{ maxWidth: 170 }}
            options={(categories.data ?? []).map((item) => ({ label: item.name, value: item.id }))}
            onChange={(event) => setCategoryId(event.target.value === '' ? undefined : Number(event.target.value))}
          />

          <Select
            value={tagId ?? ''}
            placeholder="全部标签"
            style={{ maxWidth: 170 }}
            options={(tags.data ?? []).map((item) => ({ label: item.name, value: item.id }))}
            onChange={(event) => setTagId(event.target.value === '' ? undefined : Number(event.target.value))}
          />

          {hasFilter && (
            <Button variant="ghost" size="sm" icon="close" onClick={resetFilters}>
              清除筛选
            </Button>
          )}
        </div>
      </Glass>

      {/* ------------------------------------------------------------ 列表 */}
      <Glass className="panel panel--flush" variant="strong">
        {loading ? (
          <TableSkeleton rows={6} columns={5} />
        ) : error ? (
          <EmptyState
            icon="alert"
            title="加载失败"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={() => void fetchPage(undefined, true)}>
                重试
              </Button>
            }
          />
        ) : records.length === 0 ? (
          <EmptyState
            icon={hasFilter ? 'search' : 'article'}
            title={hasFilter ? '没有符合条件的文章' : '还没有文章'}
            desc={hasFilter ? '试试调整筛选条件。' : '写下第一篇内容，从这里开始。'}
            action={
              hasFilter ? (
                <Button variant="glass" icon="close" onClick={resetFilters}>
                  清除筛选
                </Button>
              ) : (
                <Link to="/admin/articles/new" className="btn btn--primary">
                  <Icon name="plus" size={16} />
                  写新文章
                </Link>
              )
            }
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 300 }}>文章</th>
                    <th>分类 / 标签</th>
                    <th>状态</th>
                    <th>发布时间</th>
                    <th style={{ textAlign: 'right' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <div className="cell-row">
                          <img
                            className="thumb"
                            src={withFallback(article.coverImage, articleCover(article.id))}
                            alt=""
                            loading="lazy"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div className="cell-title">
                              {article.isTop === 1 && (
                                <Icon
                                  name="award"
                                  size={13}
                                  style={{ display: 'inline', marginRight: 4, color: 'var(--brand-500)' }}
                                />
                              )}
                              {article.title}
                            </div>
                            <div className="cell-sub truncate-1">
                              {resolveSummary(article.summary, article.content, 60) || '暂无摘要'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="stack" style={{ gap: 5 }}>
                          <span className="text-sm">{article.categoryName || '未分类'}</span>
                          <div className="tag-list">
                            {(article.tags ?? []).slice(0, 2).map((tag) => (
                              <span className="tag-chip" key={tag.id}>
                                {tag.name}
                              </span>
                            ))}
                            {(article.tags?.length ?? 0) > 2 && (
                              <span className="tag-chip">+{(article.tags?.length ?? 0) - 2}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {article.status === 1 ? (
                          <Badge tone="success">已发布</Badge>
                        ) : article.status === 0 ? (
                          <Badge tone="warning">草稿</Badge>
                        ) : (
                          <Badge tone="neutral">已删除</Badge>
                        )}
                        {article.isOriginal === 1 && (
                          <div style={{ marginTop: 5 }}>
                            <Badge tone="info">原创</Badge>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className="text-sm text-muted">
                          {article.publishedTime ? formatDateTime(article.publishedTime) : '未发布'}
                        </span>
                      </td>

                      <td>
                        <div className="table__actions">
                          <Link to={`/articles/${article.id}`} className="btn btn--ghost btn--sm" title="前台预览">
                            <Icon name="eye" size={15} />
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon={article.status === 1 ? 'eyeOff' : 'check'}
                            loading={statusUpdating === article.id}
                            onClick={() => void toggleStatus(article)}
                            title={article.status === 1 ? '转为草稿' : '发布'}
                          >
                            {article.status === 1 ? '转草稿' : '发布'}
                          </Button>

                          <Link to={`/admin/articles/${article.id}/edit`} className="btn btn--ghost btn--sm">
                            <Icon name="edit" size={15} />
                            编辑
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            icon="trash"
                            onClick={() => setPendingDelete(article)}
                            style={{ color: 'var(--danger)' }}
                            title="删除文章"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(hasMore || loadingMore) && (
              <div className="load-more">
                <Button
                  variant="glass"
                  loading={loadingMore}
                  icon={loadingMore ? undefined : 'chevronDown'}
                  onClick={() => void fetchPage(cursor, false)}
                >
                  {loadingMore ? '正在加载…' : '加载更多'}
                </Button>
              </div>
            )}
          </>
        )}
      </Glass>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="删除文章"
        message={
          <>
            确定要删除《<strong>{pendingDelete?.title}</strong>》吗？
            <br />
            文章及其标签关联会被一并删除，OSS 上的封面图也会同步清理，此操作不可恢复。
          </>
        }
        confirmText="确认删除"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
