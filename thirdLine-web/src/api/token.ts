/**
 * token 与登录态的本地存储。
 * 单独抽出一层，避免 axios 实例与 React Context 互相 import 形成循环依赖。
 */

const TOKEN_KEY = 'tl_token'
const USER_KEY = 'tl_user'

/** 后端 JWT 响应头名称（application.yml: jwt.header） */
export const AUTH_HEADER = 'Authorization'
/** 后端滑动续期返回的新 token 响应头（application.yml: jwt.refresh-header） */
export const REFRESH_HEADER = 'X-Refresh-Token'

/** 未登录时后端返回的 code（ResultCode.UNAUTHORIZED） */
export const UNAUTHORIZED_CODE = 401

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* 隐私模式下 localStorage 可能不可用，忽略 */
  }
}

/** 取缓存的用户信息，用于首屏立即渲染头像/昵称，随后仍会用 /user/user/info 校准 */
export function getStoredUser<T>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: unknown | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    /* ignore */
  }
}

/* --------------------------------------------------- 全局 401 / 登录态失效处理 */

type UnauthorizedHandler = () => void

let handler: UnauthorizedHandler | null = null
/** 防止并发请求同时收到 401 时重复跳转 */
let handling = false

/** 由 AuthProvider 在挂载时注册，收到 401 时清理登录态并跳转登录页 */
export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  handler = fn
}

export function triggerUnauthorized(): void {
  if (handling) return
  handling = true
  setToken(null)
  setStoredUser(null)
  try {
    handler?.()
  } finally {
    // 留一个极短窗口合并同一批并发请求，之后恢复
    window.setTimeout(() => {
      handling = false
    }, 300)
  }
}
