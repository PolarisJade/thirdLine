import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '@/utils/format'

/* ============================================================== 异步数据请求 */

export interface AsyncState<T> {
  data: T | null
  /** 首屏加载（尚无数据）：页面应展示加载态/骨架屏 */
  loading: boolean
  /** 后台刷新（已有数据）：旧数据保持在屏，页面不应整块替换导致高度突变抖动 */
  refreshing: boolean
  error: string | null
}

/**
 * 内部状态：refreshing 不在 state 里维护，而是由 loading + data 在返回值中推导，
 * 这样各处 setState 只需关心 data / loading / error。
 */
type InternalAsyncState<T> = Omit<AsyncState<T>, 'refreshing'>

/**
 * 统一的接口请求 hook：处理 loading / error / 卸载后不 setState。
 * @param fetcher 请求函数，变化时会重新执行
 * @param deps    依赖数组，变化时重新请求
 */
export function useAsync<T>(fetcher: () => Promise<T>, deps: unknown[]): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<InternalAsyncState<T>>({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const mountedRef = useRef(true)

  // fetcher 每次渲染都是新函数，用 ref 持有避免进入依赖
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setState((prev) => ({ ...prev, loading: true, error: null }))

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled && mountedRef.current) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled && mountedRef.current) {
          setState((prev) => ({ data: prev.data, loading: false, error: errorMessage(error) }))
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return {
    ...state,
    // 仅在还没有任何数据时才算 loading；reload/依赖变化时旧数据仍在，
    // 避免“内容↔骨架屏”整体替换引起页面高度突变抖动
    loading: state.loading && state.data === null,
    refreshing: state.loading && state.data !== null,
    reload,
  }
}

/* ================================================================ 防抖值 */

/** 用于搜索输入：停止输入 delay 毫秒后才更新值，避免每个字符都打接口 */
export function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/* ============================================================ 滚动位置监听 */

/** 判断页面是否已滚动超过阈值，用于页头加阴影、显示回到顶部按钮 */
export function useScrolled(threshold = 12): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return scrolled
}

/* ============================================================ 异步操作按钮 */

/**
 * 包裹提交类操作，返回 pending 状态，并统一把后端错误文案抛给调用方。
 */
export function useSubmit() {
  const [pending, setPending] = useState(false)

  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<{ ok: boolean; data?: T; error?: string }> => {
    setPending(true)
    try {
      const data = await task()
      return { ok: true, data }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    } finally {
      setPending(false)
    }
  }, [])

  return { pending, run }
}
