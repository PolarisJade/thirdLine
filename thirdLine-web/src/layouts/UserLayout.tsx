import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { MusicPlayer } from '@/components/MusicPlayer'
import { BackToTop } from '@/components/BackToTop'

/**
 * 用户端布局：页头 + 内容 + 页脚 + 全局悬浮音乐播放器。
 *
 * 注：弹幕层由首页自行挂载（只在首页展示），不放在布局里，
 * 否则进入文章详情等阅读页会被飘过的弹幕干扰。
 */
export function UserLayout() {
  const { pathname } = useLocation()

  // 切换路由后回到顶部
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])

  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="page">
        <Outlet />
      </main>
      <SiteFooter />
      <MusicPlayer />
      <BackToTop />
    </div>
  )
}
