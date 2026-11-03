import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { footprintApi, type FootprintVO, type PhotoVO } from '@/api'
import { useAsync } from '@/hooks/useAsync'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/Button'
import { Icon } from '@/components/Icon'
import { EmptyState, Loading } from '@/components/Feedback'
import { errorMessage } from '@/utils/format'
import { photoPlaceholder, withFallback } from '@/utils/placeholder'

/** 注册到 echarts 的地图名，避免与其它页面冲突 */
const MAP_NAME = 'china-cities'

/** geojson 只用到 adcode / 名称，其余属性忽略 */
interface GeoFeature {
  properties: {
    adcode?: string | number
    name?: string
    [key: string]: unknown
  }
  geometry: unknown
}

interface GeoJson {
  type: 'FeatureCollection'
  features: GeoFeature[]
}

/**
 * 地图配色跟随明暗主题。
 * 亮色：奶油底 + 暖橘高亮；暗色：暖炭灰底 + 亮橘高亮。
 */
function paletteOf(mode: 'light' | 'dark') {
  return mode === 'dark'
    ? {
        area: 'transparent',
        border: 'rgba(255, 219, 186, 0.14)',
        label: '#c8b4a2',
        visited: '#ec8a5a',
        visitedBorder: '#ffc178',
        emphasis: 'rgba(236, 138, 90, 0.18)',
        tooltipBg: 'rgba(34, 26, 21, 0.94)',
        tooltipBorder: 'rgba(255, 219, 186, 0.22)',
        tooltipText: '#f7ede2',
      }
    : {
        // 未点亮的区域直接透明，让页面本身的暖色渐变透上来，只保留边界线
        area: 'transparent',
        border: 'rgba(120, 88, 62, 0.16)',
        label: '#6d5a4c',
        visited: '#d9704a',
        visitedBorder: '#b85737',
        emphasis: 'rgba(217, 112, 74, 0.14)',
        tooltipBg: 'rgba(255, 253, 250, 0.96)',
        tooltipBorder: 'rgba(120, 88, 62, 0.18)',
        tooltipText: '#35281f',
      }
}

/**
 * 足迹页：中国地图（市级高亮）+ 城市评价 + 城市照片。
 *
 * 数据流：
 *  - GET /user/footprint/list 拿到已发布且显示的城市（含 photoCount / coverPhotoUrl）
 *  - geojson 放 public/map/china-cities.json，本地静态加载
 *  - 点击城市才请求 GET /user/footprint/{cityCode}/photos，避免首屏拉全量照片
 */
