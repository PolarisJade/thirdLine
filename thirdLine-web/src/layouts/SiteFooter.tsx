import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'
import { useAsync } from '@/hooks/useAsync'
import { siteApi } from '@/api'
import { formatDate } from '@/utils/format'

/**
 * ICP 备案信息（个人备案）。
 * 按备案要求，备案号须以纯文本展示在页面底部，并链接至工信部备案管理系统。
 * 真实备案号不入库（不上传 GitHub），改由 thirdLine-web/.env.local 注入 VITE_ICP_NUMBER 等，
 * 该文件已被 *.local 规则忽略；Vite 构建时自动内联进 import.meta.env.VITE_*。
 */
const ICP_NUMBER = import.meta.env.VITE_ICP_NUMBER as string | undefined
const ICP_QUERY_URL = 'https://beian.miit.gov.cn/'

/**
 * 公安联网备案信息。
 * 按公安联网备案要求，须在网站底部展示备案图标（police-beian-icon.png）与备案号，
 * 并链接至全国互联网安全管理服务平台的备案查询页。同样通过 .env.local 注入。
 */
const POLICE_BEIAN_NUMBER = import.meta.env.VITE_POLICE_BEIAN_NUMBER as string | undefined
const POLICE_BEIAN_CODE = import.meta.env.VITE_POLICE_BEIAN_CODE as string | undefined
const POLICE_BEIAN_QUERY_URL = POLICE_BEIAN_CODE
  ? `https://beian.mps.gov.cn/#/query/webSearch?code=${POLICE_BEIAN_CODE}`
  : 'https://beian.mps.gov.cn/'
const POLICE_BEIAN_ICON = '/police-beian-icon.png'

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
              <Link to="/articles/archive" className="site-footer__link">
                <Icon name="clock" size={15} />
                归档
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
          {ICP_NUMBER && (
            <a
              className="site-footer__icp"
              href={ICP_QUERY_URL}
              target="_blank"
              rel="noreferrer noopener"
              title="工业和信息化部政务服务平台 · 备案信息查询"
            >
              {ICP_NUMBER}
            </a>
          )}
          {POLICE_BEIAN_NUMBER && (
            <a
              className="site-footer__icp"
              href={POLICE_BEIAN_QUERY_URL}
              target="_blank"
              rel="noreferrer"
              title="全国互联网安全管理服务平台 · 公安联网备案查询"
            >
              <img className="site-footer__beian-icon" src={POLICE_BEIAN_ICON} alt="公安联网备案图标" />
              {POLICE_BEIAN_NUMBER}
            </a>
          )}
        </div>
      </div>
    </footer>
  )
}
