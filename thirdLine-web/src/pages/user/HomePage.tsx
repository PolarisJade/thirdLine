import { Link } from 'react-router-dom'
import { articleApi, photoApi, portfolioApi, siteApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Icon } from '@/components/Icon'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { ArticleCard } from '@/components/ArticleCard'
import { WorkMiniCard } from '@/components/WorkCard'
import { ArticleCardSkeleton, EmptyState, SectionHead } from '@/components/Feedback'
import { DanmakuStage } from '@/components/Danmaku'
import { Avatar } from '@/components/Form'
import { daysSince, formatDate, formatNumber } from '@/utils/format'
import { ABOUT_IMAGE, HERO_IMAGE, avatarPlaceholder, photoPlaceholder, withFallback } from '@/utils/placeholder'

/**
 * 首页。
 * 并发拉取：站点统计 / 站主介绍 / 最新文章（游标分页）/ 作品集 / 相册缩略图。
 */
export function HomePage() {
  const { data: stats } = useAsync(() => siteApi.stats(), [])
  const { data: profile } = useAsync(() => siteApi.profile(), [])
  const articles = useAsync(() => articleApi.page({ status: 1, size: 6 }), [])
  const portfolios = useAsync(() => portfolioApi.list(), [])
  const photos = useAsync(() => photoApi.list(), [])

  const runningDays = daysSince(profile?.startTime)
  const latestWorks = (portfolios.data ?? []).slice(0, 4)
  const latestPhotos = (photos.data ?? []).slice(0, 6)

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="container">
        <div className="hero glass glass--strong">
          <div className="hero__bg">
            <img src={HERO_IMAGE} alt="" aria-hidden="true" />
          </div>

          <div className="hero__inner">
            <span className="hero__badge">
              <Icon name="sparkles" size={13} />
              第 {formatNumber(runningDays)} 天，仍在记录
            </span>

            <h1 className="hero__title">
              你好，我是 <em>{profile?.nickname || 'PolarisJade'}</em>
              <br />
              在第三条线上写代码
            </h1>

            <p className="hero__desc">
              白天与需求周旋，夜里和光标作伴。这里放着我的技术笔记、做过的项目，
              还有一些不想忘记的瞬间。
            </p>

            <div className="hero__actions">
              <Link to="/articles" className="btn btn--primary btn--lg">
                <Icon name="book" size={17} />
                开始阅读
              </Link>
              <Link to="/portfolio" className="btn btn--glass btn--lg">
                <Icon name="grid" size={17} />
                看看作品
              </Link>
            </div>
          </div>

          {/* 弹幕层：放在 Hero 内部（Hero 为 position: relative + overflow: hidden），
              弹幕只在首屏大图区域飘过，不会盖住顶部导航，也不会干扰下方内容 */}
          <DanmakuStage />
        </div>

        {/* ------------------------------------------------------- 统计条 */}
        <div className="stats-strip">
          <Glass className="stat-card" hoverable>
            <span className="stat-card__icon">
              <Icon name="article" size={19} />
            </span>
            <span className="stat-card__value">{formatNumber(stats?.articleCount ?? 0)}</span>
            <span className="stat-card__label">篇已发布文章</span>
          </Glass>

          <Glass className="stat-card" hoverable>
            <span className="stat-card__icon">
              <Icon name="folder" size={19} />
            </span>
            <span className="stat-card__value">{formatNumber(stats?.categoryCount ?? 0)}</span>
            <span className="stat-card__label">个分类</span>
          </Glass>

          <Glass className="stat-card" hoverable>
            <span className="stat-card__icon">
              <Icon name="tag" size={19} />
            </span>
            <span className="stat-card__value">{formatNumber(stats?.tagCount ?? 0)}</span>
            <span className="stat-card__label">个标签</span>
          </Glass>

          <Glass className="stat-card" hoverable>
            <span className="stat-card__icon">
              <Icon name="image" size={19} />
            </span>
            <span className="stat-card__value">{formatNumber(stats?.photoCount ?? 0)}</span>
            <span className="stat-card__label">张相册照片</span>
          </Glass>
        </div>
      </section>

      {/* -------------------------------------------------------- 最新文章 */}
      <section className="container" style={{ marginTop: 'var(--space-8)' }}>
        <SectionHead
          eyebrow="Latest"
          title="最新文章"
          desc="记录踩过的坑，也记录绕过去的方法"
          action={
            <Link to="/articles" className="btn btn--glass btn--sm">
              查看全部
              <Icon name="arrowRight" size={15} />
            </Link>
          }
        />

        {articles.loading ? (
          <div className="grid-cards">
            {Array.from({ length: 3 }).map((_, index) => (
              <ArticleCardSkeleton key={index} />
            ))}
          </div>
        ) : articles.error ? (
          <Glass className="panel">
            <EmptyState
              icon="alert"
              title="文章加载失败"
              desc={articles.error}
              action={<Button variant="primary" icon="refresh" onClick={articles.reload}>重新加载</Button>}
            />
          </Glass>
        ) : (articles.data?.records.length ?? 0) === 0 ? (
          <Glass className="panel">
            <EmptyState
              icon="article"
              title="还没有发布文章"
              desc="登录管理后台，写下第一篇内容吧。"
              action={
                <Link to="/admin" className="btn btn--primary">
                  <Icon name="edit" size={16} />
                  去写文章
                </Link>
              }
            />
          </Glass>
        ) : (
          <div className="grid-cards">
            {articles.data?.records.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>

      {/* -------------------------------------------------------- 最新作品 */}
      {latestWorks.length > 0 && (
        <section className="container" style={{ marginTop: 'var(--space-8)' }}>
          <SectionHead
            eyebrow="Works"
            title="最近在做的东西"
            desc="动手做出来的，才真正属于自己"
            action={
              <Link to="/portfolio" className="btn btn--glass btn--sm">
                查看全部
                <Icon name="arrowRight" size={15} />
              </Link>
            }
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {latestWorks.map((work) => (
              <WorkMiniCard key={work.id} work={work} />
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------------------------------------- 相册 */}
      {latestPhotos.length > 0 && (
        <section className="container" style={{ marginTop: 'var(--space-8)' }}>
          <SectionHead
            eyebrow="Moments"
            title="生活碎片"
            desc={`已收藏 ${photos.data?.length ?? 0} 个瞬间`}
            action={
              <Link to="/gallery" className="btn btn--glass btn--sm">
                进入相册
                <Icon name="arrowRight" size={15} />
              </Link>
            }
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {latestPhotos.map((photo) => (
              <Link
                to="/gallery"
                key={photo.id}
                className="glass glass--hoverable"
                style={{ overflow: 'hidden', borderRadius: 'var(--radius-md)' }}
              >
                <img
                  src={withFallback(photo.url, photoPlaceholder(photo.id))}
                  alt={photo.title ?? '相册照片'}
                  loading="lazy"
                  style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* -------------------------------------------------------- 关于我 */}
      <section className="container" style={{ marginTop: 'var(--space-8)' }}>
        <Glass variant="strong" radius="2xl" style={{ padding: 'var(--space-7)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 'var(--space-6)',
              alignItems: 'center',
            }}
          >
            <div className="stack" style={{ gap: 'var(--space-4)' }}>
              <span className="section-head__eyebrow">About</span>
              <h2 style={{ fontSize: 26, fontWeight: 800 }}>
                关于 <em style={{ fontStyle: 'normal', color: 'var(--brand-500)' }}>{profile?.nickname || '我'}</em>
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: 'var(--text-secondary)', maxWidth: 560 }}>
                一名喜欢把复杂问题拆开揉碎的后端开发者，也偶尔折腾前端与设计。
                相信好的代码像好的文字，读起来应该顺畅、有节奏。
                <br />
                本站自 {formatDate(profile?.startTime)} 开始运行，已经陪我走过 {formatNumber(runningDays)} 天。
              </p>

              <div className="row wrap" style={{ gap: 12 }}>
                <Link to="/about" className="btn btn--primary">
                  <Icon name="user" size={16} />
                  更多关于我
                </Link>
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noreferrer noopener" className="btn btn--glass">
                    <Icon name="github" size={16} />
                    GitHub
                  </a>
                )}
              </div>
            </div>

            <div className="row" style={{ gap: 16 }}>
              <Avatar size="xl" src={withFallback(profile?.avatar, avatarPlaceholder(profile?.nickname))} name={profile?.nickname} />
              <img
                src={ABOUT_IMAGE}
                alt=""
                aria-hidden="true"
                className="hide-under-820"
                style={{
                  width: 160,
                  height: 160,
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-xl)',
                }}
              />
            </div>
          </div>
        </Glass>
      </section>
    </>
  )
}
