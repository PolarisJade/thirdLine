import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { message } from 'antd'
import type { Result } from '@/types'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'

const instance: AxiosInstance = axios.create({
  // 开发环境走 Vite 代理（相对路径），生产可用 VITE_API_BASE 指定后端地址
  baseURL: import.meta.env.VITE_API_BASE || '',
  timeout: 15000,
})

// 请求拦截：只要本地存有 token 就统一携带（供后台 /admin/** 读写接口鉴权）
instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：解包 Result，统一错误处理
instance.interceptors.response.use(
  (response): any => {
    // 滑动续期：后端在 token 即将过期时通过响应头下发新 token，同步更新本地存储
    const refreshed = response.headers?.['x-refresh-token']
    if (refreshed) {
      localStorage.setItem(TOKEN_KEY, refreshed)
    }
    const body = response.data as Result<unknown>
    if (body && typeof body.code === 'number') {
      if (body.code === 200) {
        return body.data
      }
      if (body.code === 401) {
        handleUnauthorized()
        return Promise.reject(new Error(body.message || '未登录或登录已失效'))
      }
      message.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    // 非标准结构（如文件流）直接返回
    return body as never
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      handleUnauthorized()
    }
    const msg =
      error?.response?.data?.message || error?.message || '网络异常，请稍后再试'
    message.error(msg)
    return Promise.reject(error)
  },
)

function handleUnauthorized() {
  // 清除本地登录态并通过 zustand 状态驱动 UI 响应式更新：
  // 后台 ProtectedRoute 会重定向到 /admin/login，前台右上角会回到未登录。
  // 不再硬跳转，避免前台普通用户被错误拽到后台登录页。
  useAuthStore.getState().logout()
}

/** 业务请求方法，返回值即后端 Result.data */
export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config) as unknown as Promise<T>
  },
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config) as unknown as Promise<T>
  },
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config) as unknown as Promise<T>
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete(url, config) as unknown as Promise<T>
  },
}

export default instance
