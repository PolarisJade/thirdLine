export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
export class ApiError extends Error { constructor(message: string, public code: number) { super(message); } }
const TOKEN_KEY = 'thirdline.token.v1';
export function token() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function setToken(value: string | null) { try { value ? sessionStorage.setItem(TOKEN_KEY, value) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* Storage may be disabled. */ } window.dispatchEvent(new Event('thirdline-auth')); }
export function query(path: string, values: Record<string, unknown>) { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== '' && value !== undefined && value !== null) params.set(key, String(value)); }); return `${path}?${params}`; }
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const currentToken = token();
  if (currentToken) headers.set('Authorization', `Bearer ${currentToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: options.signal || controller.signal });
    const result = await response.json() as { code: number; message: string; data: T };
    if (response.status === 401 || result.code === 401) { setToken(null); throw new ApiError('登录已过期，请重新登录', 401); }
    if (!response.ok || result.code !== 200) throw new ApiError(result.message || '请求失败，请稍后重试', result.code || response.status);
    const refreshed = response.headers.get('X-Refresh-Token');
    if (refreshed && currentToken === token()) setToken(refreshed);
    return result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error && error.name === 'AbortError' ? '请求超时，请稍后重试' : '暂时无法连接博客服务，请稍后重试', 0);
  } finally { clearTimeout(timer); }
}
export const write = <T,>(path: string, method: string, body?: unknown) => request<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
export function safeUrl(value?: string) { if (!value) return undefined; try { const url = new URL(value, API_BASE); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; } }
export function date(value?: string) { if (!value) return '日期未设置'; const d = new Date(value); return Number.isNaN(d.getTime()) ? '日期未设置' : d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }); }
