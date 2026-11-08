export type Tag = { id: number; name: string }
export type Category = { id: number; name: string; sort?: number }
export type Article = {
  id: number
  title: string
  summary?: string
  content?: string
  coverImage?: string
  categoryId?: number
  categoryName?: string
  authorName?: string
  isOriginal?: number
  publishedTime?: string
  createdTime?: string
  tags?: Tag[]
  isTop?: number
}
export type Stats = { articleCount?: number; categoryCount?: number; tagCount?: number; photoCount?: number; userCount?: number }
export type Profile = { nickname?: string; email?: string; github?: string; avatar?: string; startTime?: string }
export type UserInfo = { id?: number; username?: string; nickname?: string; avatar?: string; email?: string; status?: number; role?: number; createTime?: string }
export type LoginVO = { token: string; userInfo?: UserInfo }
export type RegisterPayload = { email: string; code: string; username: string; password: string; nickname?: string }
export type TechStack = { id: number; name: string; sort?: number; status?: number }
export type Portfolio = { id: number; title: string; summary?: string; coverImage?: string; techStacks?: TechStack[]; role?: string; period?: string; demoUrl?: string; repoUrl?: string; status?: number; publishTime?: string; createTime?: string; updateTime?: string }
export type Photo = { id: number; title?: string; description?: string; cityCode?: string; url: string; width?: number; height?: number; fileSize?: number; sort?: number; status?: number; createTime?: string; updateTime?: string }
export type FriendLink = { id: number; name: string; url: string; avatar?: string; description?: string }
export type SiteHistory = { id: number; description?: string; updateDate?: string; version?: string; updateType?: number; updateTypeLabel?: string }
export type CursorPage<T> = { records?: T[]; nextCursor?: number | null; hasMore?: boolean }
export type ArchiveEntry = { id: number; title: string; categoryName?: string; publishedTime?: string }
export type ArchiveDay = { date: string; articles?: ArchiveEntry[] }

type Result<T> = { code: number; message: string; data: T }
const base = import.meta.env.VITE_API_BASE ?? '/api'
const TOKEN_KEY = 'thirdline_token'

function storedToken() {
  try { return localStorage.getItem(TOKEN_KEY) }
  catch { return null }
}

function saveToken(token: string) {
  try { localStorage.setItem(TOKEN_KEY, token) }
  catch { /* storage may be unavailable in a private browsing context */ }
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) }
  catch { /* storage may be unavailable in a private browsing context */ }
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = storedToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const requestUrl = /^https?:\/\//i.test(path) ? path : `${base}${path}`
  const response = await fetch(new URL(requestUrl, window.location.origin), { ...init, headers })
  let result: Result<T>
  try { result = await response.json() as Result<T> }
  catch { throw new Error(`Request failed: ${response.status}`) }

  const refreshedToken = response.headers.get('X-Refresh-Token')
  if (refreshedToken) saveToken(refreshedToken)
  if (!response.ok || (result.code !== 200 && result.code !== 0)) {
    if (response.status === 401 || result.code === 401) clearToken()
    throw new Error(result.message || `Request failed: ${response.status}`)
  }
  return result.data
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${base}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => value !== undefined && value !== '' && url.searchParams.set(key, String(value)))
  return request<T>(url.toString(), { method: 'GET' })
}

export const api = {
  profile: () => get<Profile>('/user/site/profile'),
  stats: () => get<Stats>('/user/site/stats'),
  categories: () => get<Category[]>('/user/category/list'),
  tags: () => get<Tag[]>('/user/tag/list'),
  articles: (params?: { categoryId?: number; tagId?: number; keyword?: string; cursor?: number; size?: number }) => get<CursorPage<Article>>('/user/article/page', { ...params, status: 1, size: params?.size ?? 8 }),
  article: (id: number) => get<Article>(`/user/article/${id}`),
  archive: () => get<ArchiveDay[]>('/user/article/archive'),
  portfolios: () => get<Portfolio[]>('/user/portfolio/list'),
  photos: () => get<Photo[]>('/user/photo/list'),
  friendLinks: () => get<FriendLink[]>('/user/friend-link/list'),
  friendLinkApplyEnabled: () => get<boolean>('/user/friend-link/apply-enabled'),
  friendLinkApply: (payload: { name: string; url: string; avatar?: string; description?: string; email?: string }) => request<void>('/user/friend-link/apply', { method: 'POST', body: JSON.stringify(payload) }),
  siteHistory: () => get<SiteHistory[]>('/user/site-history/list'),
  login: (payload: { username: string; password: string }) => request<LoginVO>('/user/user/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) => request<LoginVO>('/user/user/register', { method: 'POST', body: JSON.stringify(payload) }),
  sendEmailCode: (email: string) => request<void>(`/user/user/email/code?email=${encodeURIComponent(email)}`, { method: 'POST' }),
  info: () => get<UserInfo>('/user/user/info'),
  getToken: storedToken,
  setToken: saveToken,
  clearToken,
}
