import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import { HamsterLoader } from './HamsterLoader'
import { Select } from './Form'
import { cx } from '@/utils/format'

/* ==================================================================== 空状态 */

export function EmptyState({
  icon = 'file',
  title = '这里还什么都没有',
  desc,
  action,
}: {
  icon?: IconName
  title?: string
  desc?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={icon} size={32} strokeWidth={1.5} />
      </span>
      <span className="empty__title">{title}</span>
      {desc && <span className="empty__desc">{desc}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

/* =================================================================== 骨架屏 */

export function Skeleton({
  width,
  height = 14,
  radius,
  className,
}: {
  width?: number | string
  height?: number | string
  radius?: number | string
  className?: string
}) {
  return <div className={cx('skeleton', className)} style={{ width, height, borderRadius: radius }} />
}

/** 文章卡片骨架，与 article-card 布局对齐，减少加载时的布局跳动 */
export function ArticleCardSkeleton() {
  return (
    <div className="glass article-card">
      <div className="article-card__cover">
        <Skeleton height="100%" radius={0} />
      </div>
      <div className="article-card__body">
        <div className="row" style={{ gap: 12 }}>
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </div>
        <Skeleton height={20} />
        <Skeleton width="70%" height={20} />
        <Skeleton height={12} />
        <Skeleton width="85%" height={12} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skeleton width={54} height={20} radius={999} />
          <Skeleton width={54} height={20} radius={999} />
        </div>
      </div>
    </div>
  )
}

/** 文章列表项骨架（左文右图），与 .article-row 布局对齐 */
export function ArticleRowSkeleton() {
  return (
    <div className="glass article-row">
      <div className="article-row__main">
        <div className="row" style={{ gap: 12 }}>
          <Skeleton width={80} height={12} />
          <Skeleton width={60} height={12} />
        </div>
        <Skeleton height={20} />
        <Skeleton width="60%" height={20} />
        <Skeleton height={12} />
        <Skeleton width="85%" height={12} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skeleton width={54} height={20} radius={999} />
          <Skeleton width={54} height={20} radius={999} />
        </div>
      </div>
      <div className="article-row__cover">
        <Skeleton height="100%" radius={0} />
      </div>
    </div>
  )
}

/** 作品卡片骨架 */
export function WorkCardSkeleton() {
  return (
    <div className="glass work-card">
      <div className="work-card__cover">
        <Skeleton height="100%" radius={0} />
      </div>
      <div className="work-card__body">
        <Skeleton height={20} />
        <Skeleton height={12} />
        <Skeleton width="80%" height={12} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Skeleton width={60} height={20} radius={999} />
          <Skeleton width={70} height={20} radius={999} />
        </div>
      </div>
    </div>
  )
}

/** 相册骨架：用不等的固定高度模拟瀑布流 */
export function GallerySkeleton({ count = 6 }: { count?: number }) {
  const heights = [220, 300, 260, 340, 240, 280, 320, 200]

  return (
    <div className="gallery">
      {Array.from({ length: count }).map((_, index) => (
        <div className="gallery__item" key={index}>
          <Skeleton height={heights[index % heights.length]} radius="var(--radius-lg)" />
        </div>
      ))}
    </div>
  )
}

/** 友链卡片骨架，与 .friend-card 的横向布局对齐，避免加载完成时高度跳动 */
export function FriendLinkSkeleton() {
  return (
    <div className="glass friend-card">
      <Skeleton width={44} height={44} radius={14} />
      <div className="friend-card__body">
        <Skeleton width="58%" height={15} />
        <Skeleton width="92%" height={11} />
        <Skeleton width="42%" height={10} />
      </div>
    </div>
  )
}

/** 表格骨架 */export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="stack" style={{ gap: 1 }}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="row"
          style={{ gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              height={14}
              width={columnIndex === 0 ? '32%' : `${Math.max(12, 60 / columns)}%`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** 通用加载图标：仓鼠跑轮动画，见 components/HamsterLoader.tsx */
export function Loading({ text = '加载中…' }: { text?: string }) {
  return <HamsterLoader text={text} size={8} className="page-loader" />
}

/* =================================================================== 分页器 */

/** 管理端列表默认的「每页条数」候选 */
const DEFAULT_PAGE_SIZES = [10, 20, 50]

/**
 * 组装每页条数下拉项：把当前 size 也带上，
 * 避免列表默认每页 12 条时下拉框选中项对不上。
 */
function buildSizeOptions(size: number, sizeOptions: number[]): Array<{ label: string; value: number }> {
  return Array.from(new Set([size, ...sizeOptions]))
    .sort((left, right) => left - right)
    .map((value) => ({ label: `每页 ${value} 条`, value }))
}

export function Pagination({
  current,
  total,
  size,
  onChange,
  sizeOptions = DEFAULT_PAGE_SIZES,
  onSizeChange,
}: {
  current: number
  /** 总记录数 */
  total: number
  /** 每页条数 */
  size: number
  onChange: (page: number) => void
  /** 每页条数候选；只在传了 onSizeChange 时才渲染选择器 */
  sizeOptions?: number[]
  /** 切换每页条数（通常直接传 usePaginatedList 的 setSize，它会回到第 1 页） */
  onSizeChange?: (size: number) => void
}) {
  const pageCount = Math.max(1, Math.ceil(total / size))

  /** 生成带省略号的页码序列 */
  const buildPages = (): Array<number | '...'> => {
    const pages: Array<number | '...'> = []
    const add = (value: number | '...') => pages.push(value)

    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i += 1) add(i)
      return pages
    }

    add(1)
    if (current > 3) add('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(pageCount - 1, current + 1); i += 1) add(i)
    if (current < pageCount - 2) add('...')
    add(pageCount)
    return pages
  }

  return (
    <nav className="pagination" aria-label="分页导航">
      {/* 只有一页时也保留分页条：显式标出"第 1 / 1 页"，让「当前是分页列表」一目了然 */}
      <span className="pagination__info">
        第 {current} / {pageCount} 页 · 共 {total} 条
      </span>

      <button
        type="button"
        className="pagination__btn"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        aria-label="上一页"
      >
        <Icon name="chevronLeft" size={16} />
      </button>

      {buildPages().map((page, index) =>
        page === '...' ? (
          <span className="pagination__ellipsis" key={`gap-${index}`}>
            …
          </span>
        ) : (
          <button
            type="button"
            key={page}
            className={cx('pagination__btn', page === current && 'pagination__btn--active')}
            onClick={() => onChange(page)}
            aria-current={page === current ? 'page' : undefined}
          >
            {page}
          </button>
        ),
      )}

      <button
        type="button"
        className="pagination__btn"
        disabled={current >= pageCount}
        onClick={() => onChange(current + 1)}
        aria-label="下一页"
      >
        <Icon name="chevronRight" size={16} />
      </button>

      {onSizeChange && (
        <Select
          className="pagination__size"
          aria-label="每页条数"
          value={size}
          options={buildSizeOptions(size, sizeOptions)}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        />
      )}
    </nav>
  )
}

/* ================================================================ 分区标题 */

export function SectionHead({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div className="section-head">
      <div className="section-head__titles">
        {eyebrow && <span className="section-head__eyebrow">{eyebrow}</span>}
        <h2 className="section-head__title">{title}</h2>
        {desc && <span className="section-head__desc">{desc}</span>}
      </div>
      {action}
    </div>
  )
}
