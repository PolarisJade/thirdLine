import { request } from './request'
import type { CategoryDTO, CategoryVO } from '@/types'

/** 查询所有分类 */
export const listCategories = () =>
  request.get<CategoryVO[]>('/user/category/list')

/** 新增分类，返回分类ID（后台，需登录） */
export const saveCategory = (data: CategoryDTO) =>
  request.post<number>('/admin/category', data)

/** 修改分类（后台，需登录） */
export const updateCategory = (data: CategoryDTO) =>
  request.put<void>('/admin/category', data)

/** 删除分类（存在关联文章时后端会拒绝；后台，需登录） */
export const deleteCategory = (id: number) =>
  request.delete<void>(`/admin/category/${id}`)
