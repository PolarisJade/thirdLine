import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { UserLayout } from './layouts/UserLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAdmin, RequireAuth } from './routes/guards'
import { RouteFallback } from './components/RouteFallback'

/* ------------------------------------------------------------------ 用户端 */
import { HomePage } from './pages/user/HomePage'
import { ArticleListPage } from './pages/user/ArticleListPage'
import { ArticleDetailPage } from './pages/user/ArticleDetailPage'
import { PortfolioPage } from './pages/user/PortfolioPage'
import { GalleryPage } from './pages/user/GalleryPage'
import { MusicPage } from './pages/user/MusicPage'
import { FriendLinksPage } from './pages/user/FriendLinksPage'
import { AboutPage } from './pages/user/AboutPage'
import { ProfilePage } from './pages/user/ProfilePage'
import { LoginPage } from './pages/user/LoginPage'
import { RegisterPage } from './pages/user/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'

/* ------------------------------------------------------------------ 管理端
   全部按需加载（React.lazy）：管理端页面与富文本编辑器（约 280KB gzip）
   不再进入前台首屏包，只有访问 /admin/** 时才下载对应 chunk。 */
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage })))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const ArticleManagePage = lazy(() =>
  import('./pages/admin/ArticleManagePage').then((m) => ({ default: m.ArticleManagePage })),
)
const ArticleEditorPage = lazy(() =>
  import('./pages/admin/ArticleEditorPage').then((m) => ({ default: m.ArticleEditorPage })),
)
const CategoryManagePage = lazy(() =>
  import('./pages/admin/CategoryManagePage').then((m) => ({ default: m.CategoryManagePage })),
)
const TagManagePage = lazy(() => import('./pages/admin/TagManagePage').then((m) => ({ default: m.TagManagePage })))
const TechStackManagePage = lazy(() =>
  import('./pages/admin/TechStackManagePage').then((m) => ({ default: m.TechStackManagePage })),
)
const PhotoManagePage = lazy(() => import('./pages/admin/PhotoManagePage').then((m) => ({ default: m.PhotoManagePage })))
const PortfolioManagePage = lazy(() =>
  import('./pages/admin/PortfolioManagePage').then((m) => ({ default: m.PortfolioManagePage })),
)
const MusicManagePage = lazy(() => import('./pages/admin/MusicManagePage').then((m) => ({ default: m.MusicManagePage })))
const FriendLinkManagePage = lazy(() =>
  import('./pages/admin/FriendLinkManagePage').then((m) => ({ default: m.FriendLinkManagePage })),
)
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))

/**
 * 路由表。
 *
 * 后台路由说明：/admin/** 全部接口都要求管理员 token（后端 JwtInterceptor
 * 会校验 role === 0），因此除登录页外统一套一层 <RequireAdmin>。
 */
export function App() {
  return (
    <Routes>
      {/* -------------------------------------------------------- 用户端 */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<ArticleListPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/music" element={<MusicPage />} />
        <Route path="/links" element={<FriendLinksPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 登录 / 注册：独立全屏布局 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* -------------------------------------------------------- 管理端 */}
      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<RouteFallback />}>
            <AdminLoginPage />
          </Suspense>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="articles" element={<ArticleManagePage />} />
        <Route path="articles/new" element={<ArticleEditorPage />} />
        <Route path="articles/:id/edit" element={<ArticleEditorPage />} />
        <Route path="categories" element={<CategoryManagePage />} />
        <Route path="tags" element={<TagManagePage />} />
        <Route path="tech-stacks" element={<TechStackManagePage />} />
        <Route path="photos" element={<PhotoManagePage />} />
        <Route path="portfolio" element={<PortfolioManagePage />} />
        <Route path="music" element={<MusicManagePage />} />
        <Route path="friend-links" element={<FriendLinkManagePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage admin />} />
      </Route>
    </Routes>
  )
}
