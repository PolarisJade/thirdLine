import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'
import { SiteFooter } from './SiteFooter'
import { MusicPlayer } from '@/components/MusicPlayer'
import { BackToTop } from '@/components/BackToTop'

/**
 * 用户端布局：页头 + 内容 + 页脚 + 全局悬浮音乐播放器。
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


