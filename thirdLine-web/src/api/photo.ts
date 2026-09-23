import { request } from './request'
import type { PageResult, PhotoDTO, PhotoQuery, PhotoVO } from '@/types'

/** 查询全部显示的照片（前台相册翻页，按排序升序） */
export const listPhotos = () => request.get<PhotoVO[]>('/user/photo/list')

/** 分页查询照片（后台管理，需登录） */
export const pagePhotos = (params: PhotoQuery) =>
  request.get<PageResult<PhotoVO>>('/admin/photo/page', { params })

/** 查询照片详情（后台，需登录） */
export const getPhoto = (id: number) =>
  request.get<PhotoVO>(`/admin/photo/${id}`)

/** 新增照片，返回照片ID（后台，需登录） */
export const savePhoto = (data: PhotoDTO) =>
  request.post<number>('/admin/photo', data)

/** 修改照片（后台，需登录） */
export const updatePhoto = (data: PhotoDTO) =>
  request.put<void>('/admin/photo', data)

/** 删除照片（后台，需登录） */
export const deletePhoto = (id: number) =>
  request.delete<void>(`/admin/photo/${id}`)
