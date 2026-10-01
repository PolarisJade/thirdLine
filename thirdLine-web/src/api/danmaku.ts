import { request } from './request'
import type {
  DanmakuPoolVO,
  DanmakuQuery,
  DanmakuReportDTO,
  DanmakuReportVO,
  DanmakuSendDTO,
  DanmakuVO,
  PageResult,
} from '@/types'

/* ==================== 前台（/user/danmaku） ==================== */

/** 拉取弹幕池：含全局开关状态与最近可见弹幕，匿名可访问 */
export const getDanmakuPool = (limit = 50) =>
  request.get<DanmakuPoolVO>('/user/danmaku/pool', { params: { limit } })

/** 发送弹幕（需登录） */
export const sendDanmaku = (data: DanmakuSendDTO) =>
  request.post<DanmakuVO>('/user/danmaku/send', data)

/** 举报弹幕（需登录） */
export const reportDanmaku = (data: DanmakuReportDTO) =>
  request.post<void>('/user/danmaku/report', data)

/* ==================== 后台（/admin/danmaku） ==================== */

/** 分页查询弹幕（含累计举报数） */
export const pageDanmaku = (params: DanmakuQuery) =>
  request.get<PageResult<DanmakuVO>>('/admin/danmaku/page', { params })

/** 切换弹幕显隐：0隐藏 / 1显示 */
export const updateDanmakuStatus = (id: number, status: number) =>
  request.put<void>(`/admin/danmaku/${id}/status`, null, { params: { status } })

/** 删除弹幕（连带删除其举报记录） */
export const deleteDanmaku = (id: number) =>
  request.delete<void>(`/admin/danmaku/${id}`)

/** 分页查询举报记录（status：0待处理/1已处理，留空不限制） */
export const pageDanmakuReports = (params: { status?: number; page?: number; size?: number }) =>
  request.get<PageResult<DanmakuReportVO>>('/admin/danmaku/report/page', { params })

/** 将某条举报标记为已处理 */
export const handleDanmakuReport = (id: number) =>
  request.put<void>(`/admin/danmaku/report/${id}/handle`)

/** 查询弹幕全局开关 */
export const getDanmakuSwitch = () =>
  request.get<boolean>('/admin/danmaku/switch')

/** 设置弹幕全局开关 */
export const setDanmakuSwitch = (enabled: boolean) =>
  request.put<void>('/admin/danmaku/switch', null, { params: { enabled } })
