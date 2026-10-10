import { Link } from 'react-router-dom'
import { articleApi, danmakuApi, photoApi, portfolioApi, musicApi, siteApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Icon, type IconName } from '@/components/Icon'
import { Badge } from '@/components/Form'
import { EmptyState, TableSkeleton } from '@/components/Feedback'
import { formatNumber, formatRelative, resolveSummary } from '@/utils/format'
import { articleCover, withFallback } from '@/utils/placeholder'

interface StatCard {
  label: string
  value: number
  icon: IconName
  tone?: 'default' | 'alt' | 'warn' | 'ok'
  to: string
}

/**
 * 数据看板。
 * 并发拉取各模块的分页 total 与站点统计，形成全站概览。
 */
export function DashboardPage() {
  const stats = useAsync(() => siteApi.stats(), [])
  const articles = useAsync(() => articleApi.adminPage({ size: 6 }), [])
  const portfolios = useAsync(() => portfolioApi.adminPage({ size: 1 }), [])
  const photos = useAsync(() => photoApi.adminPage({ size: 1 }), [])
  const musics = useAsync(() => musicApi.adminPage({ size: 1 }), [])
  const danmaku = useAsync(() => danmakuApi.adminPage({ size: 1 }), [])
  const reports = useAsync(() => danmakuApi.reportPage(0, 1, 5), [])

  const cards: StatCard[] = [
    { label: '已发布文章', value: stats.data?.articleCount ?? 0, icon: 'article', to: '/admin/articles' },
    { label: '分类', value: stats.data?.categoryCount ?? 0, icon: 'folder', tone: 'alt', to: '/admin/categories' },
    { label: '标签', value: stats.data?.tagCount ?? 0, icon: 'tag', tone: 'alt', to: '/admin/tags' },
    { label: '相册照片', value: photos.data?.total ?? 0, icon: 'image', tone: 'ok', to: '/admin/photos' },
    { label: '作品集', value: portfolios.data?.total ?? 0, icon: 'grid', tone: 'ok', to: '/admin/portfolio' },
    { label: '音乐', value: musics.data?.total ?? 0, icon: 'music', tone: 'alt', to: '/admin/music' },
    { label: '弹幕总数', value: danmaku.data?.total ?? 0, icon: 'message', to: '/admin/danmaku' },
    {
      label: '待处理举报',
      value: reports.data?.total ?? 0,
      icon: 'flag',
      tone: (reports.data?.total ?? 0) > 0 ? 'warn' : 'ok',
      to: '/admin/reports',
    },
  ]

  const pendingReports = reports.data?.total ?? 0

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-head__title">数据看板</h1>
          <p className="admin-page-head__desc">一句话掌握站点当前状态</p>
        </div>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/admin/articles/new" className="btn btn--primary btn--sm">
            <Icon name="plus" size={15} />
            写新文章
          </Link>
          <a href="/" target="_blank" rel="noreferrer noopener" className="btn btn--glass btn--sm">
            <Icon name="external" size={15} />
            查看前台
          </a>
        </div>
      </div>

      {/* -------------------------------------------------------- 统计卡 */}
      <div className="dash-grid">
        {cards.map((card) => (
          <Link to={card.to} key={card.label} style={{ display: 'block' }}>
            <Glass className="dash-card" variant="strong" hoverable>
              <span
                className={
                  card.tone === 'alt'
                    ? 'dash-card__icon dash-card__icon--alt'
                    : card.tone === 'warn'
                      ? 'dash-card__icon dash-card__icon--warn'
                      : card.tone === 'ok'
                        ? 'dash-card__icon dash-card__icon--ok'
                        : 'dash-card__icon'
                }
              >
                <Icon name={card.icon} size={21} />
              </span>
              <span className="stack">
                <span className="dash-card__value">{formatNumber(card.value)}</span>
                <span className="dash-card__label">{card.label}</span>
              </span>
            </Glass>
          </Link>
        ))}
      </div>

      <div className="dash-columns">
        {/* ------------------------------------------------------ 最近文章 */}
        <Glass className="dash-panel" variant="strong" style={{ padding: 'var(--space-5)' }}>
          <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="dash-panel__title" style={{ margin: 0 }}>
              <Icon name="article" size={17} />
              最近的草稿与文章
            </h2>
            <span className="grow" />
            <Link to="/admin/articles" className="text-sm auth-link">
              全部文章
            </Link>
          </div>

          {articles.loading ? (
            <TableSkeleton rows={4} columns={3} />
          ) : (articles.data?.records.length ?? 0) === 0 ? (
            <EmptyState
              icon="article"
              title="还没有文章"
              desc="写点什么吧，哪怕只是一句话。"
              action={
                <Link to="/admin/articles/new" className="btn btn--primary btn--sm">
                  <Icon name="plus" size={15} />
                  新建文章
                </Link>
              }
            />
          ) : (
            <div className="dash-list">
              {articles.data?.records.map((article, index) => (
                <div className="dash-list__item" key={article.id}>
                  <span className={`dash-list__index${index === 0 ? ' dash-list__index--top' : ''}`}>{index + 1}</span>

                  <img
                    src={withFallback(article.coverImage, articleCover(article.id))}
                    alt=""
                    className="thumb"
                    style={{ width: 56, height: 38 }}
                  />

                  <div className="dash-list__body">
                    <div className="dash-list__title">{article.title}</div>
                    <div className="dash-list__meta">
                      {article.categoryName || '未分类'} · {formatRelative(article.publishedTime || article.createdTime)}
                      {article.status === 0 && ' · 草稿'}
                    </div>
                  </div>

                  <Link to={`/admin/articles/${article.id}/edit`} className="btn btn--ghost btn--sm">
                    <Icon name="edit" size={14} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Glass>

        {/* ------------------------------------------------------ 待处理举报 */}
        <Glass className="dash-panel" variant="strong" style={{ padding: 'var(--space-5)' }}>
          <div className="row" style={{ marginBottom: 'var(--space-4)' }}>
            <h2 className="dash-panel__title" style={{ margin: 0 }}>
              <Icon name="flag" size={17} />
              待处理举报
            </h2>
            <span className="grow" />
            {pendingReports > 0 && <Badge tone="danger">{pendingReports} 条待处理</Badge>}
          </div>

          {reports.loading ? (
            <TableSkeleton rows={3} columns={2} />
          ) : (reports.data?.records.length ?? 0) === 0 ? (
            <EmptyState icon="check" title="没有待处理举报" desc="社区氛围良好，继续保持。" />
          ) : (
            <div className="dash-list">
              {reports.data?.records.map((report) => (
                <div className="dash-list__item" key={report.id} style={{ alignItems: 'flex-start' }}>
                  <span className="dash-list__index">
                    <Icon name="flag" size={11} />
                  </span>
                  <div className="dash-list__body">
                    <div className="dash-list__title">“{report.danmakuContent || '内容已删除'}”</div>
                    <div className="dash-list__meta">
                      理由：{report.reason || '未填写'} · 举报人 {report.reporterNickname || '匿名'} ·{' '}
                      {formatRelative(report.createTime)}
                    </div>
                  </div>
                </div>
              ))}
              <Link
                to="/admin/reports"
                className="btn btn--glass btn--sm"
                style={{ marginTop: 'var(--space-4)', justifyContent: 'center' }}
              >
                去处理举报
                <Icon name="arrowRight" size={14} />
              </Link>
            </div>
          )}
        </Glass>
      </div>

      {/* -------------------------------------------------------- 快捷入口 */}
      <Glass className="dash-panel" variant="strong" style={{ padding: 'var(--space-5)' }}>
        <h2 className="dash-panel__title">
          <Icon name="zap" size={17} />
          快捷操作
        </h2>
        <div className="row wrap" style={{ gap: 10 }}>
          <Link to="/admin/articles/new" className="btn btn--glass btn--sm">
            <Icon name="edit" size={15} />
            写新文章
          </Link>
          <Link to="/admin/photos" className="btn btn--glass btn--sm">
            <Icon name="upload" size={15} />
            上传照片
          </Link>
          <Link to="/admin/portfolio" className="btn btn--glass btn--sm">
            <Icon name="plus" size={15} />
            添加作品
          </Link>
          <Link to="/admin/music" className="btn btn--glass btn--sm">
            <Icon name="music" size={15} />
            上传音乐
          </Link>
          <Link to="/admin/categories" className="btn btn--glass btn--sm">
            <Icon name="folder" size={15} />
            管理分类
          </Link>
          <Link to="/admin/settings" className="btn btn--glass btn--sm">
            <Icon name="settings" size={15} />
            账号设置
          </Link>
        </div>

        {articles.data?.records[0] && (
          <p className="text-muted text-sm" style={{ marginTop: 'var(--space-4)' }}>
            最近更新：<strong>{articles.data.records[0].title}</strong> ——{' '}
            {resolveSummary(articles.data.records[0].summary, null, 60) || '暂无摘要'}
          </p>
        )}
      </Glass>
    </div>
  )
}
