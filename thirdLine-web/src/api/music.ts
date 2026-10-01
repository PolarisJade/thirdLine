import { request } from './request'
import type { MusicDTO, MusicQuery, MusicVO, PageResult } from '@/types'

/** 查询全部已上架音乐（前台悬浮播放器使用，按排序权重升序） */
export const listEnabledMusics = () =>
  request.get<MusicVO[]>('/user/music/list')

/** 分页查询音乐（后台管理，需登录） */
export const pageMusics = (params: MusicQuery) =>
  request.get<PageResult<MusicVO>>('/admin/music/page', { params })

/** 查询音乐详情（后台，需登录） */
export const getMusic = (id: number) =>
  request.get<MusicVO>(`/admin/music/${id}`)

/** 新增音乐，返回音乐ID（后台，需登录） */
export const saveMusic = (data: MusicDTO) =>
  request.post<number>('/admin/music', data)

/** 修改音乐（后台，需登录） */
export const updateMusic = (data: MusicDTO) =>
  request.put<void>('/admin/music', data)

/** 删除音乐（后台，需登录） */
export const deleteMusic = (id: number) =>
  request.delete<void>(`/admin/music/${id}`)
