import { request } from './request'
import type { TagDTO, TagVO } from '@/types'

/** 查询所有标签 */
export const listTags = () => request.get<TagVO[]>('/user/tag/list')

/** 新增标签，返回标签ID（后台，需登录） */
export const saveTag = (data: TagDTO) =>
  request.post<number>('/admin/tag', data)

/** 修改标签（后台，需登录） */
export const updateTag = (data: TagDTO) =>
  request.put<void>('/admin/tag', data)

/** 删除标签（已关联文章时后端会拒绝；后台，需登录） */
export const deleteTag = (id: number) =>
  request.delete<void>(`/admin/tag/${id}`)
