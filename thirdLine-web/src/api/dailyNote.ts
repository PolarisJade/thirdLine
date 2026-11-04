import { api } from './client'
import type { PageResult } from './types'
import type { IconName } from '@/components/Icon'

export interface DailyNoteDTO {
  id?: number
  noteDate: string
  content: string
  mood: number | null
  weather: number | null
  publishStatus: number
}
export interface DailyNoteVO extends DailyNoteDTO {
  id: number
  publishTime: string | null
  createTime: string
  updateTime: string
}
export interface DailyNoteOption { label: string; value: number; icon: IconName }
export interface DailyNoteDateVO { id: number; noteDate: string }
export const moodOptions: DailyNoteOption[] = [
  { value: 0, label: '开心', icon: 'smile' },
  { value: 1, label: '平静', icon: 'calm' },
  { value: 2, label: '一般', icon: 'neutral' },
  { value: 3, label: '低落', icon: 'sad' },
  { value: 4, label: '烦躁', icon: 'angry' },
  { value: 5, label: '疲惫', icon: 'tired' },
]
export const weatherOptions: DailyNoteOption[] = [
  { value: 0, label: '晴', icon: 'sun' },
  { value: 1, label: '多云', icon: 'cloudSun' },
  { value: 2, label: '阴', icon: 'cloud' },
  { value: 3, label: '小雨', icon: 'drizzle' },
  { value: 4, label: '中雨', icon: 'rain' },
  { value: 5, label: '大雨', icon: 'heavyRain' },
  { value: 6, label: '雷雨', icon: 'thunderstorm' },
  { value: 7, label: '雪', icon: 'snow' },
  { value: 8, label: '雾', icon: 'fog' },
]
export function beijingToday() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const part = (type: string) => parts.find((p) => p.type === type)?.value
  return `${part('year')}-${part('month')}-${part('day')}`
}
export const dailyNoteApi = {
  dates: () => api.get<DailyNoteDateVO[]>('/user/daily-note/dates'),
  detail: (id: number) => api.get<DailyNoteVO>(`/user/daily-note/${id}`),
  page: (page: number, size: number) => api.get<PageResult<DailyNoteVO>>('/user/daily-note/page', { page, size }),
  adminPage: (page: number, size: number, publishStatus?: number) => api.get<PageResult<DailyNoteVO>>('/admin/daily-note/page', { page, size, publishStatus }),
  create: (dto: DailyNoteDTO) => api.post<number>('/admin/daily-note', dto),
  update: (dto: DailyNoteDTO) => api.put<void>('/admin/daily-note', dto),
  remove: (id: number) => api.delete<void>(`/admin/daily-note/${id}`),
}
