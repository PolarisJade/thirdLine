import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import { antdTheme } from '@/theme/antdTheme'

import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/layouts/AdminLayout'
import ProtectedRoute from '@/router/ProtectedRoute'

import Home from '@/pages/public/Home'
import ArticleDetail from '@/pages/public/ArticleDetail'
import CategoryBrowse from '@/pages/public/CategoryBrowse'
import TagBrowse from '@/pages/public/TagBrowse'
import Search from '@/pages/public/Search'
import Album from '@/pages/public/Album'

import Login from '@/pages/admin/Login'
import ArticleList from '@/pages/admin/ArticleList'
import ArticleEdit from '@/pages/admin/ArticleEdit'
import CategoryManage from '@/pages/admin/CategoryManage'
import TagManage from '@/pages/admin/TagManage'
import PhotoManage from '@/pages/admin/PhotoManage'
import Profile from '@/pages/admin/Profile'

export default function App() {
  return (
    <ConfigProvider theme={antdTheme} locale={zhCN}>
      <BrowserRouter>
        <Routes>
          {/* 前台公开区 */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="article/:id" element={<ArticleDetail />} />
            <Route path="category/:id" element={<CategoryBrowse />} />
            <Route path="tag/:id" element={<TagBrowse />} />
            <Route path="search" element={<Search />} />
            <Route path="album" element={<Album />} />
          </Route>

          {/* 后台登录 */}
          <Route path="/admin/login" element={<Login />} />

          {/* 后台管理区（需登录） */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/article" replace />} />
            <Route path="article" element={<ArticleList />} />
            <Route path="article/new" element={<ArticleEdit />} />
            <Route path="article/:id" element={<ArticleEdit />} />
            <Route path="category" element={<CategoryManage />} />
            <Route path="tag" element={<TagManage />} />
            <Route path="photo" element={<PhotoManage />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* 兜底 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  )
}
