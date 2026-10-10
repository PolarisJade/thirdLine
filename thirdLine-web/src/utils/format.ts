import { ApiError } from '@/api/client'

/**
 * 后端 LocalDateTime 形如 "2026-09-21T10:30:00"，兼容带毫秒与纯日期。
 * iOS 对 "YYYY-MM-DD HH:mm:ss" 解析不稳定，因此统一规范化后再交给 Date。
 */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 2026-09-21 */
export function formatDate(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 2026-09-21 10:30 */
export function formatDateTime(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 相对时间：刚刚 / 5 分钟前 / 3 天前 / 2026-09-21 */
export function formatRelative(value: string | null | undefined): string {
  const date = toDate(value)
  if (!date) return '—'

  const diff = Date.now() - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < 0) return formatDate(value)
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`
  return formatDate(value)
}

/** 距 startTime 已经运行了多少天（站点运行时长） */
export function daysSince(startTime: string | null | undefined): number {
  const date = toDate(startTime)
  if (!date) return 0
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000))
}

/** 1536 -> "1.5 KB" */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let index = 0
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024
    index += 1
  }
  return `${value >= 100 || index === 0 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

/** 数字千分位 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  return value.toLocaleString('zh-CN')
}

/**
 * 从 HTML 正文中抽取纯文本，用于列表摘要。
 * 后端是富文本存储，列表页的 summary 可能为空，这里做兜底。
 */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 截断文本并加省略号 */
export function truncate(text: string, max: number): string {
  if (!text) return ''
  return text.length <= max ? text : `${text.slice(0, max)}…`
}

/** 文章摘要：优先用后端 summary，为空时从正文提取 */
export function resolveSummary(summary: string | null | undefined, content: string | null | undefined, max = 120): string {
  const fromSummary = stripHtml(summary)
  if (fromSummary) return truncate(fromSummary, max)
  return truncate(stripHtml(content), max)
}

/** "React,Spring Boot,MySQL" -> ["React", "Spring Boot", "MySQL"] */
export function parseTechStack(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(/[,，、|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/** 统一的错误文案提取，ApiError 直接取后端 message */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return '操作失败，请稍后再试'
}

/** 拼接 className，过滤掉假值 */
export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

/** 取昵称首字符作为头像占位文字 */
export function initialOf(name: string | null | undefined): string {
  if (!name) return '三'
  return name.trim().charAt(0).toUpperCase()
}
