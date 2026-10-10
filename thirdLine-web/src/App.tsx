import { Route, Routes } from 'react-router-dom'
import { UserLayout } from './layouts/UserLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { RequireAdmin, RequireAuth } from './routes/guards'

/* ------------------------------------------------------------------ 用户端 */
import { HomePage } from './pages/user/HomePage'
import { ArticleListPage } from './pages/user/ArticleListPage'
import { ArticleDetailPage } from './pages/user/ArticleDetailPage'
import { PortfolioPage } from './pages/user/PortfolioPage'
import { GalleryPage } from './pages/user/GalleryPage'
import { MusicPage } from './pages/user/MusicPage'
import { AboutPage } from './pages/user/AboutPage'
import { ProfilePage } from './pages/user/ProfilePage'
import { LoginPage } from './pages/user/LoginPage'
import { RegisterPage } from './pages/user/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'

/* ------------------------------------------------------------------ 管理端 */
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ArticleManagePage } from './pages/admin/ArticleManagePage'
import { ArticleEditorPage } from './pages/admin/ArticleEditorPage'
import { CategoryManagePage } from './pages/admin/CategoryManagePage'
import { TagManagePage } from './pages/admin/TagManagePage'
import { PhotoManagePage } from './pages/admin/PhotoManagePage'
import { PortfolioManagePage } from './pages/admin/PortfolioManagePage'
import { MusicManagePage } from './pages/admin/MusicManagePage'
import { DanmakuManagePage } from './pages/admin/DanmakuManagePage'
import { ReportManagePage } from './pages/admin/ReportManagePage'
import { SettingsPage } from './pages/admin/SettingsPage'

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
      <Route path="/admin/login" element={<AdminLoginPage />} />

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
        <Route path="photos" element={<PhotoManagePage />} />
        <Route path="portfolio" element={<PortfolioManagePage />} />
        <Route path="music" element={<MusicManagePage />} />
        <Route path="danmaku" element={<DanmakuManagePage />} />
        <Route path="reports" element={<ReportManagePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage admin />} />
      </Route>
    </Routes>
  )
}
