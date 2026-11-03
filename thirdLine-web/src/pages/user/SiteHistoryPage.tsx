import { useEffect, useRef } from 'react'
import { siteHistoryApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Form'
import { EmptyState, Skeleton } from '@/components/Feedback'

/** 从旧到新阅读；数据首次就绪后定位到最新一条，后续重试不打断阅读。 */
export function SiteHistoryPage() {
  const { data, loading, error, reload } = useAsync(siteHistoryApi.list, [])
  const latest = useRef<HTMLLIElement | null>(null)
  const oldest = useRef<HTMLLIElement | null>(null)
  const positioned = useRef(false)

  useEffect(() => {
    if (!data?.length || positioned.current) return
    // 等待路由布局的滚动复位和页面排版完成。
    const frame = requestAnimationFrame(() => {
      latest.current?.scrollIntoView({ block: 'end', behavior: 'instant' })
      positioned.current = true
    })
    return () => cancelAnimationFrame(frame)
  }, [data])

  const jump = (edge: 'oldest' | 'latest') => {
    const target = edge === 'oldest' ? oldest.current : latest.current
    target?.scrollIntoView({
      block: edge === 'oldest' ? 'start' : 'end',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    })
  }

  return (
    <div className="container site-history-page">
      <header className="page__header">
        <span className="section-head__eyebrow">Changelog</span>
        <h1 className="page__title">网站历程</h1>
        <p className="page__desc">按时间记下这里的每一次更新。</p>
      </header>
      {loading ? (
        <div className="stack history-loading" role="status" aria-label="正在加载网站历程">
          {[0, 1, 2].map((item) => <Glass key={item} className="history-entry"><Skeleton width="30%" /><Skeleton height={70} /></Glass>)}
        </div>
      ) : error ? (
        <Glass><EmptyState icon="alert" title="历程加载失败" desc={error}
          action={<Button variant="glass" onClick={reload}>重新加载</Button>} /></Glass>
      ) : !data?.length ? (
        <Glass><EmptyState icon="clock" title="还没有发布历程" desc="之后的网站更新会记录在这里。" /></Glass>
      ) : (
        <>
          <div className="history-toolbar">
            <span className="text-muted text-sm">共 {data.length} 条更新 · 从旧到新</span>
            <div className="row">
              <Button variant="ghost" size="sm" onClick={() => jump('oldest')}>最早记录</Button>
              <Button variant="glass" size="sm" onClick={() => jump('latest')}>最新记录</Button>
            </div>
          </div>
          <ol className="history-timeline" aria-label="网站更新历程">
            {data.map((item, index) => (
              <li className="history-item" key={item.id}
                ref={(node) => {
                  if (index === 0) oldest.current = node
                  if (index === data.length - 1) latest.current = node
                }}>
                <time className="history-date" dateTime={item.updateDate}>{item.updateDate}</time>
                <Glass className="history-entry" variant="strong">
                  <div className="history-entry__meta">
                    <h2 className="history-version">{item.version}</h2>
                    <Badge tone={item.updateType === 2 ? 'warning' : item.updateType === 1 ? 'info' : 'success'}>{item.updateTypeLabel}</Badge>
                    {index === data.length - 1 && <span className="history-latest">最新</span>}
                  </div>
                  <p className="history-description">{item.description}</p>
                </Glass>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}

