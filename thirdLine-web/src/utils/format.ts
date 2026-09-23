import dayjs from 'dayjs'

/** 格式化日期，如 2026-09-20 */
export const formatDate = (value?: string | null, template = 'YYYY-MM-DD') => {
  if (!value) return ''
  const d = dayjs(value)
  return d.isValid() ? d.format(template) : ''
}

/** 格式化文件字节数为可读文本，如 1.2 MB */
export const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i += 1
  }
  const fixed = i === 0 ? value.toFixed(0) : value.toFixed(1)
  return `${fixed} ${units[i]}`
}

/** minimalist-ui 柔色板，用于标签 / 分类 pill 的稳定配色 */
export const PASTELS = [
  { bg: '#FDEBEC', fg: '#9F2F2D' },
  { bg: '#E1F3FE', fg: '#1F6C9F' },
  { bg: '#EDF3EC', fg: '#346538' },
  { bg: '#FBF3DB', fg: '#956400' },
] as const

/** 根据 id / 名称稳定映射到一个柔色 */
export const pastelOf = (seed: number | string) => {
  const key = typeof seed === 'number' ? seed : hashString(seed)
  return PASTELS[Math.abs(key) % PASTELS.length]
}

function hashString(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

/** 文章状态文案 */
export const statusLabel = (status: number) => {
  switch (status) {
    case 0:
      return '草稿'
    case 1:
      return '已发布'
    case 2:
      return '已删除'
    default:
      return '未知'
  }
}
