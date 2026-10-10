import { Link } from 'react-router-dom'
import { Icon } from '@/components/Icon'

/** 404 页面；admin 模式下按钮回到看板而不是前台首页 */
export function NotFoundPage({ admin = false }: { admin?: boolean }) {
  return (
    <div className="not-found">
      <span className="not-found__code">404</span>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>这条路走到尽头了</h1>
      <p className="text-muted" style={{ maxWidth: 420, lineHeight: 1.8 }}>
        你要找的页面不存在，或者已经被移动到了别的地方。
        <br />
        不如回到熟悉的地方重新出发。
      </p>
      <div className="row wrap" style={{ gap: 12, justifyContent: 'center', marginTop: 8 }}>
        <Link to={admin ? '/admin' : '/'} className="btn btn--primary">
          <Icon name={admin ? 'dashboard' : 'home'} size={16} />
          {admin ? '返回数据看板' : '返回首页'}
        </Link>
        {!admin && (
          <Link to="/articles" className="btn btn--glass">
            <Icon name="article" size={16} />
            去读文章
          </Link>
        )}
      </div>
    </div>
  )
}
