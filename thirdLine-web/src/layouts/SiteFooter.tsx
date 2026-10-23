import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { useAsync } from '@/hooks/useAsync'
import { siteApi } from '@/api'
import { formatDate } from '@/utils/format'

/**
 * ICP 备案信息（个人备案）。
 * 按备案要求，备案号须以纯文本展示在页面底部，并链接至工信部备案管理系统；
 * 因此这里写成常量而不是走接口，保证后端不可用时备案号依然显示。
 */
const ICP_NUMBER = '湘ICP备2026048558号'
const ICP_QUERY_URL = 'https://beian.miit.gov.cn/'

/**
 * 页脚。
 * 站主信息来自 GET /user/site/profile（后端配置文件 tl.host.*），是公开读接口。
 */
export function SiteFooter() {
  const { data: profile } = useAsync(() => siteApi.profile(), [])

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
              第三行 —— 虚拟与现实的交界处。
              <br />
              这里记录我写下的每一段逻辑，也收藏路过的每一束光。
            </p>
          </div>

          <div>
            <h3 className="site-footer__title">快速导航</h3>
            <div className="site-footer__links site-footer__links--grid">
              <Link to="/articles" className="site-footer__link">
                <Icon name="article" size={15} />
                文章
              </Link>
              <Link to="/portfolio" className="site-footer__link">
                <Icon name="grid" size={15} />
                作品
              </Link>
              <Link to="/gallery" className="site-footer__link">
                <Icon name="image" size={15} />
                相册
              </Link>
              <Link to="/links" className="site-footer__link">
                <Icon name="link" size={15} />
                友链
              </Link>
              <Link to="/about" className="site-footer__link">
                <Icon name="user" size={15} />
                关于
              </Link>
            </div>
          </div>

          <div>
            <h3 className="site-footer__title">联系我</h3>
            <div className="site-footer__links">
              <div className="row" style={{ gap: 12 }}>
                {profile?.email && (
                  <a href={`mailto:${profile.email}`} className="site-footer__link" aria-label="邮箱">
                    <Icon name="mail" size={18} />
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noreferrer noopener" className="site-footer__link" aria-label="GitHub">
                    <Icon name="github" size={18} />
                  </a>
                )}
              </div>
              <span className="site-footer__link" style={{ cursor: 'default' }}>
                <Icon name="calendar" size={15} />
                始于 {formatDate(profile?.startTime)}
              </span>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <a
            className="site-footer__icp"
            href={ICP_QUERY_URL}
            target="_blank"
            rel="noreferrer noopener"
            title="工业和信息化部政务服务平台 · 备案信息查询"
          >
            {ICP_NUMBER}
            <Icon name="external" size={12} strokeWidth={2} />
          </a>
        </div>
      </div>
    </footer>
  )
}
