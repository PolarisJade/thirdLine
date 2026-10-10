import { useCallback, useEffect, useState } from 'react'
import { photoApi } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { Glass } from '@/components/Glass'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { EmptyState, GallerySkeleton } from '@/components/Feedback'
import { formatFileSize } from '@/utils/format'
import { photoPlaceholder, withFallback } from '@/utils/placeholder'

/**
 * 相册页（瀑布流 + 灯箱）。
 * 数据来自 GET /user/photo/list（仅显示状态照片，按 sort 升序）。
 */
export function GalleryPage() {
  const { data, loading, error, reload } = useAsync(() => photoApi.list(), [])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const photos = data ?? []
  const current = lightboxIndex !== null ? photos[lightboxIndex] : null

  const close = useCallback(() => setLightboxIndex(null), [])
  const step = useCallback(
    (delta: number) => {
      setLightboxIndex((prev) => {
        if (prev === null || photos.length === 0) return prev
        return (prev + delta + photos.length) % photos.length
      })
    },
    [photos.length],
  )

  /** 灯箱快捷键：Esc 关闭，左右切换 */
  useEffect(() => {
    if (lightboxIndex === null) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') step(-1)
      if (event.key === 'ArrowRight') step(1)
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [lightboxIndex, close, step])

  return (
    <div className="container">
      <div className="page__header">
        <h1 className="page__title">相册</h1>
        <p className="page__desc">{photos.length} 张照片 · 眼睛记住的，相册也帮我记住</p>
      </div>

      {loading ? (
        <GallerySkeleton count={9} />
      ) : error ? (
        <Glass className="panel">
          <EmptyState
            icon="alert"
            title="相册加载失败"
            desc={error}
            action={
              <Button variant="primary" icon="refresh" onClick={reload}>
                重新加载
              </Button>
            }
          />
        </Glass>
      ) : photos.length === 0 ? (
        <Glass className="panel">
          <EmptyState icon="image" title="相册还是空的" desc="去管理后台添加第一张照片吧。" />
        </Glass>
      ) : (
        <div className="gallery">
          {photos.map((photo, index) => (
            <figure
              className="gallery__item glass"
              key={photo.id}
              onClick={() => setLightboxIndex(index)}
              style={{ margin: 0, marginBottom: 'var(--space-5)' }}
            >
              <img
                src={withFallback(photo.url, photoPlaceholder(photo.id))}
                alt={photo.title ?? `照片 ${index + 1}`}
                loading="lazy"
              />
              <figcaption className="gallery__overlay">
                <span className="gallery__title">{photo.title || `未命名照片 ${index + 1}`}</span>
                {photo.description && <span className="gallery__desc truncate-2">{photo.description}</span>}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {/* 灯箱 */}
      {current && (
        <div className="lightbox" onClick={close}>
          <button type="button" className="lightbox__close" onClick={close} aria-label="关闭">
            <Icon name="close" size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation()
                  step(-1)
                }}
                aria-label="上一张"
              >
                <Icon name="chevronLeft" size={22} />
              </button>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--next"
                onClick={(event) => {
                  event.stopPropagation()
                  step(1)
                }}
                aria-label="下一张"
              >
                <Icon name="chevronRight" size={22} />
              </button>
            </>
          )}

          <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <img src={withFallback(current.url, photoPlaceholder(current.id))} alt={current.title ?? '照片'} />
            <figcaption className="lightbox__caption">
              <div style={{ fontWeight: 600 }}>{current.title || '未命名照片'}</div>
              {current.description && <div style={{ opacity: 0.78, marginTop: 4 }}>{current.description}</div>}
              <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12.5 }}>
                {(lightboxIndex ?? 0) + 1} / {photos.length}
                {current.width && current.height ? ` · ${current.width}×${current.height}` : ''}
                {current.fileSize ? ` · ${formatFileSize(current.fileSize)}` : ''}
              </div>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  )
}
