import { HamsterLoader } from './HamsterLoader'

/**
 * 路由懒加载占位。
 *
 * 管理端页面按需加载（React.lazy），首次进入某个管理页时会短暂出现这个占位，
 * 避免白屏；动画说明见 components/HamsterLoader.tsx，样式见 styles/loader.css。
 */
export function RouteFallback() {
  return (
    <div className="route-fallback">
      <HamsterLoader text="加载中…" size={7} />
    </div>
  )
}
