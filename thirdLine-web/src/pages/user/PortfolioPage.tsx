import { useMemo, useState } from 'react'
import { portfolioApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { WorkCard } from '@/components/WorkCard'
import { EmptyState, WorkCardSkeleton } from '@/components/Feedback'
import { cx } from '@/utils/format'

/**
 * 作品集页。
 * 数据来自 GET /user/portfolio/list（仅已发布作品，按发布时间倒序），
 * 每个作品的技术栈由后端从 tl_portfolio_tech_stack + tl_tech_stack 装配。
 * 筛选仍在前端完成：接口不提供技术栈过滤参数，因此本地按 techStacks 统计。
 */
export function PortfolioPage() {
  const { data, loading, error, reload } = useAsync(() => portfolioApi.list(), [])
  const [activeTechId, setActiveTechId] = useState<number | null>(null)

  const works = data ?? []

  /** 汇总所有技术栈并统计出现次数，按次数倒序 */
  const techStats = useMemo(() => {
    const counter = new Map<number, { name: string; count: number }>()
    works.forEach((work) => {
      ;(work.techStacks ?? []).forEach((tech) => {
        const current = counter.get(tech.id)
        counter.set(tech.id, { name: tech.name, count: (current?.count ?? 0) + 1 })
      })
    })
    return Array.from(counter.entries())
      .map(([id, item]) => ({ id, name: item.name, count: item.count }))
      .sort((left, right) => right.count - left.count)
  }, [works])

  const activeTechName = techStats.find((item) => item.id === activeTechId)?.name ?? null

  const filtered =
    activeTechId === null
      ? works
      : works.filter((work) => (work.techStacks ?? []).some((tech) => tech.id === activeTechId))

  return (
    <div className="container">
      <div className="page__header">
        <h1 className="page__title">作品集</h1>
        <p className="page__desc">
          共 {works.length} 个作品 · 从想法到上线，记录每一次动手的过程
        </p>
      </div>

      {/* 技术栈筛选：本地统计，不调用接口 */}
      {techStats.length > 0 && (
        <Glass className="filter-panel" variant="strong" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="filter-panel__row">
            <span className="filter-panel__label">技术栈</span>
            <button
              type="button"
              className={cx('tag-chip', activeTechId === null && 'tag-chip--active')}
              onClick={() => setActiveTechId(null)}
            >
              全部 {works.length}
            </button>
            {techStats.map(({ id, name, count }) => (
              <button
                type="button"
                key={id}
                className={cx('tag-chip', activeTechId === id && 'tag-chip--active')}
                onClick={() => setActiveTechId(activeTechId === id ? null : id)}
              >
                <Icon name="code" size={12} />
                {name}
                <span style={{ opacity: 0.65 }}>{count}</span>
              </button>
            ))}
          </div>
        </Glass>
      )}

      {loading ? (
        <div className="grid-cards grid-cards--wide">
          {Array.from({ length: 6 }).map((_, index) => (
            <WorkCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <Glass className="panel">
          <EmptyState
            icon="alert"
            title="作品加载失败"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={reload}>
                重新加载
              </Button>
            }
          />
        </Glass>
      ) : filtered.length === 0 ? (
        <Glass className="panel">
          <EmptyState
            icon="grid"
            title={activeTechName ? `没有使用 ${activeTechName} 的作品` : '还没有发布作品'}
            desc={activeTechName ? '换个技术栈看看吧。' : '作品集还是空的，去后台添加第一个作品吧。'}
            action={
              activeTechName ? (
                <Button variant="glass" icon="close" onClick={() => setActiveTechId(null)}>
                  清除筛选
                </Button>
              ) : undefined
            }
          />
        </Glass>
      ) : (
        <div className="grid-cards grid-cards--wide">
          {filtered.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      )}
    </div>
  )
}
