import { useCallback, useEffect, useState } from 'react'
import type { PageResult } from '@/api'
import { errorMessage } from '@/utils/format'

export interface PaginatedList<T> {
  records: T[]
  total: number
  page: number
  size: number
  loading: boolean
  error: string | null
  setPage: (page: number) => void
  setSize: (size: number) => void
  /** 重新拉取当前页 */
  reload: () => void
}

/**
 * 标准分页列表 hook，对应后端 PageResult（相册 / 作品 / 音乐 / 弹幕 / 举报）。
 * 后端页码从 1 开始。
 */
export function usePaginatedList<T>(
  fetcher: (page: number, size: number) => Promise<PageResult<T>>,
  deps: unknown[] = [],
  initialSize = 12,
): PaginatedList<T> {
  const [records, setRecords] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(initialSize)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const fetcherRef = useCallback(fetcher, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetcherRef(page, size)
      .then((result) => {
        if (cancelled) return
        setRecords(result.records ?? [])
        setTotal(result.total ?? 0)
      })
      .catch((fetchError: unknown) => {
        if (cancelled) return
        setError(errorMessage(fetchError))
        setRecords([])
        setTotal(0)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [fetcherRef, page, size, nonce])

  /** 筛选条件变化时应该回到第一页，由调用方在 deps 变化时自行 setPage(1) */
  const reload = useCallback(() => setNonce((value) => value + 1), [])

  const changePage = useCallback((next: number) => setPage(Math.max(1, next)), [])
  const changeSize = useCallback((next: number) => {
    setSize(next)
    setPage(1)
  }, [])

  return { records, total, page, size, loading, error, setPage: changePage, setSize: changeSize, reload }
}
