import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { ApiResult } from './types'
import { AUTH_HEADER, REFRESH_HEADER, UNAUTHORIZED_CODE, getToken, setToken, triggerUnauthorized } from './token'

/** 业务异常：携带后端 ResultCode，页面可据此做精细提示 */
export class ApiError extends Error {
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const baseURL = import.meta.env.VITE_API_BASE || '/api'

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

/* --------------------------------------------------------------- 请求拦截 */

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    // 后端 JwtUtil.resolveToken 期望 "Bearer {token}" 格式
    config.headers.set(AUTH_HEADER, `Bearer ${token}`)
  }
  return config
})

/* --------------------------------------------------------------- 响应拦截 */

http.interceptors.response.use(
  (response) => {
    // 滑动续期：后端在剩余有效期不足时通过响应头下发新 token，这里无感替换
    const refreshed = response.headers[REFRESH_HEADER] || response.headers[REFRESH_HEADER.toLowerCase()]
    if (typeof refreshed === 'string' && refreshed.length > 0) {
      setToken(refreshed)
    }

    const body = response.data as ApiResult<unknown> | undefined

    // 文件流等非 Result 结构直接透传
    if (!body || typeof body !== 'object' || !('code' in body)) {
      return response
    }

    if (body.code !== 200) {
      if (body.code === UNAUTHORIZED_CODE) {
        triggerUnauthorized()
      }
      return Promise.reject(new ApiError(body.code, body.message || '请求失败'))
    }

    // 把 Result.data 直接替换为响应体，调用方无需层层解包
    response.data = body.data
    return response
  },
  (error: AxiosError<ApiResult<unknown>>) => {
    const status = error.response?.status
    const payload = error.response?.data

    // 后端全局异常处理器始终返回 HTTP 200 + 业务 code；
    // 走到这里通常是网关/容器层的真实 HTTP 错误
    if (status === 401 || payload?.code === UNAUTHORIZED_CODE) {
      triggerUnauthorized()
      return Promise.reject(new ApiError(UNAUTHORIZED_CODE, '未登录或登录已失效'))
    }

    const message =
      payload?.message ||
      (status === 403
        ? '没有操作权限'
        : status === 404
          ? '接口不存在，请确认后端服务已启动'
          : status
            ? `请求失败（HTTP ${status}）`
            : '网络异常，请检查后端服务是否已启动')

    return Promise.reject(new ApiError(payload?.code ?? status ?? -1, message))
  },
)

/* ------------------------------------------------------------------ 便捷方法 */

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config)
  return response.data
}

export const api = {
  get: <T>(url: string, params?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'GET', url, params }),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'POST', url, data }),

  put: <T>(url: string, data?: unknown, params?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: 'PUT', url, data, params }),

  delete: <T>(url: string, config?: AxiosRequestConfig) => request<T>({ ...config, method: 'DELETE', url }),

  /** 文件上传：multipart/form-data，交给浏览器自动带 boundary */
  upload: <T>(url: string, form: FormData) =>
    request<T>({ method: 'POST', url, data: form, headers: { 'Content-Type': 'multipart/form-data' } }),
}
