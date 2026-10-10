import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { useAsync } from '@/hooks/useAsync'
import { siteApi } from '@/api'
import { daysSince, formatDate } from '@/utils/format'
import { avatarPlaceholder, withFallback } from '@/utils/placeholder'
import { Avatar } from '@/components/Form'

/**
 * 页脚。
 * 站主信息来自 GET /user/site/profile（后端配置文件 tl.host.*），
 * 统计来自 GET /user/site/stats，两个接口都是公开读接口。
 */
export function SiteFooter() {
  const { data: profile } = useAsync(() => siteApi.profile(), [])
  const { data: stats } = useAsync(() => siteApi.stats(), [])

  const runningDays = daysSince(profile?.startTime)

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="stack" style={{ gap: 12 }}>
            <div className="row" style={{ gap: 10 }}>
              <span className="brand__mark" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Icon name="sparkles" size={16} strokeWidth={2} />
              </span>
              <span style={{ fontSize: 16, fontWeight: 800 }}>thirdLine</span>
            </div>
            <p className="site-footer__text">
              第三条线 —— 代码、设计与生活的交界处。
              <br />
              这里记录我写下的每一段逻辑，也收藏路过的每一束光。
            </p>
          </div>

          <div>
            <h3 className="site-footer__title">快速导航</h3>
            <div className="site-footer__links">
              <Link to="/articles" className="site-footer__link">
                <Icon name="article" size={15} />
                全部文章
              </Link>
              <Link to="/portfolio" className="site-footer__link">
                <Icon name="grid" size={15} />
                作品集
              </Link>
              <Link to="/gallery" className="site-footer__link">
                <Icon name="image" size={15} />
                相册
              </Link>
              <Link to="/about" className="site-footer__link">
                <Icon name="user" size={15} />
                关于我
              </Link>
            </div>
          </div>

          <div>
            <h3 className="site-footer__title">联系我</h3>
            <div className="site-footer__links">
              {profile?.email && (
                <a href={`mailto:${profile.email}`} className="site-footer__link">
                  <Icon name="mail" size={15} />
                  {profile.email}
                </a>
              )}
              {profile?.github && (
                <a href={profile.github} target="_blank" rel="noreferrer noopener" className="site-footer__link">
                  <Icon name="github" size={15} />
                  GitHub
                </a>
              )}
              <span className="site-footer__link" style={{ cursor: 'default' }}>
                <Icon name="calendar" size={15} />
                始于 {formatDate(profile?.startTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span className="row" style={{ gap: 8 }}>
            <Avatar
              size="sm"
              src={withFallback(profile?.avatar, avatarPlaceholder(profile?.nickname ?? 'thirdLine'))}
              name={profile?.nickname ?? 'thirdLine'}
            />
            © {new Date().getFullYear()} {profile?.nickname ?? 'thirdLine'} · 保留所有权利
          </span>

          <span className="row wrap" style={{ gap: 14 }}>
            {stats && (
              <>
                <span className="row" style={{ gap: 5 }}>
                  <Icon name="article" size={13} />
                  {stats.articleCount} 篇文章
                </span>
                <span className="row" style={{ gap: 5 }}>
                  <Icon name="tag" size={13} />
                  {stats.tagCount} 个标签
                </span>
                <span className="row" style={{ gap: 5 }}>
                  <Icon name="image" size={13} />
                  {stats.photoCount} 张照片
                </span>
              </>
            )}
            <span className="row" style={{ gap: 5 }}>
              <Icon name="clock" size={13} />
              已运行 {runningDays} 天
            </span>
          </span>
        </div>
      </div>
    </footer>
  )
}
