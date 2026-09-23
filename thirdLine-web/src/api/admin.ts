import { request } from './request'
import type { ArticleQuery, ArticleVO, CategoryVO, CursorPage, TagVO } from '@/types'

/**
 * 后台管理端「共享读」接口。
 * 文章分页 / 详情、分类列表、标签列表在公开区（/user/**）无需登录即可访问，
 * 后台管理页则统一走这里的 /admin/** 版本，由 JWT 拦截器强制校验登录。
 */

/** 后台：游标分页查询文章（可按状态过滤草稿 / 已发布） */
export const adminPageArticles = (query: ArticleQuery) => {
  // 过滤掉值为 null / undefined / 空串的查询参数
  const params: Record<string, unknown> = {}
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value
    }
  })
  return request.get<CursorPage<ArticleVO>>('/admin/article/page', { params })
}

/** 后台：查询文章详情（编辑回填用，可读取草稿正文） */
export const adminGetArticleDetail = (id: number) =>
  request.get<ArticleVO>(`/admin/article/${id}`)

/** 后台：查询所有分类 */
export const adminListCategories = () =>
  request.get<CategoryVO[]>('/admin/category/list')

/** 后台：查询所有标签 */
export const adminListTags = () => request.get<TagVO[]>('/admin/tag/list')