export function FootprintPage() {
  const { mode } = useTheme()
  const { data, loading, error, reload } = useAsync(footprintApi.list, [])
  const cities = useMemo(() => data ?? [], [data])

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const citiesRef = useRef<FootprintVO[]>([])
  citiesRef.current = cities
  /** adcode -> geojson 里的中文全称，用于 hover 未点亮城市时展示名字 */
  const geoIndexRef = useRef<Map<string, { name: string; province: string }>>(new Map())

  const [geoState, setGeoState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [geoNonce, setGeoNonce] = useState(0)

  const [selected, setSelected] = useState<FootprintVO | null>(null)
  const [photos, setPhotos] = useState<PhotoVO[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosError, setPhotosError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const photoRequest = useRef(0)
  const drawerRef = useRef<HTMLElement>(null)
  const lightboxRef = useRef<HTMLDivElement>(null)
  const drawerOpen = selected !== null
  const lightboxOpen = lightbox !== null

  const provinceCount = useMemo(() => new Set(cities.map((city) => city.provinceCode)).size, [cities])

  /* ------------------------------------------------------------ 城市详情 */

  const openCity = useCallback(async (city: FootprintVO) => {
    setSelected(city)
    setLightbox(null)
    setPhotos([])
    setPhotosError(null)
    setPhotosLoading(true)
    const request = ++photoRequest.current
    try {
      const list = await footprintApi.cityPhotos(city.cityCode)
      if (request === photoRequest.current) setPhotos(list)
    } catch (requestError) {
      if (request === photoRequest.current) setPhotosError(errorMessage(requestError))
    } finally {
      if (request === photoRequest.current) setPhotosLoading(false)
    }
  }, [])

  const closeCity = useCallback(() => {
    photoRequest.current += 1
    setSelected(null)
    setLightbox(null)
  }, [])

  /* -------------------------------------------------------------- 抽屉状态 */

  useEffect(() => {
    if (!drawerOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const appRoot = document.getElementById('root')
    const previousInert = appRoot?.inert ?? false
    if (appRoot) appRoot.inert = true
    document.body.style.overflow = 'hidden'
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })

    return () => {
      document.body.style.overflow = previousOverflow
      if (appRoot) appRoot.inert = previousInert
      previousFocus?.focus({ preventScroll: true })
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      const activeLightbox = lightboxRef.current
      if (event.key === 'Escape') {
        event.preventDefault()
        if (activeLightbox) setLightbox(null)
        else closeCity()
      }
      if (activeLightbox && photos.length > 1) {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          const offset = event.key === 'ArrowLeft' ? -1 : 1
          setLightbox((prev) => prev === null ? null : (prev + offset + photos.length) % photos.length)
        }
      }
      if (event.key === 'Tab') {
        const panel = activeLightbox ?? drawerRef.current
        const controls = panel?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]')
        if (!controls?.length) return
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!panel?.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault()
          const target = event.shiftKey ? last : first
          target.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [drawerOpen, photos.length, closeCity])

  /* -------------------------------------------------------------- geojson */

  useEffect(() => {
    let cancelled = false
    setGeoState('loading')

    fetch('/map/china-cities.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<GeoJson>
      })
      .then((geo) => {
        if (cancelled) return
        // 统一拿 adcode 作为区域名：中文名存在“市”后缀、市辖区重名等问题，
        // 用 adcode 才能和 tl_footprint.city_code 一一对应。
        geo.features.forEach((feature) => {
          const adcode = String(feature.properties.adcode ?? '')
          feature.properties.name = adcode
          const properties = feature.properties as { full_name?: string; province?: string }
          geoIndexRef.current.set(adcode, {
            name: properties.full_name || adcode,
            province: properties.province || '',
          })
        })
        echarts.registerMap(MAP_NAME, geo as unknown as Parameters<typeof echarts.registerMap>[1])
        setGeoState('ready')
      })
      .catch(() => {
        if (!cancelled) setGeoState('error')
      })

    return () => {
      cancelled = true
    }
  }, [geoNonce])

  /* ---------------------------------------------------------- 图表实例 */

  useEffect(() => {
    if (geoState !== 'ready' || !chartRef.current) return

    const chart = echarts.init(chartRef.current)
    chartInstance.current = chart

    const onClick = (params: echarts.ECElementEvent) => {
      const city = citiesRef.current.find((item) => item.cityCode === String(params.name))
      if (city) void openCity(city)
    }
    chart.on('click', onClick)

    const resize = () => chart.resize()
    const observer = new ResizeObserver(resize)
    observer.observe(chartRef.current)

    return () => {
      observer.disconnect()
      chart.off('click', onClick)
      chart.dispose()
      chartInstance.current = null
    }
  }, [geoState, openCity])

  /* ------------------------------------------------------------ 图表配置 */

  useEffect(() => {
    const chart = chartInstance.current
    if (!chart || geoState !== 'ready') return

    const palette = paletteOf(mode)
    const data = cities.map((city) => ({
      name: city.cityCode,
      value: 1,
      itemStyle: {
        areaColor: palette.visited,
        borderColor: palette.visitedBorder,
        borderWidth: 1,
      },
    }))

    const option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        confine: true,
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: palette.tooltipText, fontSize: 13 },
        formatter: (params: { name?: string }) => {
          const code = String(params.name)
          const city = cities.find((item) => item.cityCode === code)
          if (!city) {
            const meta = geoIndexRef.current.get(code)
            return meta
              ? `<span style="opacity:.72">${meta.name}</span><br/><span style="opacity:.5">还没去过</span>`
              : ''
          }
          const date = city.visitDate ? ` · ${city.visitDate}` : ''
          return `<strong>${city.cityName}</strong><br/>${city.provinceName}${date}`
        },
      },
      series: [
        {
          type: 'map',
          map: MAP_NAME,
          roam: true,
          scaleLimit: { min: 0.8, max: 8 },
          layoutCenter: ['50%', '50%'],
          layoutSize: '100%',
          selectedMode: 'single',
          label: { show: false },
          select: {
            itemStyle: { areaColor: palette.visitedBorder, borderColor: palette.visitedBorder, borderWidth: 1.5 },
            label: { show: true, color: palette.label, fontSize: 11 },
          },
          itemStyle: {
            areaColor: palette.area,
            borderColor: palette.border,
            borderWidth: 0.6,
          },
          emphasis: {
            label: {
              show: true,
              color: palette.label,
              fontSize: 11,
              formatter: (params: { name?: string }) => {
                const code = String(params.name)
                return cities.find((item) => item.cityCode === code)?.cityName
                  ?? geoIndexRef.current.get(code)?.name
                  ?? ''
              },
            },
            itemStyle: { areaColor: palette.emphasis, borderColor: palette.visitedBorder, borderWidth: 1 },
          },
          data,
        },
      ],
    } as EChartsOption

    chart.setOption(option, true)
  }, [cities, mode, geoState])

  /* -------------------------------------------------------------- 灯箱 */

  useEffect(() => {
    if (!lightboxOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const drawer = drawerRef.current
    if (drawer) drawer.inert = true
    lightboxRef.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true })

    return () => {
      if (drawer) drawer.inert = false
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [lightboxOpen])

  const currentPhoto = lightbox !== null ? photos[lightbox] : null

  return (
    <div className="footprint-page">
      {/* 标题保持阅读宽度，地图则铺满整个页面 */}
      <div className="container">
        <header className="page__header">
          <span className="section-head__eyebrow">Footprints</span>
          <h1 className="page__title">足迹</h1>
          <p className="page__desc">
            {cities.length > 0
              ? `点亮 ${cities.length} 座城市，走过 ${provinceCount} 个省级行政区`
              : '去过的地方，会在这里一点点亮起来'}
          </p>
        </header>
      </div>

      {/* 不用玻璃面板：地图直接铺在页面背景上，未点亮区域透明 */}
      <div className="footprint-map-panel">
        <div ref={chartRef} className="footprint-map" role="img" aria-label="中国足迹地图" />

        {loading && (
          <div className="footprint-map__mask">
            <Loading text="正在读取足迹…" />
          </div>
        )}

        {!loading && geoState === 'loading' && (
          <div className="footprint-map__mask">
            <Loading text="正在加载地图…" />
          </div>
        )}

        {geoState === 'error' && (
          <div className="footprint-map__mask">
            <EmptyState
              icon="alert"
              title="地图数据加载失败"
              desc="public/map/china-cities.json 没有正确加载。"
              action={
                <Button variant="glass" onClick={() => setGeoNonce((value) => value + 1)}>
                  重新加载
                </Button>
              }
            />
          </div>
        )}

        {!loading && error && (
          <div className="footprint-map__mask">
            <EmptyState
              icon="alert"
              title="足迹加载失败"
              desc={error}
              action={
                <Button variant="glass" onClick={reload}>
                  重试
                </Button>
              }
            />
          </div>
        )}

        {cities.length === 0 && !loading && !error && geoState === 'ready' && (
          <div className="footprint-map__hint">还没有点亮的城市，去后台「足迹管理」添加第一座吧。</div>
        )}
      </div>

      <div className="container">
        <p className="footprint-tip">
          <Icon name="info" size={14} />
          拖拽移动、滚轮或双指缩放；点击高亮的城市查看评价和照片。地图仅供示意，非测绘成果。
        </p>
      </div>

      {selected && createPortal(
        <div
          className="footprint-drawer"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCity()
            }
          }}
        >
          <aside ref={drawerRef} className="footprint-drawer__panel" role="dialog" aria-modal={!lightboxOpen} aria-labelledby="footprint-drawer-title">
            <div className="footprint-drawer__grabber" aria-hidden="true" />
            <header className="footprint-drawer__head">
              <div className="footprint-drawer__heading">
                <span className="footprint-drawer__eyebrow">已去过的城市</span>
                <h2 id="footprint-drawer-title" className="footprint-drawer__title">{selected.cityName}</h2>
                <p className="footprint-drawer__meta">
                  {selected.provinceName}
                  {selected.visitDate ? ` · ${selected.visitDate}` : ''}
                  {` · ${selected.photoCount} 张照片`}
                </p>
              </div>
              <Button
                variant="ghost"
                iconOnly
                icon="close"
                size="sm"
                aria-label="关闭城市详情"
                onClick={closeCity}
              />
            </header>

            <div className="footprint-drawer__body">
              {selected.content && <p className="footprint-drawer__content">{selected.content}</p>}

              <div className="footprint-drawer__section-head">
                <h3>旅行照片</h3>
                <span>{selected.photoCount} 张</span>
              </div>

              {photosLoading ? (
                <div className="footprint-drawer__loading"><Loading text="正在加载照片…" /></div>
              ) : photosError ? (
                <div className="footprint-drawer__feedback" role="alert">
                  <p className="field__error">{photosError}</p>
                  <Button size="sm" icon="refresh" onClick={() => void openCity(selected)}>重新加载照片</Button>
                </div>
              ) : photos.length === 0 ? (
                <p className="footprint-drawer__empty">这座城市的照片还在整理中。</p>
              ) : (
                <div className="footprint-photos">
                  {photos.map((photo, index) => (
                    <button
                      type="button"
                      key={photo.id}
                      className="footprint-photos__item"
                      onClick={() => setLightbox(index)}
                      aria-label={photo.title ?? `${selected.cityName} 照片 ${index + 1}`}
                    >
                      <img
                        src={withFallback(photo.url, photoPlaceholder(photo.id))}
                        alt={photo.title ?? `${selected.cityName} 照片 ${index + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>,
        document.body,
      )}

      {currentPhoto && createPortal(
        <div ref={lightboxRef} className="lightbox" role="dialog" aria-modal="true" aria-label="城市照片预览" onClick={() => setLightbox(null)}>
          <button type="button" className="lightbox__close" onClick={() => setLightbox(null)} aria-label="关闭">
            <Icon name="close" size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="lightbox__nav lightbox__nav--prev"
                onClick={(event) => {
                  event.stopPropagation()
                  setLightbox((prev) => (prev === null ? prev : (prev - 1 + photos.length) % photos.length))
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
                  setLightbox((prev) => (prev === null ? prev : (prev + 1) % photos.length))
                }}
                aria-label="下一张"
              >
                <Icon name="chevronRight" size={22} />
              </button>
            </>
          )}

          <figure className="lightbox__figure" onClick={(event) => event.stopPropagation()}>
            <img
              src={withFallback(currentPhoto.url, photoPlaceholder(currentPhoto.id))}
              alt={currentPhoto.title ?? '照片'}
            />
            <figcaption className="lightbox__caption">
              <div style={{ fontWeight: 600 }}>{currentPhoto.title || selected?.cityName || '未命名照片'}</div>
              {currentPhoto.description && (
                <div style={{ opacity: 0.78, marginTop: 4 }}>{currentPhoto.description}</div>
              )}
              <div style={{ opacity: 0.6, marginTop: 6, fontSize: 12.5 }}>
                {(lightbox ?? 0) + 1} / {photos.length}
              </div>
            </figcaption>
          </figure>
        </div>,
        document.body,
      )}
    </div>
  )
}
