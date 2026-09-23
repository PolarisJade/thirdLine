import { request } from './request'
import type {
  ArticleQuery,
  ArticleSaveDTO,
  ArticleUpdateDTO,
  ArticleVO,
  CursorPage,
} from '@/types'

/** 新增文章，返回文章ID（后台，需登录） */
export const saveArticle = (data: ArticleSaveDTO) =>
  request.post<number>('/admin/article', data)

/** 查询文章详情 */
export const getArticleDetail = (id: number) =>
  request.get<ArticleVO>(`/user/article/${id}`)

/** 游标分页查询文章 */
export const pageArticles = (query: ArticleQuery) => {
  // 过滤掉值为 null / undefined / 空串的查询参数
  const params: Record<string, unknown> = {}
  Object.entries(query).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params[key] = value
    }
  })
  return request.get<CursorPage<ArticleVO>>('/user/article/page', { params })
}

/** 修改文章（后台，需登录） */
export const updateArticle = (data: ArticleUpdateDTO) =>
  request.put<void>('/admin/article', data)

/** 删除文章（后台，需登录） */
export const deleteArticle = (id: number) =>
  request.delete<void>(`/admin/article/${id}`)
